const { PrismaClient } = require("@prisma/client");
const { scryptSync, randomBytes } = require("crypto");

function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

async function main() {
  const prisma = new PrismaClient();
  const email = process.env.PANEL_ADMIN_EMAIL || "admin@example.com";
  const password = process.env.PANEL_ADMIN_PASSWORD || "changeme";

  const existing = await prisma.operators.findUnique({ where: { email } });
  if (existing) {
    console.log("Operator already exists:", email);
    return;
  }

  await prisma.operators.create({
    data: {
      email,
      password_hash: hashPassword(password),
      name: "Admin",
    },
  });
  console.log("Created operator:", email);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => process.exit(0));
