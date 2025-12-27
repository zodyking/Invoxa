# Database Setup Instructions

## Prerequisites
- PostgreSQL database (local or remote)
- Node.js and npm installed

## Setup Steps

### 1. Environment Variables
Create a `.env` file in the root directory with the following variables:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/invoxa?schema=public"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"
```

**Generate NEXTAUTH_SECRET:**
```bash
openssl rand -base64 32
```

### 2. Database Connection
Update the `DATABASE_URL` in `.env` with your PostgreSQL connection string:
- Replace `user` with your PostgreSQL username
- Replace `password` with your PostgreSQL password
- Replace `localhost:5432` with your database host and port
- Replace `invoxa` with your database name

### 3. Run Migrations
Create and apply the database schema:

```bash
npm run db:migrate
```

Or if you prefer to push the schema without migrations (development only):

```bash
npm run db:push
```

### 4. Generate Prisma Client
After schema changes, regenerate the Prisma client:

```bash
npm run db:generate
```

### 5. Verify Setup
Open Prisma Studio to view your database:

```bash
npm run db:studio
```

## Database Schema Overview

The schema includes:

- **Authentication**: Users, Accounts, Sessions, Roles, Permissions
- **Customers**: Person/Business customers with tax exemption
- **Vehicles**: Vehicle information with fleet support
- **Repair Orders**: Job tracking and dispatch
- **Service Logs**: Mechanic work journals with line items
- **Invoices**: Billing documents
- **Payments**: Payment records
- **Settings**: Shop profile, billing rules, templates, SMTP

## Creating Initial Roles

After setting up the database, you'll want to create initial roles. You can do this via Prisma Studio or create a seed script.

Example roles:
- Admin
- Mechanic
- Accounting
- Manager

## First User

The first user must be created through the signup page or directly in the database. After creating a user, you can assign roles through the admin interface or database.

