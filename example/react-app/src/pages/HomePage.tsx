import { useEffect, useRef } from "react";
import { usePlayground } from "../services/playground";
import Loader from "../components/Loader";
import Dialog from "../components/Dialog";
import Account from "../components/Account";
import Passkeys from "../components/Passkeys";
import WalletServices from "../components/WalletServices";
import Card from "../components/Card";
import DocsDetails from "../components/DocsDetails";
import Console from "../components/Console";
import NftServices from "../components/NftServices";

function HomePage() {
  const dialogHowRef = useRef<HTMLDialogElement>(null);
  const { isLoading, showRegisterPasskeyModal, registerPasskey, toggleRegisterPasskeyModal } = usePlayground();

  function toggleDialog(open: boolean) {
    if (!dialogHowRef.current) {
      return;
    }
    open ? dialogHowRef.current.showModal() : dialogHowRef.current.close();
  }

  useEffect(() => {
    toggleDialog(showRegisterPasskeyModal);
  }, [showRegisterPasskeyModal]);


  useEffect(() => {
    document.title = "Home";
    console.log("Home Page");
  });
  return isLoading ? (
    <Loader />
  ) : (
    <div className="flex-grow flex py-4 px-4 sm:py-6 sm:px-10">
      <div className="w-full columns-1 sm:columns-2 lg:columns-3 xl:columns-4 break-before-avoid mx-auto">
        <div className="break-inside-avoid space-y-4 mb-4">
          <Account />
          <Passkeys />
        </div>
        <div className="break-inside-avoid lg:break-after-avoid xl:break-after-column mb-4">
          <WalletServices />
        </div>
        <div className="break-inside-avoid xl:break-after-column mb-4">
          <NftServices />
        </div>
        <div className="break-inside-avoid space-y-4">
          <DocsDetails />
          <Card>
            <p className="text-sm text-app-gray-800">
              Have any questions?
              <a
                className="text-app-primary-600 hover:underline inline mx-1"
                href="https://calendly.com/web3auth/meeting-with-web3auth"
                target="_blank"
                rel="noopener noreferrer"
              >
                Schedule a demo call
              </a>
              with our team today
            </p>
          </Card>
        </div>
      </div>
      <Console />
      <Dialog type="modal" closeDialog={() => toggleRegisterPasskeyModal()} ref={dialogHowRef}>
        <div className="text-center mt-2">
          <img className="mx-auto mb-b" src="https://images.web3auth.io/passkey-register.svg" alt="Register Passkey" />
          <div className="font-bold mb-2 text-gray-900">Register Passkey</div>
          <div className="text-sm mb-8 text-gray-500">
            <div>With passkeys, you can verify your identity through your face, fingerprint, or security keys.</div>
            <button type="button" className="text-primary outline-none">
              Learn more
            </button>
          </div>
          <button
            className="flex justify-center rounded-full px-6 h-9 items-center bg-primary text-white cursor-pointer w-full"
            onClick={registerPasskey}
          >
            Register Passkey
          </button>
        </div>
      </Dialog>
    </div>
  );
}

export default HomePage;
