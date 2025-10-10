-- Migration: Chat workspace isolation
-- Created: 2024-01-XX

-- Add workspace_id to chat_messages table
ALTER TABLE public.chat_messages ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE;

-- Add workspace_id to chat_rooms table if it exists
ALTER TABLE public.chat_rooms ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_chat_messages_workspace_id ON public.chat_messages(workspace_id);
CREATE INDEX IF NOT EXISTS idx_chat_rooms_workspace_id ON public.chat_rooms(workspace_id);

-- Drop existing overly permissive chat policies
DROP POLICY IF EXISTS "Authenticated users can read chat messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Authenticated users can insert chat messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Users can update their own chat messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Users can delete their own chat messages" ON public.chat_messages;

-- Create workspace-isolated RLS policies for chat_messages
CREATE POLICY "Users can read chat messages in their workspaces" ON public.chat_messages
    FOR SELECT USING (
        workspace_id IN (
            SELECT workspace_id FROM public.workspace_members 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert chat messages in their workspaces" ON public.chat_messages
    FOR INSERT WITH CHECK (
        auth.uid() IS NOT NULL AND 
        user_id = auth.uid() AND
        workspace_id IN (
            SELECT workspace_id FROM public.workspace_members 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update their own chat messages in their workspaces" ON public.chat_messages
    FOR UPDATE USING (
        auth.uid() = user_id AND
        workspace_id IN (
            SELECT workspace_id FROM public.workspace_members 
            WHERE user_id = auth.uid()
        )
    )
    WITH CHECK (
        auth.uid() = user_id AND
        workspace_id IN (
            SELECT workspace_id FROM public.workspace_members 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete their own chat messages in their workspaces" ON public.chat_messages
    FOR DELETE USING (
        auth.uid() = user_id AND
        workspace_id IN (
            SELECT workspace_id FROM public.workspace_members 
            WHERE user_id = auth.uid()
        )
    );

-- Create workspace-isolated RLS policies for chat_rooms
DROP POLICY IF EXISTS "Allow authenticated users to view chat rooms" ON public.chat_rooms;
DROP POLICY IF EXISTS "Allow authenticated users to create chat rooms" ON public.chat_rooms;

CREATE POLICY "Users can view chat rooms in their workspaces" ON public.chat_rooms
    FOR SELECT USING (
        workspace_id IN (
            SELECT workspace_id FROM public.workspace_members 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create chat rooms in their workspaces" ON public.chat_rooms
    FOR INSERT WITH CHECK (
        auth.uid() IS NOT NULL AND
        created_by = auth.uid() AND
        workspace_id IN (
            SELECT workspace_id FROM public.workspace_members 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Room creators and workspace admins can update chat rooms" ON public.chat_rooms
    FOR UPDATE USING (
        (created_by = auth.uid() OR 
         workspace_id IN (
            SELECT workspace_id FROM public.workspace_members 
            WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
         )) AND
        workspace_id IN (
            SELECT workspace_id FROM public.workspace_members 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Room creators and workspace admins can delete chat rooms" ON public.chat_rooms
    FOR DELETE USING (
        (created_by = auth.uid() OR 
         workspace_id IN (
            SELECT workspace_id FROM public.workspace_members 
            WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
         )) AND
        workspace_id IN (
            SELECT workspace_id FROM public.workspace_members 
            WHERE user_id = auth.uid()
        )
    );

-- Trigger to auto-assign workspace_id on chat_messages insert
CREATE OR REPLACE FUNCTION public.set_workspace_id_on_chat_messages()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.workspace_id IS NULL THEN
        NEW.workspace_id := public.get_current_workspace_id();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_workspace_id_chat_messages
    BEFORE INSERT ON public.chat_messages
    FOR EACH ROW EXECUTE FUNCTION public.set_workspace_id_on_chat_messages();

-- Trigger to auto-assign workspace_id on chat_rooms insert
CREATE OR REPLACE FUNCTION public.set_workspace_id_on_chat_rooms()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.workspace_id IS NULL THEN
        NEW.workspace_id := public.get_current_workspace_id();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_workspace_id_chat_rooms
    BEFORE INSERT ON public.chat_rooms
    FOR EACH ROW EXECUTE FUNCTION public.set_workspace_id_on_chat_rooms();

-- Function to get workspace chat rooms
CREATE OR REPLACE FUNCTION public.get_workspace_chat_rooms(workspace_uuid UUID DEFAULT NULL)
RETURNS TABLE(
    room_id TEXT,
    room_name TEXT,
    room_description TEXT,
    is_private BOOLEAN,
    created_by UUID,
    created_at TIMESTAMP WITH TIME ZONE,
    message_count BIGINT
) AS $$
DECLARE
    target_workspace_id UUID;
BEGIN
    -- Use provided workspace_id or get current user's workspace
    target_workspace_id := COALESCE(
        workspace_uuid,
        public.get_current_workspace_id()
    );
    
    -- Verify user has access to this workspace
    IF NOT EXISTS (
        SELECT 1 FROM public.workspace_members 
        WHERE workspace_id = target_workspace_id AND user_id = auth.uid()
    ) THEN
        RETURN;
    END IF;
    
    RETURN QUERY
    SELECT 
        cr.id,
        cr.name,
        cr.description,
        cr.is_private,
        cr.created_by,
        cr.created_at,
        COALESCE(msg_count.count, 0) as message_count
    FROM public.chat_rooms cr
    LEFT JOIN (
        SELECT 
            room_id, 
            COUNT(*) as count
        FROM public.chat_messages 
        WHERE workspace_id = target_workspace_id
        GROUP BY room_id
    ) msg_count ON cr.id = msg_count.room_id
    WHERE cr.workspace_id = target_workspace_id
    ORDER BY cr.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get workspace chat messages for a room
CREATE OR REPLACE FUNCTION public.get_workspace_chat_messages(
    room_uuid TEXT,
    workspace_uuid UUID DEFAULT NULL,
    message_limit INTEGER DEFAULT 100
)
RETURNS TABLE(
    message_id UUID,
    user_id UUID,
    room_id TEXT,
    content TEXT,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    user_email TEXT,
    user_full_name TEXT
) AS $$
DECLARE
    target_workspace_id UUID;
BEGIN
    -- Use provided workspace_id or get current user's workspace
    target_workspace_id := COALESCE(
        workspace_uuid,
        public.get_current_workspace_id()
    );
    
    -- Verify user has access to this workspace
    IF NOT EXISTS (
        SELECT 1 FROM public.workspace_members 
        WHERE workspace_id = target_workspace_id AND user_id = auth.uid()
    ) THEN
        RETURN;
    END IF;
    
    RETURN QUERY
    SELECT 
        cm.id,
        cm.user_id,
        cm.room_id,
        cm.content,
        cm.created_at,
        cm.updated_at,
        au.email,
        (au.raw_user_meta_data->>'full_name')::TEXT
    FROM public.chat_messages cm
    LEFT JOIN auth.users au ON cm.user_id = au.id
    WHERE cm.room_id = room_uuid 
    AND cm.workspace_id = target_workspace_id
    ORDER BY cm.created_at ASC
    LIMIT message_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.get_workspace_chat_rooms(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_workspace_chat_messages(TEXT, UUID, INTEGER) TO authenticated;

-- Refresh PostgREST schema cache
NOTIFY pgrst, 'reload schema';