import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@/lib/generated/prisma/client';
import { requireAuth } from '@/lib/auth';

export async function GET(request: Request) {
  const authErr = await requireAuth();
  if (authErr) return authErr;
  try {
    const rows = await prisma.$queryRaw<
      {
        id: number;
        customer_id: number;
        year: number | null;
        make: string | null;
        model: string | null;
        trim: string | null;
        color: string | null;
        plate: string | null;
        tire_size: string | null;
        mileage: number | null;
        vin: string | null;
        notes: string | null;
        customer_name: string;
      }[]
    >(Prisma.sql`
      SELECT v.*, c.name as customer_name
      FROM vehicles v
      LEFT JOIN customers c ON c.id = v.customer_id
      ORDER BY v.id DESC
    `);
    return NextResponse.json(rows);
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
    const vehicle = await prisma.vehicles.create({
      data: {
        customer_id: parseInt(String(customer_id)),
        year: year ? parseInt(String(year)) : undefined,
        make,
        model,
        trim,
        color,
        plate,
        tire_size,
        mileage: mileage ? parseInt(String(mileage)) : undefined,
        vin,
        notes,
      },
    });
    return NextResponse.json(vehicle);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
