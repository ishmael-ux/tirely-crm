import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { checkApiKey } from '@/lib/auth';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authErr = checkApiKey(request);
  if (authErr) return authErr;
  try {
    const { id } = await params;
    const { customer_id, vehicle_id, date, time, service, technician, notes, status } =
      await request.json();
    const appointment = await prisma.appointments.update({
      where: { id: parseInt(id) },
      data: {
        customer_id: customer_id ? parseInt(String(customer_id)) : undefined,
        vehicle_id: vehicle_id !== undefined ? (vehicle_id ? parseInt(String(vehicle_id)) : null) : undefined,
        date,
        time,
        service,
        technician,
        notes,
        status,
      },
    });
    return NextResponse.json(appointment);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authErr = checkApiKey(request);
  if (authErr) return authErr;
  try {
    const { id } = await params;
    await prisma.appointments.delete({ where: { id: parseInt(id) } });
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
