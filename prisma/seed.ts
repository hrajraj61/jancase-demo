import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const categories = ["Waste", "Roads", "Water", "Electricity", "Other"];
const sentiments = [
  { label: "angry", min: -1, max: -0.2 },
  { label: "neutral", min: -0.2, max: 0.2 },
  { label: "happy", min: 0.2, max: 1 },
];

function randomBetween(min: number, max: number) {
  return Number((Math.random() * (max - min) + min).toFixed(6));
}

function pickRandom<T>(items: T[]) {
  return items[Math.floor(Math.random() * items.length)];
}

async function main() {
  await prisma.report.deleteMany();

  const reports = Array.from({ length: 100 }, (_, index) => {
    const sentiment = pickRandom(sentiments);
    const sentimentScore = randomBetween(sentiment.min, sentiment.max);

    return {
      imageUrl: index % 5 === 0 ? `https://picsum.photos/seed/jancase-${index}/640/480` : null,
      description: `POC seeded report ${index + 1} for JanCase Hazaribagh monitoring.`,
      category: pickRandom(categories),
      severity: randomBetween(0.15, 0.98),
      latitude: randomBetween(24.0005, 24.0385),
      longitude: randomBetween(85.3405, 85.395),
      wardNumber: Math.floor(Math.random() * 12) + 1,
      sentimentScore,
      sentimentLabel: sentiment.label,
      status: Math.random() > 0.2 ? "Pending" : "Resolved",
    };
  });

  await prisma.report.createMany({ data: reports });
  console.log(`Seeded ${reports.length} reports.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
