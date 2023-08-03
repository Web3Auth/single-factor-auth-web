import { NodeDetailManager } from "@toruslabs/fetch-node-details";
import { OpenloginSessionManager } from "@toruslabs/openlogin-session-manager";
import { subkey } from "@toruslabs/openlogin-subkey";
import { BrowserStorage, OPENLOGIN_NETWORK_TYPE } from "@toruslabs/openlogin-utils";
import Torus, { keccak256 } from "@toruslabs/torus.js";
import {
  CHAIN_NAMESPACES,
  ChainNamespaceType,
  checkIfTokenIsExpired,
  CustomChainConfig,
  getSavedToken,
  SafeEventEmitterProvider,
  saveToken,
  signChallenge,
  verifySignedChallenge,
  WalletInitializationError,
  WalletLoginError,
} from "@web3auth/base";

import { AggregateVerifierParams, IWeb3Auth, LoginParams, PrivateKeyProvider, SessionData, UserAuthInfo, Web3AuthOptions } from "./interface";

class Web3Auth implements IWeb3Auth {
  readonly options: Web3AuthOptions;

  public ready = false;

  public authInstance: Torus | null = null;

  public nodeDetailManagerInstance: NodeDetailManager | null = null;

  private privKeyProvider: PrivateKeyProvider | null = null;

  private chainConfig: Partial<CustomChainConfig> | null = null;

  private currentChainNamespace: ChainNamespaceType;

  private sessionManager!: OpenloginSessionManager<SessionData>;

  private currentStorage!: BrowserStorage;

  private readonly storageKey = "sfa_store";

  constructor(options: Web3AuthOptions) {
    if (!options.clientId) throw WalletInitializationError.invalidParams("Please provide a valid clientId in constructor");

    this.options = {
      ...options,
      web3AuthNetwork: options.web3AuthNetwork || "mainnet",
      sessionTime: options.sessionTime || 86400,
      storageServerUrl: options.storageServerUrl || "https://broadcast-server.tor.us",
      storageKey: options.storageKey || "local",
    };
  }

  get sessionId(): string | null {
    return (this.sessionManager && this.sessionManager.sessionKey) || null;
  }

  get provider(): SafeEventEmitterProvider | null {
    return this.privKeyProvider?.provider || null;
  }

  async init(provider: PrivateKeyProvider): Promise<void> {
    if (!provider) {
      throw WalletInitializationError.invalidParams("provider is required");
    }

    if (!provider.currentChainConfig || !provider.currentChainConfig.chainNamespace || !provider.currentChainConfig.chainId) {
      throw WalletInitializationError.invalidParams("provider should have chainConfig and should be intiliazed with chainId and chainNamespace");
    }

    this.currentStorage = BrowserStorage.getInstance(this.storageKey, this.options.storageKey);
    this.nodeDetailManagerInstance = new NodeDetailManager({ network: this.options.web3AuthNetwork });
    this.authInstance = new Torus({
      clientId: this.options.clientId,
      enableOneKey: true,
      network: this.options.web3AuthNetwork,
    });

    this.privKeyProvider = provider;
    this.chainConfig = this.privKeyProvider.currentChainConfig;
    this.currentChainNamespace = this.privKeyProvider.currentChainConfig.chainNamespace;

    const sessionId = this.currentStorage.get<string>("sessionId");
    this.sessionManager = new OpenloginSessionManager({
      sessionServerBaseUrl: this.options.storageServerUrl,
      sessionTime: this.options.sessionTime,
      sessionId,
    });

    // if sessionId exists in storage, then try to rehydrate session.
    if (sessionId) {
      // we are doing this to make sure sessionKey is set
      // before we call authorizeSession in both cjs and esm bundles.
      this.sessionManager.sessionKey = sessionId;
      const data = await this.sessionManager.authorizeSession().catch(() => {});
      if (data && data.privKey) {
        const finalPrivKey = await this._getFinalPrivKey(data.privKey);
        await this.privKeyProvider.setupProvider(finalPrivKey);
      }
    }
    this.ready = true;
  }

  async authenticateUser(): Promise<UserAuthInfo> {
    if (!this.ready) throw WalletInitializationError.notReady("Please call init first.");
    const { chainNamespace, chainId } = this.chainConfig || {};
    if (!this.authInstance || !this.privKeyProvider || !this.nodeDetailManagerInstance) throw new Error("Please call init first");
    const accounts = await this.privKeyProvider.provider.request<string[]>({
      method: "eth_accounts",
    });
    if (accounts && accounts.length > 0) {
      const existingToken = getSavedToken(accounts[0] as string, "SFA");
      if (existingToken) {
        const isExpired = checkIfTokenIsExpired(existingToken);
        if (!isExpired) {
          return { idToken: existingToken };
        }
      }

      const payload = {
        domain: typeof window.location !== "undefined" ? window.location.origin : "reactnative",
        uri: typeof window.location !== "undefined" ? window.location.href : "com://reactnative",
        address: accounts[0],
        chainId: parseInt(chainId as string, 16),
        version: "1",
        nonce: Math.random().toString(36).slice(2),
        issuedAt: new Date().toISOString(),
      };

      const challenge = await signChallenge(payload, chainNamespace);

      const signedMessage = await this.privKeyProvider.provider.request<string>({
        method: "personal_sign",
        params: [challenge, accounts[0]],
      });

      const idToken = await verifySignedChallenge(
        chainNamespace,
        signedMessage as string,
        challenge,
        "SFA",
        this.options.sessionTime,
        this.options.clientId,
        this.options.web3AuthNetwork as OPENLOGIN_NETWORK_TYPE
      );
      saveToken(accounts[0] as string, "SFA", idToken);
      return {
        idToken,
      };
    }
  }

  async addChain(chainConfig: CustomChainConfig): Promise<void> {
    if (!this.ready) throw WalletInitializationError.notReady("Please call init first.");
    return this.privKeyProvider.addChain(chainConfig);
  }

  switchChain(params: { chainId: string }): Promise<void> {
    if (!this.ready) throw WalletInitializationError.notReady("Please call init first.");
    return this.privKeyProvider.switchChain(params);
  }

  async getPostboxKey(loginParams: LoginParams): Promise<string> {
    if (!this.ready) throw WalletInitializationError.notReady("Please call init first.");
    const { verifier, verifierId, idToken, subVerifierInfoArray } = loginParams;
    const verifierDetails = { verifier, verifierId };

    const { torusNodeEndpoints, torusNodePub, torusIndexes } = await this.nodeDetailManagerInstance.getNodeDetails(verifierDetails);

    if (loginParams.serverTimeOffset) {
      this.authInstance.serverTimeOffset = loginParams.serverTimeOffset;
    }
    // Does the key assign
    await this.authInstance.getPublicAddress(torusNodeEndpoints, torusNodePub, { verifier, verifierId });

    let finalIdToken = idToken;
    let finalVerifierParams = { verifier_id: verifierId };
    if (subVerifierInfoArray && subVerifierInfoArray?.length > 0) {
      const aggregateVerifierParams: AggregateVerifierParams = { verify_params: [], sub_verifier_ids: [], verifier_id: "" };
      const aggregateIdTokenSeeds = [];
      for (let index = 0; index < subVerifierInfoArray.length; index += 1) {
        const userInfo = subVerifierInfoArray[index];
        aggregateVerifierParams.verify_params.push({ verifier_id: verifierId, idtoken: userInfo.idToken });
        aggregateVerifierParams.sub_verifier_ids.push(userInfo.verifier);
        aggregateIdTokenSeeds.push(userInfo.idToken);
      }
      aggregateIdTokenSeeds.sort();

      finalIdToken = keccak256(Buffer.from(aggregateIdTokenSeeds.join(String.fromCharCode(29)), "utf8")).slice(2);

      aggregateVerifierParams.verifier_id = verifierId;
      finalVerifierParams = aggregateVerifierParams;
    }

    const retrieveSharesResponse = await this.authInstance.retrieveShares(
      torusNodeEndpoints,
      torusIndexes,
      verifier,
      finalVerifierParams,
      finalIdToken
    );

    const postboxKey = this.authInstance.getPostboxKeyFrom1OutOf1(
      retrieveSharesResponse.privKey,
      retrieveSharesResponse.metadataNonce.toString(16, 64)
    );
    return postboxKey.padStart(64, "0");
  }

  /**
   * Use this function only with verifiers created on developer dashboard (https://dashboard.web3auth.io)
   * @param loginParams - Params used to login
   * @returns provider to connect
   */
  async connect(loginParams: LoginParams): Promise<SafeEventEmitterProvider | null> {
    if (!this.ready) throw WalletInitializationError.notReady("Please call init first.");

    const { verifier, verifierId, idToken, subVerifierInfoArray } = loginParams;
    const verifierDetails = { verifier, verifierId };

    const { torusNodeEndpoints, torusNodePub, torusIndexes } = await this.nodeDetailManagerInstance.getNodeDetails(verifierDetails);

    if (loginParams.serverTimeOffset) {
      this.authInstance.serverTimeOffset = loginParams.serverTimeOffset;
    }
    // does the key assign
    const pubDetails = await this.authInstance.getUserTypeAndAddress(torusNodeEndpoints, torusNodePub, verifierDetails, true);

    if (pubDetails.upgraded) {
      throw WalletLoginError.mfaEnabled();
    }

    if (pubDetails.typeOfUser === "v1") {
      // This shouldn't happen for this sdk.
      await this.authInstance.getOrSetNonce(pubDetails.X, pubDetails.Y);
    }

    let finalIdToken = idToken;
    let finalVerifierParams = { verifier_id: verifierId };
    if (subVerifierInfoArray && subVerifierInfoArray?.length > 0) {
      const aggregateVerifierParams: AggregateVerifierParams = { verify_params: [], sub_verifier_ids: [], verifier_id: "" };
      const aggregateIdTokenSeeds = [];
      for (let index = 0; index < subVerifierInfoArray.length; index += 1) {
        const userInfo = subVerifierInfoArray[index];
        aggregateVerifierParams.verify_params.push({ verifier_id: verifierId, idtoken: userInfo.idToken });
        aggregateVerifierParams.sub_verifier_ids.push(userInfo.verifier);
        aggregateIdTokenSeeds.push(userInfo.idToken);
      }
      aggregateIdTokenSeeds.sort();

      finalIdToken = keccak256(Buffer.from(aggregateIdTokenSeeds.join(String.fromCharCode(29)), "utf8")).slice(2);

      aggregateVerifierParams.verifier_id = verifierId;
      finalVerifierParams = aggregateVerifierParams;
    }

    const retrieveSharesResponse = await this.authInstance.retrieveShares(
      torusNodeEndpoints,
      torusIndexes,
      verifier,
      finalVerifierParams,
      finalIdToken
    );

    const { privKey } = retrieveSharesResponse;
    if (!privKey) throw WalletLoginError.fromCode(5000, "Unable to get private key from torus nodes");

    const finalPrivKey = await this._getFinalPrivKey(privKey);
    await this.privKeyProvider.setupProvider(finalPrivKey);

    const sessionId = OpenloginSessionManager.generateRandomSessionKey();
    this.sessionManager.sessionKey = sessionId;
    // we are using the original private key so that we can retrieve other keys later on
    await this.sessionManager.createSession({ privKey });
    this.currentStorage.set("sessionId", sessionId);
    return this.provider;
  }

  async logout(): Promise<void> {
    if (!this.ready) throw WalletInitializationError.notReady("Please call init first.");
    const sessionId = this.currentStorage.get<string>("sessionId");
    if (!sessionId) throw WalletLoginError.fromCode(5000, "User not logged in");

    await this.sessionManager.invalidateSession();
    this.currentStorage.set("sessionId", "");
    this.privKeyProvider = null;
    this.ready = false;
  }

  private async _getFinalPrivKey(privKey: string) {
    let finalPrivKey = privKey.padStart(64, "0");
    // get app scoped keys.
    if (this.options.usePnPKey) {
      const pnpPrivKey = subkey(finalPrivKey, Buffer.from(this.options.clientId, "base64"));
      finalPrivKey = pnpPrivKey.padStart(64, "0");
    }
    if (this.currentChainNamespace === CHAIN_NAMESPACES.SOLANA) {
      if (!this.privKeyProvider.getEd25519Key) {
        throw WalletLoginError.fromCode(5000, "Private key is not valid, Missing getEd25519Key function");
      }
      finalPrivKey = this.privKeyProvider.getEd25519Key(finalPrivKey);
    }
    return finalPrivKey;
  }
}

export default Web3Auth;
