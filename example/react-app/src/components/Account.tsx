import { useEffect, useState } from "react";
import Card from "./Card";
import { usePlayground } from "../services/playground";
import Divider from "./Divider";
import Button from "./Button";

const Account = () => {
  const [addressToShow, setAddressToShow] = useState<string>("");
  const { address, userInfo, getUserInfo } = usePlayground();

  useEffect(() => {
    setAddressToShow(address || "");
  }, [address]);

  return (
    <Card className="text-center">
      <div className="mb-2">
        {userInfo?.profileImage && <img className="object-fill mx-auto w-16 h-16 rounded-full" src={userInfo?.profileImage} alt="" />}
        {!userInfo?.profileImage && userInfo?.name && (
          <span className="flex mx-auto justify-center items-center bg-purple-100 font-semibold w-16 h-16 rounded-full text-[36px] text-purple-800">
            {userInfo?.name.charAt(0).toUpperCase()}
          </span>
        )}
      </div>
      <div>
        <h3 className="font-bold text-app-gray-800 mb-2">{userInfo?.name || ""}</h3>
        <p className="text-xs text-app-gray-400 mb-1">{userInfo?.email ? userInfo?.email : userInfo?.name}</p>
        <button className="leading-none text-xs text-app-primary-600" onClick={getUserInfo}>
          View User Info
        </button>
      </div>
      <Divider />
      <Button
        className="text-sm w-full"
        onClick={() => {
          navigator.clipboard.writeText(address);
          setAddressToShow("Copied!");
          setTimeout(() => {
            setAddressToShow(address);
          }, 1000);
        }}
      >
        <span className="overflow-hidden overflow-ellipsis">{addressToShow}</span>
        <div className="ml-2">
          <svg className="w-3 h-3" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M2.45166 2.26636C2.45166 1.16179 3.51498 0.266357 4.82666 0.266357H11.16C12.4717 0.266357 13.535 1.16179 13.535 2.26636V9.59969C13.535 10.7043 12.4717 11.5997 11.16 11.5997C11.16 12.7043 10.0967 13.5997 8.78499 13.5997H2.45166C1.13998 13.5997 0.0766602 12.7043 0.0766602 11.5997V4.26636C0.0766602 3.16179 1.13998 2.26636 2.45166 2.26636ZM2.45166 3.59969C2.01443 3.59969 1.65999 3.89817 1.65999 4.26636V11.5997C1.65999 11.9679 2.01443 12.2664 2.45166 12.2664H8.78499C9.22222 12.2664 9.57666 11.9679 9.57666 11.5997H4.82666C3.51498 11.5997 2.45166 10.7043 2.45166 9.59969V3.59969ZM4.82666 1.59969C4.38943 1.59969 4.03499 1.89817 4.03499 2.26636V9.59969C4.03499 9.96788 4.38943 10.2664 4.82666 10.2664H11.16C11.5972 10.2664 11.9517 9.96788 11.9517 9.59969V2.26636C11.9517 1.89817 11.5972 1.59969 11.16 1.59969H4.82666Z"
              fill="currentColor"
            />
          </svg>
        </div>
      </Button>
    </Card>
  );
};
export default Account;
