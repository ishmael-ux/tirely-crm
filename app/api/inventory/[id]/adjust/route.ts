import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const authErr = await requireAuth();
  if (authErr) return authErr;
  try {
    const { id } = await params;
    const { delta } = await request.json();
    const item = await prisma.inventory.findUnique({ where: { id: parseInt(id) } });
    if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    const newQty = Math.max(0, (item.quantity ?? 0) + (delta ?? 0));
    await prisma.inventory.update({
      where: { id: parseInt(id) },
      data: { quantity: newQty, updated_at: new Date() },
    });
    return NextResponse.json({ success: true, quantity: newQty });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
