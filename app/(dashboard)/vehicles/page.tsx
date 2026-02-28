'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Topbar from '@/components/layout/Topbar';
import VehicleModal from '@/components/vehicles/VehicleModal';
import { apiGet, apiDelete } from '@/lib/api';
import { toast } from 'sonner';
import { Pencil, Trash2, Car } from 'lucide-react';

interface Vehicle {
  id: number; customer_id: number; customer_name?: string;
  year?: number | null; make?: string | null; model?: string | null; trim?: string | null;
  color?: string | null; plate?: string | null; tire_size?: string | null; mileage?: number | null;
  vin?: string | null; notes?: string | null;
}

export default function VehiclesPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Vehicle | null>(null);

  const { data: vehicles = [], isLoading } = useQuery<Vehicle[]>({
    queryKey: ['vehicles'],
    queryFn: () => apiGet('/api/vehicles'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiDelete(`/api/vehicles/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['vehicles'] }); toast.success('Vehicle deleted'); },
    onError:   (e: Error) => toast.error(e.message),
  });

  const filtered = vehicles.filter(v =>
    !search ||
    [v.make, v.model, v.plate, v.customer_name, v.tire_size]
      .some(f => f?.toLowerCase().includes(search.toLowerCase())),
  );

  function openEdit(v: Vehicle) { setEditing(v); setModalOpen(true); }
  function openNew()             { setEditing(null); setModalOpen(true); }
  function handleDelete(v: Vehicle) {
    if (!window.confirm(`Delete ${v.year} ${v.make} ${v.model}?`)) return;
    deleteMutation.mutate(v.id);
  }

  return (
    <>
      <Topbar onSearch={setSearch} onAdd={openNew} addLabel="Add Vehicle" />
      <div className="p-6">
        <div className="bg-surface border border-border rounded-[var(--radius)] shadow-[var(--shadow)] overflow-hidden">
          {isLoading ? (
            <div className="py-16 text-center text-text3 text-[13px]">Loading…</div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center">
              <Car size={32} className="mx-auto text-text3 mb-3" />
              <div className="font-semibold text-text2 mb-1">{search ? 'No results' : 'No vehicles yet'}</div>
              <div className="text-text3 text-[12.5px]">{search ? 'Try a different search' : 'Add your first vehicle'}</div>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr>
                  {['Customer','Vehicle','Plate','Tire Size','Color','Mileage',''].map(h => (
                    <th key={h} className="text-left px-3.5 py-2 font-mono text-[10px] tracking-wide uppercase text-text3 border-b border-border bg-background">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(v => (
                  <tr key={v.id} className="hover:bg-surface2 transition-colors">
                    <td className="px-3.5 py-2.5 border-b border-border text-[13px] text-text2">{v.customer_name || '—'}</td>
                    <td className="px-3.5 py-2.5 border-b border-border">
                      <div className="font-medium text-[13px]">{v.year} {v.make} {v.model}</div>
                      {v.trim && <div className="text-[11px] text-text3">{v.trim}</div>}
                    </td>
                    <td className="px-3.5 py-2.5 border-b border-border font-mono text-[12px]">{v.plate || '—'}</td>
                    <td className="px-3.5 py-2.5 border-b border-border font-mono text-[12px]">{v.tire_size || '—'}</td>
                    <td className="px-3.5 py-2.5 border-b border-border text-[13px] text-text2">{v.color || '—'}</td>
                    <td className="px-3.5 py-2.5 border-b border-border text-[13px] text-text2">{v.mileage ? v.mileage.toLocaleString() : '—'}</td>
                    <td className="px-3.5 py-2.5 border-b border-border">
                      <div className="flex items-center gap-1">
                        <button onClick={() => openEdit(v)} className="p-1.5 rounded text-text3 hover:text-brand hover:bg-surface2 transition-colors"><Pencil size={13} /></button>
                        <button onClick={() => handleDelete(v)} className="p-1.5 rounded text-text3 hover:text-brand hover:bg-brand-light transition-colors"><Trash2 size={13} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <VehicleModal open={modalOpen} onClose={() => setModalOpen(false)} vehicle={editing} />
    </>
  );
}
