export type Role = 'Student' | 'Teacher' | 'Admin';
export type Grade = 9 | 10 | 11 | 12;

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  grade?: Grade;
  points?: number;
  subject?: string; // For teachers
  assignedClasses?: string[]; // Classes a teacher is responsible for
  password?: string; // For admin tracking
  classId?: string; // For students, e.g., "11-A"
  quizAttempts?: number; // Total attempts at the ATS Innovator Quiz
  isInnovatorVerified?: boolean; // If student passed the mandatory quiz
}

export interface VoucherLevel {
  id: string;
  name: string;
  creditAmount: number;
  pointCost: number;
  description: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  points: number;
  grade: Grade;
  assignedBy: string;
  assignedToClass?: string;
  subject: string;
  createdAt: string;
  attachmentUrl?: string; // New: PDF/Resources
  attachmentName?: string;
  deadline?: string; // New: Task deadline ISO string
  maxScore?: number; // e.g. "out of 10"
}

export interface TaskSubmission {
  id: string;
  taskId: string;
  studentId: string;
  studentName: string;
  studentGrade: Grade;
  status: 'Pending' | 'Approved' | 'Rejected';
  submittedAt: string;
  points: number;
  taskTitle: string;
  subject: string;
  submissionFileUrl?: string; // New: The "solved" file
  submissionFileName?: string;
  teacherComment?: string;
  actualScore?: number; // The mark given (e.g. 8) 
  maxScore?: number; // The possible mark (e.g. 10)
  aiFlagged?: boolean; // If AI detection triggered
}

export interface PointHistory {
  id: string;
  userId: string;
  points: number;
  reason: string;
  timestamp: string;
  type: 'Awarded' | 'Redeemed';
}

export interface Redemption {
  id: string;
  userId: string;
  voucherId: string;
  code: string;
  timestamp: string;
  status: 'Active' | 'Used';
}

export interface CampusClass {
  id: string; // Dynamic ID, e.g. "9-A"
  grade: Grade;
  name: string; // e.g. "A"
}
