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

    const { email, workspace_id, role = 'member' } = await req.json()

    if (!email || !workspace_id) {
      return new Response(
        JSON.stringify({ error: 'email and workspace_id are required' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Verify user has admin access to this workspace
    const { data: membership, error: membershipError } = await supabaseClient
      .from('workspace_members')
      .select('role')
      .eq('workspace_id', workspace_id)
      .eq('user_id', user.id)
      .single()

    if (membershipError || !membership || !['owner', 'admin'].includes(membership.role)) {
      return new Response(
        JSON.stringify({ error: 'Insufficient permissions' }),
        {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Get workspace details
    const { data: workspace, error: workspaceError } = await supabaseClient
      .from('workspaces')
      .select('name, slug')
      .eq('id', workspace_id)
      .single()

    if (workspaceError || !workspace) {
      return new Response(
        JSON.stringify({ error: 'Workspace not found' }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Check if user is already a member
    const { data: existingMember } = await supabaseClient
      .from('workspace_members')
      .select('id')
      .eq('workspace_id', workspace_id)
      .eq('user_id', user.id)
      .single()

    if (existingMember) {
      return new Response(
        JSON.stringify({ error: 'User is already a member of this workspace' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Generate invite token
    const inviteToken = crypto.randomUUID()
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7) // Expires in 7 days

    // Create invite record
    const { data: invite, error: inviteError } = await supabaseClient
      .from('invites')
      .insert({
        workspace_id,
        email,
        role,
        token: inviteToken,
        invited_by: user.id,
        expires_at: expiresAt.toISOString()
      })
      .select()
      .single()

    if (inviteError) {
      return new Response(
        JSON.stringify({ error: inviteError.message }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Send invitation email using Supabase Auth
    const inviteUrl = `${Deno.env.get('SITE_URL')}/invite/${inviteToken}`
    
    const { error: emailError } = await supabaseClient.auth.admin.inviteUserByEmail(
      email,
      {
        redirectTo: inviteUrl,
        data: {
          workspace_id,
          workspace_name: workspace.name,
          invited_by: user.email,
          role
        }
      }
    )

    if (emailError) {
      // Delete the invite if email sending fails
      await supabaseClient
        .from('invites')
        .delete()
        .eq('id', invite.id)

      return new Response(
        JSON.stringify({ error: `Failed to send invitation email: ${emailError.message}` }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        invite_id: invite.id,
        message: `Invitation sent to ${email}`,
        expires_at: expiresAt.toISOString()
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