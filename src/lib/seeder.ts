import { db, firebaseConfig } from './firebase';
import { initializeApp, deleteApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, setDoc, collection, getDocs } from 'firebase/firestore';

export const seedInitialData = async () => {
    console.log("Starting System Seeding...");
    const results = {
        usersCreated: 0,
        vouchersCreated: 0,
        errors: [] as string[]
    };

    // 1. Seed Voucher Levels if empty
    try {
        const voucherSnap = await getDocs(collection(db, 'Voucher_Levels'));
        if (voucherSnap.empty) {
            console.log("Seeding Voucher Levels...");
            const vouchers = [
                { id: 'v1', name: 'Bronze Reward', valueAED: 50, pointCost: 500, description: 'Basic retail voucher' },
                { id: 'v2', name: 'Silver Reward', valueAED: 100, pointCost: 900, description: 'Premium dining voucher' },
                { id: 'v3', name: 'Gold Reward', valueAED: 250, pointCost: 2000, description: 'Luxury hotel/spa voucher' },
                { id: 'v4', name: 'Platinum Reward', valueAED: 500, pointCost: 3500, description: 'Ultimate experience voucher' }
            ];

            for (const v of vouchers) {
                await setDoc(doc(db, 'Voucher_Levels', v.id), v);
                results.vouchersCreated++;
            }
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

    // 3. Create Users in Auth & Firestore
    // We need to use a temporary app to avoid logging out the current admin
    for (const u of testUsers) {
        const tempApp = initializeApp(firebaseConfig, `seed-app-${Date.now()}-${Math.random()}`);
        const tempAuth = getAuth(tempApp);

        try {
            console.log(`Creating user: ${u.email}`);
            const userCredential = await createUserWithEmailAndPassword(tempAuth, u.email, u.password);
            const uid = userCredential.user.uid;

            const userData = {
                id: uid,
                name: u.name,
                email: u.email.toLowerCase(),
                role: u.role,
                password: u.password, // Storing for admin dashboard visibility as per existing design
                grade: u.role === 'Student' ? u.grade : null,
                points: u.role === 'Student' ? u.points : null,
                createdAt: new Date().toISOString(),
                status: 'Active'
            };

            await setDoc(doc(db, 'Users', uid), userData);
            results.usersCreated++;

            await signOut(tempAuth);
        } catch (authErr: any) {
            if (authErr.code === 'auth/email-already-in-use') {
                console.log(`User ${u.email} already exists in Auth. Skipping...`);
            } else {
                results.errors.push(`Error creating ${u.email}: ${authErr.message}`);
            }
        } finally {
            await deleteApp(tempApp);
        }
    }

    return results;
};
