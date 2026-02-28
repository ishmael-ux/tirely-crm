'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Topbar from '@/components/layout/Topbar';
import StatusBadge from '@/components/shared/StatusBadge';
import { apiGet, apiPost } from '@/lib/api';
import { fmtDate } from '@/lib/utils';
import { toast } from 'sonner';
import { Send } from 'lucide-react';

interface UpcomingAppt {
  id: number; customer_id: number; customer_name: string; phone: string;
  service: string; date: string; time: string;
  year?: number | null; make?: string | null; model?: string | null;
}

interface ReminderRow {
  id: number; customer_name?: string; phone: string; message: string;
  status: string; sent_at?: string | null; created_at: string;
  service?: string | null; appt_date?: string | null;
}

function defaultMsg(appt: UpcomingAppt): string {
  const vehicle = appt.make ? ` for your ${appt.year} ${appt.make} ${appt.model}` : '';
  return `Hi ${appt.customer_name}, reminder: ${appt.service}${vehicle} tomorrow at ${appt.time}. — TreadCRM`;
}

export default function RemindersPage() {
  const qc = useQueryClient();
  const [tab, setTab] = useState<'upcoming' | 'sent'>('upcoming');
  const [messages, setMessages] = useState<Record<number, string>>({});

  const { data: upcoming = [], isLoading: loadingUpcoming } = useQuery<UpcomingAppt[]>({
    queryKey: ['reminders-upcoming'],
    queryFn:  () => apiGet('/api/reminders/upcoming'),
    enabled:  tab === 'upcoming',
  });

  const { data: sent = [], isLoading: loadingSent } = useQuery<ReminderRow[]>({
    queryKey: ['reminders'],
    queryFn:  () => apiGet('/api/reminders'),
    enabled:  tab === 'sent',
  });

  const sendMutation = useMutation({
    mutationFn: (appt: UpcomingAppt) =>
      apiPost('/api/reminders/send', {
        customer_id:    appt.customer_id,
        appointment_id: appt.id,
        phone:          appt.phone,
        message:        messages[appt.id] ?? defaultMsg(appt),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['reminders-upcoming'] });
      qc.invalidateQueries({ queryKey: ['reminders'] });
      toast.success('Reminder sent');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const sendAllMutation = useMutation({
    mutationFn: () =>
      apiPost('/api/reminders/send-bulk', {
        appointments: upcoming.map(a => ({
          customer_id:    a.customer_id,
          appointment_id: a.id,
          phone:          a.phone,
          message:        messages[a.id] ?? defaultMsg(a),
        })),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['reminders-upcoming'] });
      qc.invalidateQueries({ queryKey: ['reminders'] });
      toast.success(`Sent ${upcoming.length} reminders`);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <>
      <Topbar />
      <div className="p-6">
        {/* Tabs */}
        <div className="flex gap-1 mb-4 border-b border-border">
          {(['upcoming','sent'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-3 py-2 text-[12px] font-medium capitalize border-b-2 mb-[-1px] transition-all ${tab === t ? 'text-brand border-brand' : 'text-text3 border-transparent hover:text-text2'}`}>
              {t === 'upcoming' ? 'Upcoming (Tomorrow)' : 'Sent History'}
            </button>
          ))}
        </div>

        {tab === 'upcoming' && (
          <div className="space-y-3">
            {upcoming.length > 0 && (
              <div className="flex justify-end">
                <button
                  onClick={() => sendAllMutation.mutate()}
                  disabled={sendAllMutation.isPending}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-brand text-white rounded-[7px] text-[13px] font-medium hover:bg-[#b33f25] disabled:opacity-50 transition-colors"
                >
                  <Send size={13} /> Send All ({upcoming.length})
                </button>
              </div>
            )}

            {loadingUpcoming ? (
              <div className="py-16 text-center text-text3 text-[13px]">Loading…</div>
            ) : upcoming.length === 0 ? (
              <div className="py-16 text-center">
                <div className="text-3xl mb-3">✅</div>
                <div className="font-semibold text-text2 mb-1">All clear!</div>
                <div className="text-text3 text-[12.5px]">No unsent reminders for tomorrow</div>
              </div>
            ) : (
              upcoming.map(appt => (
                <div key={appt.id} className="bg-surface border border-border rounded-[var(--radius)] p-4 shadow-[var(--shadow)]">
                  <div className="flex items-start gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-[14px]">{appt.customer_name}</span>
                        <span className="text-text3 text-[12px]">{appt.phone}</span>
                      </div>
                      <div className="text-[12px] text-text2 mb-2">{appt.service} — {appt.time} {fmtDate(appt.date)}</div>
                      <textarea
                        value={messages[appt.id] ?? defaultMsg(appt)}
                        onChange={e => setMessages(m => ({ ...m, [appt.id]: e.target.value }))}
                        rows={2}
                        className="w-full border border-border rounded-[7px] px-3 py-2 text-[12px] bg-surface2 outline-none focus:border-brand transition-all resize-none"
                      />
                    </div>
                    <button
                      onClick={() => sendMutation.mutate(appt)}
                      disabled={sendMutation.isPending}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-status-blue-light text-status-blue rounded-[7px] text-[12px] font-medium hover:bg-status-blue hover:text-white disabled:opacity-50 transition-all flex-shrink-0"
                    >
                      <Send size={12} /> Send
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {tab === 'sent' && (
          <div className="bg-surface border border-border rounded-[var(--radius)] shadow-[var(--shadow)] overflow-hidden">
            {loadingSent ? (
              <div className="py-16 text-center text-text3 text-[13px]">Loading…</div>
            ) : sent.length === 0 ? (
              <div className="py-16 text-center text-text3 text-[13px]">No reminders sent yet</div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr>
                    {['Customer','Phone','Message','Status','Sent'].map(h => (
                      <th key={h} className="text-left px-3.5 py-2 font-mono text-[10px] tracking-wide uppercase text-text3 border-b border-border bg-background">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sent.map(r => (
                    <tr key={r.id} className="hover:bg-surface2 transition-colors">
                      <td className="px-3.5 py-2.5 border-b border-border font-medium text-[13px]">{r.customer_name || '—'}</td>
                      <td className="px-3.5 py-2.5 border-b border-border font-mono text-[12px]">{r.phone}</td>
                      <td className="px-3.5 py-2.5 border-b border-border text-[12px] text-text2 max-w-xs truncate">{r.message}</td>
                      <td className="px-3.5 py-2.5 border-b border-border"><StatusBadge status={r.status} /></td>
                      <td className="px-3.5 py-2.5 border-b border-border text-[12px] text-text2">{r.sent_at ? fmtDate(r.sent_at.split('T')[0]) : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </>
  );
}
