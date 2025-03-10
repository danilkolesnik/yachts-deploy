'use client'
import React, { useState, useEffect } from 'react';
import {
  Navbar,
  List,
  ListItem,
} from "@material-tailwind/react";
import {
  ArchiveBoxIcon,
  LockClosedIcon,
  CurrencyDollarIcon,
  DocumentTextIcon,
  UserIcon
} from "@heroicons/react/24/solid";
import Link from 'next/link'
import Loader from '@/ui/loader';

function NavList() {
  const [role, setRole] = useState(null);

  useEffect(() => {
    const storedRole = localStorage.getItem('role');
    setRole(storedRole);
  }, []);

  const clearLocalStorage = () => {
    localStorage.clear();
  };

  if (role === null) {
    return <Loader />;
  }

  return (
    <List className="flex flex-row p-0">
      <Link href="/orders">
        <ListItem className="flex items-center gap-2 py-2 pr-4 font-medium text-black">
          <ArchiveBoxIcon className="h-5 w-5 mr-2" />
          <span>Orders</span>
        </ListItem>
      </Link>
      <Link href="/offers">
        <ListItem className="flex items-center gap-2 py-2 pr-4 font-medium text-black">
          <DocumentTextIcon className="h-5 w-5 mr-2" />
          <span>Offers</span>
        </ListItem>
      </Link>
      {(role === 'admin' || role === 'manager') && (
        <>
          <Link href="/warehouse">
            <ListItem className="flex items-center gap-2 py-2 pr-4 font-medium text-black">
              <ArchiveBoxIcon className="h-5 w-5 mr-2" />
              <span>Warehouse</span>
            </ListItem>
          </Link>
          <Link href="/priceList">
            <ListItem className="flex items-center gap-2 py-2 pr-4 font-medium text-black">
              <CurrencyDollarIcon className="h-5 w-5 mr-2" />
              <span>Price List</span>
            </ListItem>
          </Link>
          <Link href="/users">
            <ListItem className="flex items-center gap-2 py-2 pr-4 font-medium text-black">
              <UserIcon className="h-5 w-5 mr-2" />
              <span>Users</span>
            </ListItem>
          </Link>
        </>
      )}
      <Link href="/auth/login" onClick={clearLocalStorage}>
        <ListItem className="flex items-center gap-2 py-2 pr-4 font-medium text-black">
          <LockClosedIcon className="h-5 w-5 mr-2" />
          <span>Auth</span>
        </ListItem>
      </Link>
    </List>
  );
}

const Header = () => {
  return (
    <Navbar className="mx-auto max-w-screen-xl px-4 py-2 rounded-none bg-white">
      <div className="flex items-center justify-between text-blue-gray-900">
        <div className="flex-grow"></div>
        <NavList />
      </div>
    </Navbar>
  );
};

export default Header;