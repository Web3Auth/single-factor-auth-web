import { IProvider } from "@web3auth/base";
import Web3 from "web3";

export default class EthereumRpc {
  private provider: IProvider;

  constructor(provider: IProvider) {
    this.provider = provider;
  }

  async getAccounts(): Promise<string[]> {
    try {
      const web3 = new Web3(this.provider);
      const accounts = await web3.eth.getAccounts();
      return accounts;
    } catch (error: unknown) {
      return error as string[];
    }
  }

  async getChainId(): Promise<string> {
    const web3Provider = new Web3(this.provider);
    // Get the connected Chain's ID

    return (await web3Provider.eth.net.getId()).toString(16);
  }

  async getBalance(): Promise<string> {
    try {
      const web3 = new Web3(this.provider);
      const accounts = await web3.eth.getAccounts();
      const balance = web3.utils.fromWei(await web3.eth.getBalance(accounts[0]), "ether");
      return parseFloat(balance).toString();
    } catch (error) {
      return error as string;
    }
  }

  async signMessage(): Promise<string | undefined> {
    try {
      const web3 = new Web3(this.provider);
      const accounts = await web3.eth.getAccounts();
      const message = "0x47173285a8d7341e5e972fc677286384f802f8ef42a5ec5f03bbfa254cb01fad";
      const result = await web3.currentProvider?.request<string, string>({
        method: "eth_sign",
        params: [accounts[0], message],
      });
      return result?.result;
    } catch (error) {
      return error as string;
    }
  }

  async signAndSendTransaction(): Promise<string> {
    try {
      const web3 = new Web3(this.provider);
      const accounts = await web3.eth.getAccounts();

      const txRes = await web3.eth.sendTransaction({
        from: accounts[0],
        to: accounts[0],
        value: web3.utils.toWei("0.01", "ether"),
      });
      return txRes.transactionHash.toString();
    } catch (error) {
      return error as string;
    }
  }
}
