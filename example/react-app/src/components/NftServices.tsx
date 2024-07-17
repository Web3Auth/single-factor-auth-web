import { useEffect, useState } from "react";

import nftSample from "../assets/nftSample.svg";
import config from "../config";
import { usePlayground } from "../services/playground";
import Button from "./Button";
import Card from "./Card";

const FREE_MINT_CONTRACT_ID = "b5b4de3f-0212-11ef-a08f-0242ac190003";
const PAID_MINT_CONTRACT_ID = "d1145a8b-98ae-44e0-ab63-2c9c8371caff";

function DocsDetails() {
  const [showNftMinting, setShowNftMinting] = useState(false);
  const [showNftPurchase, setShowNftPurchase] = useState(false);
  const { address: receiverAddress } = usePlayground();

  const demoNftMintingUrl = `${config.nftCheckoutHost}/?contract_id=${FREE_MINT_CONTRACT_ID}&receiver_address=${receiverAddress}&api_key=${config.nftCheckoutApiKey}`;

  const demoNftPurchaseUrl = `${config.nftCheckoutHost}/?contract_id=${PAID_MINT_CONTRACT_ID}&receiver_address=${receiverAddress}&api_key=${config.nftCheckoutApiKey}`;

  const openNftMinting = () => {
    setShowNftMinting(true);
  };

  const openNftPurchase = () => {
    setShowNftPurchase(true);
  };

  function closeFromFrame(event: MessageEvent) {
    if (event.origin === config.nftCheckoutHost && event.data === "close-nft-checkout") {
      setShowNftMinting(false);
      setShowNftPurchase(false);
    }
  }

  useEffect(() => {
    window.addEventListener("message", closeFromFrame);
    return () => {
      window.removeEventListener("message", closeFromFrame);
    };
  });

  return (
    <Card>
      <div className="mb-4 text-center">
        <h3 className="font-semibold text-app-gray-900  mb-1">NFT Services</h3>
        <p className="text-xs text-app-gray-500 ">Let your users to claim or buy NFT in seconds</p>
      </div>

      <img src={nftSample} className="w-full max-w-xs mx-auto h-auto mb-6" alt="" />

      <div className="space-y-2 mb-4">
        <Button className="w-full" onClick={openNftMinting}>
          Mint free NFT airdrop
        </Button>
        <Button className="w-full" onClick={openNftPurchase}>
          NFT Checkout
        </Button>
      </div>

      <div className="text-center">
        <a
          className="text-sm text-app-primary-600 hover:underline"
          href="https://docs.stripe.com/testing#cards"
          target="_blank"
          rel="noopener noreferrer"
        >
          Try with our test credit cards
        </a>
      </div>
      {showNftMinting && (
        <iframe
          id="nftCheckoutIFrame"
          title="nft_minting"
          src={demoNftMintingUrl}
          name="nft_minting"
          allow="clipboard-write"
          style={{
            position: "fixed",
            top: 0,
            right: 0,
            width: "100%",
            height: "100%",
            border: "none",
            borderRadius: 0,
            zIndex: 99999,
          }}
        />
      )}

      {showNftPurchase && (
        <iframe
          id="nftCheckoutIFrame"
          src={demoNftPurchaseUrl}
          title="nft_purchase"
          name="nft_purchase"
          style={{
            position: "fixed",
            top: 0,
            right: 0,
            width: "100%",
            height: "100%",
            border: "none",
            borderRadius: 0,
            zIndex: 99999,
          }}
          allow="clipboard-write"
        />
      )}
    </Card>
  );
}
export default DocsDetails;
