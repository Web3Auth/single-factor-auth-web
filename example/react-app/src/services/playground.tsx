import { CHAIN_NAMESPACES, IProvider, WEB3AUTH_NETWORK } from "@web3auth/base";
import { EthereumPrivateKeyProvider } from "@web3auth/ethereum-provider";
import React, { createContext, ReactNode, useContext, useEffect, useState } from "react";

// Import Single Factor Auth SDK for no redirect flow
import { Web3Auth, ADAPTER_EVENTS, decodeToken } from "@web3auth/single-factor-auth";
import { PasskeysPlugin } from "@web3auth/passkeys-sfa-plugin";
import { WalletServicesPlugin } from "@web3auth/wallet-services-plugin";
import { CredentialResponse, googleLogout } from "@react-oauth/google";
import { shouldSupportPasskey } from "../utils";
import { OpenloginUserInfo } from "@toruslabs/openlogin-utils";
import RPC from "../evm.web3";

export interface ToggleModalData {
  open: boolean;
  type?: "how" | "getting-started";
}

export interface IPlaygroundContext {
  address: string;
  balance: string;
  chainId: string;
  isLoggedIn: boolean;
  isLoading: boolean;
  userInfo: OpenloginUserInfo | null;
  playgroundConsole: string;
  hasPasskeys: boolean;
  isGuideModalOpen: boolean;
  guideModalType: ToggleModalData["type"];
  onSuccess: (response: CredentialResponse) => void;
  loginWithPasskey: () => void;
  registerPasskey: () => void;
  listAllPasskeys: () => void;
  logout: () => void;
  getUserInfo: () => Promise<OpenloginUserInfo | null>;
  showCheckout: () => void;
  showWalletUI: () => void;
  showWalletScanner: () => void;
  signMessage: () => void;
  sendTransaction: () => void;
  toggleGuideModal: (params: ToggleModalData) => void;
}

export const PlaygroundContext = createContext<IPlaygroundContext>({
  address: "",
  balance: "",
  isLoggedIn: false,
  isLoading: false,
  userInfo: null,
  playgroundConsole: "",
  chainId: "",
  hasPasskeys: false,
  isGuideModalOpen: false,
  guideModalType: "how",
  onSuccess: async () => null,
  loginWithPasskey: async () => null,
  registerPasskey: async () => null,
  listAllPasskeys: async () => null,
  logout: async () => null,
  getUserInfo: async () => null,
  showCheckout: async () => null,
  showWalletUI: async () => null,
  showWalletScanner: async () => null,
  signMessage: async () => null,
  sendTransaction: async () => null,
  toggleGuideModal: async () => null,
});

interface IPlaygroundProps {
  children?: ReactNode;
}

export function usePlayground(): IPlaygroundContext {
  return useContext(PlaygroundContext);
}

const verifier = "w3a-sfa-web-google";

const clientId = "BPi5PB_UiIZ-cPz1GtV5i1I2iOSOHuimiXBI0e-Oe_u6X3oVAbCiAZOTEBtTXw4tsluTITPqA8zMsfxIKMjiqNQ"; // get from https://dashboard.web3auth.io

const chainConfig = {
  chainId: "0xaa36a7",
  displayName: "Ethereum Sepolia Testnet",
  chainNamespace: CHAIN_NAMESPACES.EIP155,
  tickerName: "Ethereum",
  ticker: "ETH",
  decimals: 18,
  rpcTarget: "https://rpc.ankr.com/eth_sepolia",
  blockExplorerUrl: "https://sepolia.etherscan.io",
  logo: "https://cryptologos.cc/logos/ethereum-eth-logo.png",
};

export const Playground = ({ children }: IPlaygroundProps) => {
  const [web3authSFAuth, setWeb3authSFAuth] = useState<Web3Auth | null>(null);
  const [provider, setProvider] = useState<IProvider | null>(null);
  const [plugin, setPlugin] = useState<PasskeysPlugin | null>(null);
  const [playgroundConsole, setPlaygroundConsole] = useState<string>("");
  const [wsPlugin, setWsPlugin] = useState<WalletServicesPlugin | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userInfo, setUserInfo] = useState<OpenloginUserInfo | null>(null);
  const [address, setAddress] = useState<string>("");
  const [balance, setBalance] = useState<string>("");
  const [chainId, setChainId] = useState<string>("");
  const [hasPasskeys, setHasPasskeys] = useState<boolean>(false);

  // Dialog
  const [isGuideModalOpen, setIsGuideModalOpen] = useState(false);
  const [guideModalType, setGuideModalType] = useState<ToggleModalData["type"]>("how");

  const onSuccess = async (response: CredentialResponse): Promise<void> => {
    try {
      if (!web3authSFAuth) {
        console.log("Web3Auth Single Factor Auth SDK not initialized yet");
        return;
      }
      setIsLoading(true);
      const idToken = response.credential;
      if (!idToken) {
        setIsLoading(false);
        return;
      }
      const { payload } = decodeToken(idToken);
      await web3authSFAuth.connect({
        verifier,
        verifierId: (payload as any).email,
        idToken: idToken!,
      });
      setIsLoading(false);
      const res = await plugin?.listAllPasskeys();
      if (res && Object.values(res).length === 0) {
        await registerPasskey();
      }
    } catch (err) {
      // Single Factor Auth SDK throws an error if the user has already enabled MFA
      // One can use the Web3AuthNoModal SDK to handle this case
      setIsLoading(false);
      console.error(err);
    }
  };

  const loginWithPasskey = async () => {
    try {
      setIsLoading(true);
      if (!plugin) throw new Error("Passkey plugin not initialized");
      const result = shouldSupportPasskey();
      if (!result.isBrowserSupported) {
        console.log("Browser not supported");
        return;
      }
      await plugin.loginWithPasskey();
      console.log("Passkey logged in successfully");
    } catch (error) {
      console.error((error as Error).message);
      throw new Error((error as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const registerPasskey = async () => {
    try {
      if (!plugin) {
        uiConsole("plugin not initialized yet");
        return;
      }
      const result = shouldSupportPasskey();
      if (!result.isBrowserSupported) {
        uiConsole("Browser not supported");
        return;
      }
      const userInfo = await web3authSFAuth?.getUserInfo();
      const res = await plugin?.registerPasskey({
        username: `google|${userInfo?.email || userInfo?.name} - ${new Date().toLocaleDateString("en-GB")}`,
      });
      if (res) uiConsole("Passkey saved successfully");
    } catch (error: unknown) {
      uiConsole((error as Error).message);
    }
  };

  const logout = async () => {
    if (!web3authSFAuth) {
      throw new Error("web3auth sfa auth not initialized.");
    }
    googleLogout();
    await web3authSFAuth.logout();
    uiConsole("Logged out");
    return;
  };

  const getUserInfo = async (): Promise<OpenloginUserInfo | null> => {
    if (web3authSFAuth && web3authSFAuth?.connected) {
      const useInfo = await web3authSFAuth?.getUserInfo();
      uiConsole(useInfo);
    }
    return null;
  };

  const showCheckout = async () => {
    if (!wsPlugin) {
      uiConsole("wallet services plugin not initialized yet");
      return;
    }
    await wsPlugin.showCheckout();
  };

  const showWalletUI = async () => {
    if (!wsPlugin) {
      uiConsole("wallet services plugin not initialized yet");
      return;
    }
    await wsPlugin.showWalletUi();
  };

  const signMessage = async () => {
    if (!provider) {
      uiConsole("No provider found");
      return;
    }
    const rpc = new RPC(provider);
    const result = await rpc.signMessage();
    uiConsole(result);
  };

  const sendTransaction = async () => {
    if (!provider) {
      uiConsole("No provider found");
      return;
    }
    const rpc = new RPC(provider);
    const result = await rpc.signAndSendTransaction();
    uiConsole(result);
  };

  const showWalletScanner = async () => {
    if (!wsPlugin) {
      uiConsole("wallet services plugin not initialized yet");
      return;
    }
    await wsPlugin.showWalletConnectScanner();
  };

  const listAllPasskeys = async () => {
    if (!plugin) {
      uiConsole("plugin not initialized yet");
      return;
    }
    const res = await plugin?.listAllPasskeys();
    uiConsole(res);
  };

  const toggleGuideModal = (params: ToggleModalData = { open: true, type: "how" }) => {
    setIsGuideModalOpen(params.open);
    setGuideModalType(params.type);
  };

  useEffect(() => {
    setIsLoggedIn(!!(provider && web3authSFAuth));
  }, [provider, web3authSFAuth]);

  const uiConsole = (...args: unknown[]) => {
    setPlaygroundConsole(`${JSON.stringify(args || {}, null, 2)}\n\n\n\n${playgroundConsole}`);
    console.log(...args);
  };

  useEffect(() => {
    const init = async () => {
      try {
        const provider = new EthereumPrivateKeyProvider({ config: { chainConfig } });
        // Initialising Web3Auth Single Factor Auth SDK
        const web3authSfa = new Web3Auth({
          clientId, // Get your Client ID from Web3Auth Dashboard
          web3AuthNetwork: WEB3AUTH_NETWORK.SAPPHIRE_MAINNET,
          usePnPKey: true, // Setting this to true returns the same key as PnP Web SDK, By default, this SDK returns CoreKitKey.
          privateKeyProvider: provider,
        });
        const plugin = new PasskeysPlugin();
        web3authSfa?.addPlugin(plugin);
        const wsPlugin = new WalletServicesPlugin({
          walletInitOptions: {
            whiteLabel: {
              logoLight: "https://web3auth.io/images/web3auth-logo.svg",
              logoDark: "https://web3auth.io/images/web3auth-logo.svg",
            },
          },
        });
        web3authSfa?.addPlugin(wsPlugin);
        setWsPlugin(wsPlugin);
        setPlugin(plugin);
        web3authSfa.on(ADAPTER_EVENTS.CONNECTED, async (data) => {
          console.log("sfa:connected", data);
          console.log("sfa:state", web3authSfa?.state);
          setProvider(web3authSfa.provider);
          if (web3authSfa.state.userInfo) setUserInfo(web3authSfa.state.userInfo);

          // Get account data

          const rpc = new RPC(provider);
          const accounts = await rpc.getAccounts();
          if (accounts?.length) setAddress(accounts[0]);

          const balance = await rpc.getBalance();
          setBalance(balance);

          const chainId = await rpc.getChainId();
          setChainId(`0x${chainId}`);

          const res = await plugin?.listAllPasskeys();
          setHasPasskeys(Object.values(res).length > 0);
        });
        web3authSfa.on(ADAPTER_EVENTS.DISCONNECTED, () => {
          console.log("sfa:disconnected");
          setProvider(null);
        });
        setWeb3authSFAuth(web3authSfa);
        await web3authSfa.init();
        (window as any).web3auth = web3authSfa;
      } catch (error) {
        console.error(error);
      }
    };

    init();
  }, []);
  const contextProvider = {
    address,
    balance,
    chainId,
    isLoggedIn,
    isLoading,
    userInfo,
    playgroundConsole,
    hasPasskeys,
    isGuideModalOpen,
    guideModalType,
    onSuccess,
    loginWithPasskey,
    registerPasskey,
    listAllPasskeys,
    logout,
    getUserInfo,
    showCheckout,
    showWalletUI,
    showWalletScanner,
    signMessage,
    sendTransaction,
    toggleGuideModal,
  };
  return <PlaygroundContext.Provider value={contextProvider}>{children}</PlaygroundContext.Provider>;
};
