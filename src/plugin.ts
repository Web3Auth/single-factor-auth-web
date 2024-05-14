import { SafeEventEmitter } from "@toruslabs/openlogin-jrpc";

import { type IWeb3Auth } from "./interface";

export interface IPlugin extends SafeEventEmitter {
  name: string;
  initWithSfaWeb3auth(web3auth: IWeb3Auth): Promise<void>;
}
