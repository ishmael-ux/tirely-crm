import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

export async function GET(request: Request) {
  const authErr = await requireAuth();
  if (authErr) return authErr;
  try {
    const items = await prisma.inventory.findMany({
      orderBy: [{ brand: 'asc' }, { model: 'asc' }],
    });
    return NextResponse.json(
      items.map(i => ({
        ...i,
        cost_price: parseFloat(String(i.cost_price ?? 0)),
        sell_price: parseFloat(String(i.sell_price ?? 0)),
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
    const { brand, model, size, type, quantity, min_stock, cost_price, sell_price, location, notes } =
      await request.json();
    if (!brand || !model || !size)
      return NextResponse.json({ error: 'Brand, model, and size required' }, { status: 400 });
    const item = await prisma.inventory.create({
      data: {
        brand, model, size,
        type: type || 'All-Season',
        quantity: quantity ?? 0,
        min_stock: min_stock ?? 4,
        cost_price: cost_price ?? 0,
        sell_price: sell_price ?? 0,
        location: location || null,
        notes: notes || null,
      },
    });
    return NextResponse.json(item);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
