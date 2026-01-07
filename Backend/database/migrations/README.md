# Database Migrations

This folder contains SQL migration files for the HVTSocial database.

## Migration Files

Migrations are numbered sequentially and should be run in order:

1. `001_create_users_table.sql` - Base users table
2. `002_create_posts_table.sql` - Posts with media support
3. `003_create_comments_table.sql` - Comments with nested replies

## Running Migrations

### Manual Execution

Connect to your SQL Server database and execute each file in order:

```bash
sqlcmd -S localhost -d HVTSocialDB -i 001_create_users_table.sql
sqlcmd -S localhost -d HVTSocialDB -i 002_create_posts_table.sql
sqlcmd -S localhost -d HVTSocialDB -i 003_create_comments_table.sql
```

### Using Azure Data Studio or SSMS

1. Open each migration file
2. Connect to your database
3. Execute the SQL in sequential order

## Creating New Migrations

When creating a new migration:

1. Number it sequentially (e.g., `004_add_notifications.sql`)
2. Include a header comment with:
   - Migration name
   - Created date
   - Description
3. Include rollback instructions if needed
4. Add appropriate indexes for performance
5. Update this README

## Best Practices

- ✅ Always test migrations on a development database first
- ✅ Include `IF NOT EXISTS` checks to make migrations idempotent
- ✅ Add indexes for frequently queried columns
- ✅ Use appropriate data types and constraints
- ✅ Document foreign key relationships
- ❌ Never modify existing migration files after they've been applied to production
- ❌ Never delete migration files

## Rollback

To rollback a migration, create a new migration file with `DROP` statements.

Example: `005_rollback_notifications.sql`
