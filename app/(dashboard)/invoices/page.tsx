'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Topbar from '@/components/layout/Topbar';
import StatusBadge from '@/components/shared/StatusBadge';
import InvoiceModal from '@/components/invoices/InvoiceModal';
import { apiGet, apiPut, apiDelete } from '@/lib/api';
import { fmtCurrency, fmtDate } from '@/lib/utils';
import { toast } from 'sonner';
import { Trash2, ChevronDown } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

interface Invoice {
  id: number; invoice_number: string; customer_name: string;
  date: string; due_date?: string | null; total: number; status: string;
  year?: number | null; make?: string | null; model?: string | null;
}

const STATUSES = ['all','pending','paid','overdue'] as const;
type Filter = typeof STATUSES[number];

export default function InvoicesPage() {
  const qc = useQueryClient();
  const [search, setSearch]     = useState('');
  const [filter, setFilter]     = useState<Filter>('all');
  const [modalOpen, setModalOpen] = useState(false);

  const { data: invoices = [], isLoading } = useQuery<Invoice[]>({
    queryKey: ['invoices'],
    queryFn:  () => apiGet('/api/invoices'),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      apiPut(`/api/invoices/${id}/status`, { status }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['invoices'] }); toast.success('Status updated'); },
    onError:   (e: Error) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiDelete(`/api/invoices/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['invoices'] }); toast.success('Invoice deleted'); },
    onError:   (e: Error) => toast.error(e.message),
  });

  const filtered = invoices.filter(i => {
    if (filter !== 'all' && i.status !== filter) return false;
    if (search && ![i.invoice_number, i.customer_name].some(f => f?.toLowerCase().includes(search.toLowerCase()))) return false;
    return true;
  });

  function handleDelete(i: Invoice) {
    if (!window.confirm(`Delete ${i.invoice_number}?`)) return;
    deleteMutation.mutate(i.id);
  }

  return (
    <>
      <Topbar onSearch={setSearch} onAdd={() => setModalOpen(true)} addLabel="New Invoice" />
      <div className="p-6">
        {/* Status filter tabs */}
        <div className="flex gap-1 mb-4 border-b border-border">
          {STATUSES.map(s => (
            <button key={s} onClick={() => setFilter(s)}
              className={`px-3 py-2 text-[12px] font-medium capitalize border-b-2 mb-[-1px] transition-all ${filter === s ? 'text-brand border-brand' : 'text-text3 border-transparent hover:text-text2'}`}>
              {s}
            </button>
          ))}
        </div>

        <div className="bg-surface border border-border rounded-[var(--radius)] shadow-[var(--shadow)] overflow-hidden">
          {isLoading ? (
            <div className="py-16 text-center text-text3 text-[13px]">Loading…</div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center">
              <div className="text-3xl mb-3">🧾</div>
              <div className="font-semibold text-text2 mb-1">{search || filter !== 'all' ? 'No results' : 'No invoices yet'}</div>
              <div className="text-text3 text-[12.5px]">Create your first invoice</div>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr>
                  {['Invoice #','Customer','Vehicle','Date','Due','Total','Status',''].map(h => (
                    <th key={h} className="text-left px-3.5 py-2 font-mono text-[10px] tracking-wide uppercase text-text3 border-b border-border bg-background">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(inv => (
                  <tr key={inv.id} className="hover:bg-surface2 transition-colors">
                    <td className="px-3.5 py-2.5 border-b border-border font-mono text-[12px]">{inv.invoice_number}</td>
                    <td className="px-3.5 py-2.5 border-b border-border font-medium text-[13px]">{inv.customer_name}</td>
                    <td className="px-3.5 py-2.5 border-b border-border text-[13px] text-text2">{inv.make ? `${inv.year} ${inv.make} ${inv.model}` : '—'}</td>
                    <td className="px-3.5 py-2.5 border-b border-border text-[13px] text-text2">{fmtDate(inv.date)}</td>
                    <td className="px-3.5 py-2.5 border-b border-border text-[13px] text-text2">{inv.due_date ? fmtDate(inv.due_date) : '—'}</td>
                    <td className="px-3.5 py-2.5 border-b border-border font-medium text-[13px]">{fmtCurrency(inv.total)}</td>
                    <td className="px-3.5 py-2.5 border-b border-border"><StatusBadge status={inv.status} /></td>
                    <td className="px-3.5 py-2.5 border-b border-border">
                      <div className="flex items-center gap-1">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button className="flex items-center gap-0.5 text-[12px] text-text2 border border-border rounded px-2 py-1 hover:border-text3 transition-colors">
                              Status <ChevronDown size={11} />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {['pending','paid','overdue'].map(s => (
                              <DropdownMenuItem key={s} onClick={() => statusMutation.mutate({ id: inv.id, status: s })} className="capitalize text-[13px]">{s}</DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                        <button onClick={() => handleDelete(inv)} className="p-1.5 rounded text-text3 hover:text-brand hover:bg-brand-light transition-colors">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <InvoiceModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  );
}
