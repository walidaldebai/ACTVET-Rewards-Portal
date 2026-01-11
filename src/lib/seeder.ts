import { db, firebaseConfig } from './firebase';
import { initializeApp, deleteApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { ref, set } from 'firebase/database';

export const seedInitialData = async () => {
    console.log("Starting System Seeding (Realtime DB)...");
    const results = {
        usersCreated: 0,
        vouchersCreated: 0,
        errors: [] as string[]
    };

    // 1. Seed Voucher Levels (ALWAYS seed if empty or just overwrite to be safe)
    try {
        const vouchers: Record<string, any> = {
            'v1': { id: 'v1', name: 'Bronze Canteen Credit', creditAmount: 10, pointCost: 500, description: 'Single meal canteen voucher' },
            'v2': { id: 'v2', name: 'Silver Canteen Credit', creditAmount: 25, pointCost: 900, description: 'Premium meal + beverage bundle' },
            'v3': { id: 'v3', name: 'Gold Canteen Credit', creditAmount: 50, pointCost: 2000, description: 'Multi-day campus refueling pass' },
            'v4': { id: 'v4', name: 'Elite Canteen Pass', creditAmount: 100, pointCost: 3500, description: 'Institutional premium catering access' }
        };
        await set(ref(db, 'Voucher_Levels'), vouchers);
        results.vouchersCreated = 4;
        console.log("Vouchers Seeded.");
    } catch (e: any) {
        results.errors.push(`Voucher Seed Error: ${e.message}`);
    }

    // 1.5 Seed Campus Classes
    try {
        const classes: Record<string, any> = {
            '9-A': { grade: 9, name: 'A' },
            '9-B': { grade: 9, name: 'B' },
            '9-C': { grade: 9, name: 'C' },
            '10-A': { grade: 10, name: 'A' },
            '10-B': { grade: 10, name: 'B' },
            '10-C': { grade: 10, name: 'C' },
            '11-A': { grade: 11, name: 'A' },
            '11-B': { grade: 11, name: 'B' },
            '11-C': { grade: 11, name: 'C' },
            '11-D': { grade: 11, name: 'D' },
            '12-A': { grade: 12, name: 'A' },
            '12-B': { grade: 12, name: 'B' },
            '12-C': { grade: 12, name: 'C' }
        };
        await set(ref(db, 'Classes'), classes);
        console.log("Classes Seeded.");
    } catch (e: any) {
        results.errors.push(`Class Seed Error: ${e.message}`);
    }

    // 2. Define Comprehensive Academic Faculty
    const testUsers = [
        // Admin
        { name: 'Walid Admin', email: 'walid@actvet.gov.ae', password: 'walidisEPIC@1234567890', role: 'Admin' },

        // Teachers across different subjects
        { name: 'Dr. Sarah Ahmed', email: 'sarah.a@actvet.gov.ae', password: 'TeacherPass123!', role: 'Teacher', subject: 'Mathematics' },
        { name: 'Eng. Omar Khalid', email: 'omar.k@actvet.gov.ae', password: 'TeacherPass123!', role: 'Teacher', subject: 'Physics' },
        { name: 'Ms. Fatima Saeed', email: 'fatima.s@actvet.gov.ae', password: 'TeacherPass123!', role: 'Teacher', subject: 'English' },
        { name: 'Mr. Zayed Mansour', email: 'zayed.m@actvet.gov.ae', password: 'TeacherPass123!', role: 'Teacher', subject: 'Computer Science' },
        { name: 'Dr. Amna Al Ali', email: 'amna.ali@actvet.gov.ae', password: 'TeacherPass123!', role: 'Teacher', subject: 'Chemistry' },

        // Students spread across different grades and classes
        { name: 'Ahmad Rashid', email: 'ahmad.r@actvet.gov.ae', password: 'StudentPass123!', role: 'Student', grade: 11, classId: '11-1', points: 1500 },
        { name: 'Mariam Ali', email: 'mariam.a@actvet.gov.ae', password: 'StudentPass123!', role: 'Student', grade: 11, classId: '11-1', points: 2200 },
        { name: 'Sultan Ahmed', email: 'sultan.a@actvet.gov.ae', password: 'StudentPass123!', role: 'Student', grade: 11, classId: '11-2', points: 900 },
        { name: 'Noora Khalid', email: 'noora.k@actvet.gov.ae', password: 'StudentPass123!', role: 'Student', grade: 10, classId: '10-1', points: 1100 },
        { name: 'Hamad Saeed', email: 'hamad.s@actvet.gov.ae', password: 'StudentPass123!', role: 'Student', grade: 10, classId: '10-1', points: 1750 },
        { name: 'Laila Yousif', email: 'laila.y@actvet.gov.ae', password: 'StudentPass123!', role: 'Student', grade: 12, classId: '12-1', points: 3000 },
        { name: 'Khalifa Omar', email: 'khalifa.o@actvet.gov.ae', password: 'StudentPass123!', role: 'Student', grade: 12, classId: '12-2', points: 500 }
    ];

    // 3. Create Users
    for (const u of testUsers) {
        const tempApp = initializeApp(firebaseConfig, `seed-app-${Date.now()}-${Math.random()}`);
        const tempAuth = getAuth(tempApp);

        try {
            const userCredential = await createUserWithEmailAndPassword(tempAuth, u.email, u.password);
            const uid = userCredential.user.uid;

            const userData: any = {
                id: uid,
                name: u.name,
                email: u.email.toLowerCase(),
                role: u.role,
                password: u.password,
                createdAt: new Date().toISOString(),
                status: 'Active'
            };

            if (u.role === 'Student') {
                userData.grade = u.grade;
                userData.classId = u.classId;
                userData.points = u.points;
            } else if (u.role === 'Teacher') {
                userData.subject = u.subject;
            }

            await set(ref(db, `Users/${uid}`), userData);
            results.usersCreated++;
            await signOut(tempAuth);
        } catch (authErr: any) {
            // If user already exists, still update their metadata in DB
            try {
                // We'd need their UID to update. For seeding, if they exist we skip auth creation but ensure DB node is correct.
                // In a real seeder we might use admin SDK but here we just catch and log.
                results.errors.push(`Note: ${u.email} already exists or auth error: ${authErr.message}`);
            } catch (dbErr) { }
        } finally {
            await deleteApp(tempApp);
        }
    }

    return results;
};
