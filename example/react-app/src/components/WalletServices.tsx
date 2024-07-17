import { useState } from "react";

import walletServices from "../assets/walletServices.svg";
import { usePlayground } from "../services/playground";
import Button from "./Button";
import Card from "./Card";

function WalletServices() {
  const [signedMessage, setSignedMessage] = useState<string>("");
  const [signingState, setSigningState] = useState<"success" | "error" | "">("");
  const { showCheckout, showWalletUI, showWalletScanner, signMessage } = usePlayground();

  async function onSignMessage() {
    try {
      const signature = await signMessage();
      setSignedMessage(signature);
      setSigningState("success");
    } catch (error) {
      console.error(error);
      setSigningState("error");
    } finally {
      setTimeout(() => {
        setSignedMessage("");
        setSigningState("");
      }, 3000);
    }
  }

  return (
    <Card className="text-center">
      <div className="mb-4">
        <h3 className="font-semibold text-app-gray-900 mb-1">Wallet Services</h3>
        <p className="text-xs text-app-gray-500">Production-ready wallet UI</p>
      </div>
      <img className="mx-auto mb-8" src={walletServices} alt="" />
      <div className="space-y-2">
        <Button className="w-full" onClick={showWalletUI}>
          Open Wallet UI
        </Button>
        <Button className="w-full" onClick={showCheckout}>
          Use Fiat Onramp
        </Button>
        <Button className="w-full" onClick={showWalletScanner}>
          Connect to Applications
        </Button>
        {signedMessage ? (
          <div
            className={`border p-2 border-app-gray-500 text-app-gray-500 flex flex-col items-center justify-center text-sm rounded-md min-h-9 ${
              signingState === "success" ? "bg-app-green-100 text-app-green-500" : "bg-app-red-100 text-app-red-800"
            }`}
          >
            <div>{signingState === "success" ? "Signature Success!" : "Signature Failed, Try again"}</div>
            {signedMessage && <div className="break-all text-xxs leading-tight mt-1">{signedMessage}</div>}
          </div>
        ) : (
          <Button className="w-full" onClick={onSignMessage}>
            Sign Personal Message
          </Button>
        )}
      </div>
    </Card>
  );
}
export default WalletServices;
