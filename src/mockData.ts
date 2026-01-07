import { User, VoucherLevel, Task } from './types';

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
        name: 'Level 1 Voucher',
        valueAED: 10,
        pointCost: 150,
        description: 'Digital code generated for 10 AED Canteen credit.',
    },
    {
        id: 'l2',
        name: 'Level 2 Voucher',
        valueAED: 20,
        pointCost: 280,
        description: 'Digital code generated for 20 AED Canteen credit.',
    },
    {
        id: 'l3',
        name: 'Level 3 Voucher',
        valueAED: 50,
        pointCost: 600,
        description: 'Digital code + Email to Canteen for 50 AED value.',
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
        status: 'Pending',
    },
    {
        id: 't2',
        title: 'Advanced Robotics Lab',
        description: 'Document the assembly process of the drone prototype.',
        points: 100,
        grade: 12,
        assignedBy: '2',
        status: 'Approved',
        studentId: '1',
    },
];
