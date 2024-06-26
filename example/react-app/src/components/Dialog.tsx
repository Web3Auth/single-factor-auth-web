import { forwardRef } from "react";

type Props = {
  children: React.ReactNode;
  closeDialog: () => void;
  type: "modal" | "non-modal";
};

const Dialog = forwardRef<HTMLDialogElement, Props>(({ children, closeDialog, type = "non-modal" }, ref) => {
  return (
    <dialog
      className={`rounded-3xl px-6 pb-6 pt-10 w-[360px] shadow-sm border border-gray-100 ${type === "non-modal" ? "ml-8 mb-8 z-50 bottom-0 left-0" : ""}`}
      ref={ref}
      onClick={(e) => {
        if (e.currentTarget === e.target) {
          closeDialog();
        }
      }}
    >
      {children}
      <button className="absolute top-4 right-5 shadow-sm outline-none" onClick={closeDialog}>
        <svg width="26" height="26" viewBox="0 0 26 26" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M9.8 16.2L13 13M13 13L16.2 9.8M13 13L9.8 9.8M13 13L16.2 16.2M25 13C25 14.5759 24.6896 16.1363 24.0866 17.5922C23.4835 19.0481 22.5996 20.371 21.4853 21.4853C20.371 22.5996 19.0481 23.4835 17.5922 24.0866C16.1363 24.6896 14.5759 25 13 25C11.4241 25 9.86371 24.6896 8.4078 24.0866C6.95189 23.4835 5.62902 22.5996 4.51472 21.4853C3.40042 20.371 2.5165 19.0481 1.91345 17.5922C1.31039 16.1363 1 14.5759 1 13C1 9.8174 2.26428 6.76516 4.51472 4.51472C6.76515 2.26428 9.8174 1 13 1C16.1826 1 19.2348 2.26428 21.4853 4.51472C23.7357 6.76516 25 9.8174 25 13Z"
            stroke="#6B7280"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
    </dialog>
  );
});
export default Dialog;
