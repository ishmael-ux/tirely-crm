'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Topbar from '@/components/layout/Topbar';
import { apiGet } from '@/lib/api';
import { fmtCurrency, addDays, today } from '@/lib/utils';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
} from 'recharts';

type Tab = 'monthly' | 'daily' | 'services' | 'technicians';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function fmtMonth(m: string) {
  const [y, mo] = m.split('-');
  return `${MONTHS[parseInt(mo)-1]} '${y.slice(2)}`;
}

function fmtDay(d: string) {
  const days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  return days[new Date(d + 'T12:00:00').getDay()];
}

export default function ReportsPage() {
  const [tab, setTab] = useState<Tab>('monthly');
  const [weekStart, setWeekStart] = useState(() => {
    const t = today();
    const d = new Date(t + 'T12:00:00');
    return addDays(t, -d.getDay());
  });

  const { data: monthly = [] } = useQuery({
    queryKey: ['reports-monthly'],
    queryFn: () => apiGet<{ month: string; revenue: number; paid_count: number }[]>('/api/reports/monthly'),
    enabled: tab === 'monthly',
  });

  const { data: daily = [] } = useQuery({
    queryKey: ['reports-daily', weekStart],
    queryFn: () => apiGet<{ date: string; revenue: number; invoice_count: number }[]>(`/api/reports/daily?week=${weekStart}`),
    enabled: tab === 'daily',
  });

  const { data: services = [] } = useQuery({
    queryKey: ['reports-services'],
    queryFn: () => apiGet<{ description: string; count: number; revenue: number; profit: number; margin: number }[]>('/api/reports/services'),
    enabled: tab === 'services',
  });

  const { data: techs = [] } = useQuery({
    queryKey: ['reports-technicians'],
    queryFn: () => apiGet<{ technician: string; total: number; completed: number }[]>('/api/reports/technicians'),
    enabled: tab === 'technicians',
  });

  const TABS: { key: Tab; label: string }[] = [
    { key: 'monthly',     label: 'Monthly Revenue' },
    { key: 'daily',       label: 'Daily Revenue' },
    { key: 'services',    label: 'Services' },
    { key: 'technicians', label: 'Technicians' },
  ];

  return (
    <>
      <Topbar />
      <div className="p-6">
        <div className="flex gap-1 mb-6 border-b border-border">
          {TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`px-3 py-2 text-[12px] font-medium border-b-2 mb-[-1px] transition-all ${tab === t.key ? 'text-brand border-brand' : 'text-text3 border-transparent hover:text-text2'}`}>
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'monthly' && (
          <div className="bg-surface border border-border rounded-[var(--radius)] p-6 shadow-[var(--shadow)]">
            <h2 className="font-serif text-[16px] mb-6">Revenue — Last 12 Months</h2>
            {monthly.length === 0 ? (
              <div className="py-16 text-center text-text3 text-[13px]">No data yet</div>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={monthly.map(d => ({ ...d, month: fmtMonth(d.month) }))} barSize={24}>
                  <XAxis dataKey="month" tick={{ fontSize: 11, fontFamily: 'DM Mono', fill: '#A09A93' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fontFamily: 'DM Mono', fill: '#A09A93' }} axisLine={false} tickLine={false} tickFormatter={v => `$${(v/1000).toFixed(0)}k`} />
                  <Tooltip
                    formatter={(v: number | undefined) => [fmtCurrency(v ?? 0), 'Revenue']}
                    contentStyle={{ background: '#fff', border: '1px solid #E2DDD7', borderRadius: 8, fontSize: 12 }}
                  />
                  <Bar dataKey="revenue" fill="#C84B2F" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        )}

        {tab === 'daily' && (
          <div className="bg-surface border border-border rounded-[var(--radius)] p-6 shadow-[var(--shadow)]">
            <div className="flex items-center gap-3 mb-6">
              <button onClick={() => setWeekStart(w => addDays(w, -7))} className="p-1.5 rounded-[7px] border border-border hover:border-text3 text-text2 transition-colors"><ChevronLeft size={15} /></button>
              <h2 className="font-serif text-[16px]">Week of {new Date(weekStart + 'T12:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}</h2>
              <button onClick={() => setWeekStart(w => addDays(w, 7))} className="p-1.5 rounded-[7px] border border-border hover:border-text3 text-text2 transition-colors"><ChevronRight size={15} /></button>
            </div>
            {daily.length === 0 ? (
              <div className="py-16 text-center text-text3 text-[13px]">No data for this week</div>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={daily.map(d => ({ ...d, day: fmtDay(d.date) }))} barSize={28}>
                  <XAxis dataKey="day" tick={{ fontSize: 11, fontFamily: 'DM Mono', fill: '#A09A93' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fontFamily: 'DM Mono', fill: '#A09A93' }} axisLine={false} tickLine={false} tickFormatter={v => `$${v}`} />
                  <Tooltip formatter={(v: number | undefined) => [fmtCurrency(v ?? 0), 'Revenue']} contentStyle={{ background: '#fff', border: '1px solid #E2DDD7', borderRadius: 8, fontSize: 12 }} />
                  <Bar dataKey="revenue" fill="#C84B2F" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        )}

        {tab === 'services' && (
          <div className="bg-surface border border-border rounded-[var(--radius)] shadow-[var(--shadow)] overflow-hidden">
            <div className="px-5 py-4 border-b border-border">
              <h2 className="font-serif text-[16px]">Top Services (Paid Invoices)</h2>
            </div>
            {services.length === 0 ? (
              <div className="py-16 text-center text-text3 text-[13px]">No paid invoices yet</div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr>
                    {['Service','Count','Revenue','Profit','Margin'].map(h => (
                      <th key={h} className="text-left px-4 py-2.5 font-mono text-[10px] tracking-wide uppercase text-text3 border-b border-border bg-background">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {services.map(s => (
                    <tr key={s.description} className="hover:bg-surface2 transition-colors">
                      <td className="px-4 py-3 border-b border-border font-medium text-[13px]">{s.description}</td>
                      <td className="px-4 py-3 border-b border-border text-[13px] text-text2">{s.count}</td>
                      <td className="px-4 py-3 border-b border-border text-[13px]">{fmtCurrency(s.revenue)}</td>
                      <td className="px-4 py-3 border-b border-border text-[13px] text-status-green">{fmtCurrency(s.profit)}</td>
                      <td className="px-4 py-3 border-b border-border text-[13px]">
                        <span className={s.margin >= 30 ? 'text-status-green font-medium' : s.margin >= 15 ? 'text-status-yellow' : 'text-brand'}>{s.margin}%</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {tab === 'technicians' && (
          <div className="bg-surface border border-border rounded-[var(--radius)] shadow-[var(--shadow)] overflow-hidden">
            <div className="px-5 py-4 border-b border-border">
              <h2 className="font-serif text-[16px]">Technician Performance</h2>
            </div>
            {techs.length === 0 ? (
              <div className="py-16 text-center text-text3 text-[13px]">No appointments with technicians yet</div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr>
                    {['Technician','Total Jobs','Completed','Completion Rate'].map(h => (
                      <th key={h} className="text-left px-4 py-2.5 font-mono text-[10px] tracking-wide uppercase text-text3 border-b border-border bg-background">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {techs.map(t => {
                    const rate = t.total > 0 ? Math.round((t.completed / t.total) * 100) : 0;
                    return (
                      <tr key={t.technician} className="hover:bg-surface2 transition-colors">
                        <td className="px-4 py-3 border-b border-border font-medium text-[13px]">{t.technician}</td>
                        <td className="px-4 py-3 border-b border-border text-[13px] text-text2">{t.total}</td>
                        <td className="px-4 py-3 border-b border-border text-[13px] text-status-green">{t.completed}</td>
                        <td className="px-4 py-3 border-b border-border text-[13px]">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-surface2 rounded-full h-1.5 max-w-24">
                              <div className="bg-status-green h-1.5 rounded-full" style={{ width: `${rate}%` }} />
                            </div>
                            <span className="text-[12px] font-mono text-text2">{rate}%</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </>
  );
}
