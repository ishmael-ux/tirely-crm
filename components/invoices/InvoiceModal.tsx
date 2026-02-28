'use client';

import { useState, useEffect, useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { apiGet, apiPost } from '@/lib/api';
import { today, addDays } from '@/lib/utils';
import { toast } from 'sonner';
import { Plus, Trash2 } from 'lucide-react';

interface Customer { id: number; name: string }
interface Vehicle  { id: number; customer_id: number; year?: number | null; make?: string | null; model?: string | null }
interface LineItem  { description: string; quantity: number; cost_price: number; unit_price: number }

interface Props {
  open: boolean;
  onClose: () => void;
}

const BLANK_ITEM: LineItem = { description: '', quantity: 1, cost_price: 0, unit_price: 0 };

export default function InvoiceModal({ open, onClose }: Props) {
  const qc = useQueryClient();
  const [customerId, setCustomerId] = useState('');
  const [vehicleId,  setVehicleId]  = useState('');
  const [date,       setDate]       = useState(today());
  const [dueDate,    setDueDate]    = useState(addDays(today(), 14));
  const [notes,      setNotes]      = useState('');
  const [items,      setItems]      = useState<LineItem[]>([{ ...BLANK_ITEM }]);

  useEffect(() => {
    if (!open) {
      setCustomerId(''); setVehicleId(''); setDate(today());
      setDueDate(addDays(today(), 14)); setNotes('');
      setItems([{ ...BLANK_ITEM }]);
    }
  }, [open]);

  const { data: customers = [] } = useQuery<Customer[]>({
    queryKey: ['customers-simple'],
    queryFn: () => apiGet<{ id: number; name: string }[]>('/api/customers').then(d => d.map(c => ({ id: c.id, name: c.name }))),
  });

  const { data: allVehicles = [] } = useQuery<Vehicle[]>({
    queryKey: ['vehicles'],
    queryFn: () => apiGet('/api/vehicles'),
  });

  const vehicles = useMemo(
    () => allVehicles.filter(v => String(v.customer_id) === customerId),
    [allVehicles, customerId],
  );

  const subtotal = items.reduce((s, i) => s + i.quantity * i.unit_price, 0);
  const tax      = Math.round(subtotal * 0.07 * 100) / 100;
  const total    = subtotal + tax;

  const mutation = useMutation({
    mutationFn: () =>
      apiPost('/api/invoices', {
        customer_id: parseInt(customerId),
        vehicle_id:  vehicleId ? parseInt(vehicleId) : null,
        date, due_date: dueDate, notes, items,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['invoices'] });
      toast.success('Invoice created');
      onClose();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const updateItem = (i: number, k: keyof LineItem, v: string) => {
    setItems(prev => prev.map((it, idx) => idx === i ? { ...it, [k]: k === 'description' ? v : parseFloat(v) || 0 } : it));
  };

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-2xl bg-surface border-border rounded-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-serif text-[17px]">New Invoice</DialogTitle>
        </DialogHeader>

        <form onSubmit={e => { e.preventDefault(); mutation.mutate(); }} className="space-y-4 mt-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-text2 tracking-wide">Customer *</label>
              <select required value={customerId} onChange={e => { setCustomerId(e.target.value); setVehicleId(''); }}
                className="w-full border border-border rounded-[7px] px-3 py-2 text-[13px] bg-surface outline-none focus:border-brand transition-all">
                <option value="">Select customer…</option>
                {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-text2 tracking-wide">Vehicle</label>
              <select value={vehicleId} onChange={e => setVehicleId(e.target.value)}
                className="w-full border border-border rounded-[7px] px-3 py-2 text-[13px] bg-surface outline-none focus:border-brand transition-all">
                <option value="">No vehicle</option>
                {vehicles.map(v => <option key={v.id} value={v.id}>{v.year} {v.make} {v.model}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-text2 tracking-wide">Date</label>
              <input type="date" value={date} onChange={e => setDate(e.target.value)}
                className="w-full border border-border rounded-[7px] px-3 py-2 text-[13px] bg-surface outline-none focus:border-brand transition-all" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-text2 tracking-wide">Due Date</label>
              <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)}
                className="w-full border border-border rounded-[7px] px-3 py-2 text-[13px] bg-surface outline-none focus:border-brand transition-all" />
            </div>
          </div>

          {/* Line Items */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-[11px] font-semibold text-text2 tracking-wide">Line Items</label>
              <button type="button" onClick={() => setItems(p => [...p, { ...BLANK_ITEM }])}
                className="flex items-center gap-1 text-[12px] text-brand hover:underline">
                <Plus size={12} /> Add Item
              </button>
            </div>
            <div className="border border-border rounded-[7px] overflow-hidden">
              <table className="w-full text-[12px]">
                <thead>
                  <tr className="bg-background border-b border-border">
                    <th className="text-left px-3 py-2 font-mono text-[10px] tracking-wide text-text3 uppercase">Description</th>
                    <th className="text-left px-2 py-2 font-mono text-[10px] tracking-wide text-text3 uppercase w-14">Qty</th>
                    <th className="text-left px-2 py-2 font-mono text-[10px] tracking-wide text-text3 uppercase w-24">Cost</th>
                    <th className="text-left px-2 py-2 font-mono text-[10px] tracking-wide text-text3 uppercase w-24">Price</th>
                    <th className="text-right px-2 py-2 font-mono text-[10px] tracking-wide text-text3 uppercase w-20">Total</th>
                    <th className="w-8"></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((it, i) => (
                    <tr key={i} className="border-b border-border last:border-0">
                      <td className="px-2 py-1.5">
                        <input value={it.description} onChange={e => updateItem(i, 'description', e.target.value)} placeholder="Service description"
                          className="w-full border-0 bg-transparent outline-none text-[12px] text-foreground placeholder:text-text3" />
                      </td>
                      <td className="px-2 py-1.5">
                        <input type="number" min="1" step="1" value={it.quantity} onChange={e => updateItem(i, 'quantity', e.target.value)}
                          className="w-12 border border-border rounded px-1.5 py-1 text-[12px] bg-surface outline-none focus:border-brand" />
                      </td>
                      <td className="px-2 py-1.5">
                        <input type="number" step="0.01" min="0" value={it.cost_price || ''} onChange={e => updateItem(i, 'cost_price', e.target.value)} placeholder="0.00"
                          className="w-20 border border-border rounded px-1.5 py-1 text-[12px] bg-surface outline-none focus:border-brand" />
                      </td>
                      <td className="px-2 py-1.5">
                        <input type="number" step="0.01" min="0" value={it.unit_price || ''} onChange={e => updateItem(i, 'unit_price', e.target.value)} placeholder="0.00"
                          className="w-20 border border-border rounded px-1.5 py-1 text-[12px] bg-surface outline-none focus:border-brand" />
                      </td>
                      <td className="px-2 py-1.5 text-right font-medium">${(it.quantity * it.unit_price).toFixed(2)}</td>
                      <td className="px-1 py-1.5">
                        <button type="button" onClick={() => setItems(p => p.filter((_, idx) => idx !== i))} disabled={items.length === 1}
                          className="text-text3 hover:text-brand disabled:opacity-30 p-0.5">
                          <Trash2 size={13} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Totals */}
          <div className="flex justify-end">
            <div className="w-52 space-y-1 text-[13px]">
              <div className="flex justify-between text-text2"><span>Subtotal</span><span>${subtotal.toFixed(2)}</span></div>
              <div className="flex justify-between text-text2"><span>Tax (7%)</span><span>${tax.toFixed(2)}</span></div>
              <div className="flex justify-between font-semibold border-t border-border pt-1 mt-1"><span>Total</span><span>${total.toFixed(2)}</span></div>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-text2 tracking-wide">Notes</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2}
              className="w-full border border-border rounded-[7px] px-3 py-2 text-[13px] bg-surface outline-none focus:border-brand transition-all resize-none" />
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-[7px] border border-border text-text2 text-[13px] hover:border-text3 transition-colors">Cancel</button>
            <button type="submit" disabled={mutation.isPending || !customerId}
              className="px-4 py-2 rounded-[7px] bg-brand text-white text-[13px] font-medium hover:bg-[#b33f25] disabled:opacity-50 transition-colors">
              {mutation.isPending ? 'Creating…' : 'Create Invoice'}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
