const mongoose = require('mongoose')

const githubConnectStateSchema = new mongoose.Schema({
  state: { type: String, required: true, unique: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  expiresAt: { type: Date, required: true },
})

githubConnectStateSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 })

module.exports = mongoose.model('GitHubConnectState', githubConnectStateSchema)
