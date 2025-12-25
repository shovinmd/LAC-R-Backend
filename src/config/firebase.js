const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
const initializeFirebase = () => {
  if (!admin.apps.length) {
    let privateKey = process.env.FIREBASE_PRIVATE_KEY;

    if (!privateKey) {
      throw new Error('FIREBASE_PRIVATE_KEY is not set. Please configure it in backend/.env or your hosting env vars.');
    }

    // Strip surrounding quotes if present
    if (
      (privateKey.startsWith('"') && privateKey.endsWith('"')) ||
      (privateKey.startsWith("'") && privateKey.endsWith("'"))
    ) {
      privateKey = privateKey.slice(1, -1);
    }

    // Normalize escaped newlines and remove stray carriage returns
    privateKey = privateKey
      .replace(/\\r\\n/g, '\n') // convert literal \r\n to newline
      .replace(/\\n/g, '\n')    // convert literal \n to newline
      .replace(/\\r/g, '\n')    // convert literal \r to newline
      .replace(/\r/g, '');      // remove actual carriage returns

    // Debug: log sanitized length and boundaries (not the full key)
    const previewStart = privateKey.slice(0, 40).replace(/\n/g, '\\n');
    const previewEnd = privateKey.slice(-40).replace(/\n/g, '\\n');
    console.log(`FIREBASE_PRIVATE_KEY length: ${privateKey.length}`);
    console.log(`FIREBASE_PRIVATE_KEY start: ${previewStart}`);
    console.log(`FIREBASE_PRIVATE_KEY end: ${previewEnd}`);

    // Validate PEM boundaries
    if (
      !privateKey.includes('-----BEGIN PRIVATE KEY-----') ||
      !privateKey.includes('-----END PRIVATE KEY-----')
    ) {
      throw new Error('FIREBASE_PRIVATE_KEY is not a valid PEM. Ensure it includes BEGIN/END PRIVATE KEY and uses \\n for newlines.');
    }

    const serviceAccount = {
      type: "service_account",
      project_id: process.env.FIREBASE_PROJECT_ID,
      private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
      private_key: privateKey,
      client_email: process.env.FIREBASE_CLIENT_EMAIL,
      client_id: process.env.FIREBASE_CLIENT_ID,
      auth_uri: "https://accounts.google.com/o/oauth2/auth",
      token_uri: "https://oauth2.googleapis.com/token",
      auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
      client_x509_cert_url: `https://www.googleapis.com/robot/v1/metadata/x509/${process.env.FIREBASE_CLIENT_EMAIL}`
    };

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: process.env.FIREBASE_PROJECT_ID
    });

    console.log('🔥 Firebase Admin initialized successfully');
  }

  return admin;
};

module.exports = initializeFirebase;
