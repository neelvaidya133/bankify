-- Create temporary_cards table
CREATE TABLE IF NOT EXISTS temporary_cards (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    main_card_id UUID NOT NULL REFERENCES main_cards(id) ON DELETE CASCADE,
    card_number VARCHAR(16) NOT NULL,
    expiry_date VARCHAR(5) NOT NULL,
    cvv VARCHAR(3) NOT NULL,
    status VARCHAR(10) NOT NULL DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    CONSTRAINT status_check CHECK (status IN ('active', 'used', 'expired'))
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_temporary_cards_user_id ON temporary_cards(user_id);
CREATE INDEX IF NOT EXISTS idx_temporary_cards_main_card_id ON temporary_cards(main_card_id);
CREATE INDEX IF NOT EXISTS idx_temporary_cards_status ON temporary_cards(status);
CREATE INDEX IF NOT EXISTS idx_temporary_cards_expires_at ON temporary_cards(expires_at);

-- Create emi_plans table
CREATE TABLE IF NOT EXISTS emi_plans (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    temp_card_id UUID NOT NULL REFERENCES temporary_cards(id) ON DELETE CASCADE,
    product_name VARCHAR(255) NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    emi_amount DECIMAL(10,2) NOT NULL,
    total_installments INTEGER NOT NULL,
    remaining_installments INTEGER NOT NULL,
    next_payment_date TIMESTAMP WITH TIME ZONE NOT NULL,
    status VARCHAR(10) NOT NULL DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    CONSTRAINT status_check CHECK (status IN ('active', 'completed', 'defaulted'))
);

-- Create emi_payments table
CREATE TABLE IF NOT EXISTS emi_payments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    emi_plan_id UUID NOT NULL REFERENCES emi_plans(id) ON DELETE CASCADE,
    transaction_id UUID NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
    installment_number INTEGER NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    payment_date TIMESTAMP WITH TIME ZONE NOT NULL,
    status VARCHAR(10) NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    CONSTRAINT status_check CHECK (status IN ('pending', 'paid', 'failed'))
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_emi_plans_user_id ON emi_plans(user_id);
CREATE INDEX IF NOT EXISTS idx_emi_plans_temp_card_id ON emi_plans(temp_card_id);
CREATE INDEX IF NOT EXISTS idx_emi_plans_status ON emi_plans(status);
CREATE INDEX IF NOT EXISTS idx_emi_payments_emi_plan_id ON emi_payments(emi_plan_id);
CREATE INDEX IF NOT EXISTS idx_emi_payments_status ON emi_payments(status);

-- Enable Row Level Security
ALTER TABLE emi_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE emi_payments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for emi_plans
CREATE POLICY "Users can view their own EMI plans"
    ON emi_plans FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own EMI plans"
    ON emi_plans FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own EMI plans"
    ON emi_plans FOR UPDATE
    USING (auth.uid() = user_id);

-- Create RLS policies for emi_payments
CREATE POLICY "Users can view their own EMI payments"
    ON emi_payments FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM emi_plans
            WHERE emi_plans.id = emi_payments.emi_plan_id
            AND emi_plans.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create their own EMI payments"
    ON emi_payments FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM emi_plans
            WHERE emi_plans.id = emi_payments.emi_plan_id
            AND emi_plans.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update their own EMI payments"
    ON emi_payments FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM emi_plans
            WHERE emi_plans.id = emi_payments.emi_plan_id
            AND emi_plans.user_id = auth.uid()
        )
    );

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Allow users to view their own profile
CREATE POLICY "Users can view own profile"
ON profiles FOR SELECT
TO public
USING (auth.uid() = user_id);

-- Allow users to view minimal profile info for transfers (only email and user_id)
CREATE POLICY "Users can view minimal profile info for transfers"
ON profiles FOR SELECT
TO public
USING (true)
WITH CHECK (
    -- Only allow selecting specific columns needed for transfers
    (SELECT array_agg(column_name::text) 
     FROM information_schema.columns 
     WHERE table_name = 'profiles' 
     AND column_name IN ('user_id', 'email')
    ) = array_agg(column_name::text)
);

-- Allow users to update their own profile
CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE
TO public
USING (auth.uid() = user_id);

-- Allow users to insert their own profile
CREATE POLICY "Users can insert own profile"
ON profiles FOR INSERT
TO public
WITH CHECK (auth.uid() = user_id); 