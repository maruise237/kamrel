import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Get the authorization header from the request
    const authorization = req.headers.get('Authorization')

    if (!authorization) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Verify the JWT token
    const token = authorization.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token)

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    const { invite_token } = await req.json()

    if (!invite_token) {
      return new Response(
        JSON.stringify({ error: 'invite_token is required' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Get invite details
    const { data: invite, error: inviteError } = await supabaseClient
      .from('invites')
      .select(`
        *,
        workspace:workspaces(id, name, slug)
      `)
      .eq('token', invite_token)
      .eq('email', user.email)
      .is('accepted_at', null)
      .single()

    if (inviteError || !invite) {
      return new Response(
        JSON.stringify({ error: 'Invalid or expired invitation' }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Check if invite has expired
    const now = new Date()
    const expiresAt = new Date(invite.expires_at)
    
    if (now > expiresAt) {
      return new Response(
        JSON.stringify({ error: 'Invitation has expired' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Check if user is already a member
    const { data: existingMember } = await supabaseClient
      .from('workspace_members')
      .select('id')
      .eq('workspace_id', invite.workspace_id)
      .eq('user_id', user.id)
      .single()

    if (existingMember) {
      // Mark invite as accepted even if already a member
      await supabaseClient
        .from('invites')
        .update({ accepted_at: new Date().toISOString() })
        .eq('id', invite.id)

      return new Response(
        JSON.stringify({ 
          success: true,
          message: 'You are already a member of this workspace',
          workspace: invite.workspace
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Add user to workspace
    const { error: memberError } = await supabaseClient
      .from('workspace_members')
      .insert({
        workspace_id: invite.workspace_id,
        user_id: user.id,
        role: invite.role,
        joined_at: new Date().toISOString()
      })

    if (memberError) {
      return new Response(
        JSON.stringify({ error: memberError.message }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Mark invite as accepted
    const { error: updateError } = await supabaseClient
      .from('invites')
      .update({ 
        accepted_at: new Date().toISOString(),
        accepted_by: user.id
      })
      .eq('id', invite.id)

    if (updateError) {
      console.error('Failed to update invite status:', updateError)
    }

    // Update user metadata with new workspace
    const { error: metadataError } = await supabaseClient.auth.admin.updateUserById(
      user.id,
      {
        app_metadata: {
          ...user.app_metadata,
          workspace_id: invite.workspace_id,
          workspace_role: invite.role,
          updated_at: new Date().toISOString()
        }
      }
    )

    if (metadataError) {
      console.error('Failed to update user metadata:', metadataError)
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        message: `Successfully joined ${invite.workspace.name}`,
        workspace: invite.workspace,
        role: invite.role
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})