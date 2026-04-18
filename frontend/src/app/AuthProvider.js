"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import axios from "axios";
import { URL } from "@/utils/constants";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import { useRouter, usePathname } from "next/navigation";
import { setUserFromVerify, clearUserSession } from "@/lib/features/todos/usersDataSlice";
import { isJwtExpired } from "@/utils/jwtExpiry";

const SESSION_EXPIRED_EVENT = "app:session-expired";

const isPublicPathname = (pathname) =>
  Boolean(
    pathname === "/" ||
      !pathname ||
      pathname?.startsWith("/auth") ||
      pathname === "/login" ||
      pathname?.includes("reset-password"),
  );

const AuthProvider = ({ children }) => {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const pathname = usePathname();
  const session = useAppSelector((s) => s.userData?.session ?? null);
  const [authReady, setAuthReady] = useState(false);
  /** While false, ignore 401 on arbitrary API calls (avoids logout race with child useEffects). */
  const authGateOpenRef = useRef(false);

  const pathnameRef = useRef(pathname);
  pathnameRef.current = pathname;

  const dispatchRef = useRef(dispatch);
  dispatchRef.current = dispatch;

  const routerRef = useRef(router);
  routerRef.current = router;

  const forceLogoutToLogin = useCallback(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    dispatchRef.current(clearUserSession());
    const p = pathnameRef.current || "";
    if (!isPublicPathname(p)) {
      routerRef.current.replace("/auth/login");
    }
  }, []);

  const logoutIfTokenExpired = useCallback(() => {
    const token = localStorage.getItem("token");
    if (!token) return;
    if (isJwtExpired(token)) {
      forceLogoutToLogin();
    }
  }, [forceLogoutToLogin]);

  const verifyUser = useCallback(async () => {
    const p = pathnameRef.current || "";
    try {
      const token = localStorage.getItem("token");

      if (token) {
        if (isJwtExpired(token)) {
          forceLogoutToLogin();
          return null;
        }
        const response = await axios.post(
          `${URL}/auth/verify`,
          {},
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );
        if (response.data.code === 200) {
          return response.data.data;
        }
        forceLogoutToLogin();
        return null;
      }
      dispatchRef.current(clearUserSession());
      if (!isPublicPathname(p)) {
        routerRef.current.replace("/auth/login");
      }
      return null;
    } catch {
      forceLogoutToLogin();
      return null;
    }
  }, [forceLogoutToLogin]);

  /** After the first verify on this navigation, enforce “no session” → login. */
  useEffect(() => {
    if (!authReady) return;
    if (session !== false) return;
    if (isPublicPathname(pathname)) return;
    // Token present but Redux not updated yet: right after login → navigate, verify effect
    // may still be in flight while authReady stayed true from the previous route — do not bounce to login.
    if (typeof window !== "undefined" && localStorage.getItem("token")) {
      return;
    }
    router.replace("/auth/login");
  }, [authReady, session, pathname, router]);

  /** Sync bootstrap attaches Bearer + JWT check; this only handles logout from that path. */
  useEffect(() => {
    const onSessionExpired = () => forceLogoutToLogin();
    window.addEventListener(SESSION_EXPIRED_EVENT, onSessionExpired);
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, onSessionExpired);
  }, [forceLogoutToLogin]);

  useEffect(() => {
    const responseInterceptor = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        const status = error?.response?.status;
        const serverMessage = String(error?.response?.data?.message || "").toLowerCase();
        const rawMessage = String(error?.message || "").toLowerCase();
        const isTokenProblem =
          status === 401 ||
          serverMessage.includes("jwt expired") ||
          serverMessage.includes("invalid token") ||
          serverMessage.includes("authorization token missing") ||
          serverMessage.includes("unauthorized") ||
          rawMessage.includes("jwt expired");

        if (isTokenProblem && authGateOpenRef.current) {
          forceLogoutToLogin();
        }

        return Promise.reject(error);
      },
    );

    return () => {
      axios.interceptors.response.eject(responseInterceptor);
    };
  }, [forceLogoutToLogin]);

  useEffect(() => {
    authGateOpenRef.current = false;
    setAuthReady(false);
    let cancelled = false;
    const isAuthRoute = pathname?.startsWith("/auth");
    verifyUser()
      .then((res) => {
        if (cancelled || !res) return;
        dispatch(
          setUserFromVerify({
            email: res.email,
            role: res.role,
            id: res.id,
            permissions: res.permissions,
            responsibilityAreas: res.responsibilityAreas,
          }),
        );
        localStorage.setItem("role", res.role);

        if (res.role === "client" && !pathname?.startsWith("/client") && !isAuthRoute) {
          router.push("/client/orders");
        }
      })
      .finally(() => {
        if (!cancelled) {
          authGateOpenRef.current = true;
          setAuthReady(true);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [pathname, verifyUser, dispatch, router]);

  /** Expired JWT must log the user out even without a new API call (same page). */
  useEffect(() => {
    logoutIfTokenExpired();
    const id = setInterval(logoutIfTokenExpired, 15_000);
    const onVisible = () => {
      if (document.visibilityState === "visible") {
        logoutIfTokenExpired();
        void verifyUser();
      }
    };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onVisible);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onVisible);
    };
  }, [logoutIfTokenExpired, verifyUser]);

  return <>{children}</>;
};

export default AuthProvider;
