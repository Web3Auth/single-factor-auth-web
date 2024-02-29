import { NodeDetailManager } from "@toruslabs/fetch-node-details";
import { SafeEventEmitter, SafeEventEmitterProvider } from "@toruslabs/openlogin-jrpc";
import { OpenloginSessionManager } from "@toruslabs/openlogin-session-manager";
import { subkey } from "@toruslabs/openlogin-subkey";
import { base64url, BrowserStorage, OPENLOGIN_NETWORK, OPENLOGIN_NETWORK_TYPE, OpenloginUserInfo } from "@toruslabs/openlogin-utils";
import Torus, { keccak256 } from "@toruslabs/torus.js";
import {
  ADAPTER_EVENTS,
  ADAPTER_STATUS,
  CHAIN_NAMESPACES,
  ChainNamespaceType,
  checkIfTokenIsExpired,
  CustomChainConfig,
  getSavedToken,
  IProvider,
  log,
  saveToken,
  signChallenge,
  verifySignedChallenge,
  WalletInitializationError,
  WalletLoginError,
} from "@web3auth/base";
import BN from "bn.js";
import { jwtDecode } from "jwt-decode";

import { getNonce, getUserInfo, saveUserInfo, setNonce } from "./helpers";
import {
  ADAPTER_STATUS_TYPE,
  AggregateVerifierParams,
  Auth0UserInfo,
  IWeb3Auth,
  LoginParams,
  PasskeyConnectParams,
  PrivateKeyProvider,
  SessionData,
  UserAuthInfo,
  Web3AuthOptions,
} from "./interface";
import { ecCurve } from "./utils";

class Web3Auth extends SafeEventEmitter implements IWeb3Auth {
  readonly options: Web3AuthOptions;

  public ready = false;

  public authInstance: Torus | null = null;

  public nodeDetailManagerInstance: NodeDetailManager | null = null;

  public state: SessionData = {};

  private privKeyProvider: PrivateKeyProvider | null = null;

  private chainConfig: Partial<CustomChainConfig> | null = null;

  private currentChainNamespace: ChainNamespaceType;

  private sessionManager!: OpenloginSessionManager<SessionData>;

  private currentStorage!: BrowserStorage;

  private oAuthKey: string | null = null;

  private readonly storageKey = "sfa_store";

  constructor(options: Web3AuthOptions) {
    super();
    if (!options.clientId) throw WalletInitializationError.invalidParams("Please provide a valid clientId in constructor");

    this.options = {
      ...options,
      web3AuthNetwork: options.web3AuthNetwork || OPENLOGIN_NETWORK.MAINNET,
      sessionTime: options.sessionTime || 86400,
      storageServerUrl: options.storageServerUrl || "https://broadcast-server.tor.us",
      storageKey: options.storageKey || "local",
    };

    // TODO: fix the metadata url.
  }

  get sessionId(): string | null {
    return (this.sessionManager && this.sessionManager.sessionId) || null;
  }

  get connected(): boolean {
    return Boolean(this.sessionId);
  }

  get provider(): IProvider | null {
    return this.privKeyProvider || null;
  }

  get status(): ADAPTER_STATUS_TYPE {
    if (this.ready && !this.connected) return ADAPTER_STATUS.READY;
    if (this.connected) return ADAPTER_STATUS.CONNECTED;
    return ADAPTER_STATUS.NOT_READY;
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
      this.sessionManager.sessionId = sessionId;
      const data = await this.sessionManager.authorizeSession().catch(() => {
        this.currentStorage.set("sessionId", "");
      });
      if (data && data.privKey) {
        this.oAuthKey = data.privKey;
        const finalPrivKey = await this._getFinalPrivKey(data.privKey);
        await this.privKeyProvider.setupProvider(finalPrivKey);
        this.updateState(data);
        this.emit(ADAPTER_EVENTS.CONNECTED, { reconnected: true });
      }
    }
    this.ready = true;
  }

  async authenticateUser(): Promise<UserAuthInfo> {
    if (!this.ready) throw WalletInitializationError.notReady("Please call init first.");
    const { chainNamespace, chainId } = this.chainConfig || {};
    if (!this.authInstance || !this.privKeyProvider || !this.nodeDetailManagerInstance) throw new Error("Please call init first");
    const accounts = await this.privKeyProvider.provider.request<unknown, string[]>({
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

      const signedMessage = await this.privKeyProvider.provider.request<string[], string>({
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
    return this.getTorusKey(loginParams);
  }

  /**
   * Use this function only with verifiers created on developer dashboard (https://dashboard.web3auth.io)
   * @param loginParams - Params used to login
   * @returns provider to connect
   */
  async connect(loginParams: LoginParams): Promise<IProvider | null> {
    if (!this.ready) throw WalletInitializationError.notReady("Please call init first.");

    const { verifier, verifierId, idToken, subVerifierInfoArray } = loginParams;
    if (!verifier || !verifierId || !idToken) throw WalletInitializationError.invalidParams("verifier or verifierId or idToken  required");
    const verifierDetails = { verifier, verifierId };

    const { torusNodeEndpoints, torusNodePub, torusIndexes } = await this.nodeDetailManagerInstance.getNodeDetails(verifierDetails);

    if (loginParams.serverTimeOffset) {
      this.authInstance.serverTimeOffset = loginParams.serverTimeOffset;
    }

    if (this.authInstance.isLegacyNetwork) {
      // does the key assign
      const pubDetails = await this.authInstance.getPublicAddress(torusNodeEndpoints, torusNodePub, verifierDetails);

      if (pubDetails.metadata.upgraded) {
        throw WalletLoginError.mfaEnabled();
      }
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
    if (retrieveSharesResponse.metadata.upgraded) {
      throw WalletLoginError.mfaEnabled();
    }
    const { finalKeyData, oAuthKeyData } = retrieveSharesResponse;
    const privKey = finalKeyData.privKey || oAuthKeyData.privKey;
    this.oAuthKey = privKey;
    if (!privKey) throw WalletLoginError.fromCode(5000, "Unable to get private key from torus nodes");

    // we are using the original private key so that we can retrieve other keys later on
    let decodedUserInfo: Partial<Auth0UserInfo>;
    try {
      decodedUserInfo = jwtDecode<Auth0UserInfo>(idToken);
    } catch (error) {
      decodedUserInfo = loginParams.fallbackUserInfo;
    }
    const userInfo: OpenloginUserInfo = {
      name: decodedUserInfo.name || decodedUserInfo.nickname || "",
      email: decodedUserInfo.email || "",
      profileImage: decodedUserInfo.picture || "",
      verifierId,
      verifier,
      typeOfLogin: "jwt",
      oAuthIdToken: idToken,
    };
    await this.setupProvider(privKey, userInfo);
    return this.provider;
  }

  async logout(): Promise<void> {
    if (!this.ready) throw WalletInitializationError.notReady("Please call init first.");
    const sessionId = this.currentStorage.get<string>("sessionId");
    if (!sessionId) throw WalletLoginError.fromCode(5000, "User not logged in");

    await this.sessionManager.invalidateSession();
    this.currentStorage.set("sessionId", "");
    this.emit(ADAPTER_EVENTS.DISCONNECTED);
    this.updateState({
      privKey: "",
      userInfo: {
        name: "",
        email: "",
        profileImage: "",
        verifierId: "",
        verifier: "",
        typeOfLogin: "",
      },
    });
    this.privKeyProvider = null;
    this.ready = false;
  }

  public async getUserInfo(): Promise<OpenloginUserInfo> {
    if (!this.sessionId) throw WalletLoginError.userNotLoggedIn();
    return this.state.userInfo;
  }

  public async registerPasskey(params: PasskeyConnectParams): Promise<boolean> {
    if (!this.ready) throw WalletInitializationError.notReady("Please call init first.");
    if (!this.oAuthKey) throw WalletLoginError.userNotLoggedIn();

    // user is logged in.
    const { verifier, extraVerifierParams } = params;
    if (!verifier) throw WalletInitializationError.invalidParams("verifier is required");
    if (!extraVerifierParams) throw WalletInitializationError.invalidParams("extraVerifierParams is required");
    if (!extraVerifierParams.signature) throw WalletInitializationError.invalidParams("signature is required");
    if (!extraVerifierParams.clientDataJSON) throw WalletInitializationError.invalidParams("clientDataJSON is required");
    if (!extraVerifierParams.authenticatorData) throw WalletInitializationError.invalidParams("authenticatorData is required");
    if (!extraVerifierParams.publicKey) throw WalletInitializationError.invalidParams("publicKey is required");
    if (!extraVerifierParams.challenge) throw WalletInitializationError.invalidParams("challenge is required");
    if (!extraVerifierParams.rpId) throw WalletInitializationError.invalidParams("rpId is required");
    if (!extraVerifierParams.credId) throw WalletInitializationError.invalidParams("credId is required");

    const { signature, clientDataJSON, authenticatorData, publicKey, challenge, rpId, credId } = extraVerifierParams;

    const verifierHash = keccak256(Buffer.from(publicKey, "base64")).slice(2);
    const verifierId = base64url.fromBase64(Buffer.from(verifierHash, "hex").toString("base64"));

    const loginParams: LoginParams = {
      verifier,
      verifierId,
      idToken: signature,
      extraVerifierParams: {
        signature,
        clientDataJSON,
        authenticatorData,
        publicKey,
        challenge,
        rpOrigin: window.location.origin,
        rpId,
        credId,
      },
    };

    try {
      // get the passkey private key.
      const passkey = await this.getTorusKey(loginParams);

      // get the deterministic nonce.
      // Nonce = OAuthKey - Passkey.
      const nonce = this.getNonce(this.oAuthKey, passkey);

      // save the nonce in the metadata db.
      // this will throw an error if it fails.
      await setNonce(this.options.metadataHost, passkey, nonce, this.options.serverTimeOffset);

      // if the nonce is set, then we are good to go.
      // We set the oAuthUserInfo in the metadata DB.
      // This will be help us to get the user info when you login with passkey.
      await saveUserInfo(this.options.metadataHost, this.oAuthKey, this.state.userInfo);

      return true;
    } catch (error: unknown) {
      log.error("error while registering passkey", error);
      throw WalletLoginError.fromCode(5000, "Unable to register passkey, please try again.");
    }
  }

  public async loginWithPasskey(params: PasskeyConnectParams): Promise<SafeEventEmitterProvider> {
    if (!this.ready) throw WalletInitializationError.notReady("Please call init first.");

    // user is logged in.
    const { verifier, extraVerifierParams } = params;
    if (!verifier) throw WalletInitializationError.invalidParams("verifier is required");
    if (!extraVerifierParams) throw WalletInitializationError.invalidParams("extraVerifierParams is required");
    if (!extraVerifierParams.signature) throw WalletInitializationError.invalidParams("signature is required");
    if (!extraVerifierParams.clientDataJSON) throw WalletInitializationError.invalidParams("clientDataJSON is required");
    if (!extraVerifierParams.authenticatorData) throw WalletInitializationError.invalidParams("authenticatorData is required");
    if (!extraVerifierParams.publicKey) throw WalletInitializationError.invalidParams("publicKey is required");
    if (!extraVerifierParams.challenge) throw WalletInitializationError.invalidParams("challenge is required");
    if (!extraVerifierParams.rpId) throw WalletInitializationError.invalidParams("rpId is required");
    if (!extraVerifierParams.credId) throw WalletInitializationError.invalidParams("credId is required");

    const { signature, clientDataJSON, authenticatorData, publicKey, challenge, rpId, credId } = extraVerifierParams;

    const verifierHash = keccak256(Buffer.from(publicKey, "base64")).slice(2);
    const verifierId = base64url.fromBase64(Buffer.from(verifierHash, "hex").toString("base64"));
    const loginParams: LoginParams = {
      verifier,
      verifierId,
      idToken: signature,
      extraVerifierParams: {
        signature,
        clientDataJSON,
        authenticatorData,
        publicKey,
        challenge,
        rpId,
        rpOrigin: window.location.origin,
        credId,
      },
    };

    try {
      // get the passkey private key.
      const passkey = await this.getTorusKey(loginParams);
      const nonce = await getNonce(this.options.metadataHost, passkey, this.options.serverTimeOffset);
      if (!nonce) throw WalletLoginError.fromCode(5000, "Unable to login with passkey, no passkey found or different passkey selected to login.");

      const privKey = this.getPrivKeyFromNonce(passkey, nonce);
      // get the oAuthUserInfo from the metadata DB.
      const userInfo = await getUserInfo(this.options.metadataHost, privKey);
      await this.setupProvider(privKey, userInfo);
      return this.provider;
    } catch (error: unknown) {
      log.error("error while login with passkey", error);
      throw WalletLoginError.fromCode(5000, "Unable to login with passkey, please try again.");
    }
  }

  private updateState(newState: Partial<SessionData>) {
    this.state = { ...this.state, ...newState };
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
        throw WalletLoginError.fromCode(5000, "Private key provider is not valid, Missing getEd25519Key function");
      }
      finalPrivKey = this.privKeyProvider.getEd25519Key(finalPrivKey);
    }
    return finalPrivKey;
  }

  private async getTorusKey(loginParams: LoginParams): Promise<string> {
    const { verifier, verifierId, idToken, subVerifierInfoArray } = loginParams;
    const verifierDetails = { verifier, verifierId };

    const { torusNodeEndpoints, torusNodePub, torusIndexes } = await this.nodeDetailManagerInstance.getNodeDetails(verifierDetails);

    if (loginParams.serverTimeOffset) {
      this.authInstance.serverTimeOffset = loginParams.serverTimeOffset;
    }

    // Does the key assign
    if (this.authInstance.isLegacyNetwork) await this.authInstance.getPublicAddress(torusNodeEndpoints, torusNodePub, { verifier, verifierId });

    let finalIdToken = idToken;
    let finalVerifierParams = { verifier_id: verifierId };
    if (subVerifierInfoArray && subVerifierInfoArray?.length > 0) {
      const aggregateVerifierParams: AggregateVerifierParams = { verify_params: [], sub_verifier_ids: [], verifier_id: "" };
      const aggregateIdTokenSeeds = [];
      for (let index = 0; index < subVerifierInfoArray.length; index += 1) {
        const userInfo = subVerifierInfoArray[index];
        aggregateVerifierParams.verify_params.push({
          verifier_id: verifierId,
          idtoken: userInfo.idToken,
        });
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
      finalIdToken,
      loginParams.extraVerifierParams || {}
    );

    const postboxKey = Torus.getPostboxKey(retrieveSharesResponse);
    return postboxKey.padStart(64, "0");
  }

  private getNonce(oAuthKey: string, passkey: string): string {
    return new BN(oAuthKey, "hex").sub(new BN(passkey, "hex")).umod(ecCurve.curve.n).toString("hex", 64);
  }

  private getPrivKeyFromNonce(passkey: string, nonce: string): string {
    return new BN(passkey, "hex").add(new BN(nonce, "hex")).umod(ecCurve.curve.n).toString("hex", 64);
  }

  private async setupProvider(privKey: string, userInfo: OpenloginUserInfo) {
    this.oAuthKey = privKey;
    // update the provider with the private key.
    const finalPrivKey = await this._getFinalPrivKey(privKey);
    await this.privKeyProvider.setupProvider(finalPrivKey);

    // save the data in the session.
    const sessionId = OpenloginSessionManager.generateRandomSessionKey();
    this.sessionManager.sessionId = sessionId;
    await this.sessionManager.createSession({ privKey, userInfo });

    // update the local state.
    this.updateState({ privKey, userInfo });
    this.currentStorage.set("sessionId", sessionId);
    this.emit(ADAPTER_EVENTS.CONNECTED, { reconnected: false });
  }
}

export default Web3Auth;
