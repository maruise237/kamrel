# Deployment Guide - Multi-Tenant Workspace Isolation

This guide provides step-by-step instructions for deploying the enhanced multi-tenant workspace isolation features to your Supabase project.

## Prerequisites

- Supabase CLI installed and configured
- Access to your Supabase project
- Database admin privileges
- Node.js 18+ installed
- Vercel account (for deployment)

## Migration Files Overview

The following migration files need to be applied in order:

1. `004_multi_tenant_setup.sql` - Initial multi-tenant setup with workspaces
2. `005_enhanced_rls_policies.sql` - Enhanced RLS policies for existing tables
3. `006_chat_workspace_isolation.sql` - Chat functionality workspace isolation

## Deployment Steps

### Step 1: Backup Your Database

Before applying any migrations, create a backup of your current database:

```bash
# Create a backup
npx supabase db dump --file backup_$(date +%Y%m%d_%H%M%S).sql
```

### Step 2: Apply Migrations

Apply the migrations in the correct order:

```bash
# Apply multi-tenant setup
npx supabase db push

# Or apply individual migrations if needed
psql -h your-db-host -U postgres -d postgres -f supabase/migrations/004_multi_tenant_setup.sql
psql -h your-db-host -U postgres -d postgres -f supabase/migrations/005_enhanced_rls_policies.sql
psql -h your-db-host -U postgres -d postgres -f supabase/migrations/006_chat_workspace_isolation.sql
```

### Step 3: Verify Migration Success

Check that all tables have been updated correctly:

```sql
-- Verify workspace_id columns exist
SELECT table_name, column_name 
FROM information_schema.columns 
WHERE column_name = 'workspace_id';

-- Verify RLS policies are active
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename IN ('projects', 'tasks', 'time_entries', 'chat_messages', 'chat_rooms', 'file_uploads', 'notifications');

-- Check functions exist
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_name IN ('get_current_workspace_id', 'create_workspace_with_owner', 'accept_invite', 'get_workspace_chat_rooms', 'get_workspace_chat_messages');
```

### Step 4: Data Migration (If Needed)

If you have existing data, you may need to assign workspace_id values:

```sql
-- Example: Assign existing projects to a default workspace
-- First, create a default workspace for existing users
INSERT INTO workspaces (name, description, created_by)
SELECT DISTINCT 'Default Workspace', 'Migrated workspace', created_by
FROM projects
WHERE created_by NOT IN (SELECT created_by FROM workspaces);

-- Then assign projects to workspaces
UPDATE projects 
SET workspace_id = (
  SELECT id FROM workspaces 
  WHERE workspaces.created_by = projects.created_by 
  LIMIT 1
)
WHERE workspace_id IS NULL;
```

### Step 5: Environment Setup

1. Clone the repository
2. Install dependencies: `npm install`
3. Copy `.env.example` to `.env.local`
4. Configure your environment variables:

```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### Step 6: Deploy Application Code

Deploy the updated application code with workspace isolation features:

```bash
# Build the application
npm run build

# Deploy to Vercel
vercel deploy

# Configure production environment variables in Vercel dashboard
```

## Testing the Deployment

### 1. Test Workspace Creation

```javascript
// Test creating a new workspace
const { data, error } = await supabase.rpc('create_workspace_with_owner', {
  workspace_name: 'Test Workspace',
  workspace_description: 'Test workspace for validation'
});
```

### 2. Test RLS Policies

```javascript
// Test that users can only see their workspace data
const { data: projects } = await supabase
  .from('projects')
  .select('*');

// Should only return projects from user's workspace
console.log('Projects:', projects);
```

### 3. Test Chat Isolation

```javascript
// Test workspace-isolated chat
const { data: messages } = await supabase.rpc('get_workspace_chat_messages', {
  workspace_id: 'your-workspace-id',
  room_id: 'test-room'
});
```

## Rollback Plan

If issues occur, you can rollback using your backup:

```bash
# Restore from backup
psql -h your-db-host -U postgres -d postgres < backup_YYYYMMDD_HHMMSS.sql
```

## Post-Deployment Checklist

- [ ] All migrations applied successfully
- [ ] RLS policies are active and working
- [ ] Users can create and join workspaces
- [ ] Data is properly isolated between workspaces
- [ ] Chat functionality works with workspace isolation
- [ ] Time tracking respects workspace boundaries
- [ ] Gantt charts show only workspace projects
- [ ] File uploads are workspace-isolated
- [ ] Notifications are workspace-scoped

## Monitoring and Maintenance

### Performance Monitoring

Monitor query performance after deployment:

```sql
-- Check slow queries
SELECT query, mean_time, calls 
FROM pg_stat_statements 
WHERE mean_time > 100 
ORDER BY mean_time DESC;
```

### Index Optimization

Ensure indexes are properly created for workspace_id columns:

```sql
-- Check existing indexes
SELECT indexname, tablename, indexdef 
FROM pg_indexes 
WHERE indexdef LIKE '%workspace_id%';
```

## Troubleshooting

### Common Issues

1. **RLS Policy Conflicts**: If you encounter permission errors, check that RLS policies are correctly configured
2. **Missing workspace_id**: Ensure all new records have workspace_id set via triggers
3. **Performance Issues**: Add indexes on workspace_id columns if queries are slow

### Support

For issues with this deployment:
1. Check the migration logs for errors
2. Verify all prerequisites are met
3. Ensure proper database permissions
4. Review the RLS policies for conflicts

## Security Considerations

- All tables now enforce workspace isolation via RLS
- Users can only access data within their assigned workspaces
- Workspace membership is required for data access
- Admin and owner roles have elevated permissions within workspaces
- Chat messages and rooms are isolated by workspace
- File uploads are scoped to workspaces
- Time entries and tasks respect workspace boundaries

This deployment implements comprehensive multi-tenant workspace isolation while maintaining data security and performance.