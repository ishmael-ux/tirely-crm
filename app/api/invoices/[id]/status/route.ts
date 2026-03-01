import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const authErr = await requireAuth();
  if (authErr) return authErr;
  try {
    const { id } = await params;
    const { status } = await request.json();
    await prisma.invoices.update({
      where: { id: parseInt(id) },
      data: { status },
    });
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
