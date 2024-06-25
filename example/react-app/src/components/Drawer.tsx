import { useLocation, useNavigate } from "react-router-dom";
import { usePlayground } from "../services/playground";

interface DrawerProps {
  isOpen: boolean;
  setOpen: any;
}
const Drawer = ({ isOpen, setOpen }: DrawerProps) => {
  const { logout } = usePlayground();
  const navigate = useNavigate();

  function goToHome() {
    navigate("/");
  }
  function goToPasskeyList() {
    navigate("/passkey-list");
  }
  function goToSigning() {
    navigate("/features");
  }
  function goToSourceCode() {
    window.open("https://github.com/Web3Auth/single-factor-auth-web/tree/master/example/react-app");
  }
  const location = useLocation();
  function linktoGo(label: string, path: any, id: number) {
    return (
      <div
        onClick={() => path()}
        key={id}
        className="flex items-center px-4 py-2 mb-2 text-gray-500 rounded-lg hover:bg-gray-100 hover:text-primary  cursor-pointer"
      >
        <span className="text-sm font-normal">{label}</span>
      </div>
    );
  }
  function activePage(label: string, id: number) {
    return (
      <div key={id} className="flex items-center px-4 py-2 mb-2 rounded-lg bg-gray-100 text-primary cursor-pointer">
        <span className="text-sm font-bold">{label}</span>
      </div>
    );
  }
  if (isOpen) {
    return (
      <div className="fixed flex w-full h-full  lg:hidden">
        <div onClick={() => setOpen(false)} className="w-full h-full bg-black/[.4]"></div>
        <div className="flex right-0 flex-col justify-between h-screen p-5 bg-white w-80">
          <div className="py-2">
            <strong className="px-4 block p-1 text-xs font-medium text-gray-400 uppercase">MENU</strong>
            <nav className="flex flex-col mt-6">
              {location.pathname === "/" ? activePage("Main Page", 1) : linktoGo("Main Page", goToHome, 1)}
              {location.pathname === "/features" ? activePage("Discover more", 2) : linktoGo("Discover more", goToSigning, 2)}
              {location.pathname === "/passkey-list" ? activePage("Show All Passkeys", 2) : linktoGo("Show All Passkeys", goToPasskeyList, 9)}
              {linktoGo("Source Code", goToSourceCode, 10)}

              <div
                onClick={() => {
                  logout();
                }}
                className="flex items-center px-4 py-2 mb-2 text-gray-500 rounded-lg hover:bg-gray-100 hover:text-primary  cursor-pointer"
              >
                <span className="text-sm font-normal">Disconnect</span>
              </div>
            </nav>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default Drawer;
