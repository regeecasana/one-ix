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

  // Mobile plans -- more tiers around the original three so the catalog
  // reads as a real ladder, not three arbitrary points.
  {
    id: "plan-gosurf199",
    name: "GoSurf199",
    description: "3GB data, unlimited calls & text. For light, occasional use.",
    priceCents: 39000,
    imageUrl: "",
    stock: 500,
  },
  {
    id: "plan-gosurf499",
    name: "GoSurf499",
    description: "8GB data, unlimited calls & text, free social media access.",
    priceCents: 59000,
    imageUrl: "",
    stock: 500,
  },
  {
    id: "plan-gosurf1499",
    name: "GoSurf1499",
    description: "50GB data, priority network during peak hours, rollover unused data.",
    priceCents: 159000,
    imageUrl: "",
    stock: 500,
  },
  {
    id: "plan-unlimited-lite",
    name: "Unlimited Lite",
    description: "Unlimited data, capped at 3Mbps after 50GB. No overage charges, ever.",
    priceCents: 179000,
    imageUrl: "",
    stock: 500,
  },
  {
    id: "plan-unlimited-pro",
    name: "Unlimited Pro",
    description: "True unlimited data at full speed, 5G priority lane, no throttling.",
    priceCents: 299000,
    imageUrl: "",
    stock: 500,
  },
  {
    id: "plan-student",
    name: "Student SATU",
    description: "5GB data plus unlimited social media, discounted for verified students.",
    priceCents: 45000,
    imageUrl: "",
    stock: 500,
  },

  // Family / multi-line
  {
    id: "plan-family-4",
    name: "Family Connect 4",
    description: "200GB shared across 4 lines, individual usage caps, one bill.",
    priceCents: 349000,
    imageUrl: "",
    stock: 200,
  },
  {
    id: "plan-family-6",
    name: "Family Connect 6",
    description: "300GB shared across 6 lines, parental controls included on every line.",
    priceCents: 499000,
    imageUrl: "",
    stock: 200,
  },

  // Home & fiber
  {
    id: "plan-home-basic",
    name: "XL Home Basic",
    description: "50Mbps fiber, unlimited data. A solid start for a small household.",
    priceCents: 189000,
    imageUrl: "",
    stock: 300,
  },
  {
    id: "plan-home-pro",
    name: "XL Home Pro",
    description: "300Mbps fiber with mesh WiFi included, covers up to 3 floors.",
    priceCents: 329000,
    imageUrl: "",
    stock: 300,
  },
  {
    id: "plan-home-gamer",
    name: "XL Home Gamer",
    description: "500Mbps fiber with a dedicated low-latency lane for online play.",
    priceCents: 349000,
    imageUrl: "",
    stock: 150,
  },

  // Roaming & international
  {
    id: "addon-roam-asean",
    name: "ASEAN Roaming Pass",
    description: "7 days of data roaming across Southeast Asia, no daily caps.",
    priceCents: 99000,
    imageUrl: "",
    stock: 500,
  },
  {
    id: "addon-roam-global",
    name: "Global Roaming Pass",
    description: "15 days of data roaming in 80+ countries worldwide.",
    priceCents: 249000,
    imageUrl: "",
    stock: 500,
  },
  {
    id: "addon-intl-call",
    name: "International Call Pack",
    description: "500 minutes of calls to 50+ countries, valid for 30 days.",
    priceCents: 59000,
    imageUrl: "",
    stock: 500,
  },

  // Business / SME
  {
    id: "plan-biz-starter",
    name: "XL Business Starter",
    description: "5 lines, 500GB pooled data, static IP for remote access.",
    priceCents: 599000,
    imageUrl: "",
    stock: 100,
  },
  {
    id: "plan-biz-pro",
    name: "XL Business Pro",
    description: "20 lines, 2TB pooled data, dedicated account support.",
    priceCents: 1499000,
    imageUrl: "",
    stock: 50,
  },

  // Add-ons
  {
    id: "addon-data-boost-5gb",
    name: "5GB Data Boost",
    description: "One-time top-up, stacks on top of your current plan's data.",
    priceCents: 25000,
    imageUrl: "",
    stock: 1000,
  },
  {
    id: "addon-data-boost-20gb",
    name: "20GB Data Boost",
    description: "One-time top-up for heavier months, no commitment change.",
    priceCents: 65000,
    imageUrl: "",
    stock: 1000,
  },
  {
    id: "addon-mesh-wifi",
    name: "Mesh WiFi Extender",
    description: "Whole-home coverage add-on, pairs with any XL Home plan.",
    priceCents: 149000,
    imageUrl: "",
    stock: 300,
  },
  {
    id: "addon-security-suite",
    name: "SecureNet Suite",
    description: "Device protection, parental controls, and ad-blocking across your network.",
    priceCents: 39000,
    imageUrl: "",
    stock: 500,
  },
  {
    id: "addon-cloud-storage",
    name: "100GB Cloud Backup",
    description: "Automatic photo and file backup, accessible from any device.",
    priceCents: 29000,
    imageUrl: "",
    stock: 500,
  },

  // Streaming / gaming niche
  {
    id: "plan-streamer-plus",
    name: "Streamer+ Plan",
    description: "150GB data, upload-optimized with low jitter for livestreaming.",
    priceCents: 219000,
    imageUrl: "",
    stock: 300,
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
