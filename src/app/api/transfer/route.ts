import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { Resend } from 'resend'
import TransferNotificationEmail from '@/emails/TransferNotification'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: Request) {
    const supabase = await createClient()
    const {
        data: { user },
    } = await supabase.auth.getUser()

    console.log('Transfer request from user:', user?.email)

    if (!user) {
        console.log('Error: Unauthorized - No user found')
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const { recipientEmail, amount, description } = await request.json()
        console.log('Transfer details:', { recipientEmail, amount, description })

        // Validate input
        if (!recipientEmail || !amount || amount <= 0) {
            console.log('Error: Invalid input', { recipientEmail, amount })
            return NextResponse.json(
                { error: 'Invalid input. Please provide recipient email and valid amount.' },
                { status: 400 }
            )
        }

        // Get sender's bank account
        const { data: senderBankAccount, error: senderError } = await supabase
            .from('bank_accounts')
            .select('*')
            .eq('user_id', user.id)
            .single()

        console.log('Sender bank account:', senderBankAccount)
        console.log('Sender error if any:', senderError)

        if (senderError || !senderBankAccount) {
            console.log('Error: Failed to fetch sender account', senderError)
            return NextResponse.json(
                { error: 'Failed to fetch sender account' },
                { status: 500 }
            )
        }

        // Check if sender has sufficient balance
        if (senderBankAccount.balance < amount) {
            console.log('Error: Insufficient funds', {
                currentBalance: senderBankAccount.balance,
                requestedAmount: amount
            })
            return NextResponse.json(
                { error: 'Insufficient funds' },
                { status: 400 }
            )
        }

        // Get recipient's profile
        console.log('Looking up recipient:', recipientEmail)
        const { data: recipientUser, error: recipientError } = await supabase
            .from('profiles')
            .select('user_id, email, full_name')
            .eq('email', recipientEmail)
            .single()

        console.log('Profile lookup result:', recipientUser)
        console.log('Profile lookup error if any:', recipientError)

        if (recipientError || !recipientUser) {
            console.log('Error: Recipient not found', recipientError)
            return NextResponse.json(
                { error: `No user found with email: ${recipientEmail}. Please make sure the recipient has registered and completed their profile setup.` },
                { status: 404 }
            )
        }

        // Prevent sending to self
        if (recipientUser.user_id === user.id) {
            console.log('Error: Attempted self-transfer')
            return NextResponse.json(
                { error: 'You cannot send money to yourself' },
                { status: 400 }
            )
        }

        // Get recipient's bank account
        console.log('Looking up recipient bank account for user_id:', recipientUser.user_id)
        const { data: recipientBankAccount, error: recipientBankError } = await supabase
            .from('bank_accounts')
            .select('*')
            .eq('user_id', recipientUser.user_id)
            .single()

        console.log('Recipient bank account:', recipientBankAccount)
        console.log('Recipient bank error if any:', recipientBankError)

        if (recipientBankError || !recipientBankAccount) {
            console.log('Error: Recipient bank account not found', recipientBankError)
            return NextResponse.json(
                { error: `Recipient ${recipientEmail} does not have a bank account set up. Please ask them to create an account first.` },
                { status: 404 }
            )
        }

        // Create transaction record for sender
        console.log('Creating sender transaction')
        const { data: senderTransaction, error: senderTransactionError } = await supabase
            .from('transactions')
            .insert({
                user_id: user.id,
                amount: -amount,
                transaction_type: 'transfer',
                status: 'completed',
                description: description || `Transfer to ${recipientEmail}`,
                merchant_name: recipientEmail,
                merchant_category: 'Transfer'
            })
            .select()
            .single()

        console.log('Sender transaction result:', senderTransaction)
        console.log('Sender transaction error if any:', senderTransactionError)

        if (senderTransactionError) {
            console.error('Error creating sender transaction:', senderTransactionError)
            return NextResponse.json(
                { error: 'Failed to create transaction' },
                { status: 500 }
            )
        }

        // Update sender's balance using the secure function
        const { error: senderBalanceError } = await supabase
            .rpc('update_bank_account_balance', {
                p_account_id: senderBankAccount.id,
                p_amount: amount,
                p_operation: 'subtract'
            });

        if (senderBalanceError) {
            console.error('Error updating sender balance:', senderBalanceError);
            return NextResponse.json(
                { error: 'Failed to update sender balance' },
                { status: 500 }
            );
        }

        // Create recipient's transaction
        const recipientTransaction = await supabase
            .from('transactions')
            .insert({
                user_id: recipientUser.user_id,
                bank_account_id: recipientBankAccount.id,
                transaction_type: 'transfer',
                amount: amount,
                currency: 'CAD',
                status: 'completed',
                description: `Transfer from ${user.email}`,
                merchant_name: user.email,
                merchant_category: 'Transfer'
            })
            .select()
            .single();

        if (recipientTransaction.error) {
            console.error('Error creating recipient transaction:', recipientTransaction.error);
            throw new Error('Failed to create recipient transaction');
        }

        // Update recipient's balance using the secure function
        const { error: recipientBalanceError } = await supabase
            .rpc('update_bank_account_balance', {
                p_account_id: recipientBankAccount.id,
                p_amount: amount,
                p_operation: 'add'
            });

        if (recipientBalanceError) {
            console.error('Error updating recipient balance:', recipientBalanceError);
            throw new Error('Failed to update recipient balance');
        }

        // After successful transfer, send email notification
        try {
            console.log('Sending email notification to recipient:', recipientUser.email, user.email)
            await resend.emails.send({
                from: 'Bankify <notifications@bankify.neelvaidya.com>',
                to: recipientUser.email,
                subject: 'Money Transfer Received - Bankify',
                react: TransferNotificationEmail({
                    recipientName: recipientUser.full_name || recipientUser.email,
                    senderName: user.email || 'Bankify',
                    amount,
                    bankAccountNumber: recipientBankAccount.account_number,
                    date: new Date().toLocaleDateString(),
                }),
            });
            console.log('Email notification sent successfully')
        } catch (error) {
            console.log('Error sending email notification:', error);
            console.error('Error sending email notification:', error);
            // Don't throw error here, as the transfer was successful
        }

        console.log('Transfer completed successfully')
        return NextResponse.json({
            success: true,
            message: 'Transfer completed successfully',
            transactionId: senderTransaction.id
        })
    } catch (error) {
        console.error('Unexpected transfer error:', error)
        return NextResponse.json(
            { error: 'An unexpected error occurred' },
            { status: 500 }
        )
    }
} 