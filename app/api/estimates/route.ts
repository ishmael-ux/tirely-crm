import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@/lib/generated/prisma/client';
import { requireAuth } from '@/lib/auth';

export async function GET(request: Request) {
  const authErr = await requireAuth();
  if (authErr) return authErr;
  try {
    const rows = await prisma.$queryRaw<Record<string, unknown>[]>(Prisma.sql`
      SELECT e.*, c.name as customer_name,
        v.year, v.make, v.model, v.plate
      FROM estimates e
      LEFT JOIN customers c ON c.id = e.customer_id
      LEFT JOIN vehicles v ON v.id = e.vehicle_id
      ORDER BY e.created_at DESC
    `);
    return NextResponse.json(
      rows.map(r => ({
        ...r,
        subtotal:   parseFloat(String(r.subtotal ?? 0)),
        tax:        parseFloat(String(r.tax ?? 0)),
        total:      parseFloat(String(r.total ?? 0)),
        total_cost: parseFloat(String(r.total_cost ?? 0)),
      })),
    );
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const authErr = await requireAuth();
  if (authErr) return authErr;
  try {
    const { customer_id, vehicle_id, notes, items } = await request.json();
    if (!customer_id || !items?.length)
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });

    const lineItems = (items as { description: string; quantity?: number; cost_price?: number; unit_price?: number }[]).map(item => {
      const qty   = parseFloat(String(item.quantity ?? 1));
      const cost  = parseFloat(String(item.cost_price ?? 0));
      const price = parseFloat(String(item.unit_price ?? 0));
      return { description: item.description, quantity: qty, cost_price: cost, unit_price: price, total: qty * price, profit: (price - cost) * qty };
    });

    const subtotal   = lineItems.reduce((s, i) => s + i.total, 0);
    const total_cost = lineItems.reduce((s, i) => s + i.quantity * i.cost_price, 0);
    const tax        = Math.round(subtotal * 0.07 * 100) / 100;
    const total      = Math.round((subtotal + tax) * 100) / 100;

    const estimate = await prisma.estimates.create({
      data: {
        customer_id: parseInt(String(customer_id)),
        vehicle_id: vehicle_id ? parseInt(String(vehicle_id)) : null,
        status: 'draft',
        subtotal, tax, total, total_cost,
        notes: notes || null,
      },
    });

    await prisma.estimate_items.createMany({
      data: lineItems.map(it => ({ estimate_id: estimate.id, ...it })),
    });

    return NextResponse.json({ id: estimate.id });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
