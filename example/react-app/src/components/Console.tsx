import { useEffect, useRef, useState } from "react";

import { usePlayground } from "../services/playground";
import Button from "./Button";

function Console() {
  const [showAnimate, setShowAnimate] = useState<boolean>(false);
  const consolePopupRef = useRef<HTMLDialogElement>(null);
  const { playgroundConsoleData, playgroundConsoleTitle, resetConsole } = usePlayground();

  const closeDialog = () => {
    setShowAnimate(false);
    setTimeout(() => {
      resetConsole();
      consolePopupRef.current?.close();
    }, 180);
  };

  useEffect(() => {
    if (!consolePopupRef.current || !playgroundConsoleData) {
      return;
    }

    setShowAnimate(true);
    consolePopupRef.current.showModal();
  }, [playgroundConsoleData]);

  useEffect(() => {
    const effectRef = consolePopupRef.current;
    const closeEffectDialog = () => {
      setShowAnimate(false);
      setTimeout(() => {
        resetConsole();
        consolePopupRef.current?.close();
      }, 180);
    };

    if (effectRef) {
      effectRef.addEventListener("click", closeEffectDialog);

      return () => {
        effectRef.removeEventListener("scroll", closeEffectDialog);
      };
    }

    return () => {};
  }, [resetConsole, consolePopupRef]);

  return (
    <dialog className={`console-dialog overflow-hidden ${showAnimate ? "showAnimate" : ""}`} ref={consolePopupRef}>
      <div className="p-5 h-full overflow-hidden flex flex-col gap-5">
        {playgroundConsoleTitle && <div className="flex-shrink-0 font-semibold text-center">{playgroundConsoleTitle}</div>}
        <div className="flex-1 overflow-auto p-6 bg-app-gray-200 rounded-2xl">
          <pre className="font-mono text-xs break-all text-wrap w-full">{playgroundConsoleData}</pre>
        </div>
        <div className="flex-shrink-0">
          <Button className="w-full" onClick={closeDialog}>
            Done
          </Button>
        </div>
      </div>
    </dialog>
  );
}

export default Console;
