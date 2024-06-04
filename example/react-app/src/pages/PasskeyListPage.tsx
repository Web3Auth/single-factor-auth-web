import React, { useMemo } from "react";
import Sidebar from "../components/Sidebar";
import Console from "../components/Console";
import { usePlayground } from "../services/playground";

function PasskeyListPage() {
  const { listAllPasskeys } = usePlayground();

  useMemo(() => {
    listAllPasskeys();
  }, []);

  return (
    <div className="flex-grow flex items-stretch">
      <Sidebar />
      <div className="flex-grow p-8 bg-gray-50">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-lg font-bold text-center">Passkey List</h1>
          <Console />
        </div>
      </div>
    </div>
  );
}

export default PasskeyListPage;
