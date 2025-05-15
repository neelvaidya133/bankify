-- Drop the existing foreign key constraint
ALTER TABLE transactions
DROP CONSTRAINT IF EXISTS transactions_temp_card_id_fkey;

-- Add the new foreign key constraint
ALTER TABLE transactions
ADD CONSTRAINT transactions_temp_card_id_fkey
FOREIGN KEY (temp_card_id)
REFERENCES temporary_cards(id)
ON DELETE CASCADE; 