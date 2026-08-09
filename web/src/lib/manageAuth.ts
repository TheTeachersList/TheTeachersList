import { verifyManageToken } from "./session";

export function getManageProfileRecordId(request: Request): string | null {
  const auth = request.headers.get("authorization") ?? "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  if (!token) return null;
  return verifyManageToken(token);
}
