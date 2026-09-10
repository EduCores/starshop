---
name: auth-prisma
description: Auth StarShop con NextAuth credentials, bcrypt y Prisma. Use when touching src/lib/auth.ts, users.ts, login, registro, NEXTAUTH_SECRET, role, rut, @auth/prisma-adapter.
---

# Auth Prisma - StarShop

## Estado actual
- `src/lib/auth.ts`: `NextAuthOptions` con `session.strategy jwt`, `CredentialsProvider` (email+password), `authorize` usa `verifyUser()` de `src/lib/users.ts`.
- Callbacks propagan `role` y `rut` de jwt -> session. `pages.signIn = /login`.
- Secret: `process.env.NEXTAUTH_SECRET || starshop-dev-secret-cambia-en-produccion`.
- `src/app/providers.tsx` envuelve en `SessionProvider`.
- Rutas: `src/app/login/`, `src/app/registro/`.
- Deps instaladas: `next-auth 4.24.15`, `@auth/prisma-adapter 2.11.3`, `@prisma/client 5.14`, `prisma 5.14`, `bcryptjs 3.0.3`. No hay `schema.prisma` aún: users es mock en `users.ts`.

## Reglas
- Nuevo campo de usuario (role/rut): agregar en `authorize` return + callback `jwt` + callback `session` + tipos.
- Passwords siempre con `bcryptjs` (`verifyUser` / hash en registro), nunca plaintext.
- Al crear `prisma/schema.prisma`: usar `@auth/prisma-adapter`, migrar `verifyUser` a Prisma sin romper firma.
- Producción: exigir `NEXTAUTH_SECRET` real, eliminar fallback dev.
- Checkout guest (1 paso con Zod en `src/app/checkout/page.tsx`) debe seguir funcionando sin login; B2B usa role para TierPrice/descuento.

## Archivos clave
`src/lib/auth.ts`, `src/lib/users.ts`, `src/app/api/auth/[...nextauth]/route.ts`, `src/app/login/*`, `src/app/registro/*`.
