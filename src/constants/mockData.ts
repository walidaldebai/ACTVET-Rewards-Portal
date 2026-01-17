import type { User, VoucherLevel, Task } from '../types';

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
        id: 'v1',
        name: 'Staff Voucher (5 AED)',
        aedValue: 5,
        pointCost: 250,
        description: 'Quick snack or beverage credit',
    },
    {
        id: 'v2',
        name: 'Staff Voucher (10 AED)',
        aedValue: 10,
        pointCost: 500,
        description: 'Standard meal credit',
    },
    {
        id: 'v3',
        name: 'Staff Voucher (15 AED)',
        aedValue: 15,
        pointCost: 750,
        description: 'Premium meal combo credit',
    },
    {
        id: 'v4',
        name: 'Staff Voucher (20 AED)',
        aedValue: 20,
        pointCost: 1000,
        description: 'Complete dining experience credit',
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
