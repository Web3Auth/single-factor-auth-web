import keyIcon from "../assets/keyIcon.svg";
import LoadingIcon from "../assets/loadingIcon.svg";
import UnlinkIcon from "../assets/unlinkIcon.svg";
import { usePlayground } from "../services/playground";
import Badge from "./Badge";
import Button from "./Button";
import Card from "./Card";
import Divider from "./Divider";

function Passkeys() {
  const { hasPasskeys, passkeys, deletingPasskeyId, registerPasskey, unlinkPasskey } = usePlayground();
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
          {passkeys.map((passkey) => (
            <div key={passkey.id} className="flex items-center py-4">
              <div className="mr-2">
                <img src={keyIcon} className="text-app-gray-900 w-5 h-5" alt="key" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-app-gray-900 dark:text-app-white">{passkey.name}</h4>
                <p className="text-xs text-app-gray-400">{passkey.detail1}</p>
                <p className="text-xs text-app-gray-400">{passkey.detail2}</p>
              </div>
              <div className="ml-auto">
                <button
                  type="button"
                  className="p-1 rounded-md hover:bg-app-gray-200 disabled:bg-app-gray-200 w-6 h-6 flex items-center justify-center"
                  disabled={deletingPasskeyId === passkey.id}
                  onClick={() => unlinkPasskey(passkey.id)}
                >
                  {deletingPasskeyId === passkey.id ? (
                    <img src={LoadingIcon} className="w-5 h-5 animate-spin" alt="Loading" />
                  ) : (
                    <img src={UnlinkIcon} className="w-5 h-5" alt="Unlink" />
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
export default Passkeys;
