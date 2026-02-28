import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@/lib/generated/prisma/client';
import { checkApiKey } from '@/lib/auth';

export async function GET(request: Request) {
  const authErr = checkApiKey(request);
  if (authErr) return authErr;
  try {
    const rows = await prisma.$queryRaw<Record<string, unknown>[]>(Prisma.sql`
      SELECT TO_CHAR(date::date, 'YYYY-MM') as month,
        COALESCE(SUM(CASE WHEN status='paid' THEN total ELSE 0 END),0) as revenue,
        COUNT(CASE WHEN status='paid' THEN 1 END) as paid_count,
        COUNT(CASE WHEN status!='paid' THEN 1 END) as open_count
      FROM invoices
      WHERE date::date >= CURRENT_DATE - INTERVAL '12 months'
      GROUP BY month ORDER BY month ASC
    `);
    return NextResponse.json(
      rows.map(r => ({
        ...r,
        revenue:     parseFloat(String(r.revenue ?? 0)),
        paid_count:  Number(r.paid_count ?? 0),
        open_count:  Number(r.open_count ?? 0),
      })),
    );
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
