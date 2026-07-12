import { useAuthStore } from "../../store/auth";

const getApiUrl = (): string => {
  const g =
    typeof globalThis !== "undefined"
      ? (globalThis as unknown as {
          process?: { env?: { NEXT_PUBLIC_API_URL?: string } };
        })
      : null;
  const envUrl = g?.process?.env?.NEXT_PUBLIC_API_URL;
  if (envUrl) {
    return envUrl;
  }
  return "http://localhost:5000/api";
};

export async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const apiUrl = getApiUrl();
  const headers = new Headers(options.headers || {});

  if (options.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  // Retrieve token dynamically from Zustand persistent store
  const token = useAuthStore.getState().token;
  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${apiUrl}${endpoint}`, {
    ...options,
    headers,
  });

  const resData = await response.json();

  if (!response.ok) {
    throw new Error(resData.error || `HTTP Error ${response.status}`);
  }

  // Automatically unwrap standard success envelopes
  return resData.data as T;
}
