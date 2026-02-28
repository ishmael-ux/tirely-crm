import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@/lib/generated/prisma/client';
import { checkApiKey } from '@/lib/auth';
import { addDays, today } from '@/lib/utils';

export async function GET(request: Request) {
  const authErr = checkApiKey(request);
  if (authErr) return authErr;
  try {
    const tomorrow = addDays(today(), 1);
    const rows = await prisma.$queryRaw<Record<string, unknown>[]>(Prisma.sql`
      SELECT a.*, c.name as customer_name, c.phone,
        v.year, v.make, v.model
      FROM appointments a
      LEFT JOIN customers c ON c.id = a.customer_id
      LEFT JOIN vehicles v ON v.id = a.vehicle_id
      WHERE a.date = ${tomorrow}
        AND a.status = 'scheduled'
        AND a.reminder_sent = 0
        AND c.phone != ''
        AND c.phone IS NOT NULL
    `);
    return NextResponse.json(rows);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
