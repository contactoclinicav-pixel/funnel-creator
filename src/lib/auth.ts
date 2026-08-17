import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";

import { prisma } from "@/lib/db";
import { createDefaultWorkspaceForUser } from "@/server/services/workspace";

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL,
  secret: process.env.BETTER_AUTH_SECRET,
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    sendResetPassword: async ({ user, url }) => {
      if (process.env.RESEND_API_KEY) {
        // TODO(producción): enviar email real vía Resend cuando haya API key.
        console.warn(
          "[auth] RESEND_API_KEY definido pero el envío de email aún no está implementado."
        );
      }
      // Modo desarrollo: el enlace se registra en la consola del servidor.
      console.log(
        `\n[auth] Enlace de recuperación de contraseña para ${user.email}:\n${url}\n`
      );
    },
  },
  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          await createDefaultWorkspaceForUser(user);
        },
      },
    },
  },
  plugins: [nextCookies()],
});

export type ServerSession = typeof auth.$Infer.Session;
