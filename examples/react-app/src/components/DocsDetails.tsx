import Button from "./Button";
import Card from "./Card";

function DocsDetails() {
  return (
    <Card>
      <div className="mb-4">
        <h3 className="font-semibold text-app-gray-900  mb-1">Experience Web3Auth, first hand</h3>
        <p className="text-xs text-app-gray-500 ">Browse our full suite of features for your dApp with our docs.</p>
      </div>

      <Button
        href="https://web3auth.io/docs"
        className="gap-2 w-full border  flex border-app-gray-300 text-app-gray-800 mb-2"
        target="_blank"
        rel="noopener noreferrer"
      >
        Read our docs
      </Button>
      <Button
        href="https://web3auth.io/customers.html"
        className="gap-2 w-full border  flex border-app-gray-300 text-app-gray-800"
        target="_blank"
        rel="noopener noreferrer"
      >
        Check out live integrations
      </Button>
    </Card>
  );
}
export default DocsDetails;
