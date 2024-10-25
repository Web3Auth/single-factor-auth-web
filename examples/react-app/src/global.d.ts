import { type Web3Auth } from "@web3auth/single-factor-auth";

declare global {
  interface Window {
    web3auth: Web3Auth;
  }
}
