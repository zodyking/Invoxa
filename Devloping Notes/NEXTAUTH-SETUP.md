# NextAuth Environment Variables Setup

## ✅ Completed

The seed script has been fixed and run successfully! Your database now has:
- ✅ Default roles (Admin, Mechanic, Accounting, Manager)
- ✅ Permissions system
- ✅ Shop profile
- ✅ Billing rules

## NextAuth Environment Variables

NextAuth requires two environment variables in your `.env` file:

```env
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="W8zZhQJLlsppUONbac8XU0hSJEU45uHEvM0zIaWL+Wk="
```

### Automatic Setup

Run the setup script:
```powershell
powershell -ExecutionPolicy Bypass -File scripts/setup-nextauth-env.ps1
```

### Manual Setup

If you prefer to add them manually, open your `.env` file and add:

```env
# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="W8zZhQJLlsppUONbac8XU0hSJEU45uHEvM0zIaWL+Wk="
```

## Verify Setup

After adding the variables, restart your development server:

```bash
npm run dev
```

Then test authentication:
1. Visit `http://localhost:3000/signup` to create a user
2. Visit `http://localhost:3000/login` to sign in

## What Was Fixed

1. ✅ **Seed Script** - Fixed Prisma 7 compatibility by using `@prisma/adapter-pg`
2. ✅ **Database Seeded** - Created initial roles, permissions, shop profile, and billing rules
3. ✅ **NextAuth Secret Generated** - Created secure secret for token encryption

## Next Steps

1. Add NextAuth variables to `.env` (use the script above)
2. Start the dev server: `npm run dev`
3. Create your first user via `/signup`
4. Assign the Admin role to your user (via Prisma Studio or admin interface)

