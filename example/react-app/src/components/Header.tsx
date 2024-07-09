import { useNavigate } from "react-router-dom";
import { usePlayground } from "../services/playground";

import web3authLogo from "../assets/web3authLogoBlue.svg";
import Button from "./Button";

const Header = () => {
  const { isLoggedIn, logout } = usePlayground();

  const navigate = useNavigate();

  function goToHome() {
    navigate("/");
  }

  return (
    <header className="sticky max-w-screen z-10">
      <div className="px-4 py-4 mx-auto sm:py-2 sm:px-6 md:px-8 bg-white">
        <div className="justify-between items-center flex">
          <div className="block sm:flex py-0 sm:py-3 justify-center  flex-row" onClick={() => goToHome()}>
            <div className="flex flex-row justify-center items-center mb-2 sm:mb-0">
              <img
                src={web3authLogo}
                style={{
                  height: "30px",
                  paddingRight: "15px",
                }}
                alt=""
              />
              <div className="border-l-2 text-sm sm:text-xl text-gray-900 px-3 items-center">SDK Playground</div>
            </div>
            <div className="flex flex-row justify-center items-center no-underline w-max overflow-hidden flex-wrap m-0 p-0 rounded-lg bg-purple_100 mt-0">
              <div className="flex flex-col justify-center text-center items-center w-max font-medium text-xs sm:text-s leading-[150%] text-purple_800 flex-wrap m-0 px-2 sm:px-3 py-0.5;">
                SFA Passkey
              </div>
            </div>
          </div>
          {isLoggedIn && (
            <div className="mt-0 items-center">
              <Button className="!h-8 sm:!h-[42px]" onClick={logout}>
                Logout
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
