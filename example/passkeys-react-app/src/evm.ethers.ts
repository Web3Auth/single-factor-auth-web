import type { IProvider } from "@web3auth/base";
import { BrowserProvider, formatEther, parseEther } from "ethers";

export default class EthereumRpc {
  private provider: IProvider;

  constructor(provider: IProvider) {
    this.provider = provider;
  }

  async getChainId(): Promise<any> {
    try {
      const ethersProvider = new BrowserProvider(this.provider);
      // Get the connected Chain's ID
      const networkDetails = await ethersProvider.getNetwork();
      return networkDetails.chainId;
    } catch (error) {
      return error;
    }
  }

  async getAccounts(): Promise<string> {
    try {
      const provider = new BrowserProvider(this.provider as any);
      const signer = await provider.getSigner();
      const account = await signer.getAddress();
      return account;
    } catch (error: unknown) {
      return error as string;
    }
  }

  async getBalance(): Promise<string> {
    try {
      const provider = new BrowserProvider(this.provider as any);
      const signer = await provider.getSigner();
      const account = await signer.getAddress();
      // Get user's balance in ether
      const balance = formatEther(
        await provider.getBalance(account) // Balance is in wei
      );
      return balance;
    } catch (error) {
      return error as string;
    }
  }

  async signMessage(): Promise<string> {
    try {
      const provider = new BrowserProvider(this.provider as any);
      const signer = await provider.getSigner();

      const originalMessage = "YOUR_MESSAGE";

      const signedMessage = await signer.signMessage(originalMessage);
      return signedMessage;
    } catch (error) {
      return error as string;
    }
  }

  async signAndSendTransaction(): Promise<string> {
    try {
      const provider = new BrowserProvider(this.provider as any);
      const signer = await provider.getSigner();
      const address = await signer.getAddress();

      const tx = await signer.sendTransaction({
        to: address,
        value: parseEther("0.0001"),
      });
      const receipt = await tx.wait();
      return receipt?.hash || "";
    } catch (error) {
      return error as string;
    }
  }
}
