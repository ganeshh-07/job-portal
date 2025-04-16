const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  company: { type: String, required: true },
  location: { type: String, required: true },
  salary: { type: Number },
  postedBy: { type: String, required: true }, // Should reference User ID or name
  createdAt: { type: Date, default: Date.now },
  type: { type: String, enum: ['Full-time', 'Part-time', 'Contract', 'Internship'] }, // Optional with validation
  category: { type: String, enum: ['IT', 'Marketing', 'Finance', 'Engineering', 'Design'] }, // Optional with validation
  requirements: [{ type: String }],
});

module.exports = mongoose.model('Job', jobSchema);