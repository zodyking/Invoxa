# Invoxa - Dependencies & Versions

This document lists all dependencies, dev dependencies, and runtime requirements for the Invoxa project.

## Runtime Environment

- **Node.js**: v25.1.0
- **npm**: 11.6.2
- **Project Version**: 0.1.0

## Core Framework

- **Next.js**: ^16.1.1
- **React**: ^19.0.0
- **React DOM**: ^19.0.0

## Production Dependencies

### Authentication & Security

- **next-auth**: ^5.0.0-beta.30
- **@auth/prisma-adapter**: ^2.11.1
- **bcryptjs**: ^3.0.3

### Database & ORM

- **prisma**: ^7.2.0
- **@prisma/client**: ^7.2.0
- **@prisma/adapter-pg**: ^7.2.0
- **pg**: ^8.16.3

### UI Components & Styling

- **@radix-ui/react-alert-dialog**: ^1.1.15
- **@radix-ui/react-avatar**: ^1.1.11
- **@radix-ui/react-checkbox**: ^1.3.3
- **@radix-ui/react-dialog**: ^1.1.15
- **@radix-ui/react-dropdown-menu**: ^2.1.16
- **@radix-ui/react-label**: ^2.1.8
- **@radix-ui/react-select**: ^2.2.6
- **@radix-ui/react-separator**: ^1.1.8
- **@radix-ui/react-slot**: ^1.2.4
- **@radix-ui/react-tabs**: ^1.1.13
- **@radix-ui/react-tooltip**: ^1.2.8
- **tailwindcss**: ^3.4.17
- **tailwindcss-animate**: ^1.0.7
- **tailwind-merge**: ^3.4.0
- **class-variance-authority**: ^0.7.1
- **clsx**: ^2.1.1
- **next-themes**: ^0.4.6
- **lucide-react**: ^0.562.0
- **sonner**: ^2.0.7

### Forms & Validation

- **react-hook-form**: ^7.69.0
- **@hookform/resolvers**: ^5.2.2
- **zod**: ^4.2.1

### Code Editor

- **@monaco-editor/react**: ^4.7.0
- **monaco-editor**: ^0.55.1

### Email

- **nodemailer**: ^7.0.12
- **@types/nodemailer**: ^7.0.4

### Utilities

- **jszip**: ^3.10.1

## Development Dependencies

### TypeScript & Type Definitions

- **typescript**: ^5.7.2 (installed: 5.9.3)
- **@types/node**: ^22.10.2
- **@types/react**: ^19.0.6
- **@types/react-dom**: ^19.0.2
- **@types/bcryptjs**: ^2.4.6
- **@types/jszip**: ^3.4.0
- **@types/pg**: ^8.16.0

### Build Tools & CSS

- **postcss**: ^8.4.49
- **autoprefixer**: ^10.4.23

### Linting & Code Quality

- **eslint**: ^9.18.0
- **eslint-config-next**: ^16.1.1

### Development Utilities

- **tsx**: ^4.21.0
- **dotenv**: ^17.2.3

## Configuration Files

- **next.config.ts**: Next.js configuration
- **tailwind.config.ts**: Tailwind CSS configuration
- **postcss.config.mjs**: PostCSS configuration
- **tsconfig.json**: TypeScript configuration
- **prisma/schema.prisma**: Prisma database schema
- **prisma.config.ts**: Prisma configuration

## Key Features Enabled

- **Turbopack**: Enabled for development (Next.js 16)
- **Server Actions**: Enabled with 50MB body size limit
- **NextAuth v5**: Beta version with trustHost enabled

## Notes

- Next.js 16.1.1 uses Turbopack by default for development
- React 19.0.0 is the latest major version
- Prisma 7.2.0 with PostgreSQL adapter
- NextAuth v5 (beta) requires `trustHost: true` configuration
- TypeScript ^5.7.2 (currently installed: 5.9.3)

## Installation

To install all dependencies:

```bash
npm install
```

## Update Dependencies

To update all dependencies to their latest versions:

```bash
npm update
```

To update to latest major versions (use with caution):

```bash
npm install package-name@latest
```

