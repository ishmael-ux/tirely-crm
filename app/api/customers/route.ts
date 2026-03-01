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
        name: string;
        phone: string | null;
        email: string | null;
        notes: string | null;
        created_at: Date | null;
        vehicle_count: bigint;
        last_visit: string | null;
        total_spent: number;
        balance: number;
      }[]
    >(Prisma.sql`
      SELECT c.*,
        COUNT(DISTINCT v.id) as vehicle_count,
        MAX(a.date) as last_visit,
        COALESCE(SUM(CASE WHEN i.status='paid' THEN i.total ELSE 0 END),0) as total_spent,
        COALESCE(SUM(CASE WHEN i.status!='paid' THEN i.total ELSE 0 END),0) as balance
      FROM customers c
      LEFT JOIN vehicles v ON v.customer_id=c.id
      LEFT JOIN appointments a ON a.customer_id=c.id AND a.status='completed'
      LEFT JOIN invoices i ON i.customer_id=c.id
      GROUP BY c.id ORDER BY c.id DESC
    `);

    const result = rows.map((r) => ({
      ...r,
      vehicle_count: Number(r.vehicle_count),
      total_spent: parseFloat(String(r.total_spent)),
      balance: parseFloat(String(r.balance)),
    }));

    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const authErr = await requireAuth();
  if (authErr) return authErr;
  try {
    const { name, phone, email, notes } = await request.json();
    const customer = await prisma.customers.create({
      data: { name, phone, email, notes },
    });
    return NextResponse.json(customer);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
