-- Add role column to user_profiles table
ALTER TABLE user_profiles 
ADD COLUMN role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin'));

-- Update existing users to have 'user' role by default
UPDATE user_profiles SET role = 'user' WHERE role IS NULL;

-- Create an admin user if not exists (for demo purposes)
-- This will be handled by the application logic

-- Add index for better performance on role queries
CREATE INDEX idx_user_profiles_role ON user_profiles(role);