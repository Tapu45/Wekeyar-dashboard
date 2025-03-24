import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding products...");

  const products = [
    { name: "Product A", description: "Description for Product A", price: 10.0 },
    { name: "Product B", description: "Description for Product B", price: 20.0 },
    { name: "Product C", description: "Description for Product C", price: 30.0 },
  ];

  for (const product of products) {
    await prisma.product.upsert({
      where: { name: product.name },
      update: {},
      create: product,
    });
  }

  console.log("Seeding completed.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });