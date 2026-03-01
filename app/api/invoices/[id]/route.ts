import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@/lib/generated/prisma/client';
import { requireAuth } from '@/lib/auth';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authErr = await requireAuth();
  if (authErr) return authErr;
  try {
    const { id } = await params;
    const rows = await prisma.$queryRaw<Record<string, unknown>[]>(Prisma.sql`
      SELECT i.*,
        c.name as customer_name, c.phone as customer_phone, c.email as customer_email,
        v.year, v.make, v.model, v.plate, v.tire_size
      FROM invoices i
      LEFT JOIN customers c ON c.id = i.customer_id
      LEFT JOIN vehicles v ON v.id = i.vehicle_id
      WHERE i.id = ${parseInt(id)}
    `);

    if (!rows.length) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const invoice = {
      ...rows[0],
      subtotal: parseFloat(String(rows[0].subtotal ?? 0)),
      tax: parseFloat(String(rows[0].tax ?? 0)),
      total: parseFloat(String(rows[0].total ?? 0)),
      total_cost: parseFloat(String(rows[0].total_cost ?? 0)),
      total_profit: parseFloat(String(rows[0].total_profit ?? 0)),
    };

    const items = await prisma.invoice_items.findMany({
      where: { invoice_id: parseInt(id) },
    });

    const itemsFormatted = items.map((it) => ({
      ...it,
      quantity: parseFloat(String(it.quantity ?? 1)),
      cost_price: parseFloat(String(it.cost_price ?? 0)),
      unit_price: parseFloat(String(it.unit_price ?? 0)),
      total: parseFloat(String(it.total ?? 0)),
      profit: parseFloat(String(it.profit ?? 0)),
    }));

    return NextResponse.json({ ...invoice, invoice_items: itemsFormatted });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authErr = await requireAuth();
  if (authErr) return authErr;
  try {
    const { id } = await params;
    // Delete items first, then invoice
    await prisma.invoice_items.deleteMany({ where: { invoice_id: parseInt(id) } });
    await prisma.invoices.delete({ where: { id: parseInt(id) } });
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
