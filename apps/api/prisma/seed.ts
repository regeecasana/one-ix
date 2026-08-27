import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// imageUrl is intentionally blank -- the storefront renders a line-art
// ProductIcon per product id instead of photography (see
// apps/storefront/src/components/ProductIcon.tsx).
const products = [
  {
    id: "prod-sim",
    name: "Prepaid SIM Card",
    description: "Unlimited talk & text, 10GB data. 30-day plan, no contract.",
    priceCents: 1999,
    imageUrl: "",
    stock: 200,
  },
  {
    id: "prod-earbuds",
    name: "Wireless Earbuds",
    description: "Noise isolation, 24-hour case battery, one-tap pairing.",
    priceCents: 5999,
    imageUrl: "",
    stock: 45,
  },
  {
    id: "prod-hotspot",
    name: "5G Pocket Hotspot",
    description: "Connects up to 10 devices, 20-hour battery.",
    priceCents: 8999,
    imageUrl: "",
    stock: 30,
  },
  {
    id: "prod-router",
    name: "Wi-Fi 6 Home Router",
    description: "Mesh-ready, gigabit ports, covers up to 2,500 sq ft.",
    priceCents: 12999,
    imageUrl: "",
    stock: 20,
  },
  {
    id: "prod-phone",
    name: "Relay Phone 12",
    description: '6.1" display, 128GB, 5G. Unlocked, works with any SIM.',
    priceCents: 49999,
    imageUrl: "",
    stock: 12,
  },
];

async function main() {
  // Demo data only -- reset dependent tables so a reseed always leaves a
  // clean, telco-only catalog rather than mixing in whatever a previous
  // theme's carts/orders left behind (they'd reference product ids that no
  // longer exist).
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.coupon.deleteMany();
  await prisma.abandonedCartEvent.deleteMany();
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
