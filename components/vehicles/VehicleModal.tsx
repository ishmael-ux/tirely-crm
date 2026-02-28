'use client';

import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { apiGet, apiPost, apiPut } from '@/lib/api';
import { toast } from 'sonner';

interface Customer { id: number; name: string }
interface Vehicle {
  id: number; customer_id: number; year?: number | null; make?: string | null;
  model?: string | null; trim?: string | null; color?: string | null;
  plate?: string | null; tire_size?: string | null; mileage?: number | null;
  vin?: string | null; notes?: string | null;
}

interface Props {
  open: boolean;
  onClose: () => void;
  vehicle?: Vehicle | null;
  preselectedCustomerId?: number;
}

const EMPTY = { customer_id: '', year: '', make: '', model: '', trim: '', color: '', plate: '', tire_size: '', mileage: '', vin: '', notes: '' };

export default function VehicleModal({ open, onClose, vehicle, preselectedCustomerId }: Props) {
  const qc = useQueryClient();
  const [form, setForm] = useState(EMPTY);

  const { data: customers = [] } = useQuery<Customer[]>({
    queryKey: ['customers-simple'],
    queryFn: () => apiGet('/api/customers'),
    select: (data: { id: number; name: string }[]) => data.map(c => ({ id: c.id, name: c.name })),
  });

  useEffect(() => {
    if (vehicle) {
      setForm({
        customer_id: String(vehicle.customer_id),
        year:        vehicle.year ? String(vehicle.year) : '',
        make:        vehicle.make || '',
        model:       vehicle.model || '',
        trim:        vehicle.trim || '',
        color:       vehicle.color || '',
        plate:       vehicle.plate || '',
        tire_size:   vehicle.tire_size || '',
        mileage:     vehicle.mileage ? String(vehicle.mileage) : '',
        vin:         vehicle.vin || '',
        notes:       vehicle.notes || '',
      });
    } else {
      setForm({ ...EMPTY, customer_id: preselectedCustomerId ? String(preselectedCustomerId) : '' });
    }
  }, [vehicle, preselectedCustomerId, open]);

  const mutation = useMutation({
    mutationFn: () => {
      const body = {
        customer_id: parseInt(form.customer_id),
        year:        form.year ? parseInt(form.year) : null,
        make:        form.make, model: form.model, trim: form.trim,
        color:       form.color, plate: form.plate, tire_size: form.tire_size,
        mileage:     form.mileage ? parseInt(form.mileage) : null,
        vin:         form.vin, notes: form.notes,
      };
      return vehicle
        ? apiPut(`/api/vehicles/${vehicle.id}`, body)
        : apiPost('/api/vehicles', body);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['vehicles'] });
      toast.success(vehicle ? 'Vehicle updated' : 'Vehicle added');
      onClose();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-lg bg-surface border-border rounded-2xl">
        <DialogHeader>
          <DialogTitle className="font-serif text-[17px]">
            {vehicle ? 'Edit Vehicle' : 'Add Vehicle'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={e => { e.preventDefault(); mutation.mutate(); }} className="space-y-3 mt-2">
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-text2 tracking-wide">Customer *</label>
            <select
              required
              value={form.customer_id}
              onChange={e => set('customer_id', e.target.value)}
              className="w-full border border-border rounded-[7px] px-3 py-2 text-[13px] bg-surface outline-none focus:border-brand transition-all"
            >
              <option value="">Select customer…</option>
              {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-text2 tracking-wide">Year</label>
              <input type="number" value={form.year} onChange={e => set('year', e.target.value)} placeholder="2022" className="w-full border border-border rounded-[7px] px-3 py-2 text-[13px] bg-surface outline-none focus:border-brand transition-all" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-text2 tracking-wide">Make</label>
              <input value={form.make} onChange={e => set('make', e.target.value)} placeholder="Toyota" className="w-full border border-border rounded-[7px] px-3 py-2 text-[13px] bg-surface outline-none focus:border-brand transition-all" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-text2 tracking-wide">Model</label>
              <input value={form.model} onChange={e => set('model', e.target.value)} placeholder="Camry" className="w-full border border-border rounded-[7px] px-3 py-2 text-[13px] bg-surface outline-none focus:border-brand transition-all" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-text2 tracking-wide">Trim</label>
              <input value={form.trim} onChange={e => set('trim', e.target.value)} placeholder="XSE V6" className="w-full border border-border rounded-[7px] px-3 py-2 text-[13px] bg-surface outline-none focus:border-brand transition-all" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-text2 tracking-wide">Color</label>
              <input value={form.color} onChange={e => set('color', e.target.value)} placeholder="White" className="w-full border border-border rounded-[7px] px-3 py-2 text-[13px] bg-surface outline-none focus:border-brand transition-all" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-text2 tracking-wide">Plate</label>
              <input value={form.plate} onChange={e => set('plate', e.target.value)} placeholder="ABC-1234" className="w-full border border-border rounded-[7px] px-3 py-2 text-[13px] bg-surface outline-none focus:border-brand transition-all" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-text2 tracking-wide">Tire Size</label>
              <input value={form.tire_size} onChange={e => set('tire_size', e.target.value)} placeholder="235/45R18" className="w-full border border-border rounded-[7px] px-3 py-2 text-[13px] bg-surface outline-none focus:border-brand transition-all" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-text2 tracking-wide">Mileage</label>
              <input type="number" value={form.mileage} onChange={e => set('mileage', e.target.value)} placeholder="45000" className="w-full border border-border rounded-[7px] px-3 py-2 text-[13px] bg-surface outline-none focus:border-brand transition-all" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-text2 tracking-wide">VIN</label>
              <input value={form.vin} onChange={e => set('vin', e.target.value)} placeholder="1HGCM826…" className="w-full border border-border rounded-[7px] px-3 py-2 text-[13px] bg-surface outline-none focus:border-brand transition-all" />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-[7px] border border-border text-text2 text-[13px] hover:border-text3 transition-colors">Cancel</button>
            <button type="submit" disabled={mutation.isPending} className="px-4 py-2 rounded-[7px] bg-brand text-white text-[13px] font-medium hover:bg-[#b33f25] disabled:opacity-50 transition-colors">
              {mutation.isPending ? 'Saving…' : vehicle ? 'Save Changes' : 'Add Vehicle'}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
