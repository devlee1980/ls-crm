import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding LS Nexus database...");

  // Admin user
  const adminPassword = await bcrypt.hash("admin123", 12);
  const admin = await prisma.user.upsert({
    where: { email: "lee.mcduffie@lifescientific.com" },
    update: {},
    create: {
      name: "Lee McDuffie",
      email: "lee.mcduffie@lifescientific.com",
      password: adminPassword,
      role: "ADMIN",
      region: "National",
    },
  });

  // Sample rep
  const repPassword = await bcrypt.hash("rep123", 12);
  const rep = await prisma.user.upsert({
    where: { email: "rep@lifescientific.com" },
    update: {},
    create: {
      name: "John Smith",
      email: "rep@lifescientific.com",
      password: repPassword,
      role: "REP",
      region: "Midwest",
    },
  });

  // Sample products
  const products = await Promise.all([
    prisma.product.upsert({
      where: { sku: "LS-HERB-001" },
      update: {},
      create: {
        sku: "LS-HERB-001",
        name: "GlycoMax 4L Herbicide",
        description: "Generic glyphosate 4lb/gallon formulation",
        category: "Herbicide",
        unitPrice: 18.5,
        uom: "Gallon",
      },
    }),
    prisma.product.upsert({
      where: { sku: "LS-FUNG-001" },
      update: {},
      create: {
        sku: "LS-FUNG-001",
        name: "AzoxMax Fungicide",
        description: "Broad-spectrum azoxystrobin fungicide",
        category: "Fungicide",
        unitPrice: 95.0,
        uom: "Quart",
      },
    }),
    prisma.product.upsert({
      where: { sku: "LS-INSEC-001" },
      update: {},
      create: {
        sku: "LS-INSEC-001",
        name: "ChloroShield Insecticide",
        description: "Chlorpyrifos replacement broad-spectrum insecticide",
        category: "Insecticide",
        unitPrice: 42.0,
        uom: "Quart",
      },
    }),
    prisma.product.upsert({
      where: { sku: "LS-ADJ-001" },
      update: {},
      create: {
        sku: "LS-ADJ-001",
        name: "SpreadMax Adjuvant",
        description: "Non-ionic surfactant crop oil concentrate",
        category: "Adjuvant",
        unitPrice: 12.75,
        uom: "Quart",
      },
    }),
    prisma.product.upsert({
      where: { sku: "LS-SEED-001" },
      update: {},
      create: {
        sku: "LS-SEED-001",
        name: "ThioMax Seed Treatment",
        description: "Thiamethoxam + fludioxonil combination seed treatment",
        category: "Seed Treatment",
        unitPrice: 185.0,
        uom: "Case",
      },
    }),
  ]);

  // Sample customers
  const customer1 = await prisma.customer.create({
    data: {
      name: "Heartland Ag Supply",
      accountNumber: "ACC-001",
      industry: "Distribution",
      type: "DISTRIBUTOR",
      wholesalePercent: 80,
      retailPercent: 20,
      rating: 5,
      status: "ACTIVE",
      assignedRepId: rep.id,
      locations: {
        create: [
          {
            label: "Main Office",
            address1: "1200 Farm Bureau Rd",
            city: "Des Moines",
            state: "IA",
            zip: "50301",
            phone: "(515) 555-0100",
            isPrimary: true,
          },
          {
            label: "Distribution Center",
            address1: "4500 Industrial Pkwy",
            city: "Ames",
            state: "IA",
            zip: "50010",
            phone: "(515) 555-0200",
          },
        ],
      },
      contacts: {
        create: [
          {
            firstName: "Mike",
            lastName: "Johnson",
            title: "VP of Purchasing",
            phone: "(515) 555-0101",
            email: "mjohnson@heartlandag.com",
            isPrimary: true,
            decisionMaker: true,
          },
          {
            firstName: "Sarah",
            lastName: "Williams",
            title: "Procurement Manager",
            phone: "(515) 555-0102",
            email: "swilliams@heartlandag.com",
          },
        ],
      },
    },
  });

  const customer2 = await prisma.customer.create({
    data: {
      name: "Prairie State Retailers",
      accountNumber: "ACC-002",
      industry: "Retail Ag",
      type: "RETAILER",
      wholesalePercent: 10,
      retailPercent: 90,
      rating: 4,
      status: "ACTIVE",
      assignedRepId: rep.id,
      locations: {
        create: [
          {
            label: "Main Store",
            address1: "500 Main Street",
            city: "Springfield",
            state: "IL",
            zip: "62701",
            phone: "(217) 555-0300",
            isPrimary: true,
          },
        ],
      },
      contacts: {
        create: [
          {
            firstName: "Tom",
            lastName: "Baker",
            title: "Store Manager",
            phone: "(217) 555-0301",
            email: "tbaker@prairiestate.com",
            isPrimary: true,
            decisionMaker: true,
          },
        ],
      },
    },
  });

  // Revenue records
  await prisma.revenueRecord.createMany({
    data: [
      {
        customerId: customer1.id,
        repId: rep.id,
        period: "Q1 2025",
        date: new Date("2025-03-31"),
        totalAmount: 125000,
      },
      {
        customerId: customer1.id,
        repId: rep.id,
        period: "Q2 2025",
        date: new Date("2025-06-30"),
        totalAmount: 187500,
      },
      {
        customerId: customer1.id,
        repId: rep.id,
        period: "Q3 2025",
        date: new Date("2025-09-30"),
        totalAmount: 210000,
      },
      {
        customerId: customer2.id,
        repId: rep.id,
        period: "Q1 2025",
        date: new Date("2025-03-31"),
        totalAmount: 45000,
      },
      {
        customerId: customer2.id,
        repId: rep.id,
        period: "Q2 2025",
        date: new Date("2025-06-30"),
        totalAmount: 62000,
      },
    ],
  });

  // Action items
  await prisma.actionItem.createMany({
    data: [
      {
        customerId: customer1.id,
        assignedToId: rep.id,
        title: "Present Q1 2026 forecast to Heartland",
        description: "Schedule call with Mike Johnson to review annual forecast",
        priority: "HIGH",
        status: "TODO",
        dueDate: new Date("2026-01-20"),
      },
      {
        customerId: customer2.id,
        assignedToId: rep.id,
        title: "Contract renewal discussion",
        description: "Prairie State annual pricing agreement up for renewal",
        priority: "URGENT",
        status: "IN_PROGRESS",
        dueDate: new Date("2026-01-10"),
      },
      {
        customerId: customer1.id,
        assignedToId: rep.id,
        title: "Deliver product samples — GlycoMax 4L",
        priority: "MEDIUM",
        status: "DONE",
        dueDate: new Date("2025-12-15"),
        completedAt: new Date("2025-12-14"),
      },
    ],
  });

  // Sample forecast
  await prisma.forecast.create({
    data: {
      customerId: customer1.id,
      repId: rep.id,
      period: "2026",
      startDate: new Date("2026-01-01"),
      endDate: new Date("2026-12-31"),
      status: "DRAFT",
      totalAmount: 250000,
      notes: "Annual forecast based on prior year + 15% growth",
      items: {
        create: [
          {
            productId: products[0].id,
            quantity: 5000,
            unitPrice: products[0].unitPrice,
            wholesalePercent: 80,
            retailPercent: 20,
            lineTotal: 5000 * products[0].unitPrice,
          },
          {
            productId: products[1].id,
            quantity: 800,
            unitPrice: products[1].unitPrice,
            wholesalePercent: 80,
            retailPercent: 20,
            lineTotal: 800 * products[1].unitPrice,
          },
        ],
      },
    },
  });

  console.log("✅ Seed complete!");
  console.log("   Admin: lee.mcduffie@lifescientific.com / admin123");
  console.log("   Rep:   rep@lifescientific.com / rep123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
