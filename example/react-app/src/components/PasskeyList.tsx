import { usePlayground } from "../services/playground";

function PasskeyList() {
  const { address } = usePlayground();

  return (
    <div>
      <div className="flex flex-col space-y-2 md:flex-row md:justify-between md:space-y-0">
        <h1 className="text-lg font-bold">Passkeys</h1>
      </div>

      <div className="md:p-8 p-4 mt-6 space-y-4 rounded-lg bg-white overflow-hidden w-full">{address}</div>
    </div>
  );
}

export default PasskeyList;
