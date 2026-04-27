import prisma from "@/lib/prisma";

const publicUserSelect = {
  id: true,
  email: true,
  name: true,
  createdAt: true,
  updatedAt: true,
} as const;

const authUserSelect = {
  ...publicUserSelect,
  passwordHash: true,
} as const;

export async function findUserByEmail(email: string) {
  return prisma.user.findUnique({
    where: { email },
    select: authUserSelect,
  });
}

export async function findUserById(id: string) {
  return prisma.user.findUnique({
    where: { id },
    select: publicUserSelect,
  });
}

export async function createUser(data: {
  email: string;
  passwordHash: string;
  name?: string | null;
}) {
  return prisma.user.create({
    data: {
      email: data.email,
      passwordHash: data.passwordHash,
      name: data.name ?? null,
    },
    select: publicUserSelect,
  });
}

export { publicUserSelect, authUserSelect };