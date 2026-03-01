import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@/lib/generated/prisma/client';
import { requireAuth } from '@/lib/auth';
import { addDays, today } from '@/lib/utils';

export async function GET(request: Request) {
  const authErr = await requireAuth();
  if (authErr) return authErr;
  try {
    const { searchParams } = new URL(request.url);
    const t = today();
    const weekParam = searchParams.get('week');
    const weekStart = weekParam ?? addDays(t, -new Date().getDay());
    const weekEnd   = addDays(weekStart, 6);

    const rows = await prisma.$queryRaw<Record<string, unknown>[]>(Prisma.sql`
      SELECT date,
        COALESCE(SUM(CASE WHEN status='paid' THEN total ELSE 0 END),0) as revenue,
        COUNT(*) as invoice_count
      FROM invoices
      WHERE date >= ${weekStart} AND date <= ${weekEnd}
      GROUP BY date ORDER BY date ASC
    `);

    return NextResponse.json(
      rows.map(r => ({
        ...r,
        revenue:       parseFloat(String(r.revenue ?? 0)),
        invoice_count: Number(r.invoice_count ?? 0),
      })),
    );
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
