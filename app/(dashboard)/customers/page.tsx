'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Topbar from '@/components/layout/Topbar';
import CustomerAvatar from '@/components/shared/CustomerAvatar';
import CustomerModal from '@/components/customers/CustomerModal';
import { apiGet, apiDelete } from '@/lib/api';
import { fmtCurrency, fmtDate } from '@/lib/utils';
import { toast } from 'sonner';
import { Pencil, Trash2 } from 'lucide-react';

interface Customer {
  id: number; name: string; phone?: string | null; email?: string | null;
  notes?: string | null; vehicle_count: number; last_visit?: string | null;
  total_spent: number; balance: number;
}

export default function CustomersPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Customer | null>(null);

  const { data: customers = [], isLoading } = useQuery<Customer[]>({
    queryKey: ['customers'],
    queryFn: () => apiGet('/api/customers'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiDelete(`/api/customers/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['customers'] }); toast.success('Customer deleted'); },
    onError:   (e: Error) => toast.error(e.message),
  });

  const filtered = customers.filter(c =>
    !search || [c.name, c.phone, c.email].some(f => f?.toLowerCase().includes(search.toLowerCase())),
  );

  function openEdit(c: Customer) { setEditing(c); setModalOpen(true); }
  function openNew()              { setEditing(null); setModalOpen(true); }
  function handleDelete(c: Customer) {
    if (!window.confirm(`Delete ${c.name}? This cannot be undone.`)) return;
    deleteMutation.mutate(c.id);
  }

  return (
    <>
      <Topbar onSearch={setSearch} onAdd={openNew} addLabel="Add Customer" />
      <div className="p-6">
        <div className="bg-surface border border-border rounded-[var(--radius)] shadow-[var(--shadow)] overflow-hidden">
          {isLoading ? (
            <div className="py-16 text-center text-text3 text-[13px]">Loading…</div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center">
              <div className="text-3xl mb-3">👤</div>
              <div className="font-semibold text-text2 mb-1">{search ? 'No results' : 'No customers yet'}</div>
              <div className="text-text3 text-[12.5px]">{search ? 'Try a different search' : 'Add your first customer'}</div>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr>
                  <th className="text-left px-3.5 py-2 font-mono text-[10px] tracking-wide uppercase text-text3 border-b border-border bg-background">Customer</th>
                  <th className="text-left px-3.5 py-2 font-mono text-[10px] tracking-wide uppercase text-text3 border-b border-border bg-background">Phone</th>
                  <th className="text-left px-3.5 py-2 font-mono text-[10px] tracking-wide uppercase text-text3 border-b border-border bg-background">Email</th>
                  <th className="text-left px-3.5 py-2 font-mono text-[10px] tracking-wide uppercase text-text3 border-b border-border bg-background">Vehicles</th>
                  <th className="text-left px-3.5 py-2 font-mono text-[10px] tracking-wide uppercase text-text3 border-b border-border bg-background">Last Visit</th>
                  <th className="text-left px-3.5 py-2 font-mono text-[10px] tracking-wide uppercase text-text3 border-b border-border bg-background">Total Spent</th>
                  <th className="text-left px-3.5 py-2 font-mono text-[10px] tracking-wide uppercase text-text3 border-b border-border bg-background">Balance</th>
                  <th className="border-b border-border bg-background"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(c => (
                  <tr key={c.id} className="hover:bg-surface2 transition-colors">
                    <td className="px-3.5 py-2.5 border-b border-border">
                      <div className="flex items-center gap-2.5">
                        <CustomerAvatar name={c.name} size="sm" />
                        <div>
                          <div className="font-medium text-[13px]">{c.name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-3.5 py-2.5 border-b border-border text-[13px] text-text2">{c.phone || '—'}</td>
                    <td className="px-3.5 py-2.5 border-b border-border text-[13px] text-text2">{c.email || '—'}</td>
                    <td className="px-3.5 py-2.5 border-b border-border text-[13px] text-center">{c.vehicle_count}</td>
                    <td className="px-3.5 py-2.5 border-b border-border text-[13px] text-text2">{c.last_visit ? fmtDate(c.last_visit) : '—'}</td>
                    <td className="px-3.5 py-2.5 border-b border-border text-[13px] text-status-green font-medium">{fmtCurrency(c.total_spent)}</td>
                    <td className="px-3.5 py-2.5 border-b border-border text-[13px]">
                      <span className={c.balance > 0 ? 'text-brand font-medium' : 'text-text2'}>{fmtCurrency(c.balance)}</span>
                    </td>
                    <td className="px-3.5 py-2.5 border-b border-border">
                      <div className="flex items-center gap-1">
                        <button onClick={() => openEdit(c)} className="p-1.5 rounded text-text3 hover:text-brand hover:bg-surface2 transition-colors"><Pencil size={13} /></button>
                        <button onClick={() => handleDelete(c)} className="p-1.5 rounded text-text3 hover:text-brand hover:bg-brand-light transition-colors"><Trash2 size={13} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <CustomerModal open={modalOpen} onClose={() => setModalOpen(false)} customer={editing} />
    </>
  );
}
