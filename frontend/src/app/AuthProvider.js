"use client";

import { useCallback, useEffect, useRef } from "react";
import axios from "axios";
import { URL } from "@/utils/constants";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import { useRouter, usePathname } from "next/navigation";
import { setUserFromVerify, clearUserSession } from "@/lib/features/todos/usersDataSlice";

const isPublicPathname = (pathname) =>
  Boolean(
    pathname?.startsWith("/auth") ||
      pathname === "/login" ||
      pathname?.includes("reset-password"),
  );

const AuthProvider = ({ children }) => {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const pathname = usePathname();
  const session = useAppSelector((s) => s.usersData.session);

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
      routerRef.current.replace("/login");
    }
  }, []);

  const verifyUser = useCallback(async () => {
    const p = pathnameRef.current || "";
    try {
      const token = localStorage.getItem("token");

      if (token) {
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
        routerRef.current.replace("/login");
      }
      return null;
    } catch {
      forceLogoutToLogin();
      return null;
    }
  }, [forceLogoutToLogin]);

  /** Any protected page while Redux says there is no session → login. */
  useEffect(() => {
    if (session !== false) return;
    if (isPublicPathname(pathname)) return;
    router.replace("/login");
  }, [session, pathname, router]);

  useEffect(() => {
    const requestInterceptor = axios.interceptors.request.use((config) => {
      const token = localStorage.getItem("token");
      if (token) {
        config.headers = config.headers || {};
        if (!config.headers.Authorization) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      }
      return config;
    });

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

        if (isTokenProblem) {
          forceLogoutToLogin();
        }

        return Promise.reject(error);
      },
    );

    return () => {
      axios.interceptors.request.eject(requestInterceptor);
      axios.interceptors.response.eject(responseInterceptor);
    };
  }, [forceLogoutToLogin]);

  useEffect(() => {
    const isAuthRoute = pathname?.startsWith("/auth");
    verifyUser().then((res) => {
      if (res) {
        dispatch(
          setUserFromVerify({
            email: res.email,
            role: res.role,
            id: res.id,
          }),
        );
        localStorage.setItem("role", res.role);

        if (res.role === "client" && !pathname?.startsWith("/client") && !isAuthRoute) {
          router.push("/client/orders");
        }
      }
    });
  }, [pathname, verifyUser, dispatch, router]);

  return <>{children}</>;
};

export default AuthProvider;
