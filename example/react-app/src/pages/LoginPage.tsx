import React from "react";
import web3authLogoBlue from "../assets/web3authLogoBlue.svg";
import { usePlayground } from "../services/playground";

// Google OAuth libraries for login and logout
import { CredentialResponse, GoogleLogin } from "@react-oauth/google";
import { Navigate } from "react-router-dom";
import Loader from "../components/Loader";

function LoginPage() {
  const { loginWithPasskey, onSuccess, isLoggedIn, isLoading, toggleGuideModal } = usePlayground();

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
      toggleGuideModal({ open: true, type: "how" });
    }
  };

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
          <GoogleLogin
            logo_alignment="left"
            locale="en"
            auto_select={false}
            text="continue_with"
            onSuccess={onLogin}
            size="large"
            shape="pill"
            width="332px"
          />
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
          <button className="text-primary text-sm" onClick={() => toggleGuideModal({ open: true, type: "how" })}>
            How does it work?
          </button>
        </div>

        <img className="mx-auto mt-6" src="https://images.web3auth.io/ws-trademark-light.svg" alt="web3auth footer" />
      </div>
    </div>
  );
}

export default LoginPage;
