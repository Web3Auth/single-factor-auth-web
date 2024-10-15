import { useEffect, useRef } from "react";

import AlertIcon from "../assets/alertIcon.svg";
import { usePlayground } from "../services/playground";
import Dialog, { DialogRef } from "./Dialog";

function CancelModal() {
  const dialogHowRef = useRef<DialogRef>(null);
  const { isCancelModalOpen, toggleCancelModal } = usePlayground();
  const steps = [
    "Sign in with Google or use Google One Tap",
    "Once logged in, register your Passkey and log out",
    "Sign in with Passkey to fully experience the Passkey login",
  ];

  useEffect(() => {
    if (!dialogHowRef.current) {
      return;
    }
    if (isCancelModalOpen) {
      dialogHowRef.current.show();
    } else dialogHowRef.current.close();
  }, [isCancelModalOpen]);

  return (
    <Dialog type="modal" closeDialog={() => toggleCancelModal(false)} ref={dialogHowRef}>
      <img src={AlertIcon} className="w-8 h-8 mb-2 mx-auto" alt="" />
      <h2 className="text-lg text-text_primary font-semibold mb-6 text-center">Canceled or timed out</h2>
      <div className="mb-4 text-sm text-text_secondary">How to get started with Passkey</div>
      <ul className="text-text_secondary">
        {steps.map((step, index) => (
          <li key={step} className="flex gap-4">
            <div className="bg-primary flex-shrink-0 mt-1 rounded-full w-5 h-5 flex items-center justify-center text-white">{index + 1}</div>
            {step}
          </li>
        ))}
      </ul>
    </Dialog>
  );
}

export default CancelModal;
