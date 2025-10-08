'use client'
import React, { useState, useEffect } from 'react';
import {
  Navbar,
  List,
  ListItem,
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

  console.log(pathname.startsWith('/offers'));

  return (
    <List className={`flex items-center ${isMobile ? 'flex-col' : 'flex-row'} w-full p-0`}>
      <Link href="/offers" onClick={handleClick} className=" font-bold">
        <ListItem className={`flex items-center gap-2 py-2 pr-4 font-medium`}>
          <DocumentTextIcon className="h-5 w-5 mr-2" />
          <span className={pathname.startsWith('/offers') ? 'text-red-600' : 'text-black'}>Offers</span>
        </ListItem>
      </Link>
      <Link href="/orders" onClick={handleClick} className=" font-bold">
        <ListItem className={`flex items-center gap-2 py-2 pr-4 font-medium ${pathname.startsWith('/orders') ? 'text-red-600' : 'text-black'}`}>
          <ArchiveBoxIcon className="h-5 w-5 mr-2" />
          <span>Orders</span>
        </ListItem>
      </Link>
      {(role === 'admin' || role === 'manager') && (
        <>
          <Link href="/yachts" onClick={handleClick} className=" font-bold">
            <ListItem className={`flex items-center gap-2 py-2 pr-4 font-medium ${pathname.startsWith('/yachts') ? 'text-red-600' : 'text-black'}`}>
              <Image src={yacht} alt="yacht" width={38} height={38} className="mr-2" />
              <span>Yachts</span>
            </ListItem>
          </Link>
          <Link href="/warehouse" onClick={handleClick} className=" font-bold">
            <ListItem className={`flex items-center gap-2 ${isMobile ? 'w-full justify-center' : 'pr-4'} font-medium ${pathname.startsWith('/warehouse') ? 'text-red-600' : 'text-black'}`}>
              <ArchiveBoxIcon className="h-5 w-5 mr-2" />
              <span>Warehouse</span>
            </ListItem>
          </Link>
          <Link href="/warehouseUnofficially" onClick={handleClick} className=" font-bold"> 
            <ListItem className={`flex items-center gap-2 py-2 pr-4 font-medium ${pathname.startsWith('/warehouseUnofficially') ? 'text-red-600' : 'text-black'}`}>
              <ArchiveBoxIcon className="h-5 w-5 mr-2" />
              <span>Internal warehouse</span>
            </ListItem>
          </Link>
          <Link href="/priceList" onClick={handleClick} className=" font-bold">
            <ListItem className={`flex items-center gap-2 py-2 pr-4 font-medium ${pathname.startsWith('/priceList') ? 'text-red-600' : 'text-black'}`}>
              <CurrencyDollarIcon className="h-5 w-5 mr-2" />
              <span>Price List</span>
            </ListItem>
          </Link>
          <Link href="/users" onClick={handleClick} className=" font-bold">
            <ListItem className={`flex items-center gap-2 py-2 pr-4 font-medium ${pathname.startsWith('/users') ? 'text-red-600' : 'text-black'}`}>
              <UserIcon className="h-5 w-5 mr-2" />
              <span>Users</span>
            </ListItem>
          </Link>
        </>
      )}
      <Link href="/auth/login" onClick={() => { clearLocalStorage(); handleClick(); }} className=" font-bold">
        <ListItem className={`flex items-center gap-2 py-2 pr-4 font-medium ${pathname.startsWith('/auth/login') ? 'text-red-600' : 'text-black'}`}>
          <LockClosedIcon className="h-5 w-5 mr-2" />
          <span>Logout</span>
        </ListItem>
      </Link>
    </List>
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