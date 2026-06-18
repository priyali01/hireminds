const mongoose = require('mongoose')
const logger = require('../utils/logger')

let isConnected = false

async function connectDB() {
  if (isConnected) return

  const MONGODB_URI = process.env.MONGODB_URI

  if (!MONGODB_URI) {
    throw new Error('MONGODB_URI is not defined in environment variables')
  }

  mongoose.connection.on('connected', () => {
    isConnected = true
    logger.info('MongoDB connected successfully')
  })

  mongoose.connection.on('error', (err) => {
    logger.error('MongoDB connection error', { error: err.message })
  })

  mongoose.connection.on('disconnected', () => {
    isConnected = false
    logger.warn('MongoDB disconnected')
  })

  // Graceful shutdown on SIGTERM
  process.on('SIGTERM', async () => {
    await mongoose.connection.close()
    logger.info('MongoDB connection closed on SIGTERM')
    process.exit(0)
  })

  let retries = 5
  while (retries) {
    try {
      await mongoose.connect(MONGODB_URI, {
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
      })
      break
    } catch (err) {
      retries -= 1
      logger.error(`MongoDB connection failed. Retries left: ${retries}`, { error: err.message })
      if (!retries) throw err
      await new Promise((r) => setTimeout(r, 3000))
    }
  }
}

module.exports = { connectDB }
