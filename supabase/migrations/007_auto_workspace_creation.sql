-- Migration: Auto workspace creation on user signup
-- Created: 2024-01-XX

-- Function to create default workspace for new user
CREATE OR REPLACE FUNCTION public.create_default_workspace_for_user()
RETURNS TRIGGER AS $$
DECLARE
    new_workspace_id UUID;
    workspace_name TEXT;
    workspace_slug TEXT;
BEGIN
    -- Generate workspace name and slug based on user's full_name or email
    workspace_name := COALESCE(
        NEW.raw_user_meta_data->>'full_name',
        split_part(NEW.email, '@', 1)
    ) || '''s Workspace';
    
    workspace_slug := lower(
        regexp_replace(
            COALESCE(
                NEW.raw_user_meta_data->>'full_name',
                split_part(NEW.email, '@', 1)
            ),
            '[^a-zA-Z0-9]',
            '-',
            'g'
        )
    ) || '-' || substr(NEW.id::text, 1, 8);
    
    -- Create workspace
    INSERT INTO public.workspaces (name, slug, owner_id)
    VALUES (workspace_name, workspace_slug, NEW.id)
    RETURNING id INTO new_workspace_id;
    
    -- Add user as workspace owner
    INSERT INTO public.workspace_members (workspace_id, user_id, role)
    VALUES (new_workspace_id, NEW.id, 'owner');
    
    -- Update user metadata with default workspace_id
    UPDATE auth.users 
    SET raw_app_meta_data = COALESCE(raw_app_meta_data, '{}'::jsonb) || 
        jsonb_build_object('workspace_id', new_workspace_id)
    WHERE id = NEW.id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically create workspace on user signup
CREATE TRIGGER trigger_create_default_workspace
    AFTER INSERT ON auth.users
    FOR EACH ROW
    WHEN (NEW.email_confirmed_at IS NOT NULL OR NEW.phone_confirmed_at IS NOT NULL)
    EXECUTE FUNCTION public.create_default_workspace_for_user();

-- Function to handle workspace creation for users who signed up via invite
CREATE OR REPLACE FUNCTION public.handle_invite_signup()
RETURNS TRIGGER AS $$
DECLARE
    invite_token TEXT;
    invite_record RECORD;
BEGIN
    -- Check if user signed up with an invite token
    invite_token := NEW.raw_user_meta_data->>'invite_token';
    
    IF invite_token IS NOT NULL THEN
        -- Get invite details
        SELECT * INTO invite_record
        FROM public.invites
        WHERE token = invite_token
        AND expires_at > NOW()
        AND accepted_at IS NULL;
        
        IF FOUND THEN
            -- Add user to the inviting workspace
            INSERT INTO public.workspace_members (workspace_id, user_id, role, invited_by)
            VALUES (invite_record.workspace_id, NEW.id, invite_record.role, invite_record.invited_by)
            ON CONFLICT (workspace_id, user_id) DO NOTHING;
            
            -- Mark invite as accepted
            UPDATE public.invites
            SET accepted_at = NOW(), accepted_by = NEW.id
            WHERE id = invite_record.id;
            
            -- Update user metadata with the inviting workspace_id
            UPDATE auth.users 
            SET raw_app_meta_data = COALESCE(raw_app_meta_data, '{}'::jsonb) || 
                jsonb_build_object('workspace_id', invite_record.workspace_id)
            WHERE id = NEW.id;
            
            -- Don't create a default workspace since user is joining an existing one
            RETURN NEW;
        END IF;
    END IF;
    
    -- If no valid invite, proceed with default workspace creation
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to handle invite signup before default workspace creation
CREATE TRIGGER trigger_handle_invite_signup
    AFTER INSERT ON auth.users
    FOR EACH ROW
    WHEN (NEW.email_confirmed_at IS NOT NULL OR NEW.phone_confirmed_at IS NOT NULL)
    EXECUTE FUNCTION public.handle_invite_signup();

-- Ensure invite trigger runs before default workspace trigger
DROP TRIGGER IF EXISTS trigger_create_default_workspace ON auth.users;
CREATE TRIGGER trigger_create_default_workspace
    AFTER INSERT ON auth.users
    FOR EACH ROW
    WHEN (
        NEW.email_confirmed_at IS NOT NULL OR NEW.phone_confirmed_at IS NOT NULL
        AND NEW.raw_user_meta_data->>'invite_token' IS NULL
    )
    EXECUTE FUNCTION public.create_default_workspace_for_user();

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.create_default_workspace_for_user() TO authenticated;
GRANT EXECUTE ON FUNCTION public.handle_invite_signup() TO authenticated;