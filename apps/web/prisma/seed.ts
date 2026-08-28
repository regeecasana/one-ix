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

  const now = Date.now();
  const hoursAgo = (h: number) => new Date(now - h * 60 * 60 * 1000);
  const daysAgo = (d: number) => hoursAgo(d * 24);

  // Demo customer #1 -- already activated, exercises the Zendesk sidebar
  // app's "service resolution" flow (see docs/zendesk-app.md).
  const activated = await prisma.customer.create({
    data: {
      email: "regee.casana@concentrix.com",
      name: "Regee Casana",
      createdAt: daysAgo(3),
    },
  });

  const activatedCart = await prisma.cart.create({
    data: {
      customerId: activated.id,
      status: "converted",
      recommendationReason: "Recommended based on high upload/streaming activity during the builder session.",
      lastActivityAt: daysAgo(2),
      createdAt: daysAgo(2),
    },
  });
  await prisma.cartItem.createMany({
    data: [
      { cartId: activatedCart.id, productId: "plan-creator", quantity: 1, unitPriceCents: 199000 },
      { cartId: activatedCart.id, productId: "addon-satu-fiber-boost", quantity: 1, unitPriceCents: 49000 },
    ],
  });

  const activatedVoucher = await prisma.voucher.create({
    data: {
      code: "CREATOR10-DEMO",
      customerId: activated.id,
      productId: "plan-creator",
      percentOff: 10,
      status: "redeemed",
      expiresAt: daysAgo(1),
      issuedBy: "agent",
      resendCount: 0,
      createdAt: daysAgo(2),
    },
  });

  await prisma.order.create({
    data: {
      cartId: activatedCart.id,
      customerId: activated.id,
      status: "paid",
      subtotalCents: 248000,
      discountCents: 24800,
      totalCents: 223200,
      voucherId: activatedVoucher.id,
      createdAt: daysAgo(2),
    },
  });

  await prisma.interactionEvent.createMany({
    data: [
      {
        customerId: activated.id,
        type: "activated",
        detail: "Activated XL Creator Package",
        createdAt: daysAgo(2),
      },
      {
        customerId: activated.id,
        type: "viewed_page",
        detail: "Visited Help & Support page",
        createdAt: hoursAgo(3),
      },
      {
        customerId: activated.id,
        type: "reopened_setup",
        detail: "Re-opened saved Creator Setup",
        createdAt: hoursAgo(3),
      },
      {
        customerId: activated.id,
        type: "redeemed_voucher",
        detail: "Applied 10% Creator Activation Discount",
        createdAt: daysAgo(2),
      },
    ],
  });

  // Demo customer #2 -- saved a setup but hasn't activated, exercises the
  // sidebar app's "marketing campaign" flow.
  const prospect = await prisma.customer.create({
    data: {
      email: "demo.marketing@example.com",
      name: "Maria Demo",
      createdAt: daysAgo(1),
    },
  });

  const prospectCart = await prisma.cart.create({
    data: {
      customerId: prospect.id,
      status: "active",
      recommendationReason: "Based on browsing GoSurf Xtra twice this week.",
      lastActivityAt: hoursAgo(1),
      createdAt: hoursAgo(4),
    },
  });
  await prisma.cartItem.createMany({
    data: [{ cartId: prospectCart.id, productId: "plan-gosurf-xtra", quantity: 1, unitPriceCents: 129000 }],
  });

  await prisma.interactionEvent.createMany({
    data: [
      { customerId: prospect.id, type: "viewed_product", detail: "Viewed GoSurf Xtra", createdAt: hoursAgo(4) },
      { customerId: prospect.id, type: "saved_setup", detail: "Saved setup to My Setup", createdAt: hoursAgo(2) },
      { customerId: prospect.id, type: "closed_tab", detail: "Left checkout without paying", createdAt: hoursAgo(1) },
    ],
  });

  console.log(`Seeded 2 demo customers: ${activated.email} (activated), ${prospect.email} (prospect).`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
