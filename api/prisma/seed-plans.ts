import { PrismaClient } from "../src/generated/prisma/client.js";

const prisma = new PrismaClient();

const plans = [
  { name: "Weekly", price: 500, durationDays: 7, isActive: true },
  { name: "Monthly", price: 1250, durationDays: 30, isActive: true },
  { name: "Quarterly", price: 3000, durationDays: 90, isActive: true },
];

async function seedPlans() {
  for (const plan of plans) {
    const result = await prisma.plan.upsert({
      where: { name: plan.name },
      update: { price: plan.price, durationDays: plan.durationDays, isActive: plan.isActive },
      create: plan,
    });
    console.log(`Plan "${result.name}": ${result.price} KES / ${result.durationDays} days (id: ${result.id})`);
  }

  console.log("\nAll plans seeded successfully.");
}

seedPlans()
  .catch((err) => {
    console.error("Failed to seed plans:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
