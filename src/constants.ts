export { ADAPTER_EVENTS } from "@web3auth/base";

export const ADAPTER_STATUS = {
  NOT_READY: "not_ready",
  READY: "ready",
  CONNECTED: "connected",
} as const;

export const SDK_MODE = {
  REACT_NATIVE: "react-native",
  WEB: "web",
  NODE: "node",
} as const;

export const PASSKEYS_PLUGIN = "PASSKEYS_PLUGIN";
