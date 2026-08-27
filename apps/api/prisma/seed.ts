import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const products = [
  {
    id: "prod-headphones",
    name: "Wireless Headphones",
    description: "Over-ear, noise-cancelling, 30-hour battery.",
    priceCents: 14999,
    imageUrl: "https://picsum.photos/seed/oneix-headphones/600/400",
    stock: 25,
  },
  {
    id: "prod-keyboard",
    name: "Mechanical Keyboard",
    description: "Hot-swappable switches, per-key RGB.",
    priceCents: 8999,
    imageUrl: "https://picsum.photos/seed/oneix-keyboard/600/400",
    stock: 40,
  },
  {
    id: "prod-backpack",
    name: "Travel Backpack",
    description: "Water-resistant, 30L, laptop sleeve.",
    priceCents: 6499,
    imageUrl: "https://picsum.photos/seed/oneix-backpack/600/400",
    stock: 15,
  },
  {
    id: "prod-watch",
    name: "Fitness Watch",
    description: "Heart rate, GPS, 7-day battery.",
    priceCents: 19999,
    imageUrl: "https://picsum.photos/seed/oneix-watch/600/400",
    stock: 10,
  },
  {
    id: "prod-mug",
    name: "Insulated Mug",
    description: "Keeps drinks hot for 12 hours.",
    priceCents: 2499,
    imageUrl: "https://picsum.photos/seed/oneix-mug/600/400",
    stock: 60,
  },
];

async function main() {
  for (const product of products) {
    await prisma.product.upsert({
      where: { id: product.id },
      update: product,
      create: product,
    });
  }
  console.log(`Seeded ${products.length} products.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
