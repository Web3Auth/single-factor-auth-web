import { jwtDecode, JwtPayload } from "jwt-decode";
export function parseToken(token: string): JwtPayload {
  return jwtDecode(token);
}
