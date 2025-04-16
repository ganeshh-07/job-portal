const Application = require('../models/Application');
const Job = require('../models/Job');

exports.applyForJob = async (req, res) => {
  try {
    console.log('Received apply request:', {
      params: req.params,
      body: req.body,
      user: req.user ? { id: req.user.id, role: req.user.role } : 'Not authenticated',
      headers: req.headers,
    });
    const { jobId } = req.params;
    const { coverLetter } = req.body;
    const applicant = req.user?.id;

    if (!applicant) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    const job = await Job.findById(jobId);
    if (!job) return res.status(404).json({ error: 'Job not found' });

    const existingApplication = await Application.findOne({ job: jobId, applicant });
    if (existingApplication) {
      return res.status(400).json({ error: 'You have already applied for this job' });
    }

    const application = new Application({ job: jobId, applicant, coverLetter: coverLetter || '', status: 'pending' });
    await application.save();
    console.log('Application saved:', application._id);
    res.status(201).json({ message: 'Application submitted', application });
  } catch (error) {
    console.error('Apply error:', error);
    if (error.code === 11000) {
      return res.status(400).json({ error: 'You have already applied for this job' });
    }
    res.status(400).json({ error: error.message });
  }
};

exports.getApplications = async (req, res) => {
  try {
    console.log('Fetching applications for user:', req.user?.id, 'Full URL:', req.protocol + '://' + req.get('host') + req.originalUrl);
    const applications = await Application.find({ applicant: req.user?.id }).populate('job applicant', 'title company name email');
    console.log('Applications query result:', applications.map(app => ({ _id: app._id, job: app.job?._id, status: app.status })));
    if (!applications.length) console.log('No applications found for user:', req.user?.id);
    res.json(applications);
  } catch (error) {
    console.error('Get applications error:', error);
    res.status(400).json({ error: error.message });
  }
};

exports.getApplicationsByJob = async (req, res) => {
  try {
    const { jobId } = req.params;
    const job = await Job.findById(jobId);
    if (!job) return res.status(404).json({ error: 'Job not found' });
    if (job.postedBy.toString() !== req.user?.id) {
      return res.status(403).json({ error: 'Access denied' });
    }
    const applications = await Application.find({ job: jobId }).populate('applicant', 'name email');
    res.json(applications);
  } catch (error) {
    console.error('Get applications by job error:', error);
    res.status(400).json({ error: error.message });
  }
};

exports.withdrawApplication = async (req, res) => {
  try {
    console.log('Received withdraw request:', {
      id: req.params.id,
      user: req.user ? { id: req.user.id, role: req.user.role } : 'Not authenticated',
      query: { _id: req.params.id, applicant: req.user?.id }
    });
    const application = await Application.findOneAndDelete({ _id: req.params.id, applicant: req.user?.id });
    if (!application) {
      console.log('Application not found for id:', req.params.id, 'user:', req.user?.id);
      return res.status(404).json({ error: 'Application not found' });
    }
    res.status(200).json({ message: 'Application withdrawn' });
  } catch (error) {
    console.error('Withdraw error:', error);
    res.status(400).json({ error: error.message });
  }
};

exports.updateApplicationStatus = async (req, res) => {
  try {
    console.log('Received status update request for ID:', req.params.id, 'URL:', req.originalUrl, 'Full URL:', req.protocol + '://' + req.get('host') + req.originalUrl);
    const { id } = req.params;
    const { status } = req.body;

    if (!['pending', 'accepted', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status value. Must be "pending", "accepted", or "rejected"' });
    }

    const application = await Application.findById(id);
    if (!application) {
      return res.status(404).json({ error: 'Application not found' });
    }

    const job = await Job.findById(application.job);
    if (!job || job.postedBy.toString() !== req.user?.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    application.status = status;
    await application.save();
    console.log('Application status updated:', application._id, 'to', status);
    res.json({ message: 'Status updated successfully', application });
  } catch (error) {
    console.error('Update status error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};