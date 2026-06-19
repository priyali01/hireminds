const mongoose = require('mongoose')

/**
 * TrainingData model
 * 
 * Stores purely anonymised dataset pairs for future LLM fine-tuning.
 * Only stores data if User.consentGiven === true.
 * No user references, no names, no PII.
 */
const trainingDataSchema = new mongoose.Schema({
  dataType: {
    type: String,
    enum: ['interview_qa', 'resume_feedback', 'goal_generation'],
    required: true
  },
  inputContext: {
    type: String,
    required: true
  },
  outputTarget: {
    type: String,
    required: true
  },
  score: {
    type: Number, // Quality of the generation (e.g. 1-10) for filtering
  },
  metadata: {
    // Arbitrary non-PII metadata (e.g., role="SDE", level="fresher")
    type: mongoose.Schema.Types.Mixed 
  }
}, {
  timestamps: true
})

const TrainingData = mongoose.model('TrainingData', trainingDataSchema)
module.exports = TrainingData
