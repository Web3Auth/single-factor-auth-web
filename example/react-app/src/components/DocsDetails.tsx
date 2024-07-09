import Button from "./Button";
import Card from "./Card";

const DocsDetails = () => {
  return (
    <Card>
      <div className="mb-4">
        <h3 className="font-semibold text-app-gray-900  mb-1">Experience Web3Auth, first hand</h3>
        <p className="text-xs text-app-gray-500 ">
          Browse our full suite of features for your dApp with our docs. Access codes examples for these features by visiting our
          <a href="https://web3auth.io/customers.html" className="text-xs text-app-primary-600 ml-1" target="_blank" rel="noopener noreferrer">
            playground
          </a>
          .
        </p>
      </div>

      <Button
        href="https://web3auth.io/docs"
        className="gap-2 w-full border  flex border-app-gray-300 text-app-gray-800 "
        target="_blank"
        rel="noopener noreferrer"
      >
        Read our docs
      </Button>
    </Card>
  );
};
export default DocsDetails;
