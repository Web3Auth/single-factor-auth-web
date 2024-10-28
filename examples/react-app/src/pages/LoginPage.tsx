import { CredentialResponse, GoogleLogin } from "@react-oauth/google";
import { log } from "@web3auth/base";
import { useEffect, useRef } from "react";
// Google OAuth libraries for login and logout
import { Navigate } from "react-router-dom";

import web3authLogoBlue from "../assets/web3authLogoBlue.svg";
import Dialog, { DialogRef } from "../components/Dialog";
import Loader from "../components/Loader";
import useWindowDimensions from "../hooks/window-dimensions";
import { usePlayground } from "../services/playground";

function LoginPage() {
  const guidePopupRef = useRef<DialogRef>(null);
  const guideModalRef = useRef<DialogRef>(null);

  const { loginWithPasskey, onSuccess, isLoggedIn, isLoading, useAccountAbstraction, toggleUseAccountAbstraction } = usePlayground();

  const { width } = useWindowDimensions();

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

  function toggleGuideModal(open: boolean) {
    if (!guideModalRef.current) {
      return;
    }
    if (open) {
      guideModalRef.current.show();
      return;
    }
    guideModalRef.current.close();
  }

  function toggleGuidePopup(open: boolean) {
    if (!guidePopupRef.current) {
      return;
    }
    if (open) {
      guidePopupRef.current.show();
      return;
    }
    guidePopupRef.current.close();
  }

  useEffect(() => {
    document.title = "Login";
    log.info("Login Page");
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
    <div className="flex items-center justify-center flex-grow p-4">
      <div className="w-[340px] sm:w-[392px] bg-white p-8 rounded-2xl shadow-modal border-0">
        <img src={web3authLogoBlue} className="w-12 h-12 mb-5" alt="dapp logo" />
        <div className="mb-6">
          <p className="text-xl font-bold text-text_primary">Sign in</p>
          <p className="font-medium text-text_secondary">Your blockchain wallet in one-click</p>
          <div className="flex items-center my-4">
            <input
              type="checkbox"
              id="useAccountAbstraction"
              value={useAccountAbstraction.toString()}
              checked={useAccountAbstraction}
              onChange={toggleUseAccountAbstraction}
              className="w-5 h-5 border-gray-300 rounded form-checkbox text-primary"
            />
            <label htmlFor="useAccountAbstraction" className="ml-2 text-sm text-text_secondary">
              Account Abstraction
            </label>
          </div>
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
          className="flex items-center justify-center w-full px-6 text-white rounded-full cursor-pointer h-9"
          style={{ backgroundColor: "#0364ff" }}
          onClick={onLoginWithPasskey}
          type="button"
        >
          I have a passkey
        </button>
        <div className="w-full mt-1 text-center">
          <button className="text-xs text-primary" onClick={() => toggleGuideModal(true)} type="button">
            How does it work?
          </button>
        </div>

        <img className="mx-auto mt-6" src="https://images.web3auth.io/ws-trademark-light.svg" alt="web3auth footer" />
      </div>

      {width > 640 && (
        <Dialog type="non-modal" closeDialog={() => toggleGuidePopup(false)} ref={guidePopupRef}>
          <div className="mb-6">
            <h2 className="font-semibold text-text_primary2">Getting started with Passkey Demo</h2>
          </div>
          <ul className="text-text_secondary">
            {steps.map((step) => (
              <li key={step.index} className="flex gap-4">
                <div className="flex items-center justify-center flex-shrink-0 w-5 h-5 mt-1 text-white rounded-full bg-primary">{step.index}</div>
                {step.text}
              </li>
            ))}
          </ul>
        </Dialog>
      )}

      <Dialog type="modal" closeDialog={() => toggleGuideModal(false)} ref={guideModalRef}>
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-text_primary">How does it work?</h2>
          <p className="text-sm text-text_secondary">Follow below steps</p>
        </div>
        <ul className="text-text_secondary">
          {steps.map((step) => (
            <li key={step.index} className="flex gap-4">
              <div className="flex items-center justify-center flex-shrink-0 w-5 h-5 mt-1 text-white rounded-full bg-primary">{step.index}</div>
              {step.text}
            </li>
          ))}
        </ul>
      </Dialog>
    </div>
  );
}

export default LoginPage;
