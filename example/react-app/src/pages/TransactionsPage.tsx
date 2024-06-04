import React from "react";
import Sidebar from "../components/Sidebar";
import Console from "../components/Console";
import { usePlayground } from "../services/playground";

function SigningTransactionPage() {
  const { showCheckout, showWalletUI, showWalletScanner, signMessage, sendTransaction } = usePlayground();

  return (
    <div className="flex-grow flex items-stretch">
      <Sidebar />
      <div className="flex-grow p-8 bg-gray-50">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-lg font-bold mx-auto mb-6">Transactions</h1>
          <div className="justify-center p-8 mt-6 mb-0 space-y-4 rounded-lg bg-white">
            <div className="grid grid-cols-3 gap-3">
              <div>
                <button onClick={showCheckout} className="card">
                  Show Checkout
                </button>
              </div>
              <div>
                <button onClick={showWalletUI} className="card">
                  Show Wallet UI
                </button>
              </div>
              <div>
                <button onClick={showWalletScanner} className="card">
                  Show WalletConnect Scanner
                </button>
              </div>
              <div>
                <button onClick={signMessage} className="card">
                  Sign Message
                </button>
              </div>
              <div>
                <button onClick={sendTransaction} className="card">
                  Send Transaction
                </button>
              </div>
            </div>
          </div>
          <Console />
        </div>
      </div>
    </div>
  );
}

export default SigningTransactionPage;
