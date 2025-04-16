const Job = require('../models/Job');

exports.getJobs = async (req, res) => {
  try {
    const { search, location, postedBy } = req.query;
    console.log('Received query parameters:', { search, location, postedBy });

    let query = {};
    
    if (postedBy) {
      query.postedBy = postedBy;
      console.log('Applied query filter:', query);
    }

    if (search) query.$or = [{ title: new RegExp(search, 'i') }, { company: new RegExp(search, 'i') }];
    if (location) query.location = new RegExp(location, 'i');

    console.log('Final query before execution:', query);

    const jobs = await Job.find(query).select('_id title description company location salary createdAt type category requirements postedBy');
    console.log('Raw jobs from database:', jobs.map(job => ({
      _id: job._id,
      postedBy: job.postedBy ? job.postedBy.toString() : 'undefined'
    })));
    res.status(200).json(jobs);
  } catch (error) {
    console.error('Error in getJobs:', error.message, error.stack);
    res.status(500).json({ error: error.message });
  }
};

exports.getJobById = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ error: 'Job not found' });
    res.status(200).json(job);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.createJob = async (req, res) => {
  try {
    const user = req.user;
    if (user.role !== 'employer') return res.status(403).json({ error: 'Only employers can create jobs' });
    const job = new Job({
      ...req.body,
      postedBy: user.id,
      createdAt: new Date(),
    });
    const savedJob = await job.save();
    res.status(201).json(savedJob);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateJob = async (req, res) => {
  try {
    const user = req.user;
    if (user.role !== 'employer') return res.status(403).json({ error: 'Only employers can update jobs' });
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ error: 'Job not found' });
    if (job.postedBy.toString() !== user.id) return res.status(403).json({ error: 'Access denied' });
    const updatedJob = await Job.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    res.status(200).json(updatedJob);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.deleteJob = async (req, res) => {
  try {
    const user = req.user;
    if (user.role !== 'employer') return res.status(403).json({ error: 'Only employers can delete jobs' });
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ error: 'Job not found' });
    await Job.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'Job deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};