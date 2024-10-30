import { log } from "@web3auth/base";
import { useEffect, useRef } from "react";

import Account from "../components/Account";
import Card from "../components/Card";
import Console from "../components/Console";
import Dialog, { DialogRef } from "../components/Dialog";
import DocsDetails from "../components/DocsDetails";
import Loader from "../components/Loader";
import NftServices from "../components/NftServices";
import Passkeys from "../components/Passkeys";
import WalletServices from "../components/WalletServices";
import { usePlayground } from "../services/playground";

function HomePage() {
  const dialogHowRef = useRef<DialogRef>(null);
  const { isLoading, showRegisterPasskeyModal, registerPasskey, toggleRegisterPasskeyModal, useAccountAbstraction } = usePlayground();

  function toggleDialog(open: boolean) {
    if (!dialogHowRef.current) {
      return;
    }
    if (open) {
      dialogHowRef.current.show();
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
    <div className="flex flex-grow px-4 py-4 sm:py-6 sm:px-10">
      <div className="w-full mx-auto columns-1 sm:columns-2 lg:columns-3 xl:columns-4 break-before-avoid">
        <div className="mb-4 space-y-4 break-inside-avoid">
          <Account />
          <Passkeys />
        </div>
        {/* TODO: wallet service is not supporting AA atm, remove this when it is supported */}
        {!useAccountAbstraction && (
          <div className="mb-4 break-inside-avoid lg:break-after-avoid xl:break-after-column">
            <WalletServices />
          </div>
        )}
        <div className="mb-4 break-inside-avoid xl:break-after-column">
          <NftServices />
        </div>
        <div className="space-y-4 break-inside-avoid">
          <DocsDetails />
          <Card>
            <p className="text-sm text-app-gray-800">
              Have any questions?
              <a
                className="inline mx-1 text-app-primary-600 hover:underline"
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
      <Dialog type="modal" closeDialog={() => toggleRegisterPasskeyModal(false)} ref={dialogHowRef}>
        <div className="mt-2 text-center">
          <img className="mx-auto mb-b" src="https://images.web3auth.io/passkey-register.svg" alt="Register Passkey" />
          <div className="mb-2 font-bold text-gray-900">Register Passkey</div>
          <div className="mb-8 text-sm text-gray-500">
            <div>With passkeys, you can verify your identity through your face, fingerprint, or security keys.</div>
            <button type="button" className="outline-none text-primary">
              Learn more
            </button>
          </div>
          <button
            className="flex items-center justify-center w-full px-6 text-white rounded-full cursor-pointer h-9 bg-primary"
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
