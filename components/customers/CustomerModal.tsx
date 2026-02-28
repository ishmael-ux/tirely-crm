'use client';

import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { apiPost, apiPut } from '@/lib/api';
import { toast } from 'sonner';

interface Customer {
  id: number;
  name: string;
  phone?: string | null;
  email?: string | null;
  notes?: string | null;
}

interface Props {
  open: boolean;
  onClose: () => void;
  customer?: Customer | null;
}

const EMPTY = { name: '', phone: '', email: '', notes: '' };

export default function CustomerModal({ open, onClose, customer }: Props) {
  const qc = useQueryClient();
  const [form, setForm] = useState(EMPTY);

  useEffect(() => {
    if (customer) {
      setForm({
        name:  customer.name || '',
        phone: customer.phone || '',
        email: customer.email || '',
        notes: customer.notes || '',
      });
    } else {
      setForm(EMPTY);
    }
  }, [customer, open]);

  const mutation = useMutation({
    mutationFn: () =>
      customer
        ? apiPut(`/api/customers/${customer.id}`, form)
        : apiPost('/api/customers', form),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['customers'] });
      toast.success(customer ? 'Customer updated' : 'Customer created');
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
            {customer ? 'Edit Customer' : 'New Customer'}
          </DialogTitle>
        </DialogHeader>

        <form
          onSubmit={e => { e.preventDefault(); mutation.mutate(); }}
          className="space-y-4 mt-2"
        >
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-text2 tracking-wide">Name *</label>
            <input
              required
              value={form.name}
              onChange={e => set('name', e.target.value)}
              className="w-full border border-border rounded-[7px] px-3 py-2 text-[13px] bg-surface outline-none focus:border-brand transition-all"
              placeholder="Full name"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-text2 tracking-wide">Phone</label>
              <input
                value={form.phone}
                onChange={e => set('phone', e.target.value)}
                className="w-full border border-border rounded-[7px] px-3 py-2 text-[13px] bg-surface outline-none focus:border-brand transition-all"
                placeholder="(555) 555-0100"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-text2 tracking-wide">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={e => set('email', e.target.value)}
                className="w-full border border-border rounded-[7px] px-3 py-2 text-[13px] bg-surface outline-none focus:border-brand transition-all"
                placeholder="email@example.com"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-text2 tracking-wide">Notes</label>
            <textarea
              value={form.notes}
              onChange={e => set('notes', e.target.value)}
              rows={3}
              className="w-full border border-border rounded-[7px] px-3 py-2 text-[13px] bg-surface outline-none focus:border-brand transition-all resize-none"
              placeholder="Any notes…"
            />
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-[7px] border border-border text-text2 text-[13px] hover:border-text3 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={mutation.isPending}
              className="px-4 py-2 rounded-[7px] bg-brand text-white text-[13px] font-medium hover:bg-[#b33f25] disabled:opacity-50 transition-colors"
            >
              {mutation.isPending ? 'Saving…' : customer ? 'Save Changes' : 'Create Customer'}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
