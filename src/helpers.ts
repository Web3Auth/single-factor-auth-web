import MetadataStorageLayer, { encryptAndSetData, getAndDecryptData } from "@toruslabs/metadata-helpers";
import { OpenloginUserInfo } from "@toruslabs/openlogin-utils";

import { OAUTH_USERINFO, PASSKEY_NONCE } from "./constants";

export const setNonce = async (metadataHost: string, privKey: string, nonce: string, serverTimeOffset?: number) => {
  const metadataStorage = new MetadataStorageLayer(metadataHost, serverTimeOffset);
  return encryptAndSetData(metadataStorage, privKey, { nonce }, PASSKEY_NONCE);
};

export const getNonce = async (metadataHost: string, privKey: string, serverTimeOffset?: number): Promise<string> => {
  const metadataStorage = new MetadataStorageLayer(metadataHost, serverTimeOffset);
  const data = await getAndDecryptData<string & { error?: string }>(metadataStorage, privKey, PASSKEY_NONCE);
  if (data.error) return null;
  return (data || {}).nonce;
};

export const saveUserInfo = async (metadataHost: string, privKey: string, userInfo: OpenloginUserInfo, serverTimeOffset?: number) => {
  const metadataStorage = new MetadataStorageLayer(metadataHost, serverTimeOffset);
  return encryptAndSetData(metadataStorage, privKey, userInfo, OAUTH_USERINFO);
};

export const getUserInfo = async (metadataHost: string, privKey: string, serverTimeOffset?: number): Promise<OpenloginUserInfo> => {
  const metadataStorage = new MetadataStorageLayer(metadataHost, serverTimeOffset);
  const result = await getAndDecryptData(metadataStorage, privKey, OAUTH_USERINFO);
  if (!result || result.error) return null;
  return result as OpenloginUserInfo;
};
