import { CHAIN_NAMESPACES, IProvider, WEB3AUTH_NETWORK } from "@web3auth/base";
import { EthereumPrivateKeyProvider } from "@web3auth/ethereum-provider";
import { createContext, ReactNode, useContext, useEffect, useState } from "react";

// Import Single Factor Auth SDK for no redirect flow
import { Web3Auth, ADAPTER_EVENTS, decodeToken } from "@web3auth/single-factor-auth";
import { PasskeysPlugin } from "@web3auth/passkeys-sfa-plugin";
import { WalletServicesPlugin } from "@web3auth/wallet-services-plugin";
import { CredentialResponse, googleLogout } from "@react-oauth/google";
import { shouldSupportPasskey } from "../utils";
import { OpenloginUserInfo } from "@toruslabs/openlogin-utils";
import RPC from "../evm.ethers";

type PasskeysData = {
  id: string;
  name: string;
  detail1: string;
  detail2: string;
};
export interface IPlaygroundContext {
  address: string;
  balance: string;
  chainId: string;
  isLoggedIn: boolean;
  isLoading: boolean;
  userInfo: OpenloginUserInfo | null;
  playgroundConsole: string;
  playgroundConsoleTitle: string;
  playgroundConsoleData: string;
  hasPasskeys: boolean;
  passkeys: PasskeysData[];
  isCancelModalOpen: boolean;
  showRegisterPasskeyModal: boolean;
  showInfoPopup: boolean;
  infoPopupCopy: InfoPopupCopy;
  onSuccess: (response: CredentialResponse) => void;
  loginWithPasskey: () => void;
  registerPasskey: () => void;
  listAllPasskeys: () => void;
  logout: () => void;
  getUserInfo: () => Promise<OpenloginUserInfo | null>;
  showCheckout: () => void;
  showWalletUI: () => void;
  showWalletScanner: () => void;
  signMessage: () => Promise<string>;
  sendTransaction: () => void;
  toggleCancelModal: (isOpen: boolean) => void;
  toggleRegisterPasskeyModal: () => void;
  toggleShowInfoPopup: () => void;
  resetConsole: () => void;
}

export const PlaygroundContext = createContext<IPlaygroundContext>({
  address: "",
  balance: "",
  isLoggedIn: false,
  isLoading: false,
  userInfo: null,
  playgroundConsole: "",
  playgroundConsoleTitle: "",
  playgroundConsoleData: "",
  chainId: "",
  hasPasskeys: false,
  passkeys: [],
  isCancelModalOpen: false,
  showRegisterPasskeyModal: false,
  showInfoPopup: false,
  infoPopupCopy: {},
  onSuccess: async () => null,
  loginWithPasskey: async () => null,
  registerPasskey: async () => null,
  listAllPasskeys: async () => null,
  logout: async () => null,
  getUserInfo: async () => null,
  showCheckout: async () => null,
  showWalletUI: async () => null,
  showWalletScanner: async () => null,
  signMessage: async () => "",
  sendTransaction: async () => null,
  toggleCancelModal: async () => null,
  toggleRegisterPasskeyModal: async () => null,
  toggleShowInfoPopup: async () => null,
  resetConsole: async () => null,
});

interface IPlaygroundProps {
  children?: ReactNode;
}

type InfoPopupCopy = {
  title?: string;
  subtitle?: string;
};

export function usePlayground(): IPlaygroundContext {
  return useContext(PlaygroundContext);
}

const verifier = "w3a-sfa-web-google";

const clientId = "BPi5PB_UiIZ-cPz1GtV5i1I2iOSOHuimiXBI0e-Oe_u6X3oVAbCiAZOTEBtTXw4tsluTITPqA8zMsfxIKMjiqNQ"; // get from https://dashboard.web3auth.io

export const chainConfigMain = {
  chainId: "0x1",
  displayName: "Ethereum Mainnet",
  chainNamespace: CHAIN_NAMESPACES.EIP155,
  tickerName: "Ethereum",
  ticker: "ETH",
  decimals: 18,
  rpcTarget: "https://rpc.ankr.com/eth",
  blockExplorerUrl: "https://etherscan.io",
  logo: "https://cryptologos.cc/logos/ethereum-eth-logo.png",
};

// const chainConfigTest = {
//   chainId: "0xaa36a7",
//   displayName: "Ethereum Sepolia Testnet",
//   chainNamespace: CHAIN_NAMESPACES.EIP155,
//   tickerName: "Ethereum",
//   ticker: "ETH",
//   decimals: 18,
//   rpcTarget: "https://rpc.ankr.com/eth_sepolia",
//   blockExplorerUrl: "https://sepolia.etherscan.io",
//   logo: "https://cryptologos.cc/logos/ethereum-eth-logo.png",
// };

export const Playground = ({ children }: IPlaygroundProps) => {
  const [web3authSFAuth, setWeb3authSFAuth] = useState<Web3Auth | null>(null);
  const [provider, setProvider] = useState<IProvider | null>(null);
  const [plugin, setPlugin] = useState<PasskeysPlugin | null>(null);
  const [playgroundConsoleTitle, setPlaygroundConsoleTitle] = useState<string>("");
  const [playgroundConsoleData, setPlaygroundConsoleData] = useState<string>("");
  const [playgroundConsole, setPlaygroundConsole] = useState<string>("");
  const [wsPlugin, setWsPlugin] = useState<WalletServicesPlugin | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userInfo, setUserInfo] = useState<OpenloginUserInfo | null>(null);
  const [address, setAddress] = useState<string>("");
  const [balance, setBalance] = useState<string>("");
  const [chainId, setChainId] = useState<string>("");
  const [hasPasskeys, setHasPasskeys] = useState<boolean>(false);
  const [showRegisterPasskeyModal, setShowRegisterPasskeyModal] = useState<boolean>(false);
  const [showInfoPopup, setShowInfoPopup] = useState<boolean>(false);
  const [infoPopupCopy, setInfoPopupCopy] = useState<InfoPopupCopy>({});
  const [passkeys, setPasskeys] = useState<PasskeysData[]>([]);

  // Dialog
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);

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
        setShowRegisterPasskeyModal(true);
      }
      uiConsole();
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
        uiConsole("Browser not supported");
        return;
      }
      await plugin.loginWithPasskey();
      uiConsole("Passkey logged in successfully");
    } catch (error) {
      console.error((error as Error).message);
      toggleCancelModal(true);
    } finally {
      setIsLoading(false);
    }
  };

  const registerPasskey = async () => {
    try {
      setIsLoading(true);
      setShowRegisterPasskeyModal(false);
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
      if (!hasPasskeys) toggleCancelModal(true);
      uiConsole((error as Error).message);
    } finally {
      setIsLoading(false);
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
      setPlaygroundConsoleTitle("User Info Console");
      setPlaygroundConsoleData(JSON.stringify(useInfo, null, 2));
      uiConsole(useInfo);
    }
    return null;
  };

  const showCheckout = async () => {
    if (!wsPlugin) {
      uiConsole("wallet services plugin not initialized yet");
      return;
    }
    if (chainId !== chainConfigMain.chainId) {
      console.log("check: checkout not supported on testnets");
      setInfoPopupCopy({ title: "Error", subtitle: "Checkout not supported on testnets. Switch to mainnet to try checkout" });
      setShowInfoPopup(true);
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

  const signMessage = async (): Promise<string> => {
    if (!provider) {
      uiConsole("No provider found");
      return "";
    }
    const rpc = new RPC(provider);
    const result = await rpc.signMessage();
    uiConsole(result);
    return result;
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

  const toggleCancelModal = (isOpen: boolean) => {
    if (isOpen) {
      setTimeout(() => {
        setIsCancelModalOpen(true);
      }, 0);
    } else {
      setIsCancelModalOpen(false);
    }
  };

  const toggleRegisterPasskeyModal = () => {
    setShowRegisterPasskeyModal((prev) => !prev);
  };

  const toggleShowInfoPopup = () => {
    setShowInfoPopup((prev) => !prev);
  };

  useEffect(() => {
    setIsLoggedIn(!!(provider && web3authSFAuth));
  }, [provider, web3authSFAuth]);

  const uiConsole = (...args: unknown[]) => {
    setPlaygroundConsole(JSON.stringify(args || {}, null, 2));
    console.log(...args);
  };

  const resetConsole = () => {
    setPlaygroundConsoleData("");
    setPlaygroundConsoleTitle("");
  };

  useEffect(() => {
    const init = async () => {
      try {
        const provider = new EthereumPrivateKeyProvider({ config: { chainConfig: chainConfigMain } });
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
              logoDark: "https://web3auth.io/images/web3auth-logo-w.svg",
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
          const account = await rpc.getAccounts();
          if (account) setAddress(account);

          const balance = await rpc.getBalance();
          setBalance(balance);

          const chainId = await rpc.getChainId();
          setChainId(`0x${chainId}`);

          const res = (await plugin?.listAllPasskeys()) as unknown as Record<string, string>[];
          setHasPasskeys(res.length > 0);
          setPasskeys(
            res.map((passkey) => {
              return {
                id: passkey.id,
                name: passkey.provider_name,
                detail1: `${passkey.browser} ${passkey.browser_version} (${passkey.os})`,
                detail2: new Date(passkey.updated_at).toLocaleString(),
              };
            })
          );
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
    playgroundConsoleTitle,
    playgroundConsoleData,
    hasPasskeys,
    passkeys,
    isCancelModalOpen,
    showRegisterPasskeyModal,
    showInfoPopup,
    infoPopupCopy,
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
    toggleCancelModal,
    toggleRegisterPasskeyModal,
    toggleShowInfoPopup,
    resetConsole,
  };
  return <PlaygroundContext.Provider value={contextProvider}>{children}</PlaygroundContext.Provider>;
};
