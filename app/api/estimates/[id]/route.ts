import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { checkApiKey } from '@/lib/auth';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const authErr = checkApiKey(request);
  if (authErr) return authErr;
  try {
    const { id } = await params;
    const estimate = await prisma.estimates.findUnique({
      where: { id: parseInt(id) },
      include: { estimate_items: true },
    });
    if (!estimate) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({
      ...estimate,
      subtotal:       parseFloat(String(estimate.subtotal ?? 0)),
      tax:            parseFloat(String(estimate.tax ?? 0)),
      total:          parseFloat(String(estimate.total ?? 0)),
      total_cost:     parseFloat(String(estimate.total_cost ?? 0)),
      estimate_items: estimate.estimate_items.map(i => ({
        ...i,
        quantity:   parseFloat(String(i.quantity ?? 1)),
        cost_price: parseFloat(String(i.cost_price ?? 0)),
        unit_price: parseFloat(String(i.unit_price ?? 0)),
        total:      parseFloat(String(i.total ?? 0)),
        profit:     parseFloat(String(i.profit ?? 0)),
      })),
    });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const authErr = checkApiKey(request);
  if (authErr) return authErr;
  try {
    const { id } = await params;
    await prisma.estimate_items.deleteMany({ where: { estimate_id: parseInt(id) } });
    await prisma.estimates.delete({ where: { id: parseInt(id) } });
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
