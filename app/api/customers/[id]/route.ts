import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authErr = await requireAuth();
  if (authErr) return authErr;
  try {
    const { id } = await params;
    const customer = await prisma.customers.findUnique({
      where: { id: parseInt(id) },
      include: {
        vehicles: true,
        appointments: {
          include: {
            customers: false,
          },
          orderBy: { date: 'desc' },
        },
        invoices: {
          include: {
            invoice_items: true,
          },
          orderBy: { date: 'desc' },
        },
      },
    });
    if (!customer) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    return NextResponse.json(customer);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authErr = await requireAuth();
  if (authErr) return authErr;
  try {
    const { id } = await params;
    const { name, phone, email, notes } = await request.json();
    const customer = await prisma.customers.update({
      where: { id: parseInt(id) },
      data: { name, phone, email, notes },
    });
    return NextResponse.json(customer);
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
    await prisma.customers.delete({ where: { id: parseInt(id) } });
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
