# Environment Variables Checklist

## Required Variables

Add these to your `.env` file:

### Database
```env
DATABASE_URL="postgresql://username:password@localhost:5432/invoxa?schema=public"
```

**Troubleshooting:**
- Make sure PostgreSQL is running
- Verify username and password are correct
- Ensure the database exists (create it if needed: `CREATE DATABASE invoxa;`)
- Check if PostgreSQL is on the default port 5432

### NextAuth
```env
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"
```

**Generate NEXTAUTH_SECRET:**

**Windows PowerShell:**
```powershell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
```

**Linux/Mac:**
```bash
openssl rand -base64 32
```

**Or use an online generator:**
- Visit: https://generate-secret.vercel.app/32

## Complete .env Example

```env
# Database
DATABASE_URL="postgresql://postgres:yourpassword@localhost:5432/invoxa?schema=public"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="paste-your-generated-secret-here"

# Optional: Node Environment
NODE_ENV="development"
```

## Verify Your Setup

1. **Check database connection:**
   ```bash
   npm run db:verify
   ```

2. **Run migration:**
   ```bash
   npm run db:migrate
   ```

3. **Start development server:**
   ```bash
   npm run dev
   ```

## Common Issues

### "Authentication failed"
- Double-check username and password in DATABASE_URL
- Make sure the PostgreSQL user has proper permissions

### "Database does not exist"
- Create the database: `CREATE DATABASE invoxa;`
- Or update DATABASE_URL to point to an existing database

### "Connection refused"
- Make sure PostgreSQL service is running
- Check if PostgreSQL is listening on port 5432
- Verify firewall settings

