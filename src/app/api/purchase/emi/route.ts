import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function POST(request: Request) {
    const supabase = await createClient()
    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const {
            productId,
            cardNumber,
            expiryDate,
            cvv,
            amount,
            tenure,
            emiAmount
        } = await request.json()

        // Validate input
        if (!productId || !cardNumber || !expiryDate || !cvv || !amount || !tenure || !emiAmount) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            )
        }

        // Get the temporary card
        const { data: tempCard, error: tempCardError } = await supabase
            .from('temporary_cards')
            .select('*, main_cards(*)')
            .eq('card_number', cardNumber)
            .eq('expiry_date', expiryDate)
            .eq('cvv', cvv)
            .eq('status', 'active')
            .single()

        if (tempCardError || !tempCard) {
            console.error('Temp card error:', tempCardError)
            return NextResponse.json(
                { error: 'Invalid card details' },
                { status: 400 }
            )
        }

        // Get the main card
        const { data: mainCard, error: mainCardError } = await supabase
            .from('main_cards')
            .select('*, bank_accounts(*)')
            .eq('id', tempCard.main_card_id)
            .single()

        if (mainCardError || !mainCard) {
            return NextResponse.json(
                { error: 'Card not found' },
                { status: 404 }
            )
        }

        // Check if card has sufficient funds/credit based on card type
        if (mainCard.card_type === 'credit') {
            // For EMI, check against the EMI amount instead of total amount
            if (!mainCard.available_credit || mainCard.available_credit < emiAmount) {
                return NextResponse.json(
                    {
                        error: 'Insufficient credit limit for EMI payment',
                        details: {
                            required: emiAmount,
                            available: mainCard.available_credit,
                            message: 'For EMI purchases, your credit limit must cover the monthly EMI amount'
                        }
                    },
                    { status: 400 }
                )
            }

            // Update main card's available credit - only deduct the EMI amount
            const { error: cardError } = await supabase
                .from('main_cards')
                .update({
                    available_credit: mainCard.available_credit - emiAmount
                })
                .eq('id', tempCard.main_card_id)

            if (cardError) {
                console.error('Error updating available credit:', cardError)
                return NextResponse.json(
                    { error: 'Failed to update available credit' },
                    { status: 500 }
                )
            }
        } else if (mainCard.card_type === 'debit') {
            // For EMI, check against the EMI amount instead of total amount
            if (!mainCard.bank_accounts || !mainCard.bank_accounts.balance || mainCard.bank_accounts.balance < emiAmount) {
                return NextResponse.json(
                    {
                        error: 'Insufficient funds in bank account for EMI payment',
                        details: {
                            required: emiAmount,
                            available: mainCard.bank_accounts.balance,
                            message: 'For EMI purchases, your bank balance must cover the monthly EMI amount'
                        }
                    },
                    { status: 400 }
                )
            }

            // Update bank account balance for debit card - only deduct the EMI amount
            const { error: bankError } = await supabase
                .from('bank_accounts')
                .update({
                    balance: mainCard.bank_accounts.balance - emiAmount
                })
                .eq('id', mainCard.bank_accounts.id)

            if (bankError) {
                console.error('Bank balance update error:', bankError)
                return NextResponse.json(
                    { error: 'Failed to update bank balance' },
                    { status: 500 }
                )
            }
        }

        // Create transaction record first
        const { data: transaction, error: transactionError } = await supabase
            .from('transactions')
            .insert({
                user_id: user.id,
                card_id: tempCard.main_card_id,
                temp_card_id: tempCard.id,
                transaction_type: 'withdrawal',
                amount: emiAmount,
                status: 'completed',
                description: 'EMI Purchase',
                merchant_name: 'EMI Purchase',
                merchant_category: 'EMI'
            })
            .select()
            .single()

        if (transactionError) {
            console.error('Error creating transaction:', transactionError)
            return NextResponse.json(
                { error: 'Failed to create transaction' },
                { status: 500 }
            )
        }

        // Create EMI plan
        const { data: emiPlan, error: emiPlanError } = await supabase
            .from('emi_plans')
            .insert({
                user_id: user.id,
                temp_card_id: tempCard.id,
                product_name: 'Product Purchase', // You might want to get this from the product details
                total_amount: amount,
                emi_amount: emiAmount,
                total_installments: tenure,
                remaining_installments: tenure,
                next_payment_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
                status: 'active'
            })
            .select()
            .single()

        if (emiPlanError) {
            console.error('Error creating EMI plan:', emiPlanError)
            return NextResponse.json(
                { error: 'Failed to create EMI plan' },
                { status: 500 }
            )
        }

        // Create first EMI payment record
        const { error: emiPaymentError } = await supabase
            .from('emi_payments')
            .insert({
                emi_plan_id: emiPlan.id,
                transaction_id: transaction.id,
                installment_number: 1,
                amount: emiAmount,
                payment_date: new Date(),
                status: 'pending'
            })

        if (emiPaymentError) {
            console.error('Error creating EMI payment:', emiPaymentError)
            return NextResponse.json(
                { error: 'Failed to create EMI payment' },
                { status: 500 }
            )
        }

        // Create credit card bill
        const today = new Date();
        const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        const dueDate = new Date(today.getFullYear(), today.getMonth() + 1, 15);

        // Check if a bill already exists for this month
        const { data: existingBill, error: billQueryError } = await supabase
            .from('credit_card_bills')
            .select('*')
            .eq('card_id', tempCard.main_card_id)
            .gte('statement_start', firstDayOfMonth.toISOString())
            .lte('statement_end', lastDayOfMonth.toISOString())
            .single();

        if (billQueryError && billQueryError.code !== 'PGRST116') { // PGRST116 is "no rows returned"
            console.error('Error querying for existing bill:', billQueryError);
            throw new Error('Failed to query for existing bill');
        }

        if (existingBill) {
            // Update existing bill
            const { error: billUpdateError } = await supabase
                .from('credit_card_bills')
                .update({
                    statement_amount: existingBill.statement_amount + emiAmount
                })
                .eq('id', existingBill.id);

            if (billUpdateError) {
                console.error('Error updating existing bill:', billUpdateError);
                throw new Error('Failed to update existing bill');
            }
        } else {
            // Create new bill
            const { error: billError } = await supabase
                .from('credit_card_bills')
                .insert({
                    user_id: user.id,
                    card_id: tempCard.main_card_id,
                    statement_start: firstDayOfMonth.toISOString(),
                    statement_end: lastDayOfMonth.toISOString(),
                    due_date: dueDate.toISOString(),
                    statement_amount: emiAmount,
                    paid_amount: 0,
                    status: 'unpaid'
                })
                .select()
                .single();

            if (billError) {
                console.error('Error creating credit card bill:', billError);
                throw new Error('Failed to create credit card bill');
            }
        }

        // Update temporary card status to used
        const { error: tempCardUpdateError } = await supabase
            .from('temporary_cards')
            .update({
                status: 'used'
            })
            .eq('id', tempCard.id)

        if (tempCardUpdateError) {
            console.error('Error updating temporary card status:', tempCardUpdateError)
            return NextResponse.json(
                { error: 'Failed to update temporary card status' },
                { status: 500 }
            )
        }

        return NextResponse.json({ success: true, emiPlan })
    } catch (error) {
        console.error('EMI payment error:', error)
        return NextResponse.json(
            { error: 'An unexpected error occurred' },
            { status: 500 }
        )
    }
} 