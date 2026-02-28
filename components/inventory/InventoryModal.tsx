'use client';

import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { apiPost, apiPut } from '@/lib/api';
import { toast } from 'sonner';

interface InventoryRow {
  id: number; brand: string; model: string; size: string;
  type?: string | null; quantity?: number | null; min_stock?: number | null;
  cost_price?: number; sell_price?: number;
  location?: string | null; notes?: string | null;
}

interface Props {
  open: boolean;
  onClose: () => void;
  item?: InventoryRow | null;
}

const EMPTY = { brand: '', model: '', size: '', type: 'All-Season', quantity: '0', min_stock: '4', cost_price: '', sell_price: '', location: '', notes: '' };
const TYPES = ['All-Season','Summer','Winter','Performance','All-Terrain'];

export default function InventoryModal({ open, onClose, item }: Props) {
  const qc = useQueryClient();
  const [form, setForm] = useState(EMPTY);

  useEffect(() => {
    if (item) {
      setForm({
        brand:      item.brand,
        model:      item.model,
        size:       item.size,
        type:       item.type || 'All-Season',
        quantity:   String(item.quantity ?? 0),
        min_stock:  String(item.min_stock ?? 4),
        cost_price: String(item.cost_price ?? ''),
        sell_price: String(item.sell_price ?? ''),
        location:   item.location || '',
        notes:      item.notes || '',
      });
    } else {
      setForm(EMPTY);
    }
  }, [item, open]);

  const mutation = useMutation({
    mutationFn: () => {
      const body = {
        brand:      form.brand,
        model:      form.model,
        size:       form.size,
        type:       form.type,
        quantity:   parseInt(form.quantity) || 0,
        min_stock:  parseInt(form.min_stock) || 4,
        cost_price: parseFloat(form.cost_price) || 0,
        sell_price: parseFloat(form.sell_price) || 0,
        location:   form.location,
        notes:      form.notes,
      };
      return item ? apiPut(`/api/inventory/${item.id}`, body) : apiPost('/api/inventory', body);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['inventory'] });
      toast.success(item ? 'Item updated' : 'Item added');
      onClose();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-lg bg-surface border-border rounded-2xl">
        <DialogHeader>
          <DialogTitle className="font-serif text-[17px]">{item ? 'Edit Tire' : 'Add Tire'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={e => { e.preventDefault(); mutation.mutate(); }} className="space-y-3 mt-2">
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-text2 tracking-wide">Brand *</label>
              <input required value={form.brand} onChange={e => set('brand', e.target.value)} placeholder="Michelin" className="w-full border border-border rounded-[7px] px-3 py-2 text-[13px] bg-surface outline-none focus:border-brand transition-all" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-text2 tracking-wide">Model *</label>
              <input required value={form.model} onChange={e => set('model', e.target.value)} placeholder="Pilot Sport" className="w-full border border-border rounded-[7px] px-3 py-2 text-[13px] bg-surface outline-none focus:border-brand transition-all" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-text2 tracking-wide">Size *</label>
              <input required value={form.size} onChange={e => set('size', e.target.value)} placeholder="235/45R18" className="w-full border border-border rounded-[7px] px-3 py-2 text-[13px] bg-surface outline-none focus:border-brand transition-all" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-text2 tracking-wide">Type</label>
              <select value={form.type} onChange={e => set('type', e.target.value)} className="w-full border border-border rounded-[7px] px-3 py-2 text-[13px] bg-surface outline-none focus:border-brand transition-all">
                {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-text2 tracking-wide">Qty</label>
              <input type="number" min="0" value={form.quantity} onChange={e => set('quantity', e.target.value)} className="w-full border border-border rounded-[7px] px-3 py-2 text-[13px] bg-surface outline-none focus:border-brand transition-all" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-text2 tracking-wide">Min Stock</label>
              <input type="number" min="0" value={form.min_stock} onChange={e => set('min_stock', e.target.value)} className="w-full border border-border rounded-[7px] px-3 py-2 text-[13px] bg-surface outline-none focus:border-brand transition-all" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-text2 tracking-wide">Cost Price</label>
              <input type="number" step="0.01" value={form.cost_price} onChange={e => set('cost_price', e.target.value)} placeholder="0.00" className="w-full border border-border rounded-[7px] px-3 py-2 text-[13px] bg-surface outline-none focus:border-brand transition-all" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-text2 tracking-wide">Sell Price</label>
              <input type="number" step="0.01" value={form.sell_price} onChange={e => set('sell_price', e.target.value)} placeholder="0.00" className="w-full border border-border rounded-[7px] px-3 py-2 text-[13px] bg-surface outline-none focus:border-brand transition-all" />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-text2 tracking-wide">Location</label>
            <input value={form.location} onChange={e => set('location', e.target.value)} placeholder="Bay A" className="w-full border border-border rounded-[7px] px-3 py-2 text-[13px] bg-surface outline-none focus:border-brand transition-all" />
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-[7px] border border-border text-text2 text-[13px] hover:border-text3 transition-colors">Cancel</button>
            <button type="submit" disabled={mutation.isPending} className="px-4 py-2 rounded-[7px] bg-brand text-white text-[13px] font-medium hover:bg-[#b33f25] disabled:opacity-50 transition-colors">
              {mutation.isPending ? 'Saving…' : item ? 'Save Changes' : 'Add Tire'}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
