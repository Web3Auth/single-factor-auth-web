import React from "react";
import { usePlayground } from "../services/playground";

import web3AuthLogoWhite from "../assets/web3authLogoWhite.svg";

const DisconnectWeb3AuthButton = () => {
  const { isLoggedIn, logout } = usePlayground();

  if (isLoggedIn) {
    return (
      <div
        className="flex flex-row rounded-full px-6 py-3 text-white justify-center align-center cursor-pointer"
        style={{ backgroundColor: "#0364ff" }}
        onClick={() => logout()}
      >
        <img src={web3AuthLogoWhite} className="h-6 mr-2" alt="" />
        Disconnect
      </div>
    );
  }
  return null;
};
export default DisconnectWeb3AuthButton;
