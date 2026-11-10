import bcrypt from "bcryptjs";

const COST = 12;
let dummyHash: string | undefined;

async function fakeHash(): Promise<string> {
  dummyHash ??= await bcrypt.hash("not-a-real-password", COST);
  return dummyHash;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, COST);
}

export async function verifyPassword(
  password: string,
  passwordHash: string,
): Promise<boolean> {
  return bcrypt.compare(password, passwordHash || (await fakeHash()));
}
