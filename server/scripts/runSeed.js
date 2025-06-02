const { seedData } = require("../utils/seedData")

const runSeed = async () => {
  try {
    console.log("🌱 Starting database seeding...")
    await seedData()
    console.log("✅ Database seeding completed successfully!")
    process.exit(0)
  } catch (error) {
    console.error("❌ Error during seeding:", error)
    process.exit(1)
  }
}

runSeed()
