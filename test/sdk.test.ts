import { CHAIN_NAMESPACES, CustomChainConfig, WalletInitializationError } from "@web3auth/base";
import { EthereumPrivateKeyProvider } from "@web3auth/ethereum-provider";
import { SolanaPrivateKeyProvider } from "@web3auth/solana-provider";
import { expect } from "chai";

import { LoginParams, Web3Auth } from "../src";
import { generateIdToken } from "./helpers";

const TORUS_TEST_EMAIL = "hello@tor.us";
const TORUS_TEST_VERIFIER = "torus-test-health";
const TORUS_TEST_AGGREGATE_VERIFIER = "torus-test-health-aggregate";

describe("web3auth backend", function () {
  let web3auth: Web3Auth;

  beforeEach("one time execution before all tests", async function () {
    const provider = new EthereumPrivateKeyProvider({
      config: {
        chainConfig: {
          chainNamespace: CHAIN_NAMESPACES.EIP155,
          displayName: "ETH Sepolia",
          blockExplorerUrl: "https://sepolia.etherscan.io",
          ticker: "ETH",
          tickerName: "Ethereum",
          chainId: "0xaa36a7", // sepolia
          rpcTarget: "https://rpc.ankr.com/eth_sepolia",
        },
      },
    });
    web3auth = new Web3Auth({
      clientId: "BCtbnOamqh0cJFEUYA0NB5YkvBECZ3HLZsKfvSRBvew2EiiKW3UxpyQASSR0artjQkiUOCHeZ_ZeygXpYpxZjOs",
      web3AuthNetwork: "testnet",
      privateKeyProvider: provider,
    });

    await web3auth.init();
  });

  it("should throw WalletInitializationError for invalid provider", async function () {
    const invalidProvider = {
      // Missing currentChainConfig and chainNamespace
    };
    const invalidWeb3auth = new Web3Auth({
      clientId: "test-client-id",
      privateKeyProvider: invalidProvider as EthereumPrivateKeyProvider,
    });
    try {
      await invalidWeb3auth.init();
    } catch (error) {
      expect(error).to.be.instanceOf(WalletInitializationError);
      if (error instanceof Error) {
        expect(error.message).to.equal(
          "Invalid params passed in, provider should have chainConfig and should be initialized with chainId and chainNamespace"
        );
      }
    }
  });

  it("should throw WalletInitializationError for missing verifier, verifierId, or idToken", async function () {
    const invalidLoginParams = [
      { verifierId: "test@example.com", idToken: "valid-token" },
      { verifier: "torus", idToken: "valid-token" },
      { verifier: "torus", verifierId: "test@example.com" },
    ];

    for (const params of invalidLoginParams) {
      try {
        await web3auth.connect(params as LoginParams);
        expect.fail("Expected an error to be thrown");
      } catch (error) {
        expect(error).to.be.instanceOf(WalletInitializationError);
        if (error instanceof Error) {
          expect(error.message).to.equal("Invalid params passed in, verifier or verifierId or idToken  required");
        }
      }
    }
  });

  it("should return a provider with private key", async function () {
    const provider = await web3auth.connect({
      verifier: TORUS_TEST_VERIFIER,
      verifierId: TORUS_TEST_EMAIL,
      idToken: generateIdToken(TORUS_TEST_EMAIL, "ES256"),
    });
    expect(provider).to.not.equal(null);

    const privKey = await provider?.request({ method: "eth_private_key", params: [] });
    expect(privKey).to.equal("296045a5599afefda7afbdd1bf236358baff580a0fe2db62ae5c1bbe817fbae4");
  });

  it("should be return a provider with private key for aggregate login", async function () {
    const idToken = generateIdToken(TORUS_TEST_EMAIL, "ES256");

    const provider = await web3auth.connect({
      verifier: TORUS_TEST_AGGREGATE_VERIFIER,
      verifierId: TORUS_TEST_EMAIL,
      idToken: generateIdToken(TORUS_TEST_EMAIL, "ES256"),
      subVerifierInfoArray: [{ verifier: TORUS_TEST_VERIFIER, idToken }],
    });
    expect(provider).to.not.equal(null);

    const privKey = await provider?.request({ method: "eth_private_key", params: [] });
    expect(privKey).to.equal("ad47959db4cb2e63e641bac285df1b944f54d1a1cecdaeea40042b60d53c35d2");
  });

  it("should be able to login with solana", async function () {
    const chainConfig: CustomChainConfig = {
      chainNamespace: CHAIN_NAMESPACES.SOLANA,
      displayName: "Solana Devnet",
      blockExplorerUrl: "https://explorer.solana.com/",
      ticker: "sol",
      tickerName: "Solana",
      chainId: "0x3",
      rpcTarget: "https://api.devnet.solana.com",
    };
    const provider = new SolanaPrivateKeyProvider({ config: { chainConfig } });
    const web3authSolana = new Web3Auth({
      clientId: "BCtbnOamqh0cJFEUYA0NB5YkvBECZ3HLZsKfvSRBvew2EiiKW3UxpyQASSR0artjQkiUOCHeZ_ZeygXpYpxZjOs",
      web3AuthNetwork: "testnet",
      privateKeyProvider: provider,
    });

    await web3authSolana.init();
    const w3aProvider = await web3authSolana.connect({
      verifier: TORUS_TEST_VERIFIER,
      verifierId: TORUS_TEST_EMAIL,
      idToken: generateIdToken(TORUS_TEST_EMAIL, "ES256"),
    });
    expect(w3aProvider).to.not.equal(null);

    const privKey = await w3aProvider?.request({ method: "solanaPrivateKey", params: [] });
    expect(privKey).to.equal(
      "296045a5599afefda7afbdd1bf236358baff580a0fe2db62ae5c1bbe817fbae49fe0788629bf18798cefdb361b63f2b69f384bdf93fb85f89a24ef427d6f8d10"
    );
  });
});
