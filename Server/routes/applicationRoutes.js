const express = require('express');
const router = express.Router();
const { applyForJob, getApplications, getApplicationsByJob } = require('../controllers/applicationController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

router.post('/apply/:jobId', authMiddleware, roleMiddleware('jobseeker'), applyForJob);
router.get('/applications', authMiddleware, roleMiddleware('jobseeker'), getApplications);
router.get('/jobs/:jobId/applicants', authMiddleware, roleMiddleware('employer'), getApplicationsByJob);


module.exports = router;