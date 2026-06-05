const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const settings = await prisma.settings.findFirst();
  console.log('Settings:', settings);
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
