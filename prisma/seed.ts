import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.user.upsert({
    where: { email: "dedy@local.dev" },
    update: {
      displayName: "Dedy",
      timezone: "Asia/Tokyo",
    },
    create: {
      displayName: "Dedy",
      email: "dedy@local.dev",
      timezone: "Asia/Tokyo",
    },
  });

  console.log("Seed complete: user dedy@local.dev is ready.");
}

main()
  .catch((error) => {
    console.error("Seed failed", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
