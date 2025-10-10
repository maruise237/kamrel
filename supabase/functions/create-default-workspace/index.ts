import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
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
    // Create Supabase client with service role key for admin operations
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

    // Get the authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Verify the user
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(
      authHeader.replace('Bearer ', '')
    )

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid user token' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    const { invite_token } = await req.json()

    // Check if user already has a workspace
    const { data: existingMembership } = await supabaseClient
      .from('workspace_members')
      .select('workspace_id')
      .eq('user_id', user.id)
      .single()

    if (existingMembership) {
      return new Response(
        JSON.stringify({ 
          success: true,
          message: 'User already has a workspace',
          workspace_id: existingMembership.workspace_id
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // If user has an invite token, handle invite acceptance
    if (invite_token) {
      const { data: invite, error: inviteError } = await supabaseClient
        .from('invites')
        .select('*')
        .eq('token', invite_token)
        .eq('email', user.email)
        .gt('expires_at', new Date().toISOString())
        .is('accepted_at', null)
        .single()

      if (!inviteError && invite) {
        // Add user to the inviting workspace
        const { error: memberError } = await supabaseClient
          .from('workspace_members')
          .insert({
            workspace_id: invite.workspace_id,
            user_id: user.id,
            role: invite.role,
            invited_by: invite.invited_by,
            joined_at: new Date().toISOString()
          })

        if (!memberError) {
          // Mark invite as accepted
          await supabaseClient
            .from('invites')
            .update({ 
              accepted_at: new Date().toISOString(),
              accepted_by: user.id
            })
            .eq('id', invite.id)

          // Update user metadata with workspace_id
          await supabaseClient.auth.admin.updateUserById(user.id, {
            app_metadata: {
              ...user.app_metadata,
              workspace_id: invite.workspace_id
            }
          })

          return new Response(
            JSON.stringify({ 
              success: true,
              message: 'Successfully joined workspace via invite',
              workspace_id: invite.workspace_id
            }),
            {
              status: 200,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          )
        }
      }
    }

    // Create default workspace for user
    const userName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'User'
    const workspaceName = `${userName}'s Workspace`
    const workspaceSlug = `${userName.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${user.id.substring(0, 8)}`

    // Create workspace
    const { data: workspace, error: workspaceError } = await supabaseClient
      .from('workspaces')
      .insert({
        name: workspaceName,
        slug: workspaceSlug,
        owner_id: user.id
      })
      .select()
      .single()

    if (workspaceError) {
      return new Response(
        JSON.stringify({ error: workspaceError.message }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Add user as workspace owner
    const { error: memberError } = await supabaseClient
      .from('workspace_members')
      .insert({
        workspace_id: workspace.id,
        user_id: user.id,
        role: 'owner'
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

    // Update user metadata with workspace_id
    await supabaseClient.auth.admin.updateUserById(user.id, {
      app_metadata: {
        ...user.app_metadata,
        workspace_id: workspace.id
      }
    })

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Default workspace created successfully',
        workspace_id: workspace.id,
        workspace_name: workspaceName
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