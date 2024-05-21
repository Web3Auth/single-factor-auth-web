import { signChallenge, verifySignedChallenge } from "@toruslabs/base-controllers";
import { NodeDetailManager } from "@toruslabs/fetch-node-details";
import { SafeEventEmitter } from "@toruslabs/openlogin-jrpc";
import { OpenloginSessionManager } from "@toruslabs/openlogin-session-manager";
import { subkey } from "@toruslabs/openlogin-subkey";
import { BrowserStorage, OPENLOGIN_NETWORK, OPENLOGIN_NETWORK_TYPE, OpenloginUserInfo } from "@toruslabs/openlogin-utils";
import Torus, { keccak256, TorusKey } from "@toruslabs/torus.js";
import {
  ADAPTER_EVENTS,
  ADAPTER_STATUS,
  CHAIN_NAMESPACES,
  ChainNamespaceType,
  checkIfTokenIsExpired,
  CustomChainConfig,
  getSavedToken,
  IPlugin,
  IProvider,
  log,
  saveToken,
  WALLET_ADAPTERS,
  WalletInitializationError,
  WalletLoginError,
  Web3AuthError,
} from "@web3auth/base";

import { PASSKEYS_PLUGIN } from "./constants";
import {
  ADAPTER_STATUS_TYPE,
  AggregateVerifierParams,
  Auth0UserInfo,
  IFinalizeLoginParams,
  IWeb3Auth,
  LoginParams,
  PrivateKeyProvider,
  SessionData,
  UserAuthInfo,
  Web3AuthOptions,
} from "./interface";
import { decodeToken } from "./utils";

class Web3Auth extends SafeEventEmitter implements IWeb3Auth {
  readonly coreOptions: Web3AuthOptions;

  readonly connectedAdapterName = WALLET_ADAPTERS.SFA;

  readonly SFA_ISSUER = "https://authjs.web3auth.io/jwks";

  public status: ADAPTER_STATUS_TYPE = ADAPTER_STATUS.NOT_READY;

  public authInstance: Torus | null = null;

  public nodeDetailManagerInstance: NodeDetailManager | null = null;

  public state: SessionData = {};

  private torusPrivKey: string | null = null;

  private privKeyProvider: PrivateKeyProvider | null = null;

  private chainConfig: Partial<CustomChainConfig> | null = null;

  private currentChainNamespace: ChainNamespaceType;

  private sessionManager!: OpenloginSessionManager<SessionData>;

  private currentStorage!: BrowserStorage;

  private readonly baseStorageKey = "sfa_store";

  private readonly sessionNamespace = "sfa";

  private plugins: Record<string, IPlugin> = {};

  constructor(options: Web3AuthOptions) {
    super();
    if (!options.clientId) throw WalletInitializationError.invalidParams("Please provide a valid clientId in constructor");
    if (!options.privateKeyProvider) throw WalletInitializationError.invalidParams("Please provide a valid privateKeyProvider in constructor");

    if (options.chainConfig?.chainId && options.privateKeyProvider.currentChainConfig?.chainId !== options.chainConfig?.chainId) {
      throw WalletInitializationError.invalidParams("chainId in privateKeyProvider and chainConfig should be same");
    }

    this.coreOptions = {
      ...options,
      web3AuthNetwork: options.web3AuthNetwork || OPENLOGIN_NETWORK.MAINNET,
      sessionTime: options.sessionTime || 86400,
      storageServerUrl: options.storageServerUrl || "https://session.web3auth.io",
      storageKey: options.storageKey || "local",
      chainConfig: options.chainConfig || options.privateKeyProvider.currentChainConfig,
    };

    this.privKeyProvider = options.privateKeyProvider;
  }

  get connected(): boolean {
    return Boolean(this.sessionManager?.sessionId);
  }

  get provider(): IProvider | null {
    if (this.status !== ADAPTER_STATUS.NOT_READY && this.privKeyProvider) {
      return this.privKeyProvider;
    }
    return null;
  }

  async init(): Promise<void> {
    if (this.status !== ADAPTER_STATUS.NOT_READY) throw WalletInitializationError.notReady("Already initialized");
    if (
      !this.privKeyProvider.currentChainConfig ||
      !this.privKeyProvider.currentChainConfig.chainNamespace ||
      !this.privKeyProvider.currentChainConfig.chainId
    ) {
      throw WalletInitializationError.invalidParams("provider should have chainConfig and should be initialized with chainId and chainNamespace");
    }
    this.chainConfig = this.privKeyProvider.currentChainConfig;
    this.currentChainNamespace = this.privKeyProvider.currentChainConfig.chainNamespace;

    const storageKey = `${this.baseStorageKey}_${this.currentChainNamespace === CHAIN_NAMESPACES.SOLANA ? "solana" : "eip"}_${this.coreOptions.usePnPKey ? "pnp" : "core_kit"}`;
    this.currentStorage = BrowserStorage.getInstance(storageKey, this.coreOptions.storageKey);
    this.nodeDetailManagerInstance = new NodeDetailManager({ network: this.coreOptions.web3AuthNetwork });
    this.authInstance = new Torus({
      clientId: this.coreOptions.clientId,
      enableOneKey: true,
      network: this.coreOptions.web3AuthNetwork,
    });

    const sessionId = this.currentStorage.get<string>("sessionId");
    this.sessionManager = new OpenloginSessionManager({
      sessionServerBaseUrl: this.coreOptions.storageServerUrl,
      sessionTime: this.coreOptions.sessionTime,
      sessionNamespace: this.sessionNamespace,
      sessionId,
    });
    this.subscribeToEvents();

    if (this.plugins[PASSKEYS_PLUGIN]) {
      await this.plugins[PASSKEYS_PLUGIN].initWithWeb3Auth(this);
    }

    // if sessionId exists in storage, then try to rehydrate session.
    if (sessionId) {
      // we are doing this to make sure sessionKey is set
      // before we call authorizeSession in both cjs and esm bundles.
      this.sessionManager.sessionId = sessionId;
      const data = await this.sessionManager.authorizeSession().catch(() => {
        this.currentStorage.set("sessionId", "");
      });
      if (data && data.privKey) {
        this.torusPrivKey = data.privKey;
        const finalPrivKey = await this.getFinalPrivKey(data.privKey);
        await this.privKeyProvider.setupProvider(finalPrivKey);
        this.updateState(data);
        this.emit(ADAPTER_EVENTS.CONNECTED, { reconnected: true });
        this.status = ADAPTER_STATUS.CONNECTED;
      }
    }
    if (!this.state.privKey) {
      this.status = ADAPTER_STATUS.READY;
      this.emit(ADAPTER_EVENTS.READY);
    }
  }

  async authenticateUser(): Promise<UserAuthInfo> {
    if (!this.connected) throw WalletLoginError.notConnectedError();
    const { userInfo } = this.state;
    if (userInfo?.idToken) return { idToken: userInfo.idToken };

    const { chainNamespace, chainId } = this.chainConfig || {};
    if (!this.authInstance || !this.privKeyProvider || !this.nodeDetailManagerInstance) throw WalletInitializationError.notReady();
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
        this.SFA_ISSUER,
        this.coreOptions.sessionTime,
        this.coreOptions.clientId,
        this.coreOptions.web3AuthNetwork as OPENLOGIN_NETWORK_TYPE
      );
      saveToken(accounts[0] as string, "SFA", idToken);
      if (this.state.userInfo) {
        this.state.userInfo.idToken = idToken;
      } else {
        this.state.userInfo = { idToken } as OpenloginUserInfo;
      }
      return {
        idToken,
      };
    }
  }

  async addChain(chainConfig: CustomChainConfig): Promise<void> {
    if (this.status !== ADAPTER_STATUS.READY) throw WalletInitializationError.notReady("Please call init first.");
    return this.privKeyProvider.addChain(chainConfig);
  }

  switchChain(params: { chainId: string }): Promise<void> {
    if (this.status !== ADAPTER_STATUS.READY) throw WalletInitializationError.notReady("Please call init first.");
    return this.privKeyProvider.switchChain(params);
  }

  async getPostboxKey(loginParams: LoginParams): Promise<string> {
    if (this.status !== ADAPTER_STATUS.READY) throw WalletInitializationError.notReady("Please call init first.");
    return this.getTorusKey(loginParams);
  }

  /**
   * Use this function only with verifiers created on developer dashboard (https://dashboard.web3auth.io)
   * @param loginParams - Params used to login
   * @returns provider to connect
   */
  async connect(loginParams: LoginParams): Promise<IProvider | null> {
    if (this.status !== ADAPTER_STATUS.READY) throw WalletInitializationError.notReady("Please call init first.");

    const { verifier, verifierId, idToken, subVerifierInfoArray } = loginParams;
    if (!verifier || !verifierId || !idToken) throw WalletInitializationError.invalidParams("verifier or verifierId or idToken  required");
    const verifierDetails = { verifier, verifierId };

    const { torusNodeEndpoints, torusIndexes } = await this.nodeDetailManagerInstance.getNodeDetails(verifierDetails);

    if (loginParams.serverTimeOffset) {
      this.authInstance.serverTimeOffset = loginParams.serverTimeOffset;
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
    this.torusPrivKey = privKey;
    if (!privKey) throw WalletLoginError.fromCode(5000, "Unable to get private key from torus nodes");

    // we are using the original private key so that we can retrieve other keys later on
    let decodedUserInfo: Partial<Auth0UserInfo>;
    try {
      decodedUserInfo = decodeToken<Auth0UserInfo>(idToken).payload;
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
    const signatures = this.getSessionSignatures(retrieveSharesResponse.sessionData);
    await this._finalizeLogin({ privKey, userInfo, signatures });
    return this.provider;
  }

  async logout(): Promise<void> {
    if (!this.connected) throw WalletLoginError.notConnectedError("Not logged in");
    const sessionId = this.currentStorage.get<string>("sessionId");
    if (!sessionId) throw WalletLoginError.fromCode(5000, "User not logged in");

    await this.sessionManager.invalidateSession();
    this.currentStorage.set("sessionId", "");
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
    this.emit(ADAPTER_EVENTS.DISCONNECTED);
  }

  public async getUserInfo(): Promise<OpenloginUserInfo> {
    if (!this.connected) throw WalletLoginError.userNotLoggedIn();
    return this.state.userInfo;
  }

  public addPlugin(plugin: IPlugin): IWeb3Auth {
    if (this.plugins[plugin.name]) throw WalletInitializationError.duplicateAdapterError(`Plugin ${plugin.name} already exist`);

    this.plugins[plugin.name] = plugin;
    return this;
  }

  public getPlugin(name: string): IPlugin | null {
    return this.plugins[name] || null;
  }

  public async _finalizeLogin(params: IFinalizeLoginParams) {
    const { privKey, userInfo, signatures = [], passkeyToken = "" } = params;
    this.torusPrivKey = privKey;
    // update the provider with the private key.
    const finalPrivKey = await this.getFinalPrivKey(privKey);
    await this.privKeyProvider.setupProvider(finalPrivKey);

    // save the data in the session.
    const sessionId = OpenloginSessionManager.generateRandomSessionKey();
    this.sessionManager.sessionId = sessionId;

    await this.sessionManager.createSession({ privKey: finalPrivKey, userInfo, signatures, passkeyToken });

    // update the local state.
    this.updateState({ privKey: finalPrivKey, userInfo, signatures, passkeyToken });
    this.currentStorage.set("sessionId", sessionId);
    this.emit(ADAPTER_EVENTS.CONNECTED, { reconnected: false });
    this.status = ADAPTER_STATUS.CONNECTED;
  }

  public _getBasePrivKey() {
    return this.torusPrivKey;
  }

  private updateState(newState: Partial<SessionData>) {
    this.state = { ...this.state, ...newState };
  }

  private async getFinalPrivKey(privKey: string) {
    let finalPrivKey = privKey.padStart(64, "0");
    // get app scoped keys.
    if (this.coreOptions.usePnPKey) {
      const pnpPrivKey = subkey(finalPrivKey, Buffer.from(this.coreOptions.clientId, "base64"));
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

    const { torusNodeEndpoints, torusIndexes } = await this.nodeDetailManagerInstance.getNodeDetails(verifierDetails);

    if (loginParams.serverTimeOffset) {
      this.authInstance.serverTimeOffset = loginParams.serverTimeOffset;
    }

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
      {}
    );

    const postboxKey = Torus.getPostboxKey(retrieveSharesResponse);
    return postboxKey.padStart(64, "0");
  }

  private getSessionSignatures(sessionData: TorusKey["sessionData"]): string[] {
    return sessionData.sessionTokenData.filter((i) => Boolean(i)).map((session) => JSON.stringify({ data: session.token, sig: session.signature }));
  }

  private subscribeToEvents() {
    this.on(ADAPTER_EVENTS.CONNECTED, async () => {
      const localPlugins = Object.values(this.plugins).filter((plugin) => plugin.name !== PASSKEYS_PLUGIN);
      localPlugins.forEach(async (plugin) => {
        try {
          if (!plugin.SUPPORTED_ADAPTERS.includes(WALLET_ADAPTERS.SFA)) {
            return;
          }
          await plugin.initWithWeb3Auth(this);
          await plugin.connect({ sessionId: this.sessionManager.sessionId, sessionNamespace: this.sessionNamespace });
        } catch (error: unknown) {
          // swallow error if connector adapter doesn't supports this plugin.
          if ((error as Web3AuthError).code === 5211) {
            return;
          }
          log.error(error);
        }
      });
    });

    this.on(ADAPTER_EVENTS.DISCONNECTED, async () => {
      const localPlugins = Object.values(this.plugins).filter((plugin) => plugin.name !== PASSKEYS_PLUGIN);
      localPlugins.forEach(async (plugin) => {
        try {
          if (!plugin.SUPPORTED_ADAPTERS.includes(WALLET_ADAPTERS.SFA)) {
            return;
          }
          await plugin.disconnect();
        } catch (error: unknown) {
          // swallow error if connector adapter doesn't supports this plugin.
          if ((error as Web3AuthError).code === 5211) {
            return;
          }
          log.error(error);
        }
      });
    });
  }
}

export default Web3Auth;
