const mongoose = require("mongoose")
const { seedDatabase } = require("../utils/seedData")
require("dotenv").config()

const runSeed = async () => {
  try {
    console.log("🌱 Connecting to database...")
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    })
    console.log("✅ Connected to MongoDB")

    console.log("🌱 Starting database seeding...")
    await seedDatabase()
    console.log("✅ Database seeding completed successfully!")

    await mongoose.disconnect()
    console.log("🔌 Disconnected from MongoDB")

    process.exit(0)
  } catch (error) {
    console.error("❌ Error during seeding:", error)
    process.exit(1)
  }
}

runSeed()
