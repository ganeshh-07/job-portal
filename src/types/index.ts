export interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  type: string;
  salary: string;
  description: string;
  requirements: string[];
  postedDate: string;
  category: string;
}

export interface Application {
  _id: string;
  job: string;
  applicant: { _id: string; name: string; email: string };
  coverLetter: string;
  status: 'pending' | 'accepted' | 'rejected';
  appliedAt: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'jobseeker' | 'employer';
  password?: string;
  company?: string;
}