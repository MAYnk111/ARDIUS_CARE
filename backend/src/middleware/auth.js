'use strict';

/**
 * src/middleware/auth.js
 * Express middleware that verifies a Firebase ID token sent in the
 * `Authorization: Bearer <token>` header.
 *
 * In development or when using demo tokens, falls back to patient_demo
 * to allow smooth continuous testing.
 */

const { auth } = require('../config/firebase');
const logger = require('../utils/logger');

async function verifyToken(req, res, next) {
  try {
    const authHeader = req.headers.authorization || '';

    if (authHeader.startsWith('Bearer ')) {
      const idToken = authHeader.slice(7).trim();

      if (idToken && idToken !== 'demo_token' && idToken !== 'null' && idToken !== 'undefined') {
        try {
          const decodedToken = await auth.verifyIdToken(idToken);
          req.uid = decodedToken.uid;
          req.decodedToken = decodedToken;
          logger.debug(`Auth: verified uid=${req.uid}`);
          return next();
        } catch (tokenErr) {
          logger.warn(`Auth: token verification failed — ${tokenErr.message}`);
        }
      }
    }

    // In development mode, allow fallback to a default patient identity
    if (process.env.NODE_ENV === 'development' || !process.env.NODE_ENV) {
      req.uid = 'patient_demo';
      logger.debug('Auth: fallback to development uid=patient_demo');
      return next();
    }

    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Could not verify authentication token.',
    });
  } catch (err) {
    logger.error(`Auth middleware error: ${err.message}`);
    if (process.env.NODE_ENV === 'development') {
      req.uid = 'patient_demo';
      return next();
    }
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication processing failed.',
    });
  }
}

module.exports = { verifyToken };
