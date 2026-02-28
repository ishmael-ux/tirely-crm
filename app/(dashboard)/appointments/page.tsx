'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Topbar from '@/components/layout/Topbar';
import StatusBadge from '@/components/shared/StatusBadge';
import CustomerAvatar from '@/components/shared/CustomerAvatar';
import AppointmentModal from '@/components/appointments/AppointmentModal';
import { apiGet, apiDelete } from '@/lib/api';
import { today, addDays, fmtDate } from '@/lib/utils';
import { toast } from 'sonner';
import { ChevronLeft, ChevronRight, Pencil, Trash2 } from 'lucide-react';

interface Appointment {
  id: number; customer_id: number; customer_name: string; customer_phone?: string | null;
  vehicle_id?: number | null; year?: number | null; make?: string | null; model?: string | null; plate?: string | null;
  date: string; time: string; service: string; technician?: string | null; status: string; notes?: string | null;
}

export default function AppointmentsPage() {
  const qc = useQueryClient();
  const [date, setDate]         = useState(today());
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing]   = useState<Appointment | null>(null);

  const { data: appointments = [], isLoading } = useQuery<Appointment[]>({
    queryKey: ['appointments', date],
    queryFn: () => apiGet(`/api/appointments?date=${date}`),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiDelete(`/api/appointments/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['appointments'] }); toast.success('Appointment deleted'); },
    onError:   (e: Error) => toast.error(e.message),
  });

  function openEdit(a: Appointment) { setEditing(a); setModalOpen(true); }
  function openNew()                 { setEditing(null); setModalOpen(true); }
  function handleDelete(a: Appointment) {
    if (!window.confirm(`Delete appointment for ${a.customer_name}?`)) return;
    deleteMutation.mutate(a.id);
  }

  const isToday = date === today();

  return (
    <>
      <Topbar onAdd={openNew} addLabel="New Appointment" />
      <div className="p-6">
        {/* Date Nav */}
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => setDate(d => addDays(d, -1))} className="p-1.5 rounded-[7px] border border-border hover:border-text3 text-text2 hover:text-foreground transition-colors">
            <ChevronLeft size={15} />
          </button>
          <div className="flex items-center gap-2">
            <span className="font-medium text-[14px]">{fmtDate(date)}</span>
            {!isToday && (
              <button onClick={() => setDate(today())} className="text-[11px] text-brand border border-brand/30 rounded px-2 py-0.5 hover:bg-brand-light transition-colors">
                Today
              </button>
            )}
          </div>
          <button onClick={() => setDate(d => addDays(d, 1))} className="p-1.5 rounded-[7px] border border-border hover:border-text3 text-text2 hover:text-foreground transition-colors">
            <ChevronRight size={15} />
          </button>
        </div>

        <div className="bg-surface border border-border rounded-[var(--radius)] shadow-[var(--shadow)] overflow-hidden">
          {isLoading ? (
            <div className="py-16 text-center text-text3 text-[13px]">Loading…</div>
          ) : appointments.length === 0 ? (
            <div className="py-16 text-center">
              <div className="text-3xl mb-3">📅</div>
              <div className="font-semibold text-text2 mb-1">No appointments</div>
              <div className="text-text3 text-[12.5px]">Nothing scheduled for {fmtDate(date)}</div>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr>
                  {['Time','Customer','Vehicle','Service','Technician','Status',''].map(h => (
                    <th key={h} className="text-left px-3.5 py-2 font-mono text-[10px] tracking-wide uppercase text-text3 border-b border-border bg-background">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {appointments.map(a => (
                  <tr key={a.id} className="hover:bg-surface2 transition-colors">
                    <td className="px-3.5 py-2.5 border-b border-border font-mono text-[12px] text-text2">{a.time}</td>
                    <td className="px-3.5 py-2.5 border-b border-border">
                      <div className="flex items-center gap-2">
                        <CustomerAvatar name={a.customer_name} size="sm" />
                        <div>
                          <div className="font-medium text-[13px]">{a.customer_name}</div>
                          {a.customer_phone && <div className="text-[11px] text-text3">{a.customer_phone}</div>}
                        </div>
                      </div>
                    </td>
                    <td className="px-3.5 py-2.5 border-b border-border text-[13px] text-text2">
                      {a.make ? `${a.year} ${a.make} ${a.model}` : '—'}
                      {a.plate && <div className="text-[11px] font-mono text-text3">{a.plate}</div>}
                    </td>
                    <td className="px-3.5 py-2.5 border-b border-border text-[13px]">{a.service}</td>
                    <td className="px-3.5 py-2.5 border-b border-border text-[13px] text-text2">{a.technician || '—'}</td>
                    <td className="px-3.5 py-2.5 border-b border-border"><StatusBadge status={a.status} /></td>
                    <td className="px-3.5 py-2.5 border-b border-border">
                      <div className="flex items-center gap-1">
                        <button onClick={() => openEdit(a)} className="p-1.5 rounded text-text3 hover:text-brand hover:bg-surface2 transition-colors"><Pencil size={13} /></button>
                        <button onClick={() => handleDelete(a)} className="p-1.5 rounded text-text3 hover:text-brand hover:bg-brand-light transition-colors"><Trash2 size={13} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <AppointmentModal open={modalOpen} onClose={() => setModalOpen(false)} appointment={editing} />
    </>
  );
}
