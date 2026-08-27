-- ============================================================================================================================
-- SQL UPGRADE: ADD VIDEO COLUMN & UPDATE CANDIDATE RPC
-- Run this ENTIRE script in your Supabase SQL Editor and click "Run".
-- ============================================================================================================================

-- 1. Add video_url column to public.profiles if it does not exist
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS video_url TEXT;

-- 2. Drop the old function first to avoid signature mismatch errors
DROP FUNCTION IF EXISTS public.admin_update_candidate(UUID, TEXT, TEXT, TEXT, UUID[]);

-- 3. Create/Replace the RPC function
CREATE OR REPLACE FUNCTION public.admin_update_candidate(
  target_user_id UUID,
  new_email TEXT,
  new_password TEXT DEFAULT NULL,
  new_name TEXT DEFAULT NULL,
  new_exams_allotted UUID[] DEFAULT NULL
)
RETURNS VOID AS $$
DECLARE
  encrypted_pw TEXT;
BEGIN
  -- Verify that the caller is an administrator
  IF NOT (public.get_user_role() IN ('admin', 'super_admin')) THEN
    RAISE EXCEPTION 'Access Denied: Only administrators can update candidate profiles.';
  END IF;

  -- Update email in auth.users
  UPDATE auth.users 
  SET email = new_email, 
      updated_at = NOW() 
  WHERE id = target_user_id;
  
  -- Update password in auth.users if a new password was provided
  IF new_password IS NOT NULL AND new_password != '' THEN
    encrypted_pw := crypt(new_password, gen_salt('bf'));
    UPDATE auth.users 
    SET encrypted_password = encrypted_pw, 
        updated_at = NOW() 
    WHERE id = target_user_id;
  END IF;

  -- Update the public.profiles record
  UPDATE public.profiles 
  SET full_name = COALESCE(new_name, full_name),
      email = new_email,
      allotted_exam_ids = COALESCE(new_exams_allotted, allotted_exam_ids)
  WHERE id = target_user_id;

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.admin_update_candidate(UUID, TEXT, TEXT, TEXT, UUID[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_update_candidate(UUID, TEXT, TEXT, TEXT, UUID[]) TO service_role;
