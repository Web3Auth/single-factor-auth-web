import { safeatob } from "@toruslabs/openlogin-utils";
export function decodeToken(token: string) {
  const [header, payload] = token.split(".");
  return {
    header: JSON.parse(safeatob(header)),
    payload: JSON.parse(safeatob(payload)),
  };
}
