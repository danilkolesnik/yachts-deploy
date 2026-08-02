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
  ArrowRightOnRectangleIcon,
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
import { BRAND } from '@/constants/brand';
import BrandLogo from '@/component/BrandLogo';
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation';
import Loader from '@/ui/loader';
import Image from 'next/image';
import yacht from '../../public/yacht.png';

const ACCENT = BRAND.colors.red;
const INK = BRAND.colors.ink;

function NavItem({ href, active, icon, label, onClick, isMobile }) {
  const color = active ? ACCENT : INK;
  return (
    <Link href={href} onClick={onClick} className="font-semibold no-underline">
      <ListItem
        className={`flex items-center gap-2 py-2 ${isMobile ? 'w-full justify-center' : 'pr-3'} font-medium rounded-lg hover:bg-slate-50`}
      >
        {icon}
        <span style={{ color }}>{label}</span>
      </ListItem>
    </Link>
  );
}

function NavList({ isOpen, setIsOpen }) {
  const [role, setRole] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  const dispatch = useAppDispatch();
  const router = useRouter();
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

  const handleClick = () => {
    if (window.innerWidth <= 768) {
      setIsOpen(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    dispatch(clearUserSession());
    handleClick();
    router.replace('/auth/login');
  };

  if (session === null) {
    return <Loader size={28} fullScreen={false} />;
  }
  if (session === false) {
    return null;
  }
  if (role === null) {
    return <Loader size={28} fullScreen={false} />;
  }
  if (!role) {
    return null;
  }

  if (role === 'client') {
    const showClientPortal = can(permissions, PermissionsList.SELF_ORDERS_READ);
    return (
      <List className={`flex items-center ${isMobile ? 'flex-col' : 'flex-row'} w-full p-0 gap-0.5`}>
        {showClientPortal && (
          <NavItem
            href="/client/orders"
            active={pathname?.startsWith('/client/orders')}
            onClick={handleClick}
            isMobile={isMobile}
            icon={
              <ArchiveBoxIcon
                className="h-5 w-5 mr-1"
                style={{ color: pathname?.startsWith('/client/orders') ? ACCENT : INK }}
              />
            }
            label="My orders"
          />
        )}
        <ListItem
          onClick={handleLogout}
          className="flex items-center gap-2 py-2 pr-3 font-semibold cursor-pointer rounded-lg hover:bg-red-50"
        >
          <ArrowRightOnRectangleIcon className="h-5 w-5 mr-1" style={{ color: ACCENT }} />
          <span style={{ color: ACCENT }}>Logout</span>
        </ListItem>
      </List>
    );
  }

  const showOffers = can(permissions, PermissionsList.OFFERS_READ);
  const showOrders = can(permissions, PermissionsList.ORDERS_READ);
  const showCalendar = can(permissions, PermissionsList.CALENDAR_READ);
  const showArchive =
    can(permissions, PermissionsList.ARCHIVE_READ) ||
    can(permissions, PermissionsList.OFFERS_READ) ||
    can(permissions, PermissionsList.ORDERS_READ);
  const showStaffSection = can(permissions, PermissionsList.USERS_READ);

  return (
    <List className={`flex items-center ${isMobile ? 'flex-col' : 'flex-row'} w-full p-0 justify-end gap-0.5`}>
      {showOffers && (
        <NavItem
          href="/offers"
          active={pathname === '/offers'}
          onClick={handleClick}
          isMobile={isMobile}
          icon={<DocumentTextIcon className="h-5 w-5 mr-1" style={{ color: pathname === '/offers' ? ACCENT : INK }} />}
          label="Offers"
        />
      )}
      {showOrders && (
        <NavItem
          href="/orders"
          active={pathname === '/orders'}
          onClick={handleClick}
          isMobile={isMobile}
          icon={<ArchiveBoxIcon className="h-5 w-5 mr-1" style={{ color: pathname === '/orders' ? ACCENT : INK }} />}
          label="Orders"
        />
      )}
      {showCalendar && (
        <NavItem
          href="/calendar"
          active={pathname === '/calendar'}
          onClick={handleClick}
          isMobile={isMobile}
          icon={<CalendarDaysIcon className="h-5 w-5 mr-1" style={{ color: pathname === '/calendar' ? ACCENT : INK }} />}
          label="Calendar"
        />
      )}
      {showArchive && (
        <NavItem
          href="/archive"
          active={pathname?.startsWith('/archive')}
          onClick={handleClick}
          isMobile={isMobile}
          icon={
            <RectangleStackIcon
              className="h-5 w-5 mr-1"
              style={{ color: pathname?.startsWith('/archive') ? ACCENT : INK }}
            />
          }
          label="Archive"
        />
      )}
      {showStaffSection && (
        <>
          <NavItem
            href="/yachts"
            active={pathname === '/yachts'}
            onClick={handleClick}
            isMobile={isMobile}
            icon={
              <Image
                src={yacht}
                alt=""
                width={22}
                height={22}
                className="mr-1"
              />
            }
            label="Yachts"
          />
          <NavItem
            href="/warehouse"
            active={pathname === '/warehouse'}
            onClick={handleClick}
            isMobile={isMobile}
            icon={<ArchiveBoxIcon className="h-5 w-5 mr-1" style={{ color: pathname === '/warehouse' ? ACCENT : INK }} />}
            label="Warehouse"
          />
          <NavItem
            href="/warehouseUnofficially"
            active={pathname === '/warehouseUnofficially'}
            onClick={handleClick}
            isMobile={isMobile}
            icon={
              <ArchiveBoxIcon
                className="h-5 w-5 mr-1"
                style={{ color: pathname === '/warehouseUnofficially' ? ACCENT : INK }}
              />
            }
            label="Internal warehouse"
          />
          <NavItem
            href="/priceList"
            active={pathname === '/priceList'}
            onClick={handleClick}
            isMobile={isMobile}
            icon={<CurrencyDollarIcon className="h-5 w-5 mr-1" style={{ color: pathname === '/priceList' ? ACCENT : INK }} />}
            label="Price List"
          />
          <NavItem
            href="/users"
            active={pathname === '/users'}
            onClick={handleClick}
            isMobile={isMobile}
            icon={<UserIcon className="h-5 w-5 mr-1" style={{ color: pathname === '/users' ? ACCENT : INK }} />}
            label="Users"
          />
        </>
      )}
      <ListItem
        onClick={handleLogout}
        className="flex items-center gap-2 py-2 pr-3 font-semibold cursor-pointer rounded-lg hover:bg-red-50"
      >
        <ArrowRightOnRectangleIcon className="h-5 w-5 mr-1" style={{ color: ACCENT }} />
        <span style={{ color: ACCENT }}>Logout</span>
      </ListItem>
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
    <Navbar className="app-header w-full max-w-none px-4 py-2.5 rounded-none bg-white border-0 border-b border-slate-200/90 shadow-none">
      <div className="flex w-full items-center justify-between gap-4">
        <div className="shrink-0 min-w-0">
          <BrandLogo
            variant={isMobile ? 'compact' : 'header'}
            caption={isMobile ? null : BRAND.websiteLabel}
            href={BRAND.websiteUrl}
          />
        </div>

        <div className={`${isMobile ? 'hidden' : 'flex'} flex-1 justify-end min-w-0`}>
          <NavList isOpen={isOpen} setIsOpen={setIsOpen} />
        </div>
        <div className={isMobile ? 'block' : 'hidden'}>
          <IconButton
            variant="text"
            color="blue-gray"
            onClick={() => setIsOpen(!isOpen)}
            aria-label={isOpen ? 'Close menu' : 'Open menu'}
          >
            {isOpen ? (
              <XMarkIcon className="h-6 w-6" style={{ color: BRAND.colors.navy }} />
            ) : (
              <Bars3Icon className="h-6 w-6" style={{ color: BRAND.colors.navy }} />
            )}
          </IconButton>
        </div>
      </div>
      <Collapse open={isOpen}>
        <div className="pt-2 pb-1 border-t border-slate-100 mt-2">
          <NavList isOpen={isOpen} setIsOpen={setIsOpen} />
        </div>
      </Collapse>
    </Navbar>
  );
};

export default Header;
