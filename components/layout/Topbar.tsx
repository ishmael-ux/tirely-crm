'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { Search, Plus } from 'lucide-react';

const PAGE_TITLES: Record<string, string> = {
  '/':             'Dashboard',
  '/appointments': 'Appointments',
  '/customers':    'Customers',
  '/vehicles':     'Vehicles',
  '/invoices':     'Invoices',
  '/sales':        'New Sale',
  '/inventory':    'Inventory',
  '/reminders':    'Reminders',
  '/reports':      'Reports',
};

interface TopbarProps {
  onSearch?: (q: string) => void;
  onAdd?: () => void;
  addLabel?: string;
}

export default function Topbar({ onSearch, onAdd, addLabel = 'Add' }: TopbarProps) {
  const path = usePathname();
  const [query, setQuery] = useState('');

  const basePath = '/' + path.split('/')[1];
  const title = PAGE_TITLES[basePath] ?? PAGE_TITLES[path] ?? 'TreadCRM';

  useEffect(() => {
    const t = setTimeout(() => onSearch?.(query), 200);
    return () => clearTimeout(t);
  }, [query, onSearch]);

  return (
    <header className="bg-surface border-b border-border px-6 h-[54px] flex items-center gap-3 sticky top-0 z-10">
      <h1 className="font-serif text-[18px] tracking-tight flex-1">{title}</h1>

      {onSearch && (
        <div className="flex items-center gap-2 bg-background border border-border rounded-[7px] px-3 py-1.5 w-52 focus-within:border-brand transition-colors">
          <Search size={13} className="text-text3 flex-shrink-0" />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search…"
            className="bg-transparent outline-none text-[13px] w-full text-foreground placeholder:text-text3 font-sans"
          />
        </div>
      )}

      {onAdd && (
        <button
          onClick={onAdd}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-brand text-white rounded-[7px] text-[13px] font-medium hover:bg-[#b33f25] transition-colors"
        >
          <Plus size={14} />
          {addLabel}
        </button>
      )}
    </header>
  );
}
