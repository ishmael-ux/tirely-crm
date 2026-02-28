import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@/lib/generated/prisma/client';
import { checkApiKey } from '@/lib/auth';

export async function GET(request: Request) {
  const authErr = checkApiKey(request);
  if (authErr) return authErr;
  try {
    const rows = await prisma.$queryRaw<Record<string, unknown>[]>(Prisma.sql`
      SELECT technician,
        COUNT(*) as total,
        COUNT(CASE WHEN status='completed' THEN 1 END) as completed
      FROM appointments
      WHERE technician != '' AND technician IS NOT NULL
      GROUP BY technician
      ORDER BY total DESC
    `);
    return NextResponse.json(
      rows.map(r => ({
        ...r,
        total:     Number(r.total ?? 0),
        completed: Number(r.completed ?? 0),
      })),
    );
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
