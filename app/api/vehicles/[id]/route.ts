import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authErr = await requireAuth();
  if (authErr) return authErr;
  try {
    const { id } = await params;
    const {
      customer_id,
      year,
      make,
      model,
      trim,
      color,
      plate,
      tire_size,
      mileage,
      vin,
      notes,
    } = await request.json();
    const vehicle = await prisma.vehicles.update({
      where: { id: parseInt(id) },
      data: {
        customer_id: customer_id ? parseInt(String(customer_id)) : undefined,
        year: year !== undefined ? (year ? parseInt(String(year)) : null) : undefined,
        make,
        model,
        trim,
        color,
        plate,
        tire_size,
        mileage: mileage !== undefined ? (mileage ? parseInt(String(mileage)) : null) : undefined,
        vin,
        notes,
      },
    });
    return NextResponse.json(vehicle);
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
    await prisma.vehicles.delete({ where: { id: parseInt(id) } });
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
