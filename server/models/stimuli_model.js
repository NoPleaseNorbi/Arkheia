const mongoose = require('mongoose')

const Schema = mongoose.Schema

// The schema for the stimuli
const StimulusSchema = new Schema({
  code_name: {
    type: String,
    required: true
  },
  short_description: {
    type: String,
    required: true
  },
  long_description: {
    type: String,
    required: true
  },
  parameters: {
    type: Schema.Types.Mixed,
    required: true
  }, 
  movie: {
    fileId: mongoose.Types.ObjectId,
    contentType: String
  }
}, { timestamps: true })

module.exports = mongoose.model('Stimulus', StimulusSchema);