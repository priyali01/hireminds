const mongoose = require('mongoose')

const githubConnectionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  installationId: { type: Number, required: true },
  accountLogin: { type: String, default: '' },
}, { timestamps: true })

module.exports = mongoose.model('GitHubConnection', githubConnectionSchema)
