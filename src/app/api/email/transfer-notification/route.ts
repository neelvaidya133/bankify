import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import TransferNotificationEmail from '@/emails/TransferNotification';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
    try {
        const {
            recipientEmail,
            recipientName,
            senderName,
            amount,
            bankAccountNumber,
        } = await request.json();

        const data = await resend.emails.send({
            from: 'Bankify <notifications@bankify.com>',
            to: recipientEmail,
            subject: 'Money Transfer Received - Bankify',
            react: TransferNotificationEmail({
                recipientName,
                senderName,
                amount,
                bankAccountNumber,
                date: new Date().toLocaleDateString(),
            }),
        });

        return NextResponse.json(data);
    } catch (error) {
        return NextResponse.json({ error });
    }
} 