import Card from "./Card";
import { usePlayground } from "../services/playground";
import walletServices from "../assets/walletServices.svg";
import Button from "./Button";

const WalletServices = () => {
  const { showCheckout, showWalletUI, showWalletScanner, signMessage } = usePlayground();

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
        <Button className="w-full" onClick={signMessage}>
          Sign Personal Message
        </Button>
      </div>
    </Card>
  );
};
export default WalletServices;
