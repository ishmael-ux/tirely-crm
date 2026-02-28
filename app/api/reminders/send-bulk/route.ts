import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { checkApiKey } from '@/lib/auth';

interface BulkAppt {
  customer_id: number;
  appointment_id: number;
  phone: string;
  message: string;
}

export async function POST(request: Request) {
  const authErr = checkApiKey(request);
  if (authErr) return authErr;
  try {
    const { appointments } = await request.json();
    const TWILIO_SID   = process.env.TWILIO_SID   || '';
    const TWILIO_TOKEN = process.env.TWILIO_TOKEN || '';
    const TWILIO_FROM  = process.env.TWILIO_FROM  || '';
    const hasTwilio    = TWILIO_SID && !TWILIO_SID.startsWith('YOUR_');

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let twilioClient: any = null;
    if (hasTwilio) {
      const twilio = await import('twilio');
      twilioClient = twilio.default(TWILIO_SID, TWILIO_TOKEN);
    }

    const results = [];
    for (const appt of appointments as BulkAppt[]) {
      try {
        const reminder = await prisma.reminders.create({
          data: {
            customer_id: appt.customer_id,
            appointment_id: appt.appointment_id,
            phone: appt.phone,
            message: appt.message,
            status: hasTwilio ? 'sending' : 'simulated',
          },
        });

        if (twilioClient) {
          await twilioClient.messages.create({
            body: appt.message,
            from: TWILIO_FROM,
            to: appt.phone,
          });
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

        await prisma.appointments.update({
          where: { id: appt.appointment_id },
          data: { reminder_sent: 1 },
        });

        results.push({ phone: appt.phone, success: true });
      } catch (e) {
        results.push({ phone: appt.phone, success: false, error: (e as Error).message });
      }
    }

    return NextResponse.json({ results, simulated: !hasTwilio });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
