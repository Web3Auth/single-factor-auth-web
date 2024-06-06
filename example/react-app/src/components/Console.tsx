import { usePlayground } from "../services/playground";

const Console = () => {
  const { playgroundConsole } = usePlayground();

  return (
    <div className="w-full flex-col mt-4">
      <p className="text-lg font-bold">Console</p>
      <div className="justify-center p-8 mt-6 mb-0 space-y-4 rounded-lg bg-white">
        <div className="md:flex items-flex-start p-2 bg-gray-200 max-h-72 overflow-auto rounded-md">
          <pre className="font-mono text-xs overflow-scroll break-all text-wrap w-full">{playgroundConsole}</pre>
        </div>
      </div>
    </div>
  );
};

export default Console;
