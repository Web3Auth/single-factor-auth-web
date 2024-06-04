import React from "react";
import Sidebar from "../components/Sidebar";
import AccountDetails from "../components/AccountDetails";
import Console from "../components/Console";
import { usePlayground } from "../services/playground";
import Loader from "../components/Loader";

function HomePage() {
  const { isLoading } = usePlayground();
  return isLoading ? (
    <Loader />
  ) : (
    <div className="flex-grow flex items-stretch">
      <Sidebar />
      <div className="flex-grow p-8 bg-gray-50">
        <div className="max-w-3xl mx-auto ">
          <AccountDetails />
          <Console />
        </div>
      </div>
    </div>
  );
}

export default HomePage;
