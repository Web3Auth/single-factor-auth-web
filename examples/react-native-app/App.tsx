import React, {useEffect, useState} from 'react';
import {
  Button,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Dimensions,
  ActivityIndicator,
  Switch,
} from 'react-native';
import '@ethersproject/shims';
// IMP START - Auth Provider Login
import auth from '@react-native-firebase/auth';
// IMP END - Auth Provider Login
import EncryptedStorage from 'react-native-encrypted-storage';
import {decode as atob} from 'base-64';
import {CHAIN_NAMESPACES, IProvider, WEB3AUTH_NETWORK} from '@web3auth/base';

// IMP START - Quick Start
import {SDK_MODE, Web3Auth} from '@web3auth/single-factor-auth';
import {EthereumPrivateKeyProvider} from '@web3auth/ethereum-provider';
// IMP END - Quick Start
import {ethers} from 'ethers';
import {MMKVLoader, useMMKVStorage} from 'react-native-mmkv-storage';
import {
  AccountAbstractionProvider,
  BiconomySmartAccount,
  ISmartAccount,
  KernelSmartAccount,
  SafeSmartAccount,
  TrustSmartAccount,
} from '@web3auth/account-abstraction-provider';

// IMP START - Dashboard Registration
const clientId =
  'BPi5PB_UiIZ-cPz1GtV5i1I2iOSOHuimiXBI0e-Oe_u6X3oVAbCiAZOTEBtTXw4tsluTITPqA8zMsfxIKMjiqNQ'; // get from https://dashboard.web3auth.io
// IMP END - Dashboard Registration

// IMP START - Verifier Creation
const verifier = 'w3a-firebase-demo';
// IMP END - Verifier Creation

// IMP START - Auth Provider Login
async function signInWithEmailPassword() {
  try {
    const res = await auth().signInWithEmailAndPassword(
      'custom+jwt@firebase.login',
      'Testing@123',
    );
    return res;
  } catch (error) {
    console.error(error);
  }
}
// IMP END - Auth Provider Login

// IMP START - SDK Initialization
const chainConfig = {
  chainId: '0x1',
  displayName: 'Ethereum Mainnet',
  chainNamespace: CHAIN_NAMESPACES.EIP155,
  tickerName: 'Ethereum',
  ticker: 'ETH',
  decimals: 18,
  rpcTarget: 'https://rpc.ankr.com/eth',
  blockExplorerUrl: 'https://etherscan.io',
  logo: 'https://cryptologos.cc/logos/ethereum-eth-logo.png',
};

const privateKeyProvider = new EthereumPrivateKeyProvider({
  config: {chainConfig},
});

const PIMLICO_API_KEY = 'YOUR_PIMLICO_API_KEY';

export const getDefaultBundlerUrl = (chainId: string): string => {
  return `https://api.pimlico.io/v2/${Number(
    chainId,
  )}/rpc?apikey=${PIMLICO_API_KEY}`;
};

export type SmartAccountType = 'safe' | 'kernel' | 'biconomy' | 'trust';

export type AccountAbstractionConfig = {
  bundlerUrl?: string;
  paymasterUrl?: string;
  smartAccountType?: SmartAccountType;
};

const AAConfig: AccountAbstractionConfig = {
  // bundlerUrl: "https://bundler.safe.global",
  // paymasterUrl: "https://paymaster.safe.global",
  smartAccountType: 'safe',
};

// IMP END - SDK Initialization

const storage = new MMKVLoader().initialize();

export default function App() {
  const [web3authSFAuth, setWeb3authSFAuth] = useState<Web3Auth | null>(null);
  const [provider, setProvider] = useState<IProvider | null>(null);
  const [loggedIn, setLoggedIn] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [userInfo, setUserInfo] = useState<string>('');
  const [consoleUI, setConsoleUI] = useState<string>('');
  const [useAccountAbstraction, setUseAccountAbstraction] =
    useMMKVStorage<boolean>('useAccountAbstraction', storage, false);

  const toggleAccountAbstraction = () => {
    setUseAccountAbstraction(prevState => !prevState);
  };

  useEffect(() => {
    const init = async () => {
      try {
        setLoading(true);

        // setup aa provider
        let aaProvider: AccountAbstractionProvider | undefined;
        if (useAccountAbstraction) {
          const {bundlerUrl, paymasterUrl, smartAccountType} = AAConfig;

          let smartAccountInit: ISmartAccount;
          switch (smartAccountType) {
            case 'biconomy':
              smartAccountInit = new BiconomySmartAccount();
              break;
            case 'kernel':
              smartAccountInit = new KernelSmartAccount();
              break;
            case 'trust':
              smartAccountInit = new TrustSmartAccount();
              break;
            // case "light":
            //   smartAccountInit = new LightSmartAccount();
            //   break;
            // case "simple":
            //   smartAccountInit = new SimpleSmartAccount();
            //   break;
            case 'safe':
            default:
              smartAccountInit = new SafeSmartAccount();
              break;
          }

          aaProvider = new AccountAbstractionProvider({
            config: {
              chainConfig,
              bundlerConfig: {
                url: bundlerUrl ?? getDefaultBundlerUrl(chainConfig.chainId),
              },
              paymasterConfig: paymasterUrl
                ? {
                    url: paymasterUrl,
                  }
                : undefined,
              smartAccountInit,
            },
          });
        }

        const web3auth = new Web3Auth({
          clientId, // Get your Client ID from Web3Auth Dashboard
          web3AuthNetwork: WEB3AUTH_NETWORK.SAPPHIRE_MAINNET,
          privateKeyProvider,
          accountAbstractionProvider: aaProvider,
          storage: EncryptedStorage,
          mode: SDK_MODE.REACT_NATIVE,
        });
        setWeb3authSFAuth(web3auth);

        // IMP START - SDK Initialization
        await web3auth.init();
        setProvider(web3auth.provider);
        // IMP END - SDK Initialization

        if (web3auth.connected) {
          setLoggedIn(true);
        }
      } catch (error) {
        uiConsole(error, 'mounted caught');
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [useAccountAbstraction]);

  const parseToken = (token: any) => {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace('-', '+').replace('_', '/');
      return JSON.parse(atob(base64 || ''));
    } catch (err) {
      uiConsole(err);
      return null;
    }
  };

  const login = async () => {
    try {
      setConsoleUI('Logging in');
      setLoading(true);
      // IMP START - Auth Provider Login
      const loginRes = await signInWithEmailPassword();
      // IMP END - Auth Provider Login
      uiConsole('Login success', loginRes);
      // IMP START - Login
      const idToken = await loginRes!.user.getIdToken(true);
      // IMP END - Login
      uiConsole('idToken', idToken);
      const parsedToken = parseToken(idToken);
      setUserInfo(parsedToken);

      // IMP START - Login
      const verifierId = parsedToken.sub;
      uiConsole('trying to connect');
      await web3authSFAuth?.connect({
        verifier, // e.g. `web3auth-sfa-verifier` replace with your verifier name, and it has to be on the same network passed in init().
        verifierId, // e.g. `Yux1873xnibdui` or `name@email.com` replace with your verifier id(sub or email)'s value.
        idToken,
      });
      uiConsole('connected');

      // IMP END - Login
      setProvider(web3authSFAuth?.provider || null);

      setLoading(false);
      if (web3authSFAuth?.connected) {
        setLoggedIn(true);
        uiConsole('Logged In');
      }
    } catch (e) {
      uiConsole(e);
      setLoading(false);
    }
  };

  // IMP START - Blockchain Calls
  const getAccounts = async () => {
    setConsoleUI('Getting account');
    // For ethers v5
    // const ethersProvider = new ethers.providers.Web3Provider(this.provider);
    const ethersProvider = new ethers.BrowserProvider(provider!);

    // For ethers v5
    // const signer = ethersProvider.getSigner();
    const signer = await ethersProvider.getSigner();

    // Get user's Ethereum public address
    const address = signer.getAddress();
    uiConsole(address);
  };
  const getBalance = async () => {
    setConsoleUI('Fetching balance');
    // For ethers v5
    // const ethersProvider = new ethers.providers.Web3Provider(this.provider);
    const ethersProvider = new ethers.BrowserProvider(provider!);

    // For ethers v5
    // const signer = ethersProvider.getSigner();
    const signer = await ethersProvider.getSigner();

    // Get user's Ethereum public address
    const address = signer.getAddress();

    // Get user's balance in ether
    // For ethers v5
    // const balance = ethers.utils.formatEther(
    // await ethersProvider.getBalance(address) // Balance is in wei
    // );
    const balance = ethers.formatEther(
      await ethersProvider.getBalance(address), // Balance is in wei
    );

    uiConsole(balance);
  };
  const signMessage = async () => {
    setConsoleUI('Signing message');
    // For ethers v5
    // const ethersProvider = new ethers.providers.Web3Provider(this.provider);
    const ethersProvider = new ethers.BrowserProvider(provider!);

    // For ethers v5
    // const signer = ethersProvider.getSigner();
    const signer = await ethersProvider.getSigner();
    const originalMessage = 'YOUR_MESSAGE';

    // Sign the message
    const signedMessage = await signer.signMessage(originalMessage);
    uiConsole(signedMessage);
  };
  // IMP END - Blockchain Calls

  const logout = async () => {
    // IMP START - Logout
    web3authSFAuth?.logout();
    // IMP END - Logout
    setProvider(null);
    setLoggedIn(false);
    setUserInfo('');
  };

  const uiConsole = (...args: any) => {
    setConsoleUI(JSON.stringify(args || {}, null, 2) + '\n\n\n\n' + consoleUI);
    console.log(...args);
  };

  const loggedInView = (
    <View style={styles.buttonArea}>
      <Button title="Get User Info" onPress={() => uiConsole(userInfo)} />
      <Button title="Get Accounts" onPress={() => getAccounts()} />
      <Button title="Get Balance" onPress={() => getBalance()} />
      <Button title="Sign Message" onPress={() => signMessage()} />
      <Button title="Log Out" onPress={logout} />
    </View>
  );

  const unloggedInView = (
    <View style={styles.buttonArea}>
      <View>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
          <Text style={{paddingRight: 6}}>Use Account Abstraction:</Text>
          <Switch
            onValueChange={toggleAccountAbstraction}
            value={useAccountAbstraction}
          />
        </View>
      </View>
      <Button title="Login with Web3Auth" onPress={login} />
      {loading && <ActivityIndicator />}
    </View>
  );

  return (
    <View style={styles.container}>
      {loggedIn ? loggedInView : unloggedInView}
      <View style={styles.consoleArea}>
        <Text style={styles.consoleText}>Console:</Text>
        <ScrollView style={styles.consoleUI}>
          <Text>{consoleUI}</Text>
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 50,
    paddingBottom: 30,
  },
  consoleArea: {
    margin: 20,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  consoleUI: {
    flex: 1,
    backgroundColor: '#CCCCCC',
    color: '#ffffff',
    padding: 10,
    width: Dimensions.get('window').width - 60,
  },
  consoleText: {
    padding: 10,
  },
  buttonArea: {
    flex: 2,
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingBottom: 30,
  },
});
