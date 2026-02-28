'use client';

import { useState, useEffect, useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { apiGet, apiPost, apiPut } from '@/lib/api';
import { today } from '@/lib/utils';
import { toast } from 'sonner';

interface Customer { id: number; name: string }
interface Vehicle  { id: number; customer_id: number; year?: number | null; make?: string | null; model?: string | null }
interface AppointmentRow {
  id: number; customer_id: number; vehicle_id?: number | null;
  date: string; time: string; service: string; technician?: string | null;
  status?: string | null; notes?: string | null;
}

interface Props {
  open: boolean;
  onClose: () => void;
  appointment?: AppointmentRow | null;
}

const EMPTY = {
  customer_id: '', vehicle_id: '', date: today(), time: '09:00',
  service: '', technician: '', status: 'scheduled', notes: '',
};

const TIMES = Array.from({ length: 22 }, (_, i) => {
  const h = Math.floor(i / 2) + 8;
  const m = i % 2 === 0 ? '00' : '30';
  return `${String(h).padStart(2,'0')}:${m}`;
});

const STATUS_OPTIONS = ['scheduled','in-bay','completed','cancelled'];

export default function AppointmentModal({ open, onClose, appointment }: Props) {
  const qc = useQueryClient();
  const [form, setForm] = useState(EMPTY);

  const { data: customers = [] } = useQuery<Customer[]>({
    queryKey: ['customers-simple'],
    queryFn: () => apiGet<{ id: number; name: string }[]>('/api/customers').then(d => d.map(c => ({ id: c.id, name: c.name }))),
  });

  const { data: allVehicles = [] } = useQuery<Vehicle[]>({
    queryKey: ['vehicles'],
    queryFn: () => apiGet('/api/vehicles'),
  });

  const vehicles = useMemo(
    () => allVehicles.filter(v => String(v.customer_id) === form.customer_id),
    [allVehicles, form.customer_id],
  );

  useEffect(() => {
    if (appointment) {
      setForm({
        customer_id: String(appointment.customer_id),
        vehicle_id:  appointment.vehicle_id ? String(appointment.vehicle_id) : '',
        date:        appointment.date,
        time:        appointment.time,
        service:     appointment.service,
        technician:  appointment.technician || '',
        status:      appointment.status || 'scheduled',
        notes:       appointment.notes || '',
      });
    } else {
      setForm(EMPTY);
    }
  }, [appointment, open]);

  const mutation = useMutation({
    mutationFn: () => {
      const body = {
        customer_id: parseInt(form.customer_id),
        vehicle_id:  form.vehicle_id ? parseInt(form.vehicle_id) : null,
        date: form.date, time: form.time, service: form.service,
        technician: form.technician, status: form.status, notes: form.notes,
      };
      return appointment
        ? apiPut(`/api/appointments/${appointment.id}`, body)
        : apiPost('/api/appointments', body);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['appointments'] });
      toast.success(appointment ? 'Appointment updated' : 'Appointment scheduled');
      onClose();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-md bg-surface border-border rounded-2xl">
        <DialogHeader>
          <DialogTitle className="font-serif text-[17px]">
            {appointment ? 'Edit Appointment' : 'New Appointment'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={e => { e.preventDefault(); mutation.mutate(); }} className="space-y-3 mt-2">
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-text2 tracking-wide">Customer *</label>
            <select required value={form.customer_id} onChange={e => { set('customer_id', e.target.value); set('vehicle_id', ''); }}
              className="w-full border border-border rounded-[7px] px-3 py-2 text-[13px] bg-surface outline-none focus:border-brand transition-all">
              <option value="">Select customer…</option>
              {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-text2 tracking-wide">Vehicle</label>
            <select value={form.vehicle_id} onChange={e => set('vehicle_id', e.target.value)}
              className="w-full border border-border rounded-[7px] px-3 py-2 text-[13px] bg-surface outline-none focus:border-brand transition-all">
              <option value="">No vehicle selected</option>
              {vehicles.map(v => <option key={v.id} value={v.id}>{v.year} {v.make} {v.model}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-text2 tracking-wide">Date *</label>
              <input type="date" required value={form.date} onChange={e => set('date', e.target.value)}
                className="w-full border border-border rounded-[7px] px-3 py-2 text-[13px] bg-surface outline-none focus:border-brand transition-all" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-text2 tracking-wide">Time *</label>
              <select required value={form.time} onChange={e => set('time', e.target.value)}
                className="w-full border border-border rounded-[7px] px-3 py-2 text-[13px] bg-surface outline-none focus:border-brand transition-all">
                {TIMES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-text2 tracking-wide">Service *</label>
            <input required value={form.service} onChange={e => set('service', e.target.value)} placeholder="e.g. Tire Rotation + Balance"
              className="w-full border border-border rounded-[7px] px-3 py-2 text-[13px] bg-surface outline-none focus:border-brand transition-all" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-text2 tracking-wide">Technician</label>
              <input value={form.technician} onChange={e => set('technician', e.target.value)} placeholder="Name"
                className="w-full border border-border rounded-[7px] px-3 py-2 text-[13px] bg-surface outline-none focus:border-brand transition-all" />
            </div>
            {appointment && (
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-text2 tracking-wide">Status</label>
                <select value={form.status} onChange={e => set('status', e.target.value)}
                  className="w-full border border-border rounded-[7px] px-3 py-2 text-[13px] bg-surface outline-none focus:border-brand transition-all capitalize">
                  {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-text2 tracking-wide">Notes</label>
            <textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={2}
              className="w-full border border-border rounded-[7px] px-3 py-2 text-[13px] bg-surface outline-none focus:border-brand transition-all resize-none" />
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-[7px] border border-border text-text2 text-[13px] hover:border-text3 transition-colors">Cancel</button>
            <button type="submit" disabled={mutation.isPending} className="px-4 py-2 rounded-[7px] bg-brand text-white text-[13px] font-medium hover:bg-[#b33f25] disabled:opacity-50 transition-colors">
              {mutation.isPending ? 'Saving…' : appointment ? 'Save Changes' : 'Schedule'}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
