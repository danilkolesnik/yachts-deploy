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
  RectangleStackIcon,
  CalendarDaysIcon,
} from "@heroicons/react/24/solid";
import { useAppDispatch, useAppSelector } from '@/lib/hooks';
import { PermissionsList } from '@/constants/permissions';
import { can } from '@/utils/canPermission';
import { clearUserSession } from '@/lib/features/todos/usersDataSlice';
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
  const session = useAppSelector((s) => s.userData?.session);
  const rRole = useAppSelector((s) => s.userData?.role);
  const permissions = useAppSelector((s) => s.userData?.permissions || []);

  useEffect(() => {
    setRole(rRole || localStorage.getItem('role'));
  }, [rRole]);

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
    dispatch(clearUserSession());
  };

  if (session === null || role === null) {
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

  if (role === 'client') {
    const showClientPortal = can(permissions, PermissionsList.SELF_ORDERS_READ);
    return (
      <List className={`flex items-center ${isMobile ? 'flex-col' : 'flex-row'} w-full p-0`}>
        {showClientPortal && (
        <Link href="/client/orders" onClick={handleClick} className="font-bold">
          <ListItem className={`flex items-center gap-2 py-2 pr-4 font-medium text-black`}>
            <ArchiveBoxIcon className={`h-5 w-5 mr-2 ${pathname?.startsWith('/client/orders') ? 'text-[#dd3333]' : 'text-black'}`} />
            <span style={{ color: pathname?.startsWith('/client/orders') ? '#dd3333' : 'black' }}>My orders</span>
          </ListItem>
        </Link>
        )}
        <Link href="/login" onClick={() => { clearLocalStorage(); handleClick(); }} className=" font-bold">
          <ListItem className={`flex items-center gap-2 py-2 pr-4 font-medium text-black`}>
            <LockClosedIcon className={`h-5 w-5 mr-2 ${pathname === '/auth/login' || pathname === '/login' ? 'text-[#dd3333]' : 'text-black'}`} />
            <span>Logout</span>
          </ListItem>
        </Link>
      </List>
    );
  }

  const showOffers = can(permissions, PermissionsList.OFFERS_READ);
  const showOrders = can(permissions, PermissionsList.ORDERS_READ);
  const showCalendar = can(permissions, PermissionsList.CALENDAR_READ);
  const showArchive = can(permissions, PermissionsList.ARCHIVE_READ);
  const showStaffSection = can(permissions, PermissionsList.USERS_READ);

  return (
    <List className={`flex items-center ${isMobile ? 'flex-col' : 'flex-row'} w-full p-0 justify-end`}>
      {showOffers && (
      <Link href="/offers" onClick={handleClick} className="font-bold">
        <ListItem className={`flex items-center gap-2 py-2 pr-4 font-medium`}>
            <DocumentTextIcon className={`h-5 w-5 mr-2 text-black`} />
          <span
          style={{ color: pathname === '/offers' ? '#dd3333' : 'black' }}
          >Offers</span>
        </ListItem>
      </Link>
      )}
      {showOrders && (
      <Link href="/orders" onClick={handleClick} className=" font-bold">
        <ListItem className={`flex items-center gap-2 py-2 pr-4 font-medium text-black`}>
          <ArchiveBoxIcon className={`h-5 w-5 mr-2 ${pathname === '/orders' ? 'text-[#dd3333]' : 'text-black'}`} />
          <span
          style={{ color: pathname === '/orders' ? '#dd3333' : 'black' }}
          >Orders</span>
        </ListItem>
      </Link>
      )}
      {showCalendar && (
      <Link href="/calendar" onClick={handleClick} className="font-bold">
        <ListItem className={`flex items-center gap-2 py-2 pr-4 font-medium text-black`}>
          <CalendarDaysIcon className={`h-5 w-5 mr-2 ${pathname === '/calendar' ? 'text-[#dd3333]' : 'text-black'}`} />
          <span style={{ color: pathname === '/calendar' ? '#dd3333' : 'black' }}>Calendar</span>
        </ListItem>
      </Link>
      )}
      {showArchive && (
      <Link href="/archive" onClick={handleClick} className="font-bold">
        <ListItem className={`flex items-center gap-2 py-2 pr-4 font-medium text-black`}>
          <RectangleStackIcon className={`h-5 w-5 mr-2 ${pathname?.startsWith('/archive') ? 'text-[#dd3333]' : 'text-black'}`} />
          <span style={{ color: pathname?.startsWith('/archive') ? '#dd3333' : 'black' }}>Archive</span>
        </ListItem>
      </Link>
      )}
      {showStaffSection && (
        <>
          <Link href="/yachts" onClick={handleClick} className=" font-bold">
            <ListItem className={`flex items-center gap-2 py-2 pr-4 font-medium text-black`}>
              <Image src={yacht} alt="yacht" width={38} height={38} className={`mr-2 ${pathname === '/yachts' ? 'text-[#dd3333]' : 'text-black'}`} />
              <span
              style={{ color: pathname === '/yachts' ? '#dd3333' : 'black' }}
              >Yachts</span>
            </ListItem>
          </Link>
          <Link href="/warehouse" onClick={handleClick} className=" font-bold">
            <ListItem className={`flex items-center gap-2 ${isMobile ? 'w-full justify-center' : 'pr-4'} font-medium text-black`}>
              <ArchiveBoxIcon className={`h-5 w-5 mr-2 ${pathname === '/warehouse' ? 'text-[#dd3333]' : 'text-black'}`} />
              <span
              style={{ color: pathname === '/warehouse' ? '#dd3333' : 'black' }}
              >Warehouse</span>
            </ListItem>
          </Link>
          <Link href="/warehouseUnofficially" onClick={handleClick} className=" font-bold"> 
            <ListItem className={`flex items-center gap-2 py-2 pr-4 font-medium text-black`}>
              <ArchiveBoxIcon className={`h-5 w-5 mr-2 ${pathname === '/warehouseUnofficially' ? 'text-[#dd3333]' : 'text-black'}`} />
              <span
              style={{ color: pathname === '/warehouseUnofficially' ? '#dd3333' : 'black' }}
              >Internal warehouse</span>
            </ListItem>
          </Link>
          <Link href="/priceList" onClick={handleClick} className=" font-bold">
            <ListItem className={`flex items-center gap-2 py-2 pr-4 font-medium text-black`}>
              <CurrencyDollarIcon className={`h-5 w-5 mr-2 ${pathname === '/priceList' ? 'text-[#dd3333]' : 'text-black'}`} />
              <span
              style={{ color: pathname === '/priceList' ? '#dd3333' : 'black' }}
              >Price List</span>
            </ListItem>
          </Link>
          <Link href="/users" onClick={handleClick} className=" font-bold">
            <ListItem className={`flex items-center gap-2 py-2 pr-4 font-medium text-black`}>
              <UserIcon className={`h-5 w-5 mr-2 ${pathname === '/users' ? 'text-[#dd3333]' : 'text-black'}`} />
              <span
              style={{ color: pathname === '/users' ? '#dd3333' : 'black' }}
              >Users</span>
            </ListItem>
          </Link>
        </>
      )}
      <Link href="/login" onClick={() => { clearLocalStorage(); handleClick(); }} className=" font-bold">
        <ListItem className={`flex items-center gap-2 py-2 pr-4 font-medium text-black`}>
          <LockClosedIcon className={`h-5 w-5 mr-2 ${pathname === '/auth/login' || pathname === '/login' ? 'text-[#dd3333]' : 'text-black'}`} />
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
    <Navbar className="w-full max-w-none px-4 py-2 rounded-none bg-white shadow-sm">
      <div className="flex w-full items-center justify-between text-blue-gray-900 gap-4">
        <div className="shrink-0">
          <Image src={logo} alt="logo" width={120} height={80} priority />
        </div>

        <div className={`${isMobile ? 'hidden' : 'flex'} flex-1 justify-end`}>
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