'use client';

import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Topbar from '@/components/layout/Topbar';
import CustomerAvatar from '@/components/shared/CustomerAvatar';
import { apiGet, apiPost } from '@/lib/api';
import { fmtCurrency, today, addDays } from '@/lib/utils';
import { toast } from 'sonner';
import { CheckCircle, Plus, Trash2 } from 'lucide-react';

interface Customer { id: number; name: string; phone?: string | null; email?: string | null }
interface Vehicle  { id: number; customer_id: number; year?: number | null; make?: string | null; model?: string | null; tire_size?: string | null; plate?: string | null }
interface LineItem  { description: string; quantity: number; cost_price: number; unit_price: number }

const QUICK_SERVICES: LineItem[] = [
  { description: 'Tire Rotation',           quantity: 1, cost_price: 15,  unit_price: 49.99  },
  { description: 'Mount & Balance',         quantity: 4, cost_price: 3,   unit_price: 8.14   },
  { description: 'Alignment Check',         quantity: 1, cost_price: 30,  unit_price: 89.99  },
  { description: 'TPMS Sensor Repair',      quantity: 1, cost_price: 20,  unit_price: 75     },
  { description: 'Flat Repair',             quantity: 1, cost_price: 8,   unit_price: 25     },
];

const STEPS = ['Customer','Vehicle','Estimate','Invoice','Done'];

export default function SalesPage() {
  const qc = useQueryClient();
  const [step, setStep] = useState(0);

  const [customer, setCustomer]     = useState<Customer | null>(null);
  const [vehicle,  setVehicle]      = useState<Vehicle  | null>(null);
  const [items,    setItems]        = useState<LineItem[]>([{ description: '', quantity: 1, cost_price: 0, unit_price: 0 }]);
  const [notes,    setNotes]        = useState('');
  const [date,     setDate]         = useState(today());
  const [dueDate,  setDueDate]      = useState(addDays(today(), 14));
  const [result,   setResult]       = useState<{ id: number; invoice_number: string; total: number } | null>(null);
  const [custSearch, setCustSearch] = useState('');

  const { data: customers = [] } = useQuery<Customer[]>({
    queryKey: ['customers-simple'],
    queryFn: () => apiGet<{ id: number; name: string; phone?: string | null; email?: string | null }[]>('/api/customers').then(d => d.map(c => ({ id: c.id, name: c.name, phone: c.phone, email: c.email }))),
  });

  const { data: allVehicles = [] } = useQuery<Vehicle[]>({
    queryKey: ['vehicles'],
    queryFn: () => apiGet('/api/vehicles'),
  });

  const custVehicles = useMemo(
    () => allVehicles.filter(v => v.customer_id === customer?.id),
    [allVehicles, customer],
  );

  const filteredCustomers = useMemo(() =>
    !custSearch ? customers :
    customers.filter(c => [c.name, c.phone, c.email].some(f => f?.toLowerCase().includes(custSearch.toLowerCase()))),
  [customers, custSearch]);

  const subtotal    = items.reduce((s, i) => s + i.quantity * i.unit_price, 0);
  const total_cost  = items.reduce((s, i) => s + i.quantity * i.cost_price, 0);
  const tax         = Math.round(subtotal * 0.07 * 100) / 100;
  const total       = subtotal + tax;
  const profit      = subtotal - total_cost;
  const margin      = subtotal > 0 ? Math.round((profit / subtotal) * 100) : 0;

  const invoiceMutation = useMutation({
    mutationFn: () =>
      apiPost<{ id: number; invoice_number: string; total: number }>('/api/invoices', {
        customer_id: customer!.id,
        vehicle_id: vehicle?.id || null,
        date, due_date: dueDate, notes,
        items: items.filter(i => i.description),
      }),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['invoices'] });
      setResult(data);
      setStep(4);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  function addQuick(svc: LineItem) {
    setItems(prev => {
      const existing = prev.findIndex(i => i.description === svc.description);
      if (existing >= 0) {
        return prev.map((i, idx) => idx === existing ? { ...i, quantity: i.quantity + svc.quantity } : i);
      }
      const hasBlank = prev.some(i => !i.description);
      return hasBlank ? prev.map(i => !i.description ? svc : i) : [...prev, { ...svc }];
    });
  }

  function updateItem(i: number, k: keyof LineItem, v: string) {
    setItems(prev => prev.map((it, idx) => idx === i ? { ...it, [k]: k === 'description' ? v : parseFloat(v) || 0 } : it));
  }

  function reset() {
    setStep(0); setCustomer(null); setVehicle(null); setNotes('');
    setDate(today()); setDueDate(addDays(today(), 14));
    setItems([{ description: '', quantity: 1, cost_price: 0, unit_price: 0 }]);
    setResult(null); setCustSearch('');
  }

  return (
    <>
      <Topbar />
      <div className="p-6">
        {/* Step tabs */}
        <div className="flex border-b border-border mb-6">
          {STEPS.map((label, i) => {
            const done   = i < step;
            const active = i === step;
            return (
              <div key={label} className={`flex items-center gap-2 px-4 py-2.5 text-[12.5px] font-medium border-b-2 mb-[-1px] transition-all select-none ${active ? 'text-brand border-brand' : done ? 'text-status-green border-status-green cursor-pointer' : 'text-text3 border-transparent'}`}
                onClick={() => done && setStep(i)}>
                <span className={`w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center flex-shrink-0 ${active ? 'bg-brand text-white' : done ? 'bg-status-green text-white' : 'bg-border text-text3'}`}>
                  {done ? '✓' : i + 1}
                </span>
                {label}
              </div>
            );
          })}
        </div>

        {/* Step 1: Customer */}
        {step === 0 && (
          <div className="max-w-xl">
            <h2 className="font-serif text-[17px] mb-4">Select Customer</h2>
            <input value={custSearch} onChange={e => setCustSearch(e.target.value)} placeholder="Search customers…"
              className="w-full border border-border rounded-[7px] px-3 py-2.5 text-[13px] bg-surface outline-none focus:border-brand transition-all mb-3" />
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {filteredCustomers.map(c => (
                <div key={c.id} onClick={() => { setCustomer(c); setStep(1); }}
                  className="flex items-center gap-3 p-3 border border-border rounded-[var(--radius)] cursor-pointer hover:border-brand hover:bg-brand-light transition-all">
                  <CustomerAvatar name={c.name} size="sm" />
                  <div>
                    <div className="font-medium text-[13px]">{c.name}</div>
                    {c.phone && <div className="text-[11px] text-text2">{c.phone}</div>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Vehicle */}
        {step === 1 && customer && (
          <div className="max-w-xl">
            <div className="mb-4">
              <div className="text-[11px] text-text3 mb-1">Customer</div>
              <div className="flex items-center gap-2">
                <CustomerAvatar name={customer.name} size="sm" />
                <span className="font-medium">{customer.name}</span>
              </div>
            </div>
            <h2 className="font-serif text-[17px] mb-4">Select Vehicle</h2>
            {custVehicles.length === 0 ? (
              <div className="text-text3 text-[13px] py-8 text-center border border-border rounded-[var(--radius)]">
                No vehicles for this customer.<br />You can skip this step.
              </div>
            ) : (
              <div className="space-y-2">
                {custVehicles.map(v => (
                  <div key={v.id} onClick={() => { setVehicle(v); setStep(2); }}
                    className="flex items-center gap-3 p-3 border border-border rounded-[var(--radius)] cursor-pointer hover:border-brand hover:bg-brand-light transition-all">
                    <div className="w-8 h-8 bg-surface2 rounded-lg flex items-center justify-center text-text2 text-[11px] font-mono">{v.year}</div>
                    <div>
                      <div className="font-medium text-[13px]">{v.year} {v.make} {v.model}</div>
                      {v.tire_size && <div className="text-[11px] text-text2">{v.tire_size}</div>}
                    </div>
                    {v.plate && <div className="ml-auto font-mono text-[11px] text-text3">{v.plate}</div>}
                  </div>
                ))}
              </div>
            )}
            <button onClick={() => setStep(2)} className="mt-3 text-[12px] text-text2 hover:text-text3 underline">
              Skip — no vehicle
            </button>
          </div>
        )}

        {/* Step 3: Estimate */}
        {step === 2 && (
          <div className="flex gap-6">
            <div className="flex-1">
              <h2 className="font-serif text-[17px] mb-4">Build Estimate</h2>

              {/* Quick services */}
              <div className="flex flex-wrap gap-2 mb-4">
                {QUICK_SERVICES.map(s => (
                  <button key={s.description} onClick={() => addQuick(s)}
                    className="bg-surface2 border border-border rounded-[6px] px-3 py-1.5 text-[12px] font-medium text-text2 hover:bg-brand hover:text-white hover:border-brand transition-all">
                    {s.description}
                  </button>
                ))}
              </div>

              {/* Items table */}
              <div className="border border-border rounded-[7px] overflow-hidden mb-4">
                <table className="w-full text-[12px]">
                  <thead>
                    <tr className="bg-background border-b border-border">
                      <th className="text-left px-3 py-2 font-mono text-[10px] tracking-wide text-text3 uppercase">Description</th>
                      <th className="text-left px-2 py-2 font-mono text-[10px] tracking-wide text-text3 uppercase w-12">Qty</th>
                      <th className="text-left px-2 py-2 font-mono text-[10px] tracking-wide text-text3 uppercase w-20">Cost</th>
                      <th className="text-left px-2 py-2 font-mono text-[10px] tracking-wide text-text3 uppercase w-20">Price</th>
                      <th className="w-6"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((it, i) => (
                      <tr key={i} className="border-b border-border last:border-0">
                        <td className="px-2 py-1.5">
                          <input value={it.description} onChange={e => updateItem(i, 'description', e.target.value)} placeholder="Description"
                            className="w-full bg-transparent outline-none text-[12px] placeholder:text-text3" />
                        </td>
                        <td className="px-2 py-1.5">
                          <input type="number" min="1" value={it.quantity} onChange={e => updateItem(i, 'quantity', e.target.value)}
                            className="w-10 border border-border rounded px-1 py-0.5 text-[12px] bg-surface outline-none focus:border-brand text-center" />
                        </td>
                        <td className="px-2 py-1.5">
                          <input type="number" step="0.01" value={it.cost_price || ''} onChange={e => updateItem(i, 'cost_price', e.target.value)} placeholder="0"
                            className="w-16 border border-border rounded px-1 py-0.5 text-[12px] bg-surface outline-none focus:border-brand" />
                        </td>
                        <td className="px-2 py-1.5">
                          <input type="number" step="0.01" value={it.unit_price || ''} onChange={e => updateItem(i, 'unit_price', e.target.value)} placeholder="0"
                            className="w-16 border border-border rounded px-1 py-0.5 text-[12px] bg-surface outline-none focus:border-brand" />
                        </td>
                        <td className="px-1 py-1.5">
                          <button onClick={() => setItems(p => p.filter((_, idx) => idx !== i))} disabled={items.length === 1}
                            className="text-text3 hover:text-brand disabled:opacity-30"><Trash2 size={12} /></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <button onClick={() => setItems(p => [...p, { description: '', quantity: 1, cost_price: 0, unit_price: 0 }])}
                className="flex items-center gap-1 text-[12px] text-brand hover:underline mb-6">
                <Plus size={12} /> Add Item
              </button>

              <button onClick={() => { if (items.some(i => i.description && i.unit_price > 0)) setStep(3); else toast.error('Add at least one item with a price'); }}
                className="px-5 py-2 rounded-[7px] bg-brand text-white text-[13px] font-medium hover:bg-[#b33f25] transition-colors">
                Continue to Invoice
              </button>
            </div>

            {/* Summary sidebar */}
            <div className="w-56 flex-shrink-0">
              <div className="bg-surface border border-border rounded-[var(--radius)] p-4 shadow-[var(--shadow)] sticky top-20">
                <h3 className="font-semibold text-[13px] mb-3">Summary</h3>
                <div className="space-y-1.5 text-[13px]">
                  <div className="flex justify-between text-text2"><span>Subtotal</span><span>{fmtCurrency(subtotal)}</span></div>
                  <div className="flex justify-between text-text2"><span>Tax 7%</span><span>{fmtCurrency(tax)}</span></div>
                  <div className="flex justify-between font-semibold border-t border-border pt-1.5 mt-1.5"><span>Total</span><span>{fmtCurrency(total)}</span></div>
                </div>
                <div className="mt-3 pt-3 border-t border-border">
                  <div className="text-[11px] text-text3 mb-1">Profit</div>
                  <div className={`font-semibold ${profit >= 0 ? 'text-status-green' : 'text-brand'}`}>{fmtCurrency(profit)}</div>
                  <div className="text-[11px] text-text3 mt-0.5">{margin}% margin</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Invoice */}
        {step === 3 && (
          <div className="max-w-xl">
            <h2 className="font-serif text-[17px] mb-4">Confirm Invoice</h2>
            <div className="bg-surface border border-border rounded-[var(--radius)] p-5 mb-4 shadow-[var(--shadow)]">
              <div className="flex justify-between mb-3 pb-3 border-b border-border">
                <div>
                  <div className="font-semibold text-[14px]">{customer?.name}</div>
                  {vehicle && <div className="text-[12px] text-text2">{vehicle.year} {vehicle.make} {vehicle.model}</div>}
                </div>
              </div>
              {items.filter(i => i.description).map((it, i) => (
                <div key={i} className="flex justify-between text-[13px] py-1.5 border-b border-border last:border-0">
                  <span>{it.description} {it.quantity > 1 ? `×${it.quantity}` : ''}</span>
                  <span>{fmtCurrency(it.quantity * it.unit_price)}</span>
                </div>
              ))}
              <div className="mt-3 pt-3 space-y-1 text-[13px]">
                <div className="flex justify-between text-text2"><span>Subtotal</span><span>{fmtCurrency(subtotal)}</span></div>
                <div className="flex justify-between text-text2"><span>Tax (7%)</span><span>{fmtCurrency(tax)}</span></div>
                <div className="flex justify-between font-bold text-[15px] border-t border-border pt-1.5 mt-1.5"><span>Total</span><span>{fmtCurrency(total)}</span></div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-text2 tracking-wide">Invoice Date</label>
                <input type="date" value={date} onChange={e => setDate(e.target.value)}
                  className="w-full border border-border rounded-[7px] px-3 py-2 text-[13px] bg-surface outline-none focus:border-brand transition-all" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-text2 tracking-wide">Due Date</label>
                <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)}
                  className="w-full border border-border rounded-[7px] px-3 py-2 text-[13px] bg-surface outline-none focus:border-brand transition-all" />
              </div>
            </div>
            <div className="space-y-1.5 mb-5">
              <label className="text-[11px] font-semibold text-text2 tracking-wide">Notes</label>
              <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2}
                className="w-full border border-border rounded-[7px] px-3 py-2 text-[13px] bg-surface outline-none focus:border-brand transition-all resize-none" />
            </div>
            <div className="flex gap-2">
              <button onClick={() => setStep(2)} className="px-4 py-2 rounded-[7px] border border-border text-text2 text-[13px] hover:border-text3 transition-colors">Back</button>
              <button onClick={() => invoiceMutation.mutate()} disabled={invoiceMutation.isPending}
                className="px-5 py-2 rounded-[7px] bg-brand text-white text-[13px] font-medium hover:bg-[#b33f25] disabled:opacity-50 transition-colors">
                {invoiceMutation.isPending ? 'Creating…' : 'Create Invoice'}
              </button>
            </div>
          </div>
        )}

        {/* Step 5: Success */}
        {step === 4 && result && (
          <div className="max-w-sm mx-auto text-center py-12">
            <CheckCircle size={56} className="mx-auto text-status-green mb-4" />
            <h2 className="font-serif text-[22px] mb-2">Invoice Created!</h2>
            <p className="text-text2 text-[14px] mb-1">{result.invoice_number}</p>
            <p className="font-semibold text-[18px] mb-6">{fmtCurrency(result.total)}</p>
            <div className="flex gap-3 justify-center">
              <button onClick={() => window.location.href = '/invoices'} className="px-4 py-2 rounded-[7px] border border-border text-text2 text-[13px] hover:border-text3 transition-colors">
                View Invoice
              </button>
              <button onClick={reset} className="px-4 py-2 rounded-[7px] bg-brand text-white text-[13px] font-medium hover:bg-[#b33f25] transition-colors">
                New Sale
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
