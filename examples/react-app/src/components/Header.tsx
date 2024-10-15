import { useNavigate } from "react-router-dom";

import web3authLogo from "../assets/web3authLogoBlue.svg";
import { usePlayground } from "../services/playground";
import Button from "./Button";

function Header() {
  const { isLoggedIn, logout } = usePlayground();

  const navigate = useNavigate();

  const goToHome = () => {
    navigate("/");
  };

  return (
    <header className="sticky max-w-screen z-10">
      <div className="px-4 py-4 mx-auto sm:py-2 sm:px-6 md:px-8 bg-white">
        <div className="justify-between items-center flex">
          <button className="flex py-0 sm:py-3 justify-center items-center flex-row" onClick={() => goToHome()} type="button">
            <div className="flex flex-row justify-center items-center">
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
            <div className="font-medium text-xs sm:text-sm text-purple_800 bg-purple_100 px-2 sm:px-3 py-1 rounded-lg">SFA Passkey</div>
          </button>
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
}

export default Header;
