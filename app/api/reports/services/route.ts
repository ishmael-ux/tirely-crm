import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@/lib/generated/prisma/client';
import { requireAuth } from '@/lib/auth';

export async function GET(request: Request) {
  const authErr = await requireAuth();
  if (authErr) return authErr;
  try {
    const rows = await prisma.$queryRaw<Record<string, unknown>[]>(Prisma.sql`
      SELECT ii.description,
        COUNT(*) as count,
        SUM(ii.total) as revenue,
        SUM(ii.profit) as profit,
        CASE WHEN SUM(ii.total)>0
          THEN ROUND(SUM(ii.profit)/SUM(ii.total)*100,1)
          ELSE 0
        END as margin
      FROM invoice_items ii
      JOIN invoices i ON i.id = ii.invoice_id
      WHERE i.status = 'paid'
      GROUP BY ii.description
      ORDER BY revenue DESC
      LIMIT 8
    `);
    return NextResponse.json(
      rows.map(r => ({
        ...r,
        count:   Number(r.count ?? 0),
        revenue: parseFloat(String(r.revenue ?? 0)),
        profit:  parseFloat(String(r.profit ?? 0)),
        margin:  parseFloat(String(r.margin ?? 0)),
      })),
    );
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
