import React, { useEffect, useRef } from "react";
import Sidebar from "../components/Sidebar";
import AccountDetails from "../components/AccountDetails";
import Console from "../components/Console";
import { usePlayground } from "../services/playground";
import Loader from "../components/Loader";
import Dialog from "../components/Dialog";

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
    toggleDialog(showRegisterPasskeyModal)
  }, [showRegisterPasskeyModal]);

  return isLoading ? (
    <Loader />
  ) : (
    <div className="flex-grow flex items-stretch">
      <Sidebar />
      <div className="flex-grow p-8 bg-gray-50">
        <div className="max-w-3xl mx-auto ">
          <AccountDetails />
          <Console />
        </div>
      </div>
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
            Sign in with Passkey
          </button>
        </div>
      </Dialog>
    </div>
  );
}

export default HomePage;
