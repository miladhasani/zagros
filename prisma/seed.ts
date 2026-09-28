import { hash } from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function splitName(fullName: string) {
  const trimmed = fullName.trim();
  const space = trimmed.indexOf(" ");
  if (space === -1) return { firstName: trimmed, lastName: "" };
  return { firstName: trimmed.slice(0, space), lastName: trimmed.slice(space + 1).trim() };
}

async function main() {
  const phone = process.env.SUPERADMIN_PHONE ?? "09120000000";
  const password = process.env.SUPERADMIN_PASSWORD ?? "ChangeMe123";
  const { firstName, lastName } = splitName(process.env.SUPERADMIN_NAME ?? "مدیر سیستم");

  const existing = await prisma.user.findUnique({ where: { phone } });
  if (!existing) {
    await prisma.user.create({
      data: {
        firstName,
        lastName,
        phone,
        phones: [phone],
        passwordHash: await hash(password, 10),
        mustSetPassword: true,
        isSuperAdmin: true,
        isAdmin: true,
      },
    });
  }

  const building = await prisma.building.findFirst();
  if (!building) {
    await prisma.building.create({
      data: {
        name: "مجتمع مسکونی",
        setupComplete: false,
      },
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
