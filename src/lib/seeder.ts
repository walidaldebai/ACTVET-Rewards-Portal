import { db, firebaseConfig } from './firebase';
import { initializeApp, deleteApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { ref, set, get, child } from 'firebase/database';

export const seedInitialData = async () => {
    console.log("Starting System Seeding (Realtime DB)...");
    const results = {
        usersCreated: 0,
        vouchersCreated: 0,
        errors: [] as string[]
    };

    // 1. Seed Voucher Levels
    try {
        const dbRef = ref(db);
        const snapshot = await get(child(dbRef, 'Voucher_Levels'));
        if (!snapshot.exists()) {
            console.log("Seeding Voucher Levels...");
            const vouchers: Record<string, any> = {
                'v1': { id: 'v1', name: 'Bronze Reward', valueAED: 50, pointCost: 500, description: 'Basic retail voucher' },
                'v2': { id: 'v2', name: 'Silver Reward', valueAED: 100, pointCost: 900, description: 'Premium dining voucher' },
                'v3': { id: 'v3', name: 'Gold Reward', valueAED: 250, pointCost: 2000, description: 'Luxury hotel/spa voucher' },
                'v4': { id: 'v4', name: 'Platinum Reward', valueAED: 500, pointCost: 3500, description: 'Ultimate experience voucher' }
            };

            await set(ref(db, 'Voucher_Levels'), vouchers);
            results.vouchersCreated = 4;
        }
    } catch (e: any) {
        results.errors.push(`Voucher Seed Error: ${e.message}`);
    }

    // 2. Define Test Users
    const testUsers = [
        { name: 'Admin User', email: 'admin@actvet.gov.ae', password: 'AdminPassword123!', role: 'Admin' },
        { name: 'Sarah Teacher', email: 'sarah.t@actvet.gov.ae', password: 'TeacherPass123!', role: 'Teacher' },
        { name: 'John Student', email: 'john.s@actvet.gov.ae', password: 'StudentPass123!', role: 'Student', grade: 10, points: 1250 },
        { name: 'Amna Student', email: 'amna.a@actvet.gov.ae', password: 'StudentPass123!', role: 'Student', grade: 11, points: 500 },
        { name: 'Khalid Student', email: 'khalid.m@actvet.gov.ae', password: 'StudentPass123!', role: 'Student', grade: 12, points: 3000 }
    ];

    // 3. Create Users
    for (const u of testUsers) {
        const tempApp = initializeApp(firebaseConfig, `seed-app-${Date.now()}-${Math.random()}`);
        const tempAuth = getAuth(tempApp);

        try {
            const userCredential = await createUserWithEmailAndPassword(tempAuth, u.email, u.password);
            const uid = userCredential.user.uid;

            const userData = {
                id: uid,
                name: u.name,
                email: u.email.toLowerCase(),
                role: u.role,
                password: u.password,
                grade: u.role === 'Student' ? u.grade : null,
                points: u.role === 'Student' ? u.points : null,
                createdAt: new Date().toISOString(),
                status: 'Active'
            };

            await set(ref(db, `Users/${uid}`), userData);
            results.usersCreated++;

            await signOut(tempAuth);
        } catch (authErr: any) {
            results.errors.push(`Error creating ${u.email}: ${authErr.message}`);
        } finally {
            await deleteApp(tempApp);
        }
    }

    return results;
};
