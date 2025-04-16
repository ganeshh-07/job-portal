const express = require('express');
const router = express.Router();
const { applyForJob, getApplications, getApplicationsByJob, withdrawApplication } = require('../controllers/applicationController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

console.log('Loaded middleware - authMiddleware:', typeof authMiddleware, 'roleMiddleware:', typeof roleMiddleware);

router.post('/apply/:jobId', authMiddleware, roleMiddleware('jobseeker'), applyForJob);
router.get('/applications', authMiddleware, roleMiddleware('jobseeker'), getApplications);
router.get('/jobs/:jobId/applicants', authMiddleware, roleMiddleware('employer'), getApplicationsByJob);
router.delete('/applications/:id', authMiddleware, roleMiddleware('jobseeker'), withdrawApplication); // Added DELETE route

module.exports = router;