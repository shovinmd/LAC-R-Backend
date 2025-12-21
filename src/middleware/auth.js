const admin = require('firebase-admin');

// Middleware to verify Firebase ID token
const verifyFirebaseToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'No token provided or invalid format'
      });
    }

    const token = authHeader.split('Bearer ')[1];

    if (!token) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'No token provided'
      });
    }

    // Verify the token with Firebase
    const decodedToken = await admin.auth().verifyIdToken(token);

    // Add user information to request object
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      emailVerified: decodedToken.email_verified,
      displayName: decodedToken.name,
      photoURL: decodedToken.picture,
      phoneNumber: decodedToken.phone_number
    };

    next();
  } catch (error) {
    console.error('Token verification error:', error);

    if (error.code === 'auth/id-token-expired') {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Token has expired'
      });
    }

    if (error.code === 'auth/id-token-revoked') {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Token has been revoked'
      });
    }

    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid token'
    });
  }
};

// Middleware to check if user is admin
const requireAdmin = (req, res, next) => {
  // This would typically check a database field or custom claims
  // For now, we'll assume admin check is handled elsewhere
  next();
};

module.exports = {
  verifyFirebaseToken,
  requireAdmin
};
