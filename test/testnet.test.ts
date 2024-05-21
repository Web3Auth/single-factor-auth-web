import { TORUS_LEGACY_NETWORK } from "@toruslabs/constants";
import { CHAIN_NAMESPACES, CustomChainConfig } from "@web3auth/base";
import { CommonPrivateKeyProvider } from "@web3auth/base-provider";
import { EthereumPrivateKeyProvider } from "@web3auth/ethereum-provider";
import { SolanaPrivateKeyProvider } from "@web3auth/solana-provider";
import { expect } from "chai";

import { Web3Auth } from "../src";
import { generateIdToken } from "./helpers";

const TORUS_TEST_EMAIL = "hello@tor.us";
const TORUS_TEST_VERIFIER = "torus-test-health";
const TORUS_TEST_AGGREGATE_VERIFIER = "torus-test-health-aggregate";

describe("torus onekey", function () {
  let singleFactorAuth: Web3Auth;

  describe("Ethereum provider", function () {
    beforeEach("one time execution before all tests", async function () {
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
      singleFactorAuth = new Web3Auth({
        clientId: "torus",
        web3AuthNetwork: TORUS_LEGACY_NETWORK.TESTNET,
        privateKeyProvider: provider,
      });
      await singleFactorAuth.init();
    });

    it("should get torus key", async function () {
      const verifier = TORUS_TEST_VERIFIER; // any verifier
      const token = generateIdToken(TORUS_TEST_EMAIL, "ES256");
      const provider = await singleFactorAuth.connect({
        idToken: token,
        verifier,
        verifierId: TORUS_TEST_EMAIL,
      });
      const privKey = await provider?.request({ method: "eth_private_key" });
      expect(privKey).to.equal("296045a5599afefda7afbdd1bf236358baff580a0fe2db62ae5c1bbe817fbae4");
      await singleFactorAuth.logout();
    });

    it("should get aggregate torus key", async function () {
      const token = generateIdToken(TORUS_TEST_EMAIL, "ES256");
      const provider = await singleFactorAuth.connect({
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
      await singleFactorAuth.logout();
    });
  });

  describe("Solana provider", function () {
    beforeEach("one time execution before all tests", async function () {
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
      singleFactorAuth = new Web3Auth({
        clientId: "torus",
        web3AuthNetwork: TORUS_LEGACY_NETWORK.TESTNET,
        privateKeyProvider: provider,
      });
      await singleFactorAuth.init();
    });

    it("should get torus key", async function () {
      const verifier = TORUS_TEST_VERIFIER; // any verifier
      const token = generateIdToken(TORUS_TEST_EMAIL, "ES256");
      const provider = await singleFactorAuth.connect({
        idToken: token,
        verifier,
        verifierId: TORUS_TEST_EMAIL,
      });
      const privKey = await provider?.request({ method: "solanaSecretKey" });
      expect(privKey).to.equal("pyqTNUjYGccdvJDEmLP9aXxurnNTrQsMRupGxC7aiHcTbA7RsUV2zvQX5FBnURWEv5PBsjt3pwR3Et7pGE9BoUB");
      await singleFactorAuth.logout();
    });

    it("should get aggregate torus key", async function () {
      const token = generateIdToken(TORUS_TEST_EMAIL, "ES256");
      const provider = await singleFactorAuth.connect({
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
      await singleFactorAuth.logout();
    });
  });

  describe("Common provider", function () {
    beforeEach("one time execution before all tests", async function () {
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
      singleFactorAuth = new Web3Auth({
        clientId: "torus",
        web3AuthNetwork: TORUS_LEGACY_NETWORK.TESTNET,
        privateKeyProvider: provider,
      });
      await singleFactorAuth.init();
    });

    it("should get torus key", async function () {
      const verifier = TORUS_TEST_VERIFIER; // any verifier
      const token = generateIdToken(TORUS_TEST_EMAIL, "ES256");
      const provider = await singleFactorAuth.connect({
        idToken: token,
        verifier,
        verifierId: TORUS_TEST_EMAIL,
      });
      const privKey = await provider?.request({ method: "private_key" });
      expect(privKey).to.equal("296045a5599afefda7afbdd1bf236358baff580a0fe2db62ae5c1bbe817fbae4");
      await singleFactorAuth.logout();
    });

    it("should get aggregate torus key", async function () {
      const token = generateIdToken(TORUS_TEST_EMAIL, "ES256");
      const provider = await singleFactorAuth.connect({
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
      await singleFactorAuth.logout();
    });
  });
});
