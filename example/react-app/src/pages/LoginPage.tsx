import React, { useRef } from "react";
import web3authLogoBlue from "../assets/web3authLogoBlue.svg";
import { usePlayground } from "../services/playground";

// Google OAuth libraries for login and logout
import { CredentialResponse, GoogleLogin, useGoogleLogin } from "@react-oauth/google";
import { Navigate } from "react-router-dom";
import Loader from "../components/Loader";
import Dialog from "../components/Dialog";

function LoginPage() {
  const dialogHowRef = useRef<HTMLDialogElement>(null);
  const dialogGettingStarted = useRef<HTMLDialogElement>(null);
  const { loginWithPasskey, onSuccess, isLoggedIn, isLoading } = usePlayground();

  const onLogin = async (credentials: CredentialResponse) => {
    console.log(credentials);
    await onSuccess(credentials);
    <Navigate to="/" replace={true} />;
  };

  const onLoginWithPasskey = async () => {
    try {
      await loginWithPasskey();
    } catch (error) {
      console.error((error as Error).message);
      toggleHowModalDialog();
    }
  };

  function toggleHowModalDialog() {
    if (!dialogHowRef.current) {
      return;
    }
    dialogHowRef.current.hasAttribute("open") ? dialogHowRef.current.close() : dialogHowRef.current.showModal();
  }

  function toggleGettingStartedDialog() {
    if (!dialogGettingStarted.current) {
      return;
    }
    dialogGettingStarted.current.hasAttribute("open") ? dialogGettingStarted.current.close() : dialogGettingStarted.current.show();
  }

  if (isLoggedIn) {
    return <Navigate to="/" />;
  }

  return isLoading ? (
    <Loader />
  ) : (
    <div className="flex-grow flex items-center justify-center ">
      <div className="w-[392px] shadow-sm border border-gray-100 p-8 rounded-[30px]">
        <img src={web3authLogoBlue} className="w-12 h-12 mb-5" alt="dapp logo" />
        <div className="mb-6">
          <p className="text-xl font-bold">Sign in</p>
          <p className="font-medium">Your blockchain wallet in one-click</p>
        </div>
        <div className="flex justify-center mb-2">
          <GoogleLogin logo_alignment="left" locale="en" auto_select={false} text="continue_with" onSuccess={onLogin} size="large" shape="pill" width="332px" />
        </div>
        <div className="text-gray-500 text-xs">We do not store any data related to your social logins.</div>
        <div className="text-center my-4 text-sm font-medium">or</div>
        <button
          className="flex justify-center rounded-full px-6 h-9 items-center text-white cursor-pointer w-full"
          style={{ backgroundColor: "#0364ff" }}
          onClick={onLoginWithPasskey}
        >
          Sign in with Passkey
        </button>
        <div className="mt-1 w-full text-center">
          <button className="text-primary text-sm" onClick={toggleGettingStartedDialog}>
            How does it work?
          </button>
        </div>

        <img className="mx-auto mt-6" src="https://images.web3auth.io/ws-trademark-light.svg" alt="web3auth footer" />
      </div>
      {/* How modal dialog */}
      <Dialog toggleDialog={toggleHowModalDialog} type="modal" ref={dialogHowRef}>
        <div className="mb-8">
          <h2 className="text-lg font-semibold">How does it work?</h2>
          <p className="text-sm text-gray-800">Follow below steps</p>
        </div>
        <ul>
          <li className="flex gap-4">
            <div className="bg-primary flex-shrink-0 mt-1 rounded-full w-5 h-5 flex items-center justify-center text-white">1</div>Sign in with Google
            or use Google One Tap
          </li>
          <li className="flex gap-4">
            <div className="bg-primary flex-shrink-0 mt-1 rounded-full w-5 h-5 flex items-center justify-center text-white">2</div>Once logged in,
            register your Passkey and log out
          </li>
          <li className="flex gap-4">
            <div className="bg-primary flex-shrink-0 mt-1 rounded-full w-5 h-5 flex items-center justify-center text-white">3</div>Sign in with
            Passkey to fully experience the Passkey login
          </li>
        </ul>
      </Dialog>
      {/* Getting started dialog */}
      <Dialog toggleDialog={toggleGettingStartedDialog} type="non-modal" ref={dialogGettingStarted}>
        <div className="mb-8">
          <h2 className="text-lg font-semibold">Getting started with Passkey Demo</h2>
        </div>
        <ul>
          <li className="flex gap-4">
            <div className="bg-primary flex-shrink-0 mt-1 rounded-full w-5 h-5 flex items-center justify-center text-white">1</div>Sign in with Google
            or use Google One Tap
          </li>
          <li className="flex gap-4">
            <div className="bg-primary flex-shrink-0 mt-1 rounded-full w-5 h-5 flex items-center justify-center text-white">2</div>Once logged in,
            register your Passkey and log out
          </li>
          <li className="flex gap-4">
            <div className="bg-primary flex-shrink-0 mt-1 rounded-full w-5 h-5 flex items-center justify-center text-white">3</div>Sign in with Sign
            in with Passkey to fully experience the Passkey login
          </li>
        </ul>
      </Dialog>
    </div>
  );
}

export default LoginPage;
