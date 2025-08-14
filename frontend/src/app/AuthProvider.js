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
        }
      }else{
        console.log(pathname);
        
        if (pathname !== '/auth/reset-password') {
          router.push('/auth/login');
        }
      }
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    verifyUser()
      .then(res => {
        if (res) {
          dispatch(setEmail(res.email));
          dispatch(setRole(res.role));
          dispatch(setId(res.id));
          localStorage.setItem('role', res.role);
        }
      });
  },[]);

  return <>{children}</>;
};

export default AuthProvider;