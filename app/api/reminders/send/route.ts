import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

export async function POST(request: Request) {
  const authErr = await requireAuth();
  if (authErr) return authErr;
  try {
    const { customer_id, appointment_id, phone, message } = await request.json();
    if (!phone || !message)
      return NextResponse.json({ error: 'Phone and message required' }, { status: 400 });

    const TWILIO_SID   = process.env.TWILIO_SID   || '';
    const TWILIO_TOKEN = process.env.TWILIO_TOKEN || '';
    const TWILIO_FROM  = process.env.TWILIO_FROM  || '';
    const hasTwilio    = TWILIO_SID && !TWILIO_SID.startsWith('YOUR_');

    const status = hasTwilio ? 'sending' : 'simulated';

    const reminder = await prisma.reminders.create({
      data: {
        customer_id: customer_id ? parseInt(String(customer_id)) : 0,
        appointment_id: appointment_id ? parseInt(String(appointment_id)) : null,
        phone,
        message,
        status,
      },
    });

    if (hasTwilio) {
      const twilio = (await import('twilio')).default;
      const client = twilio(TWILIO_SID, TWILIO_TOKEN);
      await client.messages.create({ body: message, from: TWILIO_FROM, to: phone });
      await prisma.reminders.update({
        where: { id: reminder.id },
        data: { status: 'sent', sent_at: new Date() },
      });
    } else {
      await prisma.reminders.update({
        where: { id: reminder.id },
        data: { status: 'simulated', sent_at: new Date() },
      });
    }

    if (appointment_id) {
      await prisma.appointments.update({
        where: { id: parseInt(String(appointment_id)) },
        data: { reminder_sent: 1 },
      });
    }

    return NextResponse.json({ success: true, simulated: !hasTwilio });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
