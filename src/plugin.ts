import { SafeEventEmitter } from "@web3auth/auth";

import { type IWeb3Auth } from "./interface";

export interface IPlugin extends SafeEventEmitter {
  name: string;
  initWithSfaWeb3auth(web3auth: IWeb3Auth): Promise<void>;
}
