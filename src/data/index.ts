import { Job, Application, User } from '../types';

export const dummyJobs: Job[] = [
  {
    id: '1',
    title: 'Senior React Developer',
    company: 'TechCorp Inc.',
    location: 'Remote',
    type: 'Full-time',
    salary: '$120,000 - $150,000',
    description: 'We are looking for a senior React developer to join our team...',
    requirements: [
      '5+ years of React experience',
      'TypeScript proficiency',
      'Experience with state management',
    ],
    postedDate: '2024-03-10',
    category: 'Development',
  },
  {
    id: '2',
    title: 'UI/UX Designer',
    company: 'DesignHub',
    location: 'New York, NY',
    type: 'Full-time',
    salary: '$90,000 - $120,000',
    description: 'Join our creative team as a UI/UX Designer...',
    requirements: [
      '3+ years of design experience',
      'Proficiency in Figma',
      'Strong portfolio',
    ],
    postedDate: '2024-03-09',
    category: 'Design',
  },
  {
    id: '3',
    title: 'Marketing Manager',
    company: 'GrowthCo',
    location: 'San Francisco, CA',
    type: 'Full-time',
    salary: '$100,000 - $130,000',
    description: 'Lead our marketing initiatives...',
    requirements: [
      '5+ years of marketing experience',
      'Experience with digital marketing',
      'Strong analytical skills',
    ],
    postedDate: '2024-03-08',
    category: 'Marketing',
  },
];

export const dummyApplications: Application[] = [
  {
    id: '1',
    jobId: '1',
    userId: '1',
    status: 'pending',
    appliedDate: '2024-03-12',
    coverLetter: 'I am excited to apply for this position...',
    resume: 'https://example.com/resume.pdf',
  },
  {
    id: '2',
    jobId: '2',
    userId: '1',
    status: 'accepted',
    appliedDate: '2024-03-10',
    coverLetter: 'I believe I would be a great fit...',
    resume: 'https://example.com/resume.pdf',
  },
  {
    id: '3',
    jobId: '3',
    userId: '1',
    status: 'rejected',
    appliedDate: '2024-03-08',
    coverLetter: 'I am interested in this opportunity...',
    resume: 'https://example.com/resume.pdf',
  },
];

export const dummyUsers: User[] = [
  {
    id: '1',
    name: 'John Doe',
    email: 'john@example.com',
    role: 'jobseeker',
  },
  {
    id: '2',
    name: 'Jane Smith',
    email: 'jane@techcorp.com',
    role: 'employer',
    company: 'TechCorp Inc.',
  },
];