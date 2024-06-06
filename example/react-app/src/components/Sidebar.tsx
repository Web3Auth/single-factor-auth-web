import { useLocation, useNavigate } from "react-router-dom";

const Sidebar = () => {
  const navigate = useNavigate();
  function goToHome() {
    navigate("/");
  }
  function goToPasskeyList() {
    navigate("/passkey-list");
  }
  function goToSigning() {
    navigate("/transactions");
  }
  function goToSourceCode() {
    window.open("https://github.com/Web3Auth/single-factor-auth-web/tree/master/example/react-app", "_blank", "noreferrer noopener");
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

  return (
    <div>
      <div className="flex-col justify-between h-full bg-white border-r w-64 p-5 hidden lg:flex">
        <div className="py-3">
          <strong className="px-4 block p-1 text-xs font-medium text-gray-400 uppercase">MENU</strong>
          <nav className="flex flex-col mt-6">
            {location.pathname === "/" ? activePage("Account Details", 1) : linktoGo("Account Details", goToHome, 1)}
            {location.pathname === "/transactions" ? activePage("Transactions", 2) : linktoGo("Transactions", goToSigning, 2)}
            {location.pathname === "/passkey-list" ? activePage("Show All Passkeys", 2) : linktoGo("Show All Passkeys", goToPasskeyList, 9)}
            {linktoGo("Source Code", goToSourceCode, 10)}
          </nav>
        </div>
      </div>
    </div>
  );
};
export default Sidebar;
