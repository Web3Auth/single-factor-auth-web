import React from "react";
import web3authLogo from "../assets/web3authLogoBlue.svg";

const Loader = () => {
  return (
    <div className="flex-grow flex items-center justify-center">
      <div className="flex flex-col items-center gap-2">
        <div className="loader">
          <div className="loader-spinner"></div>
          <img v-if="showLogo" className="loader-image" src={web3authLogo} alt="Loader" />
        </div>
        <div>We will be there in a few seconds.</div>
      </div>
    </div>
  );
};

export default Loader;
