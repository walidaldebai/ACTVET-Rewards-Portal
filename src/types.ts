ãq!export type Role = 'Student' | 'Teacher' | 'Admin';
export type Grade = 9 | 10 | 11 | 12;

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  grade?: Grade;
  points?: number;
  subject?: string; // For teachers
  password?: string; // For admin tracking
}

export interface VoucherLevel {
  id: string;
  name: string;
  valueAED: number;
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
  status: 'Pending' | 'Completed' | 'Approved';
  studentId?: string;
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
