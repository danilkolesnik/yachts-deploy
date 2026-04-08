"use client"
import { useEffect } from 'react';
import axios from 'axios';
import { URL } from '@/utils/constants';
import { useAppDispatch } from '@/lib/hooks';
import { useRouter,usePathname  } from 'next/navigation';
import { setEmail,setRole,setId } from '@/lib/features/todos/usersDataSlice';

const AuthProvider = ({ children }) => {
  const dispatch = useAppDispatch();
  const router = useRouter()
  const pathname = usePathname()
  const isAuthRoute = pathname?.startsWith('/auth');

  const forceLogoutToLogin = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    if (!pathname?.includes('reset-password') && !isAuthRoute) {
      router.push('/auth/login');
    }
  };

  const verifyUser = async () => {
    try {
      const token = localStorage.getItem('token');

      if (token) {
        const response = await axios.post(`${URL}/auth/verify`, {}, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (response.data.code === 200) {
          return response.data.data;
        } else {
          forceLogoutToLogin();
        }
      }else{
        if (!pathname.includes('reset-password')) {
          router.push('/auth/login');
        }
      }
    } catch (error) {
      forceLogoutToLogin();
    }
  };

  useEffect(() => {
    const requestInterceptor = axios.interceptors.request.use((config) => {
      const token = localStorage.getItem('token');
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
        const serverMessage = String(error?.response?.data?.message || '').toLowerCase();
        const rawMessage = String(error?.message || '').toLowerCase();
        const isTokenProblem =
          status === 401 ||
          serverMessage.includes('jwt expired') ||
          serverMessage.includes('invalid token') ||
          serverMessage.includes('authorization token missing') ||
          rawMessage.includes('jwt expired');

        if (isTokenProblem) {
          forceLogoutToLogin();
        }

        return Promise.reject(error);
      }
    );

    verifyUser()
      .then(res => {
        if (res) {
          dispatch(setEmail(res.email));
          dispatch(setRole(res.role));
          dispatch(setId(res.id));
          localStorage.setItem('role', res.role);

          // Client-facing area lives under /client.
          // Keep existing admin/worker routes unchanged.
          if (res.role === 'client' && !pathname?.startsWith('/client') && !isAuthRoute) {
            router.push('/client/orders');
          }
        }
      });

    return () => {
      axios.interceptors.request.eject(requestInterceptor);
      axios.interceptors.response.eject(responseInterceptor);
    };
  },[]);

  return <>{children}</>;
};

export default AuthProvider;