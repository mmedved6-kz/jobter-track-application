import prisma from "@/lib/prisma";
import { getSessionFromCookie } from "@/lib/auth/session";

const publicUserSelect = {
  id: true,
  email: true,
  name: true,
  createdAt: true,
  updatedAt: true,
} as const;

export async function getCurrentUser() {
  const session = await getSessionFromCookie();

  if (!session) {
    return null;
  }

  return prisma.user.findUnique({
    where: {
      id: session.userId,
    },
    select: publicUserSelect,
  });
}

export async function requireCurrentUser() {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  return user;
}

export { publicUserSelect };