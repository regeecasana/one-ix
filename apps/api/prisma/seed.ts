import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// imageUrl is intentionally blank -- the storefront renders a line-art
// ProductIcon per product id instead of photography.
const products = [
  {
    id: "plan-starter",
    name: "Starter Plan",
    description: "10GB data, unlimited calls & text. Good for everyday browsing.",
    priceCents: 1499,
    imageUrl: "",
    stock: 500,
  },
  {
    id: "plan-work",
    name: "Work & Call Plan",
    description: "30GB data, HD video calls, priority network during work hours.",
    priceCents: 2499,
    imageUrl: "",
    stock: 500,
  },
  {
    id: "plan-creator-pro",
    name: "Creator Pro Plan",
    description: "100GB data, priority upload speed for livestreaming, unlimited social media.",
    priceCents: 3999,
    imageUrl: "",
    stock: 500,
  },
  {
    id: "plan-home-multi",
    name: "Home Multi-Device Plan",
    description: "150GB shared across up to 5 devices. Built for multi-brand households.",
    priceCents: 4999,
    imageUrl: "",
    stock: 500,
  },
  {
    id: "addon-5g-boost",
    name: "5G Speed Boost",
    description: "Unlock 5G priority access on any plan.",
    priceCents: 999,
    imageUrl: "",
    stock: 500,
  },
];

async function main() {
  // Demo data only -- reset dependent tables so a reseed always leaves a
  // clean catalog rather than mixing in whatever a previous run left behind
  // (they'd reference product ids that no longer exist).
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.supportTicket.deleteMany();
  await prisma.cart.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.product.deleteMany();

  await prisma.product.createMany({ data: products });
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
