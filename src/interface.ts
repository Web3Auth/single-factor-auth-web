import { TORUS_LEGACY_NETWORK, type TORUS_NETWORK_TYPE, TORUS_SAPPHIRE_NETWORK } from "@toruslabs/constants";
import { OpenloginUserInfo } from "@toruslabs/openlogin-utils";
import { CustomChainConfig, type IBaseProvider, IProvider, IWeb3AuthCore, IWeb3AuthCoreOptions, SafeEventEmitterProvider } from "@web3auth/base";

import { ADAPTER_STATUS } from "./constants";

export interface TorusSubVerifierInfo {
  verifier: string;
  idToken: string;
}

export type InitParams = { network: TORUS_NETWORK_TYPE };

export type PrivateKeyProvider = IBaseProvider<string> & { getEd25519Key?: (privKey: string) => string };

export type UserAuthInfo = { idToken: string };

export interface Web3AuthOptions extends Omit<IWeb3AuthCoreOptions, "uiConfig" | "useCoreKitKey"> {
  /**
   * setting this to true returns the same key as web sdk (i.e., plug n play key)
   * By default, this sdk returns CoreKitKey
   *
   * @defaultValue false
   */
  usePnPKey?: boolean;

  /**
   * Specify a custom storage server url
   *
   * @defaultValue https://session.web3auth.io
   */
  storageServerUrl?: string;

  /**
   * Specify a custom server time offset.
   *
   * @defaultValue 0
   */
  serverTimeOffset?: number;

  /**
   * Private key provider for your chain namespace
   */
  privateKeyProvider: IBaseProvider<string>;
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
  basePrivKey?: string;
  privKey?: string;
  userInfo?: OpenloginUserInfo;
  signatures?: string[];
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

export interface IWeb3Auth extends IWeb3AuthCore {
  readonly coreOptions: Web3AuthOptions;
  status: ADAPTER_STATUS_TYPE;
  provider: IProvider | null;
  connected: boolean;
  state: SessionData;
  init(): Promise<void>;
  connect(loginParams: LoginParams): Promise<SafeEventEmitterProvider | null>;
  addChain(chainConfig: CustomChainConfig): Promise<void>;
  switchChain(params: { chainId: string }): Promise<void>;
  getUserInfo(): Promise<OpenloginUserInfo>;
  _finalizeLogin(params: IFinalizeLoginParams): Promise<void>;
  _getBasePrivKey(): string;
}
export { TORUS_LEGACY_NETWORK, type TORUS_NETWORK_TYPE, TORUS_SAPPHIRE_NETWORK };
