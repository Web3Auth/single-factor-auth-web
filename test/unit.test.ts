import { CHAIN_NAMESPACES, CustomChainConfig, IBaseProvider, IProvider, WEB3AUTH_NETWORK } from "@web3auth/base";
import { CommonPrivateKeyProvider } from "@web3auth/base-provider";
import { EthereumPrivateKeyProvider } from "@web3auth/ethereum-provider";
import { SolanaPrivateKeyProvider } from "@web3auth/solana-provider";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

import { SDK_MODE } from "../src";
import { TORUS_LEGACY_NETWORK, Web3AuthOptions } from "../src/interface";
import { Web3Auth } from "../src/Web3Auth";
import { generateIdToken } from "./helpers";

const TORUS_TEST_EMAIL = "hello@tor.us";
const TORUS_TEST_VERIFIER = "torus-test-health";
const TORUS_TEST_AGGREGATE_VERIFIER = "torus-test-health-aggregate";

const sepoliaChainConfig = {
  chainConfig: {
    chainId: "0xaa36a7",
    rpcTarget: "https://rpc.ankr.com/eth_sepolia",
    chainNamespace: CHAIN_NAMESPACES.EIP155,
    displayName: "ETH Sepolia",
    blockExplorerUrl: "https://sepolia.etherscan.io",
    ticker: "ETH",
    tickerName: "Ethereum",
  },
};

const mainnetChainConfig = {
  chainConfig: {
    chainId: "0x1",
    rpcTarget: "https://rpc.ankr.com/eth_mainnet",
    chainNamespace: CHAIN_NAMESPACES.EIP155,
    displayName: "ETH Mainnet",
    blockExplorerUrl: "https://etherscan.io",
    ticker: "ETH",
    tickerName: "Ethereum",
  },
};

describe("SFA SDK unit tests", function () {
  describe("Web3Auth object creation", function () {
    it("should throw error if clientId is not provided", function () {
      const options = {};
      // @ts-expect-error test missing clientId
      expect(() => new Web3Auth(options)).toThrow();
    });

    it("should throw error if privateKeyProvider is not provided", function () {
      const options = { clientId: "test" };
      // @ts-expect-error test missing privateKeyProvider
      expect(() => new Web3Auth(options)).toThrow();
    });

    it("should throw error if chainId in options is not same as chainId in privateKeyProvider", function () {
      const privateKeyProvider = new EthereumPrivateKeyProvider({
        config: sepoliaChainConfig,
      });
      const options = {
        clientId: "test",
        privateKeyProvider,
        chainConfig: mainnetChainConfig.chainConfig,
      };
      expect(() => new Web3Auth(options)).toThrow();
    });

    it("should map coreOptions from constructor params", function () {
      const privateKeyProvider = new EthereumPrivateKeyProvider({
        config: sepoliaChainConfig,
      });
      const options: Web3AuthOptions = {
        clientId: "test",
        privateKeyProvider,
        web3AuthNetwork: WEB3AUTH_NETWORK.AQUA,
        chainConfig: {
          chainNamespace: CHAIN_NAMESPACES.EIP155,
          chainId: "0xaa36a7",
          rpcTarget: "https://rpc.ankr.com/eth_sepolia",
        },
        usePnPKey: false,
        sessionTime: 1000,
        storageKey: "session",
        storageServerUrl: "https://example.com",
        mode: SDK_MODE.NODE,
        serverTimeOffset: 0,
        useDkg: true,
        storage: "session",
      };
      const web3auth = new Web3Auth(options);
      expect(web3auth.coreOptions).toEqual({ ...options, storage: expect.any(Object) });
    });

    it("should set chainConfig from privateKeyProvider if not provided in constructor", function () {
      const privateKeyProvider = new EthereumPrivateKeyProvider({
        config: sepoliaChainConfig,
      });
      const options: Web3AuthOptions = {
        clientId: "test",
        privateKeyProvider,
      };
      const web3auth = new Web3Auth(options);
      expect(web3auth.coreOptions.chainConfig).toEqual(privateKeyProvider.currentChainConfig);
    });

    it("should set privateKeyProvider when provided in constructor", async function () {
      const privateKeyProvider = new EthereumPrivateKeyProvider({
        config: sepoliaChainConfig,
      });
      const web3auth = new Web3Auth({ clientId: "test", privateKeyProvider });
      await web3auth.init();
      expect(web3auth.provider).toEqual(privateKeyProvider);
    });

    it("should set accountAbstractionProvider when provided in constructor", async function () {
      const accountAbstractionProvider = new EthereumPrivateKeyProvider({
        config: sepoliaChainConfig,
      }) as unknown as IBaseProvider<IProvider>;

      const privateKeyProvider = new EthereumPrivateKeyProvider({
        config: mainnetChainConfig,
      });

      const web3auth = new Web3Auth({ clientId: "test", privateKeyProvider, accountAbstractionProvider });
      await web3auth.init();
      expect(web3auth.provider).toEqual(accountAbstractionProvider);
      expect(web3auth.provider).not.toEqual(privateKeyProvider);
    });

    describe("Default values", function () {
      let privateKeyProvider: EthereumPrivateKeyProvider;
      let web3auth: Web3Auth;
      beforeAll(function () {
        privateKeyProvider = new EthereumPrivateKeyProvider({
          config: sepoliaChainConfig,
        });
        web3auth = new Web3Auth({ clientId: "test", privateKeyProvider });
      });

      it("should set sessionTime to 86400 if not provided in constructor", function () {
        expect(web3auth.coreOptions.sessionTime).toBe(86400);
      });

      it("should set web3AuthNetwork to MAINNET if not provided in constructor", function () {
        expect(web3auth.coreOptions.web3AuthNetwork).toBe(WEB3AUTH_NETWORK.MAINNET);
      });

      it("should set storageServerUrl to https://session.web3auth.io if not provided in constructor", function () {
        expect(web3auth.coreOptions.storageServerUrl).toBe("https://session.web3auth.io");
      });

      it("should set storageKey to local if not provided in constructor", function () {
        expect(web3auth.coreOptions.storageKey).toBe("local");
      });

      it("should set mode to WEB if not provided in constructor", function () {
        expect(web3auth.coreOptions.mode).toBe(SDK_MODE.WEB);
      });
    });
  });

  describe("getProvider", function () {
    it("should return privateKeyProvider if not initialized", async function () {
      const privateKeyProvider = new EthereumPrivateKeyProvider({
        config: sepoliaChainConfig,
      });
      const web3auth = new Web3Auth({ clientId: "test", privateKeyProvider });
      await web3auth.init();
      expect(web3auth.provider).toEqual(privateKeyProvider);
    });

    it("should return accountAbstractionProvider if initialized with accountAbstractionProvider", async function () {
      const privateKeyProvider = new EthereumPrivateKeyProvider({
        config: sepoliaChainConfig,
      });
      const accountAbstractionProvider = new EthereumPrivateKeyProvider({
        config: mainnetChainConfig,
      }) as unknown as IBaseProvider<IProvider>;
      const web3auth = new Web3Auth({ clientId: "test", privateKeyProvider, accountAbstractionProvider });
      await web3auth.init();
      expect(web3auth.provider).toEqual(accountAbstractionProvider);
    });
  });

  describe("setProvider", function () {
    it("should throw error if called", function () {
      const privateKeyProvider = new EthereumPrivateKeyProvider({
        config: sepoliaChainConfig,
      });
      const web3auth = new Web3Auth({ clientId: "test", privateKeyProvider });
      expect(() => (web3auth.provider = privateKeyProvider)).toThrow();
    });
  });

  describe("init", function () {
    let privateKeyProvider: EthereumPrivateKeyProvider;

    beforeEach(function () {
      privateKeyProvider = undefined;
    });

    it("should throw error if called twice", async function () {
      privateKeyProvider = new EthereumPrivateKeyProvider({
        config: sepoliaChainConfig,
      });
      const web3auth = new Web3Auth({ clientId: "test", privateKeyProvider });
      await web3auth.init();
      await expect(async () => {
        await web3auth.init();
      }).rejects.toThrow("Wallet is not ready yet, Already initialized");
    });

    it("should throw error if chainNamespace is not provided", async function () {
      privateKeyProvider = new EthereumPrivateKeyProvider({
        config: {
          chainConfig: {
            ...sepoliaChainConfig.chainConfig,
            chainNamespace: undefined,
          },
        },
      });
      const web3auth = new Web3Auth({ clientId: "test", privateKeyProvider });
      await expect(async () => {
        await web3auth.init();
      }).rejects.toThrow("Invalid params passed in, provider should have chainConfig and should be initialized with chainId and chainNamespace");
    });

    it("should init successfully and return provider", async function () {
      privateKeyProvider = new EthereumPrivateKeyProvider({
        config: sepoliaChainConfig,
      });
      const web3auth = new Web3Auth({ clientId: "test", privateKeyProvider });
      await web3auth.init();
      expect(web3auth.provider).toEqual(privateKeyProvider);
    });
  });

  describe("connected", function () {
    let web3auth: Web3Auth;

    beforeEach(async function () {
      const privateKeyProvider = new EthereumPrivateKeyProvider({
        config: sepoliaChainConfig,
      });
      web3auth = new Web3Auth({
        clientId: "BCtbnOamqh0cJFEUYA0NB5YkvBECZ3HLZsKfvSRBvew2EiiKW3UxpyQASSR0artjQkiUOCHeZ_ZeygXpYpxZjOs",
        web3AuthNetwork: WEB3AUTH_NETWORK.TESTNET,
        privateKeyProvider,
      });
      await web3auth.init();
    });

    afterEach(async function () {
      if (web3auth.connected) {
        await web3auth.logout();
      }
    });

    it("should return false if not connected yet and not initialized", async function () {
      expect(web3auth.connected).toBe(false);
    });

    it("should return true if connected", async function () {
      await web3auth.connect({
        verifier: TORUS_TEST_VERIFIER,
        verifierId: TORUS_TEST_EMAIL,
        idToken: generateIdToken(TORUS_TEST_EMAIL, "ES256"),
      });
      expect(web3auth.connected).toBe(true);
    });

    it("should return false after logout", async function () {
      await web3auth.connect({
        verifier: TORUS_TEST_VERIFIER,
        verifierId: TORUS_TEST_EMAIL,
        idToken: generateIdToken(TORUS_TEST_EMAIL, "ES256"),
      });
      expect(web3auth.connected).toBe(true);
      await web3auth.logout();
      expect(web3auth.connected).toBe(false);
    });
  });

  describe("authenticateUser", function () {
    let web3auth: Web3Auth;

    beforeEach(async function () {
      const privateKeyProvider = new EthereumPrivateKeyProvider({
        config: sepoliaChainConfig,
      });
      web3auth = new Web3Auth({ clientId: "test", privateKeyProvider });
      await web3auth.init();
    });

    afterEach(async function () {
      if (web3auth.connected) {
        await web3auth.logout();
      }
    });

    it("should throw error if not connected", async function () {
      await expect(async () => {
        await web3auth.authenticateUser();
      }).rejects.toThrow("Wallet is not connected");
    });

    it("should return idToken if connected", async function () {
      await web3auth.connect({
        verifier: TORUS_TEST_VERIFIER,
        verifierId: TORUS_TEST_EMAIL,
        idToken: generateIdToken(TORUS_TEST_EMAIL, "ES256"),
      });
      const userInfo = await web3auth.authenticateUser();
      expect(userInfo.idToken).not.toBeNull();
    });

    it("should throw error if authInstance is not initialized", async function () {
      await web3auth.connect({
        verifier: TORUS_TEST_VERIFIER,
        verifierId: TORUS_TEST_EMAIL,
        idToken: generateIdToken(TORUS_TEST_EMAIL, "ES256"),
      });
      // eslint-disable-next-line require-atomic-updates
      web3auth.authInstance = undefined; // simulate authInstance not initialized
      await expect(async () => {
        await web3auth.authenticateUser();
      }).rejects.toThrow("Wallet is not ready yet");
    });

    it("should get idToken from state if it exists", async function () {
      await web3auth.connect({
        verifier: TORUS_TEST_VERIFIER,
        verifierId: TORUS_TEST_EMAIL,
        idToken: generateIdToken(TORUS_TEST_EMAIL, "ES256"),
      });

      // @ts-expect-error test
      // eslint-disable-next-line require-atomic-updates
      web3auth.state.userInfo = { idToken: "Test-Token" };

      const userInfo = await web3auth.authenticateUser();
      expect(userInfo.idToken).toBe("Test-Token");
    });
  });

  describe("addChain", function () {
    let web3auth: Web3Auth;

    beforeEach(async function () {
      const privateKeyProvider = new EthereumPrivateKeyProvider({
        config: sepoliaChainConfig,
      });
      web3auth = new Web3Auth({ clientId: "test", privateKeyProvider });
    });

    it("should throw error if not initialized", async function () {
      await expect(async () => {
        await web3auth.addChain({
          chainNamespace: CHAIN_NAMESPACES.EIP155,
          chainId: "0xaa36a7",
          rpcTarget: "https://rpc.ankr.com/eth_sepolia",
        });
      }).rejects.toThrow("Wallet is not ready yet");
    });

    it("should add chain successfully", async function () {
      await web3auth.init();
      await web3auth.addChain({
        chainNamespace: CHAIN_NAMESPACES.EIP155,
        chainId: "0xaa36a7",
        rpcTarget: "https://rpc.ankr.com/eth_sepolia",
      });
    });
  });

  describe("switchChain", function () {
    let web3auth: Web3Auth;

    beforeEach(async function () {
      const privateKeyProvider = new EthereumPrivateKeyProvider({
        config: sepoliaChainConfig,
      });
      web3auth = new Web3Auth({
        clientId: "BCtbnOamqh0cJFEUYA0NB5YkvBECZ3HLZsKfvSRBvew2EiiKW3UxpyQASSR0artjQkiUOCHeZ_ZeygXpYpxZjOs",
        privateKeyProvider,
      });
    });

    it("should throw error if not initialized", async function () {
      await expect(async () => {
        await web3auth.switchChain({ chainId: "0xaa36a7" });
      }).rejects.toThrow("Wallet is not ready yet");
    });

    it("should throw error if initialized but not connected", async function () {
      await expect(async () => {
        await web3auth.init();
        await web3auth.switchChain({ chainId: "0xaa36a7" });
      }).rejects.toThrow("Provider is not initialized");
    });

    it("should switch chain successfully", async function () {
      await web3auth.init();
      await web3auth.addChain({
        chainNamespace: CHAIN_NAMESPACES.EIP155,
        chainId: "0xaa36a7",
        rpcTarget: "https://rpc.ankr.com/eth_sepolia",
      });
      await web3auth.connect({
        verifier: TORUS_TEST_VERIFIER,
        verifierId: TORUS_TEST_EMAIL,
        idToken: generateIdToken(TORUS_TEST_EMAIL, "ES256"),
      });
      await web3auth.switchChain({ chainId: "0xaa36a7" });
    });
  });

  describe("getPostboxKey", function () {
    let web3auth: Web3Auth;

    beforeEach(async function () {
      const privateKeyProvider = new EthereumPrivateKeyProvider({
        config: sepoliaChainConfig,
      });
      web3auth = new Web3Auth({ clientId: "test", privateKeyProvider });
    });

    it("should throw error if not initialized", async function () {
      await expect(async () => {
        await web3auth.getPostboxKey({
          verifier: TORUS_TEST_VERIFIER,
          verifierId: TORUS_TEST_EMAIL,
          idToken: generateIdToken(TORUS_TEST_EMAIL, "ES256"),
        });
      }).rejects.toThrow("Wallet is not ready yet");
    });

    it("should return postbox key", async function () {
      await web3auth.init();
      const postboxKey = await web3auth.getPostboxKey({
        verifier: TORUS_TEST_VERIFIER,
        verifierId: TORUS_TEST_EMAIL,
        idToken: generateIdToken(TORUS_TEST_EMAIL, "ES256"),
      });
      expect(postboxKey).not.toBeNull();
    });
  });

  describe("connect", function () {
    let web3auth: Web3Auth;

    beforeEach(async function () {
      const privateKeyProvider = new EthereumPrivateKeyProvider({
        config: sepoliaChainConfig,
      });
      web3auth = new Web3Auth({
        clientId: "BCtbnOamqh0cJFEUYA0NB5YkvBECZ3HLZsKfvSRBvew2EiiKW3UxpyQASSR0artjQkiUOCHeZ_ZeygXpYpxZjOs",
        privateKeyProvider,
      });
    });

    afterEach(async function () {
      if (web3auth.connected) {
        await web3auth.logout();
      }
    });

    it("should throw error if not initialized", async function () {
      await expect(async () => {
        await web3auth.connect({
          verifier: TORUS_TEST_VERIFIER,
          verifierId: TORUS_TEST_EMAIL,
          idToken: generateIdToken(TORUS_TEST_EMAIL, "ES256"),
        });
      }).rejects.toThrow("Wallet is not ready yet");
    });

    it("should throw error if already connected", async function () {
      await web3auth.init();
      // connect 1st time
      await web3auth.connect({
        verifier: TORUS_TEST_VERIFIER,
        verifierId: TORUS_TEST_EMAIL,
        idToken: generateIdToken(TORUS_TEST_EMAIL, "ES256"),
      });
      await expect(async () => {
        await web3auth.connect({
          verifier: TORUS_TEST_VERIFIER,
          verifierId: TORUS_TEST_EMAIL,
          idToken: generateIdToken(TORUS_TEST_EMAIL, "ES256"),
        });
      }).rejects.toThrow("Already connected. Please check status before calling connect.");
    });

    it("should throw error if verifier is not provided", async function () {
      await web3auth.init();
      await expect(async () => {
        // @ts-expect-error test
        await web3auth.connect({
          verifierId: TORUS_TEST_EMAIL,
          idToken: generateIdToken(TORUS_TEST_EMAIL, "ES256"),
        });
      }).rejects.toThrow("verifier or verifierId or idToken  required");
    });

    it("should throw error if verifierId is not provided", async function () {
      await web3auth.init();
      await expect(async () => {
        // @ts-expect-error test
        await web3auth.connect({
          verifier: TORUS_TEST_VERIFIER,
          idToken: generateIdToken(TORUS_TEST_EMAIL, "ES256"),
        });
      }).rejects.toThrow("verifier or verifierId or idToken  required");
    });

    it("should throw error if idToken is not provided", async function () {
      await web3auth.init();
      await expect(async () => {
        // @ts-expect-error test
        await web3auth.connect({
          verifier: TORUS_TEST_VERIFIER,
          verifierId: TORUS_TEST_EMAIL,
        });
      }).rejects.toThrow("verifier or verifierId or idToken  required");
    });

    it("should connect successfully", async function () {
      await web3auth.init();
      await web3auth.connect({
        verifier: TORUS_TEST_VERIFIER,
        verifierId: TORUS_TEST_EMAIL,
        idToken: generateIdToken(TORUS_TEST_EMAIL, "ES256"),
      });
      expect(web3auth.connected).toBe(true);
    });
  });

  describe("logout", function () {
    let web3auth: Web3Auth;

    beforeEach(async function () {
      const privateKeyProvider = new EthereumPrivateKeyProvider({
        config: sepoliaChainConfig,
      });
      web3auth = new Web3Auth({
        clientId: "BCtbnOamqh0cJFEUYA0NB5YkvBECZ3HLZsKfvSRBvew2EiiKW3UxpyQASSR0artjQkiUOCHeZ_ZeygXpYpxZjOs",
        privateKeyProvider,
      });
    });

    afterEach(async function () {
      if (web3auth.connected) {
        await web3auth.logout();
      }
    });

    it("should throw error if not connected", async function () {
      await expect(async () => {
        await web3auth.logout();
      }).rejects.toThrow("Not logged in");
    });

    it("should logout successfully", async function () {
      await web3auth.init();
      await web3auth.connect({
        verifier: TORUS_TEST_VERIFIER,
        verifierId: TORUS_TEST_EMAIL,
        idToken: generateIdToken(TORUS_TEST_EMAIL, "ES256"),
      });
      await web3auth.logout();
      expect(web3auth.connected).toBe(false);
    });
  });

  describe("getUserInfo", function () {
    let web3auth: Web3Auth;

    beforeEach(async function () {
      const privateKeyProvider = new EthereumPrivateKeyProvider({
        config: sepoliaChainConfig,
      });
      web3auth = new Web3Auth({
        clientId: "BCtbnOamqh0cJFEUYA0NB5YkvBECZ3HLZsKfvSRBvew2EiiKW3UxpyQASSR0artjQkiUOCHeZ_ZeygXpYpxZjOs",
        privateKeyProvider,
      });
    });

    afterEach(async function () {
      if (web3auth.connected) {
        await web3auth.logout();
      }
    });

    it("should throw error if not connected", async function () {
      await expect(async () => {
        await web3auth.getUserInfo();
      }).rejects.toThrow("User not logged in..");
    });

    it("should return user info", async function () {
      await web3auth.init();
      await web3auth.connect({
        verifier: TORUS_TEST_VERIFIER,
        verifierId: TORUS_TEST_EMAIL,
        idToken: generateIdToken(TORUS_TEST_EMAIL, "ES256"),
      });
      const userInfo = await web3auth.getUserInfo();
      expect(userInfo).not.toBeNull();
    });
  });

  describe("Testnet tests", function () {
    let web3auth: Web3Auth;

    describe("Ethereum provider", function () {
      beforeEach(async function () {
        const chainConfig: CustomChainConfig = {
          chainId: "0xaa36a7",
          rpcTarget: "https://rpc.ankr.com/eth_sepolia",
          displayName: "Sepolia Testnet",
          blockExplorerUrl: "https://sepolia.etherscan.io",
          ticker: "ETH",
          tickerName: "Ethereum",
          chainNamespace: CHAIN_NAMESPACES.EIP155,
        };
        const provider = new EthereumPrivateKeyProvider({ config: { chainConfig } });
        web3auth = new Web3Auth({
          clientId: "torus",
          web3AuthNetwork: TORUS_LEGACY_NETWORK.TESTNET,
          privateKeyProvider: provider,
        });
        await web3auth.init();
      });

      it("should get torus key", async function () {
        const verifier = TORUS_TEST_VERIFIER; // any verifier
        const token = generateIdToken(TORUS_TEST_EMAIL, "ES256");
        const provider = await web3auth.connect({
          idToken: token,
          verifier,
          verifierId: TORUS_TEST_EMAIL,
        });
        const privKey = await provider?.request({ method: "eth_private_key" });
        expect(privKey).to.equal("296045a5599afefda7afbdd1bf236358baff580a0fe2db62ae5c1bbe817fbae4");
        await web3auth.logout();
      });

      it("should get aggregate torus key", async function () {
        const token = generateIdToken(TORUS_TEST_EMAIL, "ES256");
        const provider = await web3auth.connect({
          idToken: token,
          verifier: TORUS_TEST_AGGREGATE_VERIFIER,
          verifierId: TORUS_TEST_EMAIL,
          subVerifierInfoArray: [
            {
              verifier: TORUS_TEST_VERIFIER,
              idToken: token,
            },
          ],
        });
        const privKey = await provider?.request({ method: "eth_private_key" });
        expect(privKey).to.equal("ad47959db4cb2e63e641bac285df1b944f54d1a1cecdaeea40042b60d53c35d2");
        await web3auth.logout();
      });
    });

    describe("Solana provider", function () {
      beforeEach(async function () {
        const chainConfig: CustomChainConfig = {
          chainNamespace: CHAIN_NAMESPACES.SOLANA,
          chainId: "0x2", // Please use 0x1 for Mainnet, 0x2 for Testnet, 0x3 for Devnet
          rpcTarget: "https://api.testnet.solana.com", // This is the public RPC we have added, please pass on your own endpoint while creating an app
          displayName: "Solana Mainnet",
          blockExplorerUrl: "https://explorer.solana.com/",
          ticker: "SOL",
          tickerName: "Solana",
        };
        const provider = new SolanaPrivateKeyProvider({ config: { chainConfig } });
        web3auth = new Web3Auth({
          clientId: "torus",
          web3AuthNetwork: TORUS_LEGACY_NETWORK.TESTNET,
          privateKeyProvider: provider,
        });
        await web3auth.init();
      });

      it("should get torus key", async function () {
        const verifier = TORUS_TEST_VERIFIER; // any verifier
        const token = generateIdToken(TORUS_TEST_EMAIL, "ES256");
        const provider = await web3auth.connect({
          idToken: token,
          verifier,
          verifierId: TORUS_TEST_EMAIL,
        });
        const privKey = await provider?.request({ method: "solanaSecretKey" });
        expect(privKey).to.equal("pyqTNUjYGccdvJDEmLP9aXxurnNTrQsMRupGxC7aiHcTbA7RsUV2zvQX5FBnURWEv5PBsjt3pwR3Et7pGE9BoUB");
        await web3auth.logout();
      });

      it("should get aggregate torus key", async function () {
        const token = generateIdToken(TORUS_TEST_EMAIL, "ES256");
        const provider = await web3auth.connect({
          idToken: token,
          verifier: TORUS_TEST_AGGREGATE_VERIFIER,
          verifierId: TORUS_TEST_EMAIL,
          subVerifierInfoArray: [
            {
              verifier: TORUS_TEST_VERIFIER,
              idToken: token,
            },
          ],
        });
        const privKey = await provider?.request({ method: "solanaSecretKey" });
        expect(privKey).to.equal("4TwHtc9mgPafrfyodiyZuTtmGY7uxmskEE9ydchr7fkQfu7y2yYQu2y3qJVRixb13W63FoUPh2WNhLwXh68RU7MG");
        await web3auth.logout();
      });
    });

    describe("Common provider", function () {
      beforeEach(async function () {
        const chainConfig: CustomChainConfig = {
          chainId: "0xaa36a7",
          rpcTarget: "https://rpc.ankr.com/eth_sepolia",
          displayName: "Sepolia Testnet",
          blockExplorerUrl: "https://sepolia.etherscan.io",
          ticker: "ETH",
          tickerName: "Ethereum",
          chainNamespace: CHAIN_NAMESPACES.EIP155,
        };
        const provider = new CommonPrivateKeyProvider({ config: { chainConfig } });
        web3auth = new Web3Auth({
          clientId: "torus",
          web3AuthNetwork: TORUS_LEGACY_NETWORK.TESTNET,
          privateKeyProvider: provider,
        });
        await web3auth.init();
      });

      it("should get torus key", async function () {
        const verifier = TORUS_TEST_VERIFIER; // any verifier
        const token = generateIdToken(TORUS_TEST_EMAIL, "ES256");
        const provider = await web3auth.connect({
          idToken: token,
          verifier,
          verifierId: TORUS_TEST_EMAIL,
        });
        const privKey = await provider?.request({ method: "private_key" });
        expect(privKey).to.equal("296045a5599afefda7afbdd1bf236358baff580a0fe2db62ae5c1bbe817fbae4");
        await web3auth.logout();
      });

      it("should get aggregate torus key", async function () {
        const token = generateIdToken(TORUS_TEST_EMAIL, "ES256");
        const provider = await web3auth.connect({
          idToken: token,
          verifier: TORUS_TEST_AGGREGATE_VERIFIER,
          verifierId: TORUS_TEST_EMAIL,
          subVerifierInfoArray: [
            {
              verifier: TORUS_TEST_VERIFIER,
              idToken: token,
            },
          ],
        });
        const privKey = await provider?.request({ method: "private_key" });
        expect(privKey).to.equal("ad47959db4cb2e63e641bac285df1b944f54d1a1cecdaeea40042b60d53c35d2");
        await web3auth.logout();
      });
    });
  });
});
