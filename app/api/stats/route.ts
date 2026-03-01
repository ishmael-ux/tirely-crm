import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@/lib/generated/prisma/client';
import { requireAuth } from '@/lib/auth';
import { today } from '@/lib/utils';

export async function GET(request: Request) {
  const authErr = await requireAuth();
  if (authErr) return authErr;
  try {
    const t = today();
    const monthStart = t.substring(0, 7) + '-01';

    const [
      todayAppts,
      openInvoices,
      outstanding,
      totalCustomers,
      monthRevenue,
      lowStock,
    ] = await Promise.all([
      prisma.appointments.count({ where: { date: t } }),
      prisma.invoices.count({ where: { status: { not: 'paid' } } }),
      prisma.invoices.aggregate({
        where: { status: { not: 'paid' } },
        _sum: { total: true },
      }),
      prisma.customers.count(),
      prisma.invoices.aggregate({
        where: { status: 'paid', date: { gte: monthStart } },
        _sum: { total: true },
      }),
      prisma.$queryRaw<{ c: bigint }[]>(
        Prisma.sql`SELECT COUNT(*) as c FROM inventory WHERE quantity <= min_stock`,
      ).then(r => Number(r[0]?.c ?? 0)),
    ]);

    return NextResponse.json({
      today_appointments: todayAppts,
      open_invoices:      openInvoices,
      outstanding:        parseFloat(String(outstanding._sum.total ?? 0)),
      total_customers:    totalCustomers,
      month_revenue:      parseFloat(String(monthRevenue._sum.total ?? 0)),
      low_stock:          lowStock,
    });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
