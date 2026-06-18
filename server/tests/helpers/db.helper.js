/**
 * Test setup shared across all test files.
 *
 * Uses mongodb-memory-server so tests never touch a real database.
 * Each test suite gets a clean DB state via beforeEach cleanup.
 */
const { MongoMemoryServer } = require('mongodb-memory-server')
const mongoose = require('mongoose')

let mongoServer

/**
 * Starts an in-memory MongoDB instance and connects Mongoose to it.
 * Call in beforeAll() of each test suite.
 */
async function setupTestDB() {
  mongoServer = await MongoMemoryServer.create()
  const uri = mongoServer.getUri()
  await mongoose.connect(uri)
}

/**
 * Clears all collections between tests so state doesn't bleed across.
 * Call in afterEach() or beforeEach() depending on your preference.
 */
async function clearDB() {
  const collections = mongoose.connection.collections
  for (const key in collections) {
    await collections[key].deleteMany({})
  }
}

/**
 * Disconnects Mongoose and stops the in-memory server.
 * Call in afterAll() of each test suite.
 */
async function teardownTestDB() {
  await mongoose.disconnect()
  await mongoServer.stop()
}

module.exports = { setupTestDB, clearDB, teardownTestDB }
