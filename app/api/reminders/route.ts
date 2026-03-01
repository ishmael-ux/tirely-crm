import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@/lib/generated/prisma/client';
import { requireAuth } from '@/lib/auth';

export async function GET(request: Request) {
  const authErr = await requireAuth();
  if (authErr) return authErr;
  try {
    const rows = await prisma.$queryRaw<Record<string, unknown>[]>(Prisma.sql`
      SELECT r.*, c.name as customer_name,
        a.service, a.date as appt_date, a.time as appt_time
      FROM reminders r
      LEFT JOIN customers c ON c.id = r.customer_id
      LEFT JOIN appointments a ON a.id = r.appointment_id
      ORDER BY r.created_at DESC
      LIMIT 100
    `);
    return NextResponse.json(rows);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
