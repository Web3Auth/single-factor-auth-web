import { useEffect, useState } from "react";
import { base64url } from "@toruslabs/openlogin-utils";

// Import Single Factor Auth SDK for no redirect flow
import { Web3Auth, ADAPTER_EVENTS } from "@web3auth/single-factor-auth";
import { CHAIN_NAMESPACES } from "@web3auth/base";
import { EthereumPrivateKeyProvider } from "@web3auth/ethereum-provider";

// RPC libraries for blockchain calls
import RPC from "./evm.web3";
// import RPC from "./evm.ethers";

// Firebase libraries for custom authentication
import { initializeApp } from "firebase/app";
import { GoogleAuthProvider, getAuth, signInWithPopup, UserCredential } from "firebase/auth";

import Loading from "./Loading";
import "./App.css";
import { IProvider } from "@web3auth/base";
import { PasskeysPlugin } from "@web3auth/passkeys-plugin";


const verifier = "web3auth-firebase-examples";
(window as any).base64url = base64url;
(window as any).Buffer = Buffer;
const clientId = "BEglQSgt4cUWcj6SKRdu5QkOXTsePmMcusG5EAoyjyOYKlVRjIF1iCNnMOTfpzCiunHRrMui8TIwQPXdkQ8Yxuk"; // get from https://dashboard.web3auth.io

const chainConfig = {
  chainNamespace: CHAIN_NAMESPACES.EIP155,
  chainId: "0x1",
  rpcTarget: "https://rpc.ankr.com/eth",
  displayName: "ETH Mainnet",
  blockExplorer: "https://etherscan.io",
  ticker: "ETH",
  tickerName: "Ethereum",
};

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyB0nd9YsPLu-tpdCrsXn8wgsWVAiYEpQ_E",
  authDomain: "web3auth-oauth-logins.firebaseapp.com",
  projectId: "web3auth-oauth-logins",
  storageBucket: "web3auth-oauth-logins.appspot.com",
  messagingSenderId: "461819774167",
  appId: "1:461819774167:web:e74addfb6cc88f3b5b9c92",
};

function App() {
  const [web3authSFAuth, setWeb3authSFAuth] = useState<Web3Auth | null>(null);
  const [usesSfaSDK, setUsesSfaSDK] = useState(false);
  const [provider, setProvider] = useState<IProvider | null>(null);
  // const [veriferId, setVerifierId] = useState<string | null>(null);
  const [passkeyPlugin, setPasskeyPlugin] = useState<PasskeysPlugin | null>(null);
  // const [idToken, setIdToken] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const app = initializeApp(firebaseConfig);

  useEffect(() => {
    const init = async () => {
      try {
        // Initialising Web3Auth Single Factor Auth SDK
        const web3authSfa = new Web3Auth({
          clientId, // Get your Client ID from Web3Auth Dashboard
          web3AuthNetwork: "sapphire_devnet", // ["cyan", "testnet"]
          usePnPKey: true, // Setting this to true returns the same key as PnP Web SDK, By default, this SDK returns CoreKitKey.
          metadataHost: "https://metadata-testing.tor.us"
        });
        web3authSfa.on(ADAPTER_EVENTS.CONNECTED, async (data) => {
          console.log("sfa:connected", data);
          console.log("sfa:state", web3authSfa?.state);
          setProvider(web3authSfa.provider);
          setUsesSfaSDK(true);
          const userInfo = await web3authSfa?.getUserInfo()
          console.log("userinfo", userInfo)
          // setVerifierId(userInfo?.verifierId as string)
        });
        web3authSfa.on(ADAPTER_EVENTS.DISCONNECTED, () => {
          console.log("sfa:disconnected");
          setProvider(null);
        });
        setWeb3authSFAuth(web3authSfa);
        const provider = new EthereumPrivateKeyProvider({ config: { chainConfig } });
        const plugin = new PasskeysPlugin({ buildEnv: "local", metadataHost: "https://metadata-testing.tor.us" });
        web3authSfa.addPlugin(plugin);
        setPasskeyPlugin(plugin);

        await web3authSfa.init(provider);
      } catch (error) {
        console.error(error);
      }
    };

    init();
  }, []);

  const signInWithGoogle = async (): Promise<UserCredential> => {
    try {
      const auth = getAuth(app);
      const googleProvider = new GoogleAuthProvider();
      const res = await signInWithPopup(auth, googleProvider);
      return res;
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  const parseToken = (token: any) => {
    try {
      const base64Url = token.split(".")[1];
      const base64 = base64Url.replace("-", "+").replace("_", "/");
      return JSON.parse(window.atob(base64 || ""));
    } catch (err) {
      console.error(err);
      return null;
    }
  };

  const login = async () => {
    setIsLoggingIn(true);
    // login with firebase
    const loginRes = await signInWithGoogle();
    // get the id token from firebase
    const token = await loginRes.user.getIdToken(true);
    // setIdToken(token);

    // trying logging in with the Single Factor Auth SDK
    try {
      if (!web3authSFAuth) {
        uiConsole("Web3Auth Single Factor Auth SDK not initialized yet");
        return;
      }
      // get sub value from firebase id token
      const { sub } = parseToken(token);
      // setVerifierId(sub);
      const web3authSfaprovider = await web3authSFAuth.connect({
        verifier,
        verifierId: sub,
        idToken: token,
      });
      if (web3authSfaprovider) {
        setProvider(web3authSfaprovider);
        const privKey = await web3authSfaprovider?.request({ method: "eth_private_key" });
        console.log(privKey);
      }
      setUsesSfaSDK(true);
      setIsLoggingIn(false);
    } catch (err) {
      // Single Factor Auth SDK throws an error if the user has already enabled MFA
      // One can use the Web3AuthNoModal SDK to handle this case
      setIsLoggingIn(false);
      console.error(err);
    }
  };

  const getUserInfo = async () => {
    if (web3authSFAuth && web3authSFAuth?.connected) {
      uiConsole("user info", await web3authSFAuth?.getUserInfo());
      return;
    }
  };

  const authenticateUser = async () => {
    if (!web3authSFAuth) {
      uiConsole("web3auth not initialized yet");
      return;
    }
    const token = await web3authSFAuth?.authenticateUser();
    uiConsole(token);
  };

  const addChain = async () => {
    if (!provider) {
      uiConsole("provider not initialized yet");
      return;
    }
    const newChain = {
      chainId: "0x5",
      displayName: "Goerli Testnet",
      chainNamespace: CHAIN_NAMESPACES.EIP155,
      tickerName: "Ethereum",
      ticker: "ETH",
      decimals: 18,
      rpcTarget: "https://rpc.ankr.com/eth_goerli/",
      blockExplorer: "https://goerli.etherscan.io",
    };
    await web3authSFAuth?.addChain(newChain);
    uiConsole("New Chain Added");
  };

  const switchChain = async () => {
    if (!provider) {
      uiConsole("provider not initialized yet");
      return;
    }
    await web3authSFAuth?.switchChain({ chainId: "0x5" });
    uiConsole("Chain Switched");
  };

  const logout = async () => {
    if (usesSfaSDK) {
      if (!web3authSFAuth) {
        throw new Error("web3auth sfa auth not initialized.");
      }
      console.log(
        "You are directly using Single Factor Auth SDK to login the user, hence the Web3Auth logout function won't work for you. You can logout the user directly from your login provider, or just clear the provider object."
      );
      await web3authSFAuth.logout();
      const provider = new EthereumPrivateKeyProvider({ config: { chainConfig } });
      await web3authSFAuth.init(provider);
      return;
    }
  };

  const getAccounts = async () => {
    if (!provider) {
      uiConsole("No provider found");
      return;
    }
    const rpc = new RPC(provider);
    const userAccount = await rpc.getAccounts();
    uiConsole(userAccount);
  };

  const getBalance = async () => {
    if (!provider) {
      uiConsole("No provider found");
      return;
    }
    const rpc = new RPC(provider);
    const balance = await rpc.getBalance();
    uiConsole(balance);
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

  const getChainId = async () => {
    if (!provider) {
      uiConsole("provider not initialized yet");
      return;
    }
    const rpc = new RPC(provider);
    const chainId = await rpc.getChainId();
    uiConsole(chainId);
  };

  const getPrivateKey = async () => {
    if (!provider) {
      uiConsole("provider not initialized yet");
      return;
    }
    const privateKey = await provider?.request({ method: "eth_private_key" });
    uiConsole(privateKey);
  };

  const registerPasskey = async () => { 
    if (!passkeyPlugin) throw new Error("Passkey plugin not initialized");

    await passkeyPlugin.registerPasskey({ username: `Passkey - ${new Date(Date.now()).toUTCString()}` });
    uiConsole("Passkey registered successfully");
  }

  const listAllPasskeys = async () => { 
    if (!passkeyPlugin) throw new Error("Passkey plugin not initialized");

    const result = await passkeyPlugin.listAllPasskeys();
    uiConsole("Passkey registered successfully", result);
  }

  const loginPasskey = async () => { 
    if (!passkeyPlugin) throw new Error("Passkey plugin not initialized");
    await passkeyPlugin.loginWithPasskey();
    uiConsole("Passkey logged in successfully");
  }

  function uiConsole(...args: any[]): void {
    const el = document.querySelector("#console>p");
    if (el) {
      el.innerHTML = JSON.stringify(args || {}, null, 2);
    }
  }

  const loginView = (
    <>
      <div className="flex-container">
        <div>
          <button onClick={getUserInfo} className="card">
            Get User Info
          </button>
        </div>
        <div>
          <button onClick={getAccounts} className="card">
            Get Accounts
          </button>
        </div>
        <div>
          <button onClick={getChainId} className="card">
            Get Chain ID
          </button>
        </div>
        <div>
          <button onClick={authenticateUser} className="card">
            Get ID Token
          </button>
        </div>
        <div>
          <button onClick={getBalance} className="card">
            Get Balance
          </button>
        </div>
        <div>
          <button onClick={addChain} className="card">
            Add Chain
          </button>
        </div>
        <div>
          <button onClick={switchChain} className="card">
            Switch Chain
          </button>
        </div>
        <div>
          <button onClick={signMessage} className="card">
            Sign Message
          </button>
        </div>
        <div>
          <button onClick={sendTransaction} className="card">
            Send Transaction
          </button>
        </div>
        <div>
          <button onClick={getPrivateKey} className="card">
            Get Private Key
          </button>
        </div>
        <div>
          <button onClick={registerPasskey} className="card">
           Register Passkey
          </button>
        </div>
        <div>
          <button onClick={listAllPasskeys} className="card">
           List All Passkeys
          </button>
        </div>
        <div>
          <button onClick={logout} className="card">
            Log Out
          </button>
        </div>
      </div>

      <div id="console" style={{ whiteSpace: "pre-line" }}>
        <p style={{ whiteSpace: "pre-line" }}></p>
      </div>
    </>
  );

  const logoutView = (
    <>
      <button onClick={login} className="card">
        Login
      </button>
      <button onClick={loginPasskey} className="card">
        Login with Passkey
      </button>
    </>
  );

  return (
    <div className="container">
      <h1 className="title">
        <a target="_blank" href="http://web3auth.io/" rel="noreferrer">
          Web3Auth
        </a>{" "}
        SFA React Example
      </h1>

      {isLoggingIn ? <Loading /> : <div className="grid">{web3authSFAuth ? (provider ? loginView : logoutView) : null}</div>}

      <footer className="footer">
        <a
          href="https://github.com/Web3Auth/web3auth-core-kit-examples/tree/main/single-factor-auth/sfa-react-example"
          target="_blank"
          rel="noopener noreferrer"
        >
          Source code
        </a>
      </footer>
    </div>
  );
}

export default App;
