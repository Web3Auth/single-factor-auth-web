import Card from "./Card";
import { usePlayground } from "../services/playground";
import keyIcon from "../assets/keyIcon.svg";
import deleteIcon from "../assets/deleteIcon.svg";
import Button from "./Button";
import Divider from "./Divider";
import Badge from "./Badge";

const Passkeys = () => {
  const { hasPasskeys, passkeys, registerPasskey } = usePlayground();

  return (
    <Card>
      <div className="mb-4">
        <div className="flex justify-between items-center mb-1">
          <h3 className="font-semibold text-app-gray-900">Passkeys</h3>

          <Badge className={hasPasskeys ? "bg-app-green-100 text-app-green-800" : ""}>{hasPasskeys ? "Enabled" : "Disabled"}</Badge>
        </div>

        <p className="text-xs text-app-gray-500">Link a passkey to your account</p>
      </div>

      <Button className="w-full" onClick={registerPasskey}>
        Register a Passkey
      </Button>

      {hasPasskeys && <Divider className="mt-4 mb-0" />}

      {hasPasskeys && (
        <div className="divide-y divide-app-gray-200 ">
          {passkeys.map((passkey, index) => (
            <div key={index} className="flex items-center py-4">
              <div className="mr-2">
                <img src={keyIcon} className="text-app-gray-900 w-5 h-5" alt="key" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-app-gray-900 dark:text-app-white">Passkey #{index + 1}</h4>
                <p className="text-xs text-app-gray-400">{passkey?.created_at}</p>
              </div>
              <div className="ml-auto">
                <button>
                  <img src={deleteIcon} className="w-5" alt="key" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
};
export default Passkeys;
