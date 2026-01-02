-- Add fcm_token column to push_tokens table
alter table push_tokens 
add column if not exists fcm_token text;

-- Update the unique constraint if needed, but 'token' (Expo Push Token) should remain the primary unique key for now, 
-- or we can allow multiple rows per user. 
-- For now, we will just update the existing row with the FCM token if available.
