import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@/lib/generated/prisma/client';
import { checkApiKey } from '@/lib/auth';
import { addDays } from '@/lib/utils';

export async function GET(request: Request) {
  const authErr = checkApiKey(request);
  if (authErr) return authErr;
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    const week = searchParams.get('week');

    let rows;

    if (date) {
      rows = await prisma.$queryRaw<Record<string, unknown>[]>(Prisma.sql`
        SELECT a.*, c.name as customer_name, c.phone as customer_phone,
          v.year, v.make, v.model, v.plate, v.tire_size
        FROM appointments a
        LEFT JOIN customers c ON c.id = a.customer_id
        LEFT JOIN vehicles v ON v.id = a.vehicle_id
        WHERE a.date = ${date}
        ORDER BY a.time ASC
      `);
    } else if (week) {
      const weekEnd = addDays(week, 6);
      rows = await prisma.$queryRaw<Record<string, unknown>[]>(Prisma.sql`
        SELECT a.*, c.name as customer_name, c.phone as customer_phone,
          v.year, v.make, v.model, v.plate, v.tire_size
        FROM appointments a
        LEFT JOIN customers c ON c.id = a.customer_id
        LEFT JOIN vehicles v ON v.id = a.vehicle_id
        WHERE a.date >= ${week} AND a.date <= ${weekEnd}
        ORDER BY a.date ASC, a.time ASC
      `);
    } else {
      rows = await prisma.$queryRaw<Record<string, unknown>[]>(Prisma.sql`
        SELECT a.*, c.name as customer_name, c.phone as customer_phone,
          v.year, v.make, v.model, v.plate, v.tire_size
        FROM appointments a
        LEFT JOIN customers c ON c.id = a.customer_id
        LEFT JOIN vehicles v ON v.id = a.vehicle_id
        ORDER BY a.date DESC, a.time DESC
      `);
    }

    return NextResponse.json(rows);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const authErr = checkApiKey(request);
  if (authErr) return authErr;
  try {
    const { customer_id, vehicle_id, date, time, service, technician, notes } =
      await request.json();
    const appointment = await prisma.appointments.create({
      data: {
        customer_id: parseInt(String(customer_id)),
        vehicle_id: vehicle_id ? parseInt(String(vehicle_id)) : undefined,
        date,
        time,
        service,
        technician,
        notes,
      },
    });
    return NextResponse.json(appointment);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
