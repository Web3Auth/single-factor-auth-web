import { log } from "@web3auth/base";
import { useEffect, useRef } from "react";

import Account from "../components/Account";
import Card from "../components/Card";
import Console from "../components/Console";
import Dialog from "../components/Dialog";
import DocsDetails from "../components/DocsDetails";
import Loader from "../components/Loader";
import NftServices from "../components/NftServices";
import Passkeys from "../components/Passkeys";
import WalletServices from "../components/WalletServices";
import { usePlayground } from "../services/playground";

function HomePage() {
  const dialogHowRef = useRef<HTMLDialogElement>(null);
  const { isLoading, showRegisterPasskeyModal, registerPasskey, toggleRegisterPasskeyModal } = usePlayground();

  function toggleDialog(open: boolean) {
    if (!dialogHowRef.current) {
      return;
    }
    if (open) {
      dialogHowRef.current.showModal();
      return;
    }
    dialogHowRef.current.close();
  }

  useEffect(() => {
    toggleDialog(showRegisterPasskeyModal);
  }, [showRegisterPasskeyModal]);

  useEffect(() => {
    document.title = "Home";
    log.info("Home Page");
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
            type="button"
          >
            Register Passkey
          </button>
        </div>
      </Dialog>
    </div>
  );
}

export default HomePage;
