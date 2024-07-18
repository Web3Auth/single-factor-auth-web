import { ComponentRef, forwardRef, ReactNode, useEffect, useImperativeHandle, useRef } from "react";

import closeIcon from "../assets/closeIcon.svg";

type Props = {
  children: ReactNode;
  closeDialog: () => void;
  type: "modal" | "non-modal";
};

type Handle = {
  show: () => void;
  close: () => void;
};

const Dialog = forwardRef<Handle, Props>(function Dialog({ children, closeDialog, type = "non-modal" }, ref) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useImperativeHandle(ref, () => {
    return {
      show() {
        if (type === "modal") {
          dialogRef.current?.showModal();
        } else {
          dialogRef.current?.show();
        }
      },
      close() {
        dialogRef.current?.close();
      },
    };
  }, [type]);

  useEffect(() => {
    const effectRef = dialogRef.current;

    if (effectRef) {
      effectRef.addEventListener("click", closeDialog);

      return () => {
        effectRef.removeEventListener("scroll", closeDialog);
      };
    }

    return () => {};
  }, [closeDialog, dialogRef]);

  return (
    <dialog
      className={`global-dialog rounded-3xl px-6 pb-6 pt-10 w-[360px] shadow-sm border border-gray-100 ${type === "non-modal" ? "ml-8 mb-8 z-50 bottom-0 left-0" : ""}`}
      ref={dialogRef}
    >
      {children}
      <button className="absolute top-4 right-5 shadow-sm outline-none" onClick={closeDialog} type="button">
        <img src={closeIcon} className="w-6 h-6" alt="" />
      </button>
    </dialog>
  );
});

export type DialogRef = ComponentRef<typeof Dialog>;

export default Dialog;
