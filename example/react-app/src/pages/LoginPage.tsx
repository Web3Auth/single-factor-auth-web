import { CredentialResponse, GoogleLogin } from "@react-oauth/google";
import { useEffect, useRef } from "react";
// Google OAuth libraries for login and logout
import { Navigate } from "react-router-dom";

import web3authLogoBlue from "../assets/web3authLogoBlue.svg";
import Dialog from "../components/Dialog";
import Loader from "../components/Loader";
import useWindowDimensions from "../hooks/window-dimensions";
import { usePlayground } from "../services/playground";

function LoginPage() {
  const guidePopupRef = useRef<HTMLDialogElement>(null);
  const guideModalRef = useRef<HTMLDialogElement>(null);
  const { loginWithPasskey, onSuccess, isLoggedIn, isLoading } = usePlayground();

  const { width } = useWindowDimensions();

  const steps = [
    "Sign in with Google or use Google One Tap",
    "Once logged in, register your Passkey and log out",
    "Sign in with Passkey to fully experience the Passkey login",
  ];

  function toggleGuideModal(open: boolean) {
    if (!guideModalRef.current) {
      return;
    }

    open ? guideModalRef.current.showModal() : guideModalRef.current.close();
  }

  function toggleGuidePopup(open: boolean) {
    if (!guidePopupRef.current) {
      return;
    }

    open ? guidePopupRef.current.show() : guidePopupRef.current.close();
  }

  useEffect(() => {
    document.title = "Login";
    console.log("Login Page");
    toggleGuidePopup(true);
  });

  const onLogin = async (credentials: CredentialResponse) => {
    toggleGuidePopup(false);
    await onSuccess(credentials);
    <Navigate to="/home" replace />;
  };

  const onLoginWithPasskey = async () => {
    toggleGuidePopup(false);
    loginWithPasskey();
  };

  if (isLoggedIn) {
    return <Navigate to="/home" />;
  }

  return isLoading ? (
    <Loader />
  ) : (
    <div className="flex-grow flex items-center justify-center p-4">
      <div className="w-[340px] sm:w-[392px] bg-white p-8 rounded-2xl shadow-modal border-0">
        <img src={web3authLogoBlue} className="w-12 h-12 mb-5" alt="dapp logo" />
        <div className="mb-6">
          <p className="text-xl font-bold text-text_primary">Sign in</p>
          <p className="font-medium text-text_secondary">Your blockchain wallet in one-click</p>
        </div>
        <div className="flex justify-center mb-2">
          <GoogleLogin
            logo_alignment="left"
            locale="en"
            auto_select={false}
            text="continue_with"
            onSuccess={onLogin}
            size="large"
            shape="pill"
            width={width < 640 ? "276px" : "332px"}
          />
        </div>
        <button
          className="flex justify-center rounded-full px-6 h-9 items-center text-white cursor-pointer w-full"
          style={{ backgroundColor: "#0364ff" }}
          onClick={onLoginWithPasskey}
        >
          I have a passkey
        </button>
        <div className="mt-1 w-full text-center">
          <button className="text-primary text-xs" onClick={() => toggleGuideModal(true)}>
            How does it work?
          </button>
        </div>

        <img className="mx-auto mt-6" src="https://images.web3auth.io/ws-trademark-light.svg" alt="web3auth footer" />
      </div>

      {width > 640 && (
        <Dialog type="non-modal" closeDialog={() => toggleGuidePopup(false)} ref={guidePopupRef}>
          <div className="mb-6">
            <h2 className="text-text_primary2 font-semibold">Getting started with Passkey Demo</h2>
          </div>
          <ul className="text-text_secondary">
            {steps.map((step, index) => (
              <li key={index} className="flex gap-4">
                <div className="bg-primary flex-shrink-0 mt-1 rounded-full w-5 h-5 flex items-center justify-center text-white">{index + 1}</div>
                {step}
              </li>
            ))}
          </ul>
        </Dialog>
      )}

      <Dialog type="modal" closeDialog={() => toggleGuideModal(false)} ref={guideModalRef}>
        <div className="mb-8">
          <h2 className="text-lg text-text_primary font-semibold">How does it work?</h2>
          <p className="text-sm text-text_secondary">Follow below steps</p>
        </div>
        <ul className="text-text_secondary">
          {steps.map((step, index) => (
            <li key={index} className="flex gap-4">
              <div className="bg-primary flex-shrink-0 mt-1 rounded-full w-5 h-5 flex items-center justify-center text-white">{index + 1}</div>
              {step}
            </li>
          ))}
        </ul>
      </Dialog>
    </div>
  );
}

export default LoginPage;
