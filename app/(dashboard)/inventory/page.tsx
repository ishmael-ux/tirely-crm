'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Topbar from '@/components/layout/Topbar';
import StockRing from '@/components/shared/StockRing';
import InventoryModal from '@/components/inventory/InventoryModal';
import { apiGet, apiPost, apiDelete } from '@/lib/api';
import { fmtCurrency } from '@/lib/utils';
import { toast } from 'sonner';
import { Pencil, Trash2, Minus, Plus } from 'lucide-react';

interface InventoryRow {
  id: number; brand: string; model: string; size: string;
  type?: string | null; quantity: number; min_stock: number;
  cost_price: number; sell_price: number;
  location?: string | null; notes?: string | null;
}

const TYPES = ['All Types','All-Season','Summer','Winter','Performance','All-Terrain'];

export default function InventoryPage() {
  const qc = useQueryClient();
  const [search, setSearch]       = useState('');
  const [typeFilter, setTypeFilter] = useState('All Types');
  const [modalOpen, setModalOpen]  = useState(false);
  const [editing, setEditing]      = useState<InventoryRow | null>(null);

  const { data: items = [], isLoading } = useQuery<InventoryRow[]>({
    queryKey: ['inventory'],
    queryFn:  () => apiGet('/api/inventory'),
  });

  const adjustMutation = useMutation({
    mutationFn: ({ id, delta }: { id: number; delta: number }) =>
      apiPost(`/api/inventory/${id}/adjust`, { delta }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['inventory'] }),
    onError:   (e: Error) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiDelete(`/api/inventory/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['inventory'] }); toast.success('Item deleted'); },
    onError:   (e: Error) => toast.error(e.message),
  });

  const filtered = items.filter(i => {
    if (typeFilter !== 'All Types' && i.type !== typeFilter) return false;
    if (search && ![i.brand, i.model, i.size].some(f => f?.toLowerCase().includes(search.toLowerCase()))) return false;
    return true;
  });

  function handleDelete(i: InventoryRow) {
    if (!window.confirm(`Delete ${i.brand} ${i.model}?`)) return;
    deleteMutation.mutate(i.id);
  }

  return (
    <>
      <Topbar onSearch={setSearch} onAdd={() => { setEditing(null); setModalOpen(true); }} addLabel="Add Tire" />
      <div className="p-6">
        {/* Type filter */}
        <div className="flex gap-1 mb-4 border-b border-border">
          {TYPES.map(t => (
            <button key={t} onClick={() => setTypeFilter(t)}
              className={`px-3 py-2 text-[12px] font-medium border-b-2 mb-[-1px] transition-all ${typeFilter === t ? 'text-brand border-brand' : 'text-text3 border-transparent hover:text-text2'}`}>
              {t}
            </button>
          ))}
        </div>

        <div className="bg-surface border border-border rounded-[var(--radius)] shadow-[var(--shadow)] overflow-hidden">
          {isLoading ? (
            <div className="py-16 text-center text-text3 text-[13px]">Loading…</div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center">
              <div className="text-3xl mb-3">📦</div>
              <div className="font-semibold text-text2 mb-1">{search || typeFilter !== 'All Types' ? 'No results' : 'No inventory yet'}</div>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr>
                  {['','Brand','Model','Size','Type','Qty','Min','Cost','Sell','Margin','Location',''].map((h, i) => (
                    <th key={i} className="text-left px-3 py-2 font-mono text-[10px] tracking-wide uppercase text-text3 border-b border-border bg-background whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(item => {
                  const margin = item.sell_price > 0
                    ? Math.round(((item.sell_price - item.cost_price) / item.sell_price) * 100)
                    : 0;
                  return (
                    <tr key={item.id} className="hover:bg-surface2 transition-colors">
                      <td className="px-3 py-2.5 border-b border-border">
                        <StockRing quantity={item.quantity} minStock={item.min_stock} />
                      </td>
                      <td className="px-3 py-2.5 border-b border-border font-medium text-[13px]">{item.brand}</td>
                      <td className="px-3 py-2.5 border-b border-border text-[13px]">{item.model}</td>
                      <td className="px-3 py-2.5 border-b border-border font-mono text-[12px]">{item.size}</td>
                      <td className="px-3 py-2.5 border-b border-border text-[12px] text-text2">{item.type}</td>
                      <td className="px-3 py-2.5 border-b border-border">
                        <div className="flex items-center gap-1">
                          <button onClick={() => adjustMutation.mutate({ id: item.id, delta: -1 })}
                            className="w-5 h-5 flex items-center justify-center border border-border rounded text-text3 hover:border-brand hover:text-brand transition-colors">
                            <Minus size={10} />
                          </button>
                          <span className={`font-mono text-[13px] w-8 text-center ${item.quantity === 0 ? 'text-brand font-bold' : item.quantity <= item.min_stock ? 'text-status-yellow font-semibold' : ''}`}>
                            {item.quantity}
                          </span>
                          <button onClick={() => adjustMutation.mutate({ id: item.id, delta: 1 })}
                            className="w-5 h-5 flex items-center justify-center border border-border rounded text-text3 hover:border-brand hover:text-brand transition-colors">
                            <Plus size={10} />
                          </button>
                        </div>
                      </td>
                      <td className="px-3 py-2.5 border-b border-border text-[12px] text-text2 text-center">{item.min_stock}</td>
                      <td className="px-3 py-2.5 border-b border-border text-[13px] text-text2">{fmtCurrency(item.cost_price)}</td>
                      <td className="px-3 py-2.5 border-b border-border text-[13px] font-medium">{fmtCurrency(item.sell_price)}</td>
                      <td className="px-3 py-2.5 border-b border-border text-[12px]">
                        <span className={margin >= 30 ? 'text-status-green' : margin >= 15 ? 'text-status-yellow' : 'text-brand'}>{margin}%</span>
                      </td>
                      <td className="px-3 py-2.5 border-b border-border text-[12px] text-text2">{item.location || '—'}</td>
                      <td className="px-3 py-2.5 border-b border-border">
                        <div className="flex items-center gap-1">
                          <button onClick={() => { setEditing(item); setModalOpen(true); }} className="p-1.5 rounded text-text3 hover:text-brand hover:bg-surface2 transition-colors"><Pencil size={13} /></button>
                          <button onClick={() => handleDelete(item)} className="p-1.5 rounded text-text3 hover:text-brand hover:bg-brand-light transition-colors"><Trash2 size={13} /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <InventoryModal open={modalOpen} onClose={() => setModalOpen(false)} item={editing} />
    </>
  );
}
