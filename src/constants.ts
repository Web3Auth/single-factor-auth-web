export { ADAPTER_EVENTS } from "@web3auth/base";

export const ADAPTER_STATUS = {
  NOT_READY: "not_ready",
  READY: "ready",
  CONNECTED: "connected",
} as const;

export const PASSKEY_NONCE = "passkey_nonce";
export const OAUTH_USERINFO = "oauth_userinfo";
