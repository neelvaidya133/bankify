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