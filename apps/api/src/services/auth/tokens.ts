import jwt from "jsonwebtoken";

export type AccessTokenPayload = {
  sub: string;
  email: string;
  name: string;
  organizationId: string;
};

const EXPIRES_IN = "7d";

export function signAccessToken(
  payload: AccessTokenPayload,
  secret: string,
): string {
  return jwt.sign(payload, secret, { expiresIn: EXPIRES_IN });
}

export function readAccessToken(
  token: string,
  secret: string,
): AccessTokenPayload {
  const decoded = jwt.verify(token, secret);
  if (!decoded || typeof decoded === "string") {
    throw new Error("Invalid token");
  }
  const sub = decoded.sub;
  const email = decoded.email;
  const name = decoded.name;
  const organizationId = decoded.organizationId;
  if (
    typeof sub !== "string" ||
    typeof email !== "string" ||
    typeof name !== "string" ||
    typeof organizationId !== "string"
  ) {
    throw new Error("Invalid token");
  }
  return { sub, email, name, organizationId };
}
