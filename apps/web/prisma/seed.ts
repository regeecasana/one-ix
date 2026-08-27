import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// imageUrl is intentionally blank -- the storefront renders a line-art
// ProductIcon per product id instead of photography.
//
// priceCents holds whole Rupiah, not fractional cents -- IDR has no
// practical subunit, and the brief's own mockups show "Rp 199.000" with no
// decimals. Kept the field name to avoid an unnecessary schema rename;
// see src/lib/money.ts for the formatter.
const products = [
  {
    id: "plan-gosurf799",
    name: "GoSurf799",
    description: "10GB data, unlimited calls & text. Good for everyday browsing.",
    priceCents: 79000,
    imageUrl: "",
    stock: 500,
  },
  {
    id: "plan-gosurf-xtra",
    name: "GoSurf Xtra",
    description: "30GB data, HD video calls, priority network during work hours.",
    priceCents: 129000,
    imageUrl: "",
    stock: 500,
  },
  {
    id: "plan-creator",
    name: "XL Mobile Creator Plan",
    description: "120 GB high-speed data, priority upload lane for creators, unlimited streaming apps.",
    priceCents: 199000,
    imageUrl: "",
    stock: 500,
  },
  {
    id: "plan-home-multi",
    name: "XL Home Multi Plan",
    description: "150GB shared across up to 5 devices. Built for multi-brand households.",
    priceCents: 249000,
    imageUrl: "",
    stock: 500,
  },
  {
    id: "addon-satu-fiber-boost",
    name: "XL SATU Fiber Boost",
    description: "Unlock 5G + fiber-grade priority access on any plan.",
    priceCents: 49000,
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
  await prisma.voucher.deleteMany();
  await prisma.interactionEvent.deleteMany();
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
