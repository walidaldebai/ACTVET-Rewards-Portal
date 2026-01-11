import type { User, VoucherLevel, Task } from './types';

export const mockUsers: User[] = [
    {
        id: '1',
        name: 'Ahmed Al Mansouri',
        email: 'ahmed@actvet.gov.ae',
        role: 'Student',
        grade: 11,
        points: 450,
    },
    {
        id: '2',
        name: 'Sara Al Blooshi',
        email: 'sara@actvet.gov.ae',
        role: 'Teacher',
        subject: 'Computer Science',
    },
    {
        id: '3',
        name: 'Admin User',
        email: 'admin@actvet.gov.ae',
        role: 'Admin',
    },
];

export const mockVouchers: VoucherLevel[] = [
    {
        id: 'l1',
        name: 'Basic Canteen Credit',
        creditAmount: 10,
        pointCost: 150,
        description: 'Digital credit for campus canteen entry-level meals.',
    },
    {
        id: 'l2',
        name: 'Standard Canteen Pass',
        creditAmount: 20,
        pointCost: 280,
        description: 'Standard institutional meal credit for registered students.',
    },
    {
        id: 'l3',
        name: 'Premium Canteen Bundle',
        creditAmount: 50,
        pointCost: 600,
        description: 'High-value canteen credit including specialty beverages and institutional meals.',
    },
];

export const mockTasks: Task[] = [
    {
        id: 't1',
        title: 'Complete Python Basics',
        description: 'Finish all exercises in Chapter 1 of the Python handbook.',
        points: 50,
        grade: 11,
        assignedBy: '2',
        subject: 'Computer Science',
        createdAt: new Date().toISOString()
    },
    {
        id: 't2',
        title: 'Advanced Robotics Lab',
        description: 'Document the assembly process of the drone prototype.',
        points: 100,
        grade: 12,
        assignedBy: '2',
        subject: 'Robotics',
        createdAt: new Date().toISOString()
    },
];
