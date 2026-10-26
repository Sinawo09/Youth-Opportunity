const { db, hashToken } = require('../db/database');

function bearerToken(req) {
  const match = /^Bearer\s+(.+)$/i.exec(req.get('authorization') || '');
  return match ? match[1].trim() : null;
}

function attachUser(req, token) {
  const row = db.prepare(`
    SELECT profiles.*, sessions.id AS session_id
    FROM sessions JOIN profiles ON profiles.id = sessions.user_id
    WHERE sessions.access_token_hash = ? AND sessions.access_expires_at > ?
  `).get(hashToken(token), Date.now());
  if (!row) return false;
  req.user = row;
  req.sessionId = row.session_id;
  return true;
}

function authenticate(req, res, next) {
  const token = bearerToken(req);
  if (!token) {
    return res.status(401).json({ success: false, error: { code: 'AUTH_REQUIRED', message: 'A bearer access token is required.' } });
  }
  try {
    if (!attachUser(req, token)) {
      return res.status(401).json({ success: false, error: { code: 'INVALID_TOKEN', message: 'The access token is invalid or expired.' } });
    }
    return next();
  } catch (error) {
    return next(error);
  }
}

function optionalAuthenticate(req, res, next) {
  const token = bearerToken(req);
  if (!token) return next();
  try {
    if (!attachUser(req, token)) {
      return res.status(401).json({ success: false, error: { code: 'INVALID_TOKEN', message: 'The access token is invalid or expired.' } });
    }
    return next();
  } catch (error) {
    return next(error);
  }
}

function authorize(...roles) {
  return function roleCheck(req, res, next) {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Administrator access is required.' } });
    }
    return next();
  };
}

module.exports = { authenticate, authorize, optionalAuthenticate };
