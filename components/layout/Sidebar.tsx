'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard, Users, Calendar, Car, FileText,
  Package, Bell, BarChart2, ShoppingCart, Settings,
} from 'lucide-react';

const NAV_GROUPS = [
  {
    label: 'Operations',
    items: [
      { href: '/',             icon: LayoutDashboard, label: 'Dashboard' },
      { href: '/appointments', icon: Calendar,         label: 'Appointments' },
      { href: '/customers',    icon: Users,            label: 'Customers' },
      { href: '/vehicles',     icon: Car,              label: 'Vehicles' },
    ],
  },
  {
    label: 'Billing',
    items: [
      { href: '/sales',    icon: ShoppingCart, label: 'New Sale' },
      { href: '/invoices', icon: FileText,     label: 'Invoices' },
    ],
  },
  {
    label: 'Store',
    items: [
      { href: '/inventory', icon: Package, label: 'Inventory' },
      { href: '/reminders', icon: Bell,    label: 'Reminders' },
      { href: '/reports',   icon: BarChart2, label: 'Reports' },
    ],
  },
];

export default function Sidebar() {
  const path = usePathname();

  return (
    <aside className="w-56 min-h-screen bg-sidebar flex flex-col flex-shrink-0 fixed top-0 left-0 bottom-0 z-50">
      {/* Logo */}
      <div className="px-5 pt-6 pb-4 border-b border-sidebar-border">
        <div className="font-serif text-xl text-white tracking-tight leading-tight">TreadCRM</div>
        <div className="font-mono text-[9px] tracking-widest uppercase text-white/30 mt-0.5">
          Tire Shop Manager
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-3 overflow-y-auto">
        {NAV_GROUPS.map((group) => (
          <div key={group.label} className="mb-1">
            <div className="font-mono text-[9px] tracking-widest uppercase text-white/22 px-5 py-2 mt-2">
              {group.label}
            </div>
            {group.items.map(({ href, icon: Icon, label }) => {
              const active = href === '/' ? path === '/' : path.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    'flex items-center gap-2.5 mx-2 px-3 py-2 rounded-[7px] text-[13px] font-medium transition-all',
                    active
                      ? 'bg-brand text-white'
                      : 'text-white/65 hover:text-white hover:bg-white/8',
                  )}
                >
                  <Icon size={15} className="flex-shrink-0" />
                  {label}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-5 py-4 border-t border-sidebar-border">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-[7px] bg-brand flex items-center justify-content font-bold text-white text-xs flex-shrink-0 items-center justify-center">
            T
          </div>
          <div>
            <div className="text-white text-[12px] font-semibold">TreadCRM</div>
            <div className="text-white/40 text-[10px]">v2.0</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
