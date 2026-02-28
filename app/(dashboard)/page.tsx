'use client';

import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Topbar from '@/components/layout/Topbar';
import StatusBadge from '@/components/shared/StatusBadge';
import CustomerAvatar from '@/components/shared/CustomerAvatar';
import { apiGet, getApiKey } from '@/lib/api';
import { fmtCurrency, fmtDate } from '@/lib/utils';
import { Calendar, Users, DollarSign, AlertTriangle, Package, TrendingUp } from 'lucide-react';

interface Stats {
  today_appointments: number;
  open_invoices: number;
  outstanding: number;
  total_customers: number;
  month_revenue: number;
  low_stock: number;
}

interface Appointment {
  id: number;
  customer_name: string;
  date: string;
  time: string;
  service: string;
  technician: string;
  status: string;
  year?: number;
  make?: string;
  model?: string;
}

interface Invoice {
  id: number;
  invoice_number: string;
  customer_name: string;
  date: string;
  total: number | string;
  status: string;
}

export default function DashboardPage() {
  const router = useRouter();

  useEffect(() => {
    if (typeof window !== 'undefined' && !getApiKey() && process.env.NODE_ENV === 'production') {
      router.push('/login');
    }
  }, [router]);

  const { data: stats } = useQuery<Stats>({
    queryKey: ['stats'],
    queryFn: () => apiGet('/api/stats'),
  });

  const today = new Date().toISOString().split('T')[0];
  const { data: appointments = [] } = useQuery<Appointment[]>({
    queryKey: ['appointments', today],
    queryFn: () => apiGet(`/api/appointments?date=${today}`),
  });

  const { data: invoices = [] } = useQuery<Invoice[]>({
    queryKey: ['invoices'],
    queryFn: () => apiGet('/api/invoices'),
  });

  const recentInvoices = invoices.slice(0, 5);

  const STAT_CARDS = [
    {
      label: "Today's Appointments",
      value: stats?.today_appointments ?? '—',
      icon: Calendar,
      color: 'text-status-blue',
      bg: 'bg-status-blue-light',
    },
    {
      label: 'Total Customers',
      value: stats?.total_customers ?? '—',
      icon: Users,
      color: 'text-status-green',
      bg: 'bg-status-green-light',
    },
    {
      label: 'Month Revenue',
      value: stats ? fmtCurrency(stats.month_revenue) : '—',
      icon: TrendingUp,
      color: 'text-status-green',
      bg: 'bg-status-green-light',
    },
    {
      label: 'Outstanding',
      value: stats ? fmtCurrency(stats.outstanding) : '—',
      icon: DollarSign,
      color: 'text-status-yellow',
      bg: 'bg-status-yellow-light',
    },
    {
      label: 'Open Invoices',
      value: stats?.open_invoices ?? '—',
      icon: AlertTriangle,
      color: 'text-brand',
      bg: 'bg-brand-light',
    },
    {
      label: 'Low Stock Items',
      value: stats?.low_stock ?? '—',
      icon: Package,
      color: 'text-status-yellow',
      bg: 'bg-status-yellow-light',
    },
  ];

  return (
    <>
      <Topbar />
      <div className="p-6 space-y-6">
        {/* Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {STAT_CARDS.map(({ label, value, icon: Icon, color, bg }) => (
            <div
              key={label}
              className="bg-surface border border-border rounded-[var(--radius)] p-4 shadow-[var(--shadow)]"
            >
              <div className="flex items-center justify-between mb-3">
                <div className={`w-8 h-8 rounded-lg ${bg} flex items-center justify-center`}>
                  <Icon size={15} className={color} />
                </div>
              </div>
              <div className="font-serif text-2xl tracking-tight leading-none mb-1">{value}</div>
              <div className="font-mono text-[10px] tracking-wide uppercase text-text3">{label}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* Today's Appointments */}
          <div className="bg-surface border border-border rounded-[var(--radius)] shadow-[var(--shadow)] overflow-hidden">
            <div className="px-5 py-3.5 border-b border-border flex items-center justify-between">
              <h2 className="font-semibold text-[14px]">Today&apos;s Schedule</h2>
              <span className="font-mono text-[11px] text-text3">{fmtDate(today)}</span>
            </div>
            {appointments.length === 0 ? (
              <div className="py-10 text-center text-text3 text-[13px]">No appointments today</div>
            ) : (
              <div className="divide-y divide-border">
                {appointments.map(appt => (
                  <div key={appt.id} className="px-5 py-3 flex items-center gap-3 hover:bg-surface2 transition-colors">
                    <span className="font-mono text-[11px] text-text3 w-11 flex-shrink-0">{appt.time}</span>
                    <CustomerAvatar name={appt.customer_name} size="sm" />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-[13px] truncate">{appt.customer_name}</div>
                      <div className="text-[11px] text-text2 truncate">{appt.service}</div>
                    </div>
                    <StatusBadge status={appt.status} />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Invoices */}
          <div className="bg-surface border border-border rounded-[var(--radius)] shadow-[var(--shadow)] overflow-hidden">
            <div className="px-5 py-3.5 border-b border-border flex items-center justify-between">
              <h2 className="font-semibold text-[14px]">Recent Invoices</h2>
              <button
                onClick={() => router.push('/invoices')}
                className="text-brand text-[12px] hover:underline"
              >
                View all
              </button>
            </div>
            {recentInvoices.length === 0 ? (
              <div className="py-10 text-center text-text3 text-[13px]">No invoices yet</div>
            ) : (
              <div className="divide-y divide-border">
                {recentInvoices.map(inv => (
                  <div key={inv.id} className="px-5 py-3 flex items-center gap-3 hover:bg-surface2 transition-colors">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-[13px]">{inv.invoice_number}</div>
                      <div className="text-[11px] text-text2 truncate">{inv.customer_name}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-[13px] font-medium">{fmtCurrency(inv.total)}</div>
                      <div className="text-[10px] text-text3">{fmtDate(inv.date)}</div>
                    </div>
                    <StatusBadge status={inv.status} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
