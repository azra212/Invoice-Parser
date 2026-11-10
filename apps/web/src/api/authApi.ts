export type SessionUser = {
  id: string;
  email: string;
  name: string;
  organizationId: string;
};

type ApiResponse<T> = {
  success: boolean;
  data?: T;
  message?: string;
};

async function read<T>(res: Response, fallback: string): Promise<T> {
  const data = (await res.json()) as ApiResponse<T>;
  if (!res.ok || !data.success || !data.data) {
    throw new Error(data.message || fallback);
  }
  return data.data;
}

export async function currentUser() {
  const res = await fetch("/api/v1/auth/me", { credentials: "include" });
  if (res.status === 401) return null;
  return read<SessionUser>(res, "Could not load the current user.");
}

export async function registerAccount(input: {
  name: string;
  email: string;
  password: string;
}) {
  const res = await fetch("/api/v1/auth/register", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return read<SessionUser>(res, "Could not create the account.");
}

export async function loginAccount(input: { email: string; password: string }) {
  const res = await fetch("/api/v1/auth/login", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return read<SessionUser>(res, "Could not sign in.");
}

export async function logoutAccount() {
  await fetch("/api/v1/auth/logout", {
    method: "POST",
    credentials: "include",
  });
}
