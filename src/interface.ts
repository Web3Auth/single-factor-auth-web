import { TORUS_LEGACY_NETWORK, type TORUS_NETWORK_TYPE, TORUS_SAPPHIRE_NETWORK } from "@toruslabs/constants";
import { SafeEventEmitter } from "@toruslabs/openlogin-jrpc";
import { OpenloginUserInfo } from "@toruslabs/openlogin-utils";
import { CustomChainConfig, type IBaseProvider, SafeEventEmitterProvider } from "@web3auth/base";

import { ADAPTER_STATUS } from "./constants";

export interface TorusSubVerifierInfo {
  verifier: string;
  idToken: string;
}

export type InitParams = { network: TORUS_NETWORK_TYPE };

export type PrivateKeyProvider = IBaseProvider<string> & { getEd25519Key?: (privKey: string) => string };

export type UserAuthInfo = { idToken: string };

export interface Web3AuthOptions {
  /**
   * Client id for web3auth.
   * You can obtain your client id from the web3auth developer dashboard.
   * You can set any random string for this on localhost.
   */
  clientId: string;
  /**
   * Web3Auth Network to use for login
   * @defaultValue mainnet
   */
  web3AuthNetwork?: TORUS_NETWORK_TYPE;

  /**
   * setting to true will enable logs
   *
   * @defaultValue false
   */
  enableLogging?: boolean;

  /**
   * setting this to true returns the same key as web sdk (i.e., plug n play key)
   * By default, this sdk returns CoreKitKey
   */
  usePnPKey?: boolean;

  /**
   * How long should a login session last at a minimum in seconds
   *
   * @defaultValue 86400 seconds
   * @remarks Max value of sessionTime can be 7 * 86400 (7 days)
   */
  sessionTime?: number;

  /**
   * setting to "local" will persist social login session accross browser tabs.
   *
   * @defaultValue "local"
   */
  storageKey?: "session" | "local";

  /**
   * Specify a custom storage server url
   * @defaultValue https://session.web3auth.io
   */
  storageServerUrl?: string;

  /**
   * Specify a custom server time offset.
   */
  serverTimeOffset?: number;
}

export type AggregateVerifierParams = {
  verify_params: { verifier_id: string; idtoken: string }[];
  sub_verifier_ids: string[];
  verifier_id: string;
};

export interface Auth0UserInfo {
  picture: string;
  email: string;
  name: string;
  sub: string;
  nickname: string;
}

export interface SessionData {
  privKey?: string;
  userInfo?: OpenloginUserInfo;
  sessionSignatures?: string[];
  passkeyToken?: string;
}

export interface LoginParams {
  verifier: string;
  verifierId: string;
  idToken: string;
  subVerifierInfoArray?: TorusSubVerifierInfo[];
  // offset in seconds
  serverTimeOffset?: number;
  fallbackUserInfo?: Partial<Auth0UserInfo>;
}

export interface DeletePasskeyParams {
  credentialPublicKey?: string;
  verifier: string;
}

export type ADAPTER_STATUS_TYPE = (typeof ADAPTER_STATUS)[keyof typeof ADAPTER_STATUS];

export type IFinalizeLoginParams = { privKey: string; userInfo: OpenloginUserInfo; signatures?: string[]; passkeyToken?: string };

export interface IWeb3Auth extends SafeEventEmitter {
  /**
   * @deprecated would be removed in future versions. Use `connected` instead
   */
  sessionId: string | null;
  status: ADAPTER_STATUS_TYPE;
  provider: SafeEventEmitterProvider | null;
  connected: boolean;
  state: SessionData;
  options: Web3AuthOptions;
  /**
   * This may or may not be the actual private key returned by the provider.
   * Do not use this directly if you are not sure what you are doing.
   */
  torusPrivKey: string | null;
  init(provider: PrivateKeyProvider): Promise<void>;
  connect(loginParams: LoginParams): Promise<SafeEventEmitterProvider | null>;
  authenticateUser(): Promise<UserAuthInfo>;
  addChain(chainConfig: CustomChainConfig): Promise<void>;
  switchChain(params: { chainId: string }): Promise<void>;
  getUserInfo(): Promise<OpenloginUserInfo>;
  finalizeLogin(params: IFinalizeLoginParams): Promise<void>;
}
export { TORUS_LEGACY_NETWORK, type TORUS_NETWORK_TYPE, TORUS_SAPPHIRE_NETWORK };
