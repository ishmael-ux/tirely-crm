import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@/lib/generated/prisma/client';
import { requireAuth } from '@/lib/auth';
import { today } from '@/lib/utils';

export async function GET(request: Request) {
  const authErr = await requireAuth();
  if (authErr) return authErr;
  try {
    const rows = await prisma.$queryRaw<Record<string, unknown>[]>(Prisma.sql`
      SELECT i.*,
        c.name as customer_name, c.phone as customer_phone,
        v.year, v.make, v.model, v.plate
      FROM invoices i
      LEFT JOIN customers c ON c.id = i.customer_id
      LEFT JOIN vehicles v ON v.id = i.vehicle_id
      ORDER BY i.date DESC, i.id DESC
    `);

    const result = rows.map((r) => ({
      ...r,
      subtotal: parseFloat(String(r.subtotal ?? 0)),
      tax: parseFloat(String(r.tax ?? 0)),
      total: parseFloat(String(r.total ?? 0)),
      total_cost: parseFloat(String(r.total_cost ?? 0)),
      total_profit: parseFloat(String(r.total_profit ?? 0)),
    }));

    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const authErr = await requireAuth();
  if (authErr) return authErr;
  try {
    const {
      customer_id,
      vehicle_id,
      appointment_id,
      date,
      due_date,
      status,
      notes,
      items,
    } = await request.json();

    // Calculate totals from items
    const lineItems: {
      description: string;
      quantity: number;
      cost_price: number;
      unit_price: number;
      total: number;
      profit: number;
    }[] = (items ?? []).map(
      (item: {
        description: string;
        quantity?: number;
        cost_price?: number;
        unit_price?: number;
      }) => {
        const qty = parseFloat(String(item.quantity ?? 1));
        const cost = parseFloat(String(item.cost_price ?? 0));
        const price = parseFloat(String(item.unit_price ?? 0));
        const total = qty * price;
        const profit = total - qty * cost;
        return {
          description: item.description,
          quantity: qty,
          cost_price: cost,
          unit_price: price,
          total,
          profit,
        };
      }
    );

    const subtotal = lineItems.reduce((sum, it) => sum + it.total, 0);
    const tax = Math.round(subtotal * 0.07 * 100) / 100;
    const total = subtotal + tax;
    const total_cost = lineItems.reduce((sum, it) => sum + it.quantity * it.cost_price, 0);
    const total_profit = total - total_cost;

    // Auto-generate invoice number
    const lastInvoice = await prisma.invoices.findFirst({
      orderBy: { id: 'desc' },
      select: { invoice_number: true },
    });

    let nextNum = 100;
    if (lastInvoice?.invoice_number) {
      const match = lastInvoice.invoice_number.match(/INV-(\d+)/);
      if (match) {
        nextNum = parseInt(match[1]) + 1;
      }
    }
    const invoice_number = `INV-${String(nextNum).padStart(3, '0')}`;

    const invoice = await prisma.invoices.create({
      data: {
        invoice_number,
        customer_id: parseInt(String(customer_id)),
        vehicle_id: vehicle_id ? parseInt(String(vehicle_id)) : undefined,
        appointment_id: appointment_id ? parseInt(String(appointment_id)) : undefined,
        date: date ?? today(),
        due_date,
        status: status ?? 'pending',
        subtotal,
        tax,
        total,
        total_cost,
        total_profit,
        notes,
      },
    });

    // Insert invoice items
    if (lineItems.length > 0) {
      await prisma.invoice_items.createMany({
        data: lineItems.map((it) => ({
          invoice_id: invoice.id,
          description: it.description,
          quantity: it.quantity,
          cost_price: it.cost_price,
          unit_price: it.unit_price,
          total: it.total,
          profit: it.profit,
        })),
      });
    }

    const result = await prisma.invoices.findUnique({
      where: { id: invoice.id },
      include: { invoice_items: true },
    });

    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
