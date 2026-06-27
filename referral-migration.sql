-- DistroFi Referral System Migration
-- Run this in Supabase SQL Editor

-- 1. Add referral columns to profiles
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS referred_by UUID REFERENCES profiles(id),
  ADD COLUMN IF NOT EXISTS referral_reward_given BOOLEAN DEFAULT FALSE;

-- 2. Seed referral codes for existing users (username = their code)
UPDATE profiles
  SET referral_code = LOWER(username)
  WHERE referral_code IS NULL AND username IS NOT NULL;

-- 3. Index for fast ref link lookups
CREATE INDEX IF NOT EXISTS idx_profiles_referral_code ON profiles(referral_code);

-- 4. Index for counting referrals per user
CREATE INDEX IF NOT EXISTS idx_profiles_referred_by ON profiles(referred_by);
