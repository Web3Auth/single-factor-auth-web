import { ChainNamespaceType, signChallenge, verifySignedChallenge } from "@toruslabs/base-controllers";
import { NodeDetailManager } from "@toruslabs/fetch-node-details";
import { SessionManager } from "@toruslabs/session-manager";
import { keccak256, Torus, TorusKey } from "@toruslabs/torus.js";
import { AuthUserInfo, IStorage, MemoryStore, SafeEventEmitter, subkey, WEB3AUTH_NETWORK, type WEB3AUTH_NETWORK_TYPE } from "@web3auth/auth";
import {
  ADAPTER_EVENTS,
  ADAPTER_STATUS,
  CHAIN_NAMESPACES,
  checkIfTokenIsExpired,
  CustomChainConfig,
  getSavedToken,
  IPlugin,
  IProvider,
  log,
  PLUGIN_STATUS,
  saveToken,
  WALLET_ADAPTERS,
  WalletInitializationError,
  WalletLoginError,
  Web3AuthError,
} from "@web3auth/base";
import bs58 from "bs58";

import { AsyncStorage } from "./asyncStorage";
import { PASSKEYS_PLUGIN, SDK_MODE } from "./constants";
import {
  ADAPTER_STATUS_TYPE,
  AggregateVerifierParams,
  Auth0UserInfo,
  IAsyncStorage,
  IFinalizeLoginParams,
  ISecureStore,
  IWeb3Auth,
  LoginParams,
  PrivateKeyProvider,
  SessionData,
  UserAuthInfo,
  Web3AuthOptions,
  Web3AuthSfaEvents,
} from "./interface";
import { decodeToken } from "./utils";

export class Web3Auth extends SafeEventEmitter<Web3AuthSfaEvents> implements IWeb3Auth {
  readonly coreOptions: Omit<Web3AuthOptions, "storage"> & { storage: IAsyncStorage | IStorage | ISecureStore };

  readonly connectedAdapterName = WALLET_ADAPTERS.SFA;

  readonly SFA_ISSUER = "https://authjs.web3auth.io/jwks";

  public status: ADAPTER_STATUS_TYPE = ADAPTER_STATUS.NOT_READY;

  public authInstance: Torus | null = null;

  public nodeDetailManagerInstance: NodeDetailManager | null = null;

  public state: SessionData = {};

  private torusPrivKey: string | null = null;

  private privKeyProvider: PrivateKeyProvider | null = null;

  private sessionManager!: SessionManager<SessionData>;

  private currentStorage: AsyncStorage;

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
      web3AuthNetwork: options.web3AuthNetwork || WEB3AUTH_NETWORK.MAINNET,
      sessionTime: options.sessionTime || 86400,
      storageServerUrl: options.storageServerUrl || "https://session.web3auth.io",
      storageKey: options.storageKey || "local",
      chainConfig: options.chainConfig || options.privateKeyProvider.currentChainConfig,
      storage: this.getStorage(options.storage),
      mode: options.mode || SDK_MODE.WEB,
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

  set provider(_: IProvider | null) {
    throw new Error("Not implemented");
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

    const storageKey = `${this.baseStorageKey}_${this.coreOptions.chainConfig.chainNamespace === CHAIN_NAMESPACES.SOLANA ? "solana" : "eip"}_${this.coreOptions.usePnPKey ? "pnp" : "core_kit"}`;
    this.currentStorage = new AsyncStorage(storageKey, this.coreOptions.storage);
    this.nodeDetailManagerInstance = new NodeDetailManager({ network: this.coreOptions.web3AuthNetwork });
    this.authInstance = new Torus({
      clientId: this.coreOptions.clientId,
      enableOneKey: true,
      network: this.coreOptions.web3AuthNetwork,
    });

    const sessionId = await this.currentStorage.get<string>("sessionId");
    this.sessionManager = new SessionManager({
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
        this.torusPrivKey = data.basePrivKey;
        await this.privKeyProvider.setupProvider(data.privKey);
        this.updateState(data);
        this.status = ADAPTER_STATUS.CONNECTED;
        this.emit(ADAPTER_EVENTS.CONNECTED, { adapter: this.connectedAdapterName, provider: this.provider, reconnected: true });
      }
    }
    if (!this.state.privKey) {
      this.status = ADAPTER_STATUS.READY;
      this.emit(ADAPTER_EVENTS.READY, this.connectedAdapterName);
    }
  }

  async authenticateUser(): Promise<UserAuthInfo> {
    if (!this.connected) throw WalletLoginError.notConnectedError();
    const { userInfo } = this.state;
    if (userInfo?.idToken) return { idToken: userInfo.idToken };

    const { chainNamespace, chainId } = this.coreOptions.chainConfig || {};
    if (!this.authInstance || !this.privKeyProvider || !this.nodeDetailManagerInstance) throw WalletInitializationError.notReady();
    const accounts = await this.privKeyProvider.provider.request<unknown, string[]>({
      method: chainNamespace === CHAIN_NAMESPACES.EIP155 ? "eth_accounts" : "getAccounts",
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
        domain: typeof window !== "undefined" ? window.location.origin : "reactnative",
        uri: typeof window !== "undefined" ? window.location.href : "com://reactnative",
        address: accounts[0],
        chainId: parseInt(chainId as string, 16),
        version: "1",
        nonce: Math.random().toString(36).slice(2),
        issuedAt: new Date().toISOString(),
      };

      const challenge = await signChallenge(payload, chainNamespace);
      const signedMessage = await this._getSignedMessage(challenge, accounts, chainNamespace);
      const idToken = await verifySignedChallenge(
        chainNamespace,
        signedMessage,
        challenge,
        this.SFA_ISSUER,
        this.coreOptions.sessionTime,
        this.coreOptions.clientId,
        this.coreOptions.web3AuthNetwork as WEB3AUTH_NETWORK_TYPE
      );
      saveToken(accounts[0] as string, "SFA", idToken);
      return {
        idToken,
      };
    }
  }

  async addChain(chainConfig: CustomChainConfig): Promise<void> {
    if (this.coreOptions.mode === SDK_MODE.NODE) throw WalletInitializationError.invalidParams("Not supported in this mode");
    if (this.status === ADAPTER_STATUS.NOT_READY) throw WalletInitializationError.notReady("Please call init first.");
    return this.privKeyProvider.addChain(chainConfig);
  }

  switchChain(params: { chainId: string }): Promise<void> {
    if (this.coreOptions.mode === SDK_MODE.NODE) throw WalletInitializationError.invalidParams("Not supported in this mode");
    if (this.status === ADAPTER_STATUS.NOT_READY) throw WalletInitializationError.notReady("Please call init first.");
    return this.privKeyProvider.switchChain(params);
  }

  async getPostboxKey(loginParams: LoginParams): Promise<string> {
    if (this.status === ADAPTER_STATUS.NOT_READY) throw WalletInitializationError.notReady("Please call init first.");
    return this.getTorusKey(loginParams);
  }

  /**
   * Use this function only with verifiers created on developer dashboard (https://dashboard.web3auth.io)
   * @param loginParams - Params used to login
   * @returns provider to connect
   */
  async connect(loginParams: LoginParams): Promise<IProvider | null> {
    if (this.status === ADAPTER_STATUS.CONNECTED)
      throw WalletLoginError.connectionError("Already connected. Please check status before calling connect.");
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
    const userInfo: AuthUserInfo = {
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
    this.status = ADAPTER_STATUS.READY;
    this.emit(ADAPTER_EVENTS.DISCONNECTED);
  }

  public async getUserInfo(): Promise<AuthUserInfo> {
    if (!this.connected) throw WalletLoginError.userNotLoggedIn();
    return this.state.userInfo;
  }

  public addPlugin(plugin: IPlugin): IWeb3Auth {
    if (this.isRNOrNodeMode()) throw WalletInitializationError.invalidParams("Plugins are not supported in this mode");
    if (this.plugins[plugin.name]) throw WalletInitializationError.duplicateAdapterError(`Plugin ${plugin.name} already exist`);

    this.plugins[plugin.name] = plugin;
    if (this.status === ADAPTER_STATUS.CONNECTED && this.connectedAdapterName) {
      // web3auth is already connected. can initialize plugins
      this.connectToPlugins();
    }

    if (plugin.name === PASSKEYS_PLUGIN && (this.status === ADAPTER_STATUS.READY || this.status === ADAPTER_STATUS.CONNECTED)) {
      // this does return a Promise but we don't need to wait here.
      // as its mostly a sync function.
      this.plugins[PASSKEYS_PLUGIN].initWithWeb3Auth(this);
    }
    return this;
  }

  public getPlugin(name: string): IPlugin | null {
    if (this.isRNOrNodeMode()) throw WalletInitializationError.invalidParams("Plugins are not supported in this mode");
    return this.plugins[name] || null;
  }

  public async _finalizeLogin(params: IFinalizeLoginParams) {
    const { privKey, signatures = [], passkeyToken = "" } = params;
    this.torusPrivKey = privKey;
    // update the provider with the private key.
    const finalPrivKey = await this.getFinalPrivKey(privKey);
    await this.privKeyProvider.setupProvider(finalPrivKey);

    // We only need to authenticate user in web mode.
    // This is for the passkey plugin mode only.
    if (this.coreOptions.mode === SDK_MODE.WEB) {
      const { idToken } = await this.authenticateUser().catch((_) => ({ idToken: "" }));
      if (params.userInfo) {
        params.userInfo.idToken = idToken;
      } else {
        params.userInfo = { idToken } as AuthUserInfo;
      }
    }

    // We dont need to save the session in node mode.
    if (this.coreOptions.mode !== SDK_MODE.NODE) {
      // save the data in the session.
      const sessionId = SessionManager.generateRandomSessionKey();
      this.sessionManager.sessionId = sessionId;
      await this.sessionManager.createSession({ basePrivKey: privKey, privKey: finalPrivKey, userInfo: params.userInfo, signatures, passkeyToken });
      this.currentStorage.set("sessionId", sessionId);
    }

    // update the local state.
    this.updateState({ privKey: finalPrivKey, basePrivKey: privKey, userInfo: params.userInfo, signatures, passkeyToken });
    this.emit(ADAPTER_EVENTS.CONNECTED, { adapter: this.connectedAdapterName, provider: this.provider, reconnected: false });
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
    if (this.coreOptions.chainConfig.chainNamespace === CHAIN_NAMESPACES.SOLANA) {
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
      this.connectToPlugins();
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

  private connectToPlugins() {
    const localPlugins = Object.values(this.plugins).filter((plugin) => plugin.name !== PASSKEYS_PLUGIN);
    localPlugins.forEach(async (plugin) => {
      try {
        if (!plugin.SUPPORTED_ADAPTERS.includes(WALLET_ADAPTERS.SFA)) {
          return;
        }
        if (plugin.status === PLUGIN_STATUS.CONNECTED) return;
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
  }

  private async _getSignedMessage(challenge: string, accounts: string[], chainNamespace: ChainNamespaceType): Promise<string> {
    const signedMessage = await this.privKeyProvider.provider.request<string[] | { message: Uint8Array }, string | Uint8Array>({
      method: chainNamespace === CHAIN_NAMESPACES.EIP155 ? "personal_sign" : "signMessage",
      params: chainNamespace === CHAIN_NAMESPACES.EIP155 ? [challenge, accounts[0]] : { message: Buffer.from(challenge) },
    });
    if (chainNamespace === CHAIN_NAMESPACES.SOLANA) return bs58.encode(signedMessage as Uint8Array);
    return signedMessage as string;
  }

  private isRNOrNodeMode() {
    return this.coreOptions.mode === SDK_MODE.REACT_NATIVE || this.coreOptions.mode === SDK_MODE.NODE;
  }

  private getStorage(storage: "session" | "local" | IAsyncStorage): IAsyncStorage | IStorage | ISecureStore {
    if (typeof window !== "undefined") {
      if (!storage || storage === "local") return window.localStorage;
      if (storage === "session") return window.sessionStorage;
    } else if (!storage || typeof storage === "string") return new MemoryStore();
    return storage;
  }
}
