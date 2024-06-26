import Sidebar from "../components/Sidebar";
import Console from "../components/Console";
import Dialog from "../components/Dialog";
import { chainConfigMain, usePlayground } from "../services/playground";
import { useEffect, useRef } from "react";

function SigningTransactionPage() {
  const infoPopupRef = useRef<HTMLDialogElement>(null);
  const sendTransactionPopupRef = useRef<HTMLDialogElement>(null);
  const { chainId, showInfoPopup, infoPopupCopy, showCheckout, showWalletUI, showWalletScanner, signMessage, sendTransaction, toggleShowInfoPopup } =
    usePlayground();

  function toggleTransactionPopup(open: boolean) {
    if (!sendTransactionPopupRef.current) {
      return;
    }
    open ? sendTransactionPopupRef.current.showModal() : sendTransactionPopupRef.current.close();
  }

  function toggleInfoPopup(open: boolean) {
    if (!infoPopupRef.current) {
      return;
    }
    open ? infoPopupRef.current.showModal() : infoPopupRef.current.close();
  }

  useEffect(() => {
    toggleInfoPopup(showInfoPopup);
  }, [showInfoPopup]);

  function onSendTransaction() {
    if (chainId === chainConfigMain.chainId) {
      toggleTransactionPopup(true);
    } else {
      sendTransaction();
    }
  }
  return (
    <div className="flex-grow flex items-stretch">
      <Sidebar />
      <div className="flex-grow p-8 bg-gray-50">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-lg font-bold mx-auto mb-6">Wallet features, signing and transaction</h1>
          <div className="justify-center p-8 mt-6 mb-0 space-y-4 rounded-lg bg-white">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <button onClick={showWalletUI} className="card">
                  Show Wallet UI
                </button>
              </div>
              <div>
                <button onClick={showCheckout} className="card">
                  Show Checkout
                </button>
              </div>
              <div>
                <button onClick={showWalletScanner} className="card">
                  Show WalletConnect
                </button>
              </div>
              <div>
                <button onClick={signMessage} className="card">
                  Sign Message
                </button>
              </div>
              <div>
                <button onClick={onSendTransaction} className="card">
                  Send Transaction
                </button>
              </div>
            </div>
          </div>
          <Console />
        </div>
      </div>
      <Dialog type="non-modal" closeDialog={() => toggleShowInfoPopup()} ref={infoPopupRef}>
        <div className="left mt-2">
          <div className="font-bold mb-2 text-gray-900">{infoPopupCopy.title}</div>
          <div className="text-sm mb-8 text-gray-500">
            <div>{infoPopupCopy.subtitle}</div>
          </div>
        </div>
      </Dialog>
      <Dialog type="modal" closeDialog={() => toggleTransactionPopup(false)} ref={sendTransactionPopupRef}>
        <div className="left mt-2">
          <div className="font-bold mb-2 text-orange-400">Warning</div>
          <div className="mb-2 text-sm  text-gray-500">Are you sure you want to send a transaction on the mainnet?</div>
          <div className="text-right">
            <button
              className="rounded-full px-6 py-3 text-gray-500 cursor-pointer border border-gray-300 hover:border-gray-500"
              onClick={() => {
                onSendTransaction();
                toggleTransactionPopup(false);
              }}
            >
              Continue
            </button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}

export default SigningTransactionPage;
