# Backend Integration Notes

This file documents the manual steps required to integrate the backend.

## 1. Install Packages
npm install @prisma/client prisma next-auth @next-auth/prisma-adapter @cloudinary/url-gen cloudinary resend nodemailer shadcn-ui @radix-ui/react-dialog @radix-ui/react-popover @radix-ui/react-select @radix-ui/react-dropdown-menu @radix-ui/react-tabs @radix-ui/react-separator @radix-ui/react-slot @fullcalendar/react @fullcalendar/core @fullcalendar/daygrid @fullcalendar/timegrid @fullcalendar/interaction zod date-fns @tanstack/react-query @tanstack/react-query-devtools recharts
npm install -D prisma vitest @playwright/test ts-node @types/node

## 2. Update package.json scripts
Add:
 prisma:generate: prisma generate,
prisma:migrate: prisma migrate dev,
prisma:seed: ts-node --compiler-options {"module":"CommonJS"} prisma/seed-extra.ts,
test: vitest run,
test:watch: vitest,
test:e2e: playwright test

## 3. .env variables
Create .env with DATABASE_URL, NEXTAUTH_URL, NEXTAUTH_SECRET, GOOGLE_CLIENT_ID/SECRET, ALLOWED_EMAIL_DOMAIN, RESEND_API_KEY, EMAIL_FROM, STORAGE_PROVIDER, CLOUDINARY_*, AWS_* as needed.

## 4. DB migration & seed
npx prisma generate
npx prisma migrate dev --name init_backend_models   # or npx prisma db push
npx ts-node --compiler-options '{module:CommonJS}' prisma/seed-extra.ts

## 5. Run project
npm run dev

## 6. Tests
npm run test
npm run test:watch
npm run test:e2e
