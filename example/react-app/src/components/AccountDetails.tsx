import { useEffect, useState } from "react";
import { usePlayground } from "../services/playground";

function AccountDetails() {
  const [addressToShow, setAddressToShow] = useState<string>("");
  const { address, balance, userInfo, chainId, hasPasskeys, getUserInfo, registerPasskey } = usePlayground();

  useEffect(() => {
    setAddressToShow(address || "");
  }, [address]);

  return (
    <div>
      <div className="flex flex-col space-y-2 md:flex-row md:justify-between md:space-y-0">
        <h1 className="text-lg font-bold">Your Account Details</h1>
      </div>

      <div className="md:p-8 p-4 mt-6 space-y-4 rounded-lg bg-white overflow-hidden w-full">
        <div className="flex flex-col md:flex-row space-y-2 md:space-y-0">
          {userInfo?.profileImage && <img className="object-fill w-24 h-24 rounded-lg" src={userInfo?.profileImage} alt="" />}
          {!userInfo?.profileImage && userInfo?.name && (
            <span className="flex justify-center items-center bg-purple-100 font-bold w-24 h-24 rounded-lg text-[80px] text-purple-800">
              {userInfo?.name.charAt(0).toUpperCase()}
            </span>
          )}
          <div className="space-y-2 md:space-y-0 md:pl-8 flex flex-col flex-grow justify-between">
            <span className="text-xl md:text-2xl text-gray-800 font-bold w-fit">{userInfo?.name}</span>

            <div className="grid sm:flex justify-between grid-cols-2 gap-2">
              <div
                className="text-sm bg-gray-100 text-gray-600 p-1 px-3 rounded-full flex flex-row justify-between gap-4 items-center cursor-pointer"
                onClick={() => {
                  navigator.clipboard.writeText(address);
                  setAddressToShow("Copied!");
                  setTimeout(() => {
                    setAddressToShow(address);
                  }, 1000);
                }}
              >
                <span className="overflow-hidden overflow-ellipsis">{addressToShow}</span>
                <svg className="w-4 h-4" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M2.45166 2.26636C2.45166 1.16179 3.51498 0.266357 4.82666 0.266357H11.16C12.4717 0.266357 13.535 1.16179 13.535 2.26636V9.59969C13.535 10.7043 12.4717 11.5997 11.16 11.5997C11.16 12.7043 10.0967 13.5997 8.78499 13.5997H2.45166C1.13998 13.5997 0.0766602 12.7043 0.0766602 11.5997V4.26636C0.0766602 3.16179 1.13998 2.26636 2.45166 2.26636ZM2.45166 3.59969C2.01443 3.59969 1.65999 3.89817 1.65999 4.26636V11.5997C1.65999 11.9679 2.01443 12.2664 2.45166 12.2664H8.78499C9.22222 12.2664 9.57666 11.9679 9.57666 11.5997H4.82666C3.51498 11.5997 2.45166 10.7043 2.45166 9.59969V3.59969ZM4.82666 1.59969C4.38943 1.59969 4.03499 1.89817 4.03499 2.26636V9.59969C4.03499 9.96788 4.38943 10.2664 4.82666 10.2664H11.16C11.5972 10.2664 11.9517 9.96788 11.9517 9.59969V2.26636C11.9517 1.89817 11.5972 1.59969 11.16 1.59969H4.82666Z"
                    fill="#9CA3AF"
                  />
                </svg>
              </div>
              <div className="text-sm bg-gray-100 text-gray-600 p-1 pl-3 pr-3 rounded-full flex gap-2 items-center cursor-pointer">
                <img className="w-4 h-4" src="https://images.web3auth.io/login-google-dark.svg" alt="" />
                {userInfo?.email}
              </div>
            </div>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row w-full gap-2 justify-between">
          <button className="rounded-full w-full px-4 py-2 border cursor-pointer" onClick={getUserInfo}>
            View User Info in Console
          </button>
          <button className="rounded-full w-full px-4 py-2 cursor-pointer text-white bg-[#0364ff]" onClick={registerPasskey}>
            {hasPasskeys ? "Add another passkey" : "Register passkey"}
          </button>
        </div>
      </div>
      <div className="p-8 mt-6 mb-0 rounded-lg bg-white flex flex-row justify-between flex-wrap">
        <div className="p-2 flex flex-col">
          <span className="text-sm mb-3">Wallet Balance</span>
          <div className="flex flex-row gap-2 items-center">
            <span className="text-2xl font-bold">{balance}</span>
            <span className="text-sm font-medium">ETH</span>
          </div>
        </div>
        <div className="p-2 flex flex-col text-right">
          <span className="text-sm mb-3">Chain ID</span>
          <span className="text-2xl font-bold">{chainId}</span>
        </div>
      </div>
    </div>
  );
}

export default AccountDetails;
