import axios from "axios";
import { isJwtExpired } from "@/utils/jwtExpiry";

let attached = false;

/**
 * Must run synchronously when the client bundle loads (import from StoreProvider),
 * before any child useEffect fires axios calls — otherwise the first requests go
 * without Authorization and 401 triggers global logout.
 */
export function attachAxiosAuthRequestInterceptor() {
  if (typeof window === "undefined" || attached) return;
  attached = true;

  axios.interceptors.request.use((config) => {
    const token = localStorage.getItem("token");
    if (!token) return config;

    if (isJwtExpired(token)) {
      window.dispatchEvent(new CustomEvent("app:session-expired"));
      return Promise.reject(new Error("JWT expired (client)"));
    }

    config.headers = config.headers || {};
    if (!config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });
}

attachAxiosAuthRequestInterceptor();
