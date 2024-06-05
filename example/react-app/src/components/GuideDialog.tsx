import React, { useEffect, useRef, useState } from "react";

import { ToggleModalData, usePlayground } from "../services/playground";
import Dialog from "./Dialog";

interface CopyType {
  title: string;
  subtitle?: string;
  steps: { index: number; text: string }[];
}

const DialogModal = () => {
  const dialogHowRef = useRef<HTMLDialogElement>(null);
  const [copyWriting, setCopyWriting] = useState<CopyType>({ title: "", steps: [] });

  const { isGuideModalOpen, toggleGuideModal, guideModalType } = usePlayground();

  function toggleDialog(open: boolean) {
    if (!dialogHowRef.current) {
      return;
    }
    open ? dialogHowRef.current.showModal() : dialogHowRef.current.close();
  }

  function updateCopy(guideModalType: ToggleModalData["type"]) {
    const title = guideModalType === "how" ? "How does it work?" : "Getting started with Passkey Demo";
    const subtitle = guideModalType === "how" ? "Follow below steps" : "";
    const steps = [
      {
        index: 1,
        text: "Sign in with Google or use Google One Tap",
      },
      {
        index: 2,
        text: "Once logged in, register your Passkey and log out",
      },
      {
        index: 3,
        text: "Sign in with Passkey to fully experience the Passkey login",
      },
    ];
    setCopyWriting({ title, subtitle, steps });
  }

  useEffect(() => {
    toggleDialog(isGuideModalOpen);
  }, [isGuideModalOpen]);
  useEffect(() => {
    updateCopy(guideModalType || "how");
  }, [guideModalType]);

  return (
    <>
      <Dialog type="modal" closeDialog={() => toggleGuideModal({ open: false })} ref={dialogHowRef}>
        <div className="mb-8">
          <h2 className="text-lg font-semibold">{copyWriting.title}</h2>
          {copyWriting.subtitle && <p className="text-sm text-gray-800">{copyWriting.subtitle}</p>}
        </div>
        <ul>
          {copyWriting.steps.map((step) => (
            <li key={step.index} className="flex gap-4">
              <div className="bg-primary flex-shrink-0 mt-1 rounded-full w-5 h-5 flex items-center justify-center text-white">{step.index}</div>
              {step.text}
            </li>
          ))}
        </ul>
      </Dialog>
    </>
  );
};

export default DialogModal;
