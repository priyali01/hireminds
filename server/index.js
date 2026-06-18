require('dotenv').config()
const app = require('./app')
const { connectDB } = require('./config/db')
const logger = require('./utils/logger')

const PORT = process.env.PORT || 3001

async function start() {
  try {
    await connectDB()
    app.listen(PORT, () => {
      logger.info(`HireMinds API running on port ${PORT} [${process.env.NODE_ENV}]`)
    })
  } catch (err) {
    logger.error('Failed to start server', { error: err.message })
    process.exit(1)
  }
}

start()