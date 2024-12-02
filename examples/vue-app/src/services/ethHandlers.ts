/* eslint-disable @typescript-eslint/no-explicit-any */
import { IProvider, log } from "@web3auth/base";
import { BrowserProvider, Eip1193Provider, ethers, parseEther } from "ethers";

export const sendEth = async (provider: IProvider, uiConsole: any) => {
  try {
    const ethersProvider = new BrowserProvider(provider as Eip1193Provider);
    const signer = await ethersProvider.getSigner();
    const address = await signer.getAddress();

    const tx = await signer.sendTransaction({
      to: address,
      value: parseEther("0.0001"),
    });
    const receipt = await tx.wait();
    uiConsole("txReceipt", receipt);
    return receipt?.hash || "";
  } catch (error) {
    log.error("Error", error);
    uiConsole("error", error);
    return undefined;
  }
};

export const signEthMessage = async (provider: IProvider, uiConsole: any) => {
  try {
    const ethersProvider = new BrowserProvider(provider as Eip1193Provider);
    const signer = await ethersProvider.getSigner();

    const originalMessage = "YOUR_MESSAGE";

    const signedMessage = await signer.signMessage(originalMessage);
    uiConsole("signedMessage", signedMessage);
    return signedMessage;
  } catch (error) {
    log.error("Error", error);
    uiConsole("error", error);
    return undefined;
  }
};

export const getAccounts = async (provider: IProvider, uiConsole: any): Promise<string[] | undefined> => {
  try {
    const ethersProvider = new BrowserProvider(provider as Eip1193Provider);
    const signer = await ethersProvider.getSigner();
    const account = await signer.getAddress();
    uiConsole("accounts", account);
    return [account];
  } catch (error: unknown) {
    log.error("Error", error);
    uiConsole("error", error);
    return [];
  }
};
export const getChainId = async (provider: IProvider, uiConsole: any): Promise<string | undefined> => {
  try {
    const ethersProvider = new BrowserProvider(provider);
    // Get the connected Chain's ID
    const networkDetails = await ethersProvider.getNetwork();
    uiConsole("chainId", networkDetails.chainId.toString());
    return networkDetails.chainId.toString();
  } catch (error) {
    log.error("Error", error);
    uiConsole("error", error);
    return undefined;
  }
};
export const getBalance = async (provider: IProvider, uiConsole: any) => {
  try {
    const ethersProvider = new BrowserProvider(provider as Eip1193Provider);
    const signer = await ethersProvider.getSigner();
    const account = await signer.getAddress();
    // Get user's balance in ether
    const balance = ethers.formatEther(await ethersProvider.getBalance(account));
    uiConsole("balance", balance);
    return balance;
  } catch (error) {
    log.error("Error", error);
    uiConsole("error", error);
    return undefined;
  }
};

export const signTransaction = async (provider: IProvider, uiConsole: any) => {
  try {
    const providerx = new ethers.BrowserProvider(provider);
    const accounts = await providerx.send("eth_requestAccounts", []);

    // only supported with social logins (openlogin adapter)
    const txRes = await providerx.send("eth_signTransaction", [
      {
        from: accounts[0],
        to: accounts[0],
        value: ethers.parseEther("0.01"),
      },
    ]);
    uiConsole("txRes", txRes);
  } catch (error) {
    log.error("Error", error);
    uiConsole("error", error);
  }
};
