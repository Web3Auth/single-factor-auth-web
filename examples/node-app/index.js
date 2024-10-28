// IMP START - Quick Start
const { Web3Auth, SDK_MODE } = require("@web3auth/single-factor-auth");
const { EthereumPrivateKeyProvider } = require("@web3auth/ethereum-provider");
// IMP END - Quick Start
const jwt = require('jsonwebtoken');
// const fs = require('fs').promises;
const fsSync = require('fs');
const { BiconomySmartAccount, KernelSmartAccount, TrustSmartAccount, SafeSmartAccount, AccountAbstractionProvider } = require("@web3auth/account-abstraction-provider");
const { CHAIN_NAMESPACES } = require("@web3auth/base");
// const path = require("path");

// IMP START - Dashboard Registration
const clientId = "BPi5PB_UiIZ-cPz1GtV5i1I2iOSOHuimiXBI0e-Oe_u6X3oVAbCiAZOTEBtTXw4tsluTITPqA8zMsfxIKMjiqNQ"; // Get your Client ID from Web3Auth Dashboard
// IMP END - Dashboard Registration

// IMP START - Verifier Creation
const verifier = "w3a-node-demo";
// IMP END - Verifier Creation

const chainConfig = {
  chainId: "0x1",
  displayName: "Ethereum Mainnet",
  chainNamespace: "eip155",
  tickerName: "Ethereum",
  ticker: "ETH",
  decimals: 18,
  rpcTarget: "https://rpc.ankr.com/eth",
  blockExplorerUrl: "https://etherscan.io",
  logo: "https://cryptologos.cc/logos/ethereum-eth-logo.png",
};

// const chainConfig = {
//   chainId: "0xaa36a7",
//   displayName: "Ethereum Sepolia Testnet",
//   chainNamespace: "eip155",
//   tickerName: "Ethereum",
//   ticker: "ETH",
//   decimals: 18,
//   rpcTarget: "https://rpc.ankr.com/eth_sepolia",
//   blockExplorerUrl: "https://sepolia.etherscan.io",
//   logo: "https://cryptologos.cc/logos/ethereum-eth-logo.png",
// };

// IMP START - account abstraction config
const useAccountAbstraction = false;

const pimlicoApiKey = "YOUR_API_KEY";

const getDefaultBundlerUrl = (chainId) => {
  return `https://api.pimlico.io/v2/${Number(chainId)}/rpc?apikey=${pimlicoApiKey}`;
};

// const bundlerUrl = "";
const bundlerUrl = undefined;
const paymasterUrl = undefined;

const aaConfig = {
  bundlerUrl: bundlerUrl ?? getDefaultBundlerUrl(chainConfig.chainId),
  paymasterUrl,
  smartAccountType: "safe",
};
// IMP END - account abstraction config

// IMP START - SDK Initialization
const privateKeyProvider = new EthereumPrivateKeyProvider({
  config: {
    chainConfig,
  }
});

// setup aa provider
let aaProvider;
if (useAccountAbstraction) {
  const { bundlerUrl, paymasterUrl, smartAccountType } = aaConfig;

  let smartAccountInit;
  switch (smartAccountType) {
    case "biconomy":
      smartAccountInit = new BiconomySmartAccount();
      break;
    case "kernel":
      smartAccountInit = new KernelSmartAccount();
      break;
    case "trust":
      smartAccountInit = new TrustSmartAccount();
      break;
    // case "light":
    //   smartAccountInit = new LightSmartAccount();
    //   break;
    // case "simple":
    //   smartAccountInit = new SimpleSmartAccount();
    //   break;
    case "safe":
    default:
      smartAccountInit = new SafeSmartAccount();
      break;
  }
  aaProvider = new AccountAbstractionProvider({
    config: {
      chainConfig,
      bundlerConfig: { url: bundlerUrl },
      paymasterConfig: paymasterUrl ? { url: paymasterUrl } : undefined,
      smartAccountInit,
    },
  });
}

const web3auth = new Web3Auth({
  clientId,
  web3AuthNetwork: "sapphire_mainnet", // Get your Network ID from Web3Auth Dashboard
  privateKeyProvider,
  accountAbstractionProvider: aaProvider,
  mode: SDK_MODE.NODE,
});
// IMP END - SDK Initialization

// IMP START - Auth Provider Login
var privateKey = fsSync.readFileSync('privateKey.pem');

var sub = Math.random().toString(36).substring(7);

var token = jwt.sign(
  {
    sub: sub,
    name: 'DevRel',
    email: 'devrel@web3auth.io',
    aud: 'urn:api-web3auth-io',
    iss: 'https://web3auth.io',
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 60 * 60,
  },
  privateKey,
  { algorithm: 'RS256', keyid: '2ma4enu1kdvw5bo9xsfpi3gcjzrt6q78yl0h' },
);
// IMP END - Auth Provider Login

const connect = async () => {
  await web3auth.init();
  // IMP START - Login
  const provider = await web3auth.connect({
    verifier: "w3a-node-demo", // replace with your verifier name
    verifierId: sub, // replace with your verifier id's value, for example, sub value of JWT Token, or email address.
    idToken: token, // replace with your newly created unused JWT Token.
  });
  // IMP END - Login
  // smart account does not have private key
  if (!useAccountAbstraction) {
    const eth_private_key = await provider.request({ method: "eth_private_key" });
    console.log("ETH PrivateKey: ", eth_private_key);
  }
  const eth_address = await provider.request({ method: "eth_accounts" });
  console.log("ETH Address: ", eth_address[0]);
  process.exit(0);
};
connect();