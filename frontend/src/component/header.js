'use client'
import React, { useState, useEffect } from 'react';
import {
  Navbar,
  List,
  IconButton,
  Collapse,
} from "@material-tailwind/react";
import {
  ArchiveBoxIcon,
  LockClosedIcon,
  CurrencyDollarIcon,
  DocumentTextIcon,
  UserIcon,
  Bars3Icon,
  XMarkIcon,
} from "@heroicons/react/24/solid";
import { useAppDispatch } from '@/lib/hooks';
import { setId } from '@/lib/features/todos/usersDataSlice';
import Link from 'next/link'
import { usePathname } from 'next/navigation';
import Loader from '@/ui/loader';
import Image from 'next/image';
import logo from '../../public/logo/logo.svg';
import yacht from '../../public/yacht.png';

function NavList({ isOpen, setIsOpen }) {
  const [role, setRole] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  const dispatch = useAppDispatch();
  const pathname = usePathname();

  useEffect(() => {
    const storedRole = localStorage.getItem('role');
    setRole(storedRole);
  }, []);

  useEffect(() => {
    const checkWidth = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    checkWidth();
    window.addEventListener('resize', checkWidth);

    return () => window.removeEventListener('resize', checkWidth);
  }, []);

  const clearLocalStorage = () => {
    localStorage.clear();
    dispatch(setId(''));
  };

  if (role === null) {
    return <Loader />;
  }

  const handleClick = () => {
    if (window.innerWidth <= 768) {
      setIsOpen(false);
    }
  };

  if (!role) {
    return null;
  }

  // Функция для проверки активного пути
  const isActivePath = (path) => {
    return pathname.startsWith(path);
  };

  const linkClass = (path) => 
    `flex items-center gap-2 py-2 pr-4 font-medium cursor-pointer hover:bg-gray-100 rounded ${
      isActivePath(path) ? 'text-red-600' : 'text-black'
    }`;

  return (
    <div className={`flex items-center ${isMobile ? 'flex-col' : 'flex-row'} w-full p-0`}>
      <Link href="/offers" onClick={handleClick} className="font-bold w-full">
        <div className={linkClass('/offers')}>
          <DocumentTextIcon className="h-5 w-5 mr-2" />
          <span>Offers</span>
        </div>
      </Link>
      <Link href="/orders" onClick={handleClick} className="font-bold w-full">
        <div className={linkClass('/orders')}>
          <ArchiveBoxIcon className="h-5 w-5 mr-2" />
          <span>Orders</span>
        </div>
      </Link>
      {(role === 'admin' || role === 'manager') && (
        <>
          <Link href="/yachts" onClick={handleClick} className="font-bold w-full">
            <div className={linkClass('/yachts')}>
              <Image src={yacht} alt="yacht" width={20} height={20} className="mr-2" />
              <span>Yachts</span>
            </div>
          </Link>
          <Link href="/warehouse" onClick={handleClick} className="font-bold w-full">
            <div className={linkClass('/warehouse')}>
              <ArchiveBoxIcon className="h-5 w-5 mr-2" />
              <span>Warehouse</span>
            </div>
          </Link>
          <Link href="/warehouseUnofficially" onClick={handleClick} className="font-bold w-full"> 
            <div className={linkClass('/warehouseUnofficially')}>
              <ArchiveBoxIcon className="h-5 w-5 mr-2" />
              <span>Internal warehouse</span>
            </div>
          </Link>
          <Link href="/priceList" onClick={handleClick} className="font-bold w-full">
            <div className={linkClass('/priceList')}>
              <CurrencyDollarIcon className="h-5 w-5 mr-2" />
              <span>Price List</span>
            </div>
          </Link>
          <Link href="/users" onClick={handleClick} className="font-bold w-full">
            <div className={linkClass('/users')}>
              <UserIcon className="h-5 w-5 mr-2" />
              <span>Users</span>
            </div>
          </Link>
        </>
      )}
      <Link href="/auth/login" onClick={() => { clearLocalStorage(); handleClick(); }} className="font-bold w-full">
        <div className={linkClass('/auth/login')}>
          <LockClosedIcon className="h-5 w-5 mr-2" />
          <span>Logout</span>
        </div>
      </Link>
    </div>
  );
}

const Header = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkWidth = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    checkWidth();
    window.addEventListener('resize', checkWidth);

    return () => window.removeEventListener('resize', checkWidth);
  }, []);

  return (
    <Navbar className="mx-auto max-w-screen-xl px-4 py-2 rounded-none bg-white">
      <div className="flex items-center justify-between text-blue-gray-900 relative">
        <div className="absolute left-[10px] top-[10px]">
          <Image src={logo} alt="logo" width={120} height={80} />
        </div>
        
        <div className="flex-grow"></div>
        <div className={isMobile ? 'hidden' : 'block'}>
          <NavList isOpen={isOpen} setIsOpen={setIsOpen} />
        </div>
        <div className={isMobile ? 'block' : 'hidden'}>
          <IconButton
            variant="text"
            color="black"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? (
              <XMarkIcon className="h-6 w-6" />
            ) : (
              <Bars3Icon className="h-6 w-6" />
            )}
          </IconButton>
        </div>
      </div>
      <Collapse open={isOpen}>
        <NavList isOpen={isOpen} setIsOpen={setIsOpen} />
      </Collapse>
    </Navbar>
  );
};

export default Header;