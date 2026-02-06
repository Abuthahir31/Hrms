// Script to create initial admin user in Firebase
// Run this once to create the admin account

const admin = require('firebase-admin');

// Initialize Firebase Admin (make sure you have your service account key)
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

async function createAdminUser() {
    try {
        const userRecord = await admin.auth().createUser({
            email: 'hradmin@gmail.com',
            password: 'admin123',
            emailVerified: true,
            disabled: false
        });

        console.log('✅ Successfully created admin user:', userRecord.uid);
        console.log('Email: hradmin@gmail.com');
        console.log('Password: admin123');

        // Optionally set custom claims for admin role
        await admin.auth().setCustomUserClaims(userRecord.uid, { admin: true });
        console.log('✅ Admin role assigned');

    } catch (error) {
        console.error('❌ Error creating admin user:', error);
    }
}

createAdminUser();
