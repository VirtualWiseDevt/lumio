import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client.js";
import * as argon2 from "argon2";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({ adapter });

async function main() {
  const password = "AdminPass123!";
  const passwordHash = await argon2.hash(password);

  const admin = await prisma.user.upsert({
    where: { email: "admin@lumio.tv" },
    update: {},
    create: {
      email: "admin@lumio.tv",
      phone: "+254700000001",
      name: "Super Admin",
      role: "ADMIN",
      passwordHash,
    },
  });

  console.log("Admin account created/verified:");
  console.log(`  Email: admin@lumio.tv`);
  console.log(`  Password: ${password}`);
  console.log(`  ID: ${admin.id}`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
