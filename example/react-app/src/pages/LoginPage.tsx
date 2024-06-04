import React from "react";
import web3authLogoBlue from "../assets/web3authLogoBlue.svg";
import { usePlayground } from "../services/playground";

// Google OAuth libraries for login and logout
import { CredentialResponse, GoogleLogin } from "@react-oauth/google";
import { Navigate } from "react-router-dom";
import Loader from "../components/Loader";

function LoginPage() {
  const { loginWithPasskey, onSuccess, isLoggedIn, isLoading } = usePlayground();

  const onLogin = async (credentials: CredentialResponse) => {
    console.log(credentials);
    await onSuccess(credentials);
    <Navigate to="/" replace={true} />;
  };

  if (isLoggedIn) {
    return <Navigate to="/" />;
  }

  return isLoading ? (
    <Loader />
  ) : (
    <div className="flex-grow flex items-center justify-center ">
      <div className="w-[392px] shadow-md p-8 rounded-[30px]">
        <img src={web3authLogoBlue} className="w-12 h-12 mb-5" alt="dapp logo" />
        <div className="mb-6">
          <p className="text-xl font-bold">Sign in</p>
          <p className="font-medium">Your blockchain wallet in one-click</p>
        </div>
        <div className="flex justify-center mb-2">
          <GoogleLogin onSuccess={onLogin} size="large" shape="pill" width="332px" />
        </div>
        {/* <button className="flex mb-2 items-center justify-center rounded-full gap-2 px-6 py-3 cursor-pointer border w-full">
          <img src="https://images.web3auth.io/login-google-dark.svg" alt="" />
          Continue with Google
        </button> */}
        <button
          className="flex justify-center rounded-full px-6 h-9 items-center text-white cursor-pointer w-full"
          style={{ backgroundColor: "#0364ff" }}
          onClick={loginWithPasskey}
        >
          Login with Passkey
        </button>

        <img className="mx-auto mt-6" src="https://images.web3auth.io/ws-trademark-light.svg" alt="web3auth footer" />
      </div>
    </div>
  );
}

export default LoginPage;
