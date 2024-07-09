import { forwardRef } from "react";
import closeIcon from "../assets/closeIcon.svg";

type Props = {
  children: React.ReactNode;
  closeDialog: () => void;
  type: "modal" | "non-modal";
};

const Dialog = forwardRef<HTMLDialogElement, Props>(({ children, closeDialog, type = "non-modal" }, ref) => {
  return (
    <dialog
      className={`global-dialog rounded-3xl px-6 pb-6 pt-10 w-[360px] shadow-sm border border-gray-100 ${type === "non-modal" ? "ml-8 mb-8 z-50 bottom-0 left-0" : ""}`}
      ref={ref}
      onClick={(e) => {
        if (e.currentTarget === e.target) {
          closeDialog();
        }
      }}
    >
      {children}
      <button className="absolute top-4 right-5 shadow-sm outline-none" onClick={closeDialog}>
        <img src={closeIcon} className="w-6 h-6" alt="" />
      </button>
    </dialog>
  );
});
export default Dialog;
