const { randomBytes, scrypt: scryptCallback, timingSafeEqual } = require('node:crypto');
const { promisify } = require('node:util');
const { db, hashToken, newId, now } = require('../db/database');

const scrypt = promisify(scryptCallback);
const ACCESS_TOKEN_TTL = 15 * 60 * 1000;
const REFRESH_TOKEN_TTL = 30 * 24 * 60 * 60 * 1000;

function safeUser(user) {
  return {
    id: user.id,
    email: user.email,
    full_name: user.full_name,
    province: user.province,
    role: user.role,
    created_at: user.created_at
  };
}

function sessionTokens(accessToken, refreshToken) {
  return { access_token: accessToken, refresh_token: refreshToken, expires_in: ACCESS_TOKEN_TTL / 1000, token_type: 'bearer' };
}

function issueSession(userId) {
  const accessToken = randomBytes(32).toString('base64url');
  const refreshToken = randomBytes(32).toString('base64url');
  db.prepare(`
    INSERT INTO sessions (id, user_id, access_token_hash, refresh_token_hash, access_expires_at, refresh_expires_at, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(newId(), userId, hashToken(accessToken), hashToken(refreshToken), Date.now() + ACCESS_TOKEN_TTL, Date.now() + REFRESH_TOKEN_TTL, now());
  return sessionTokens(accessToken, refreshToken);
}

async function hashPassword(password, salt = randomBytes(16).toString('hex')) {
  const hash = await scrypt(password, salt, 64);
  return { salt, hash: hash.toString('hex') };
}

async function passwordMatches(password, salt, expectedHash) {
  const actual = await scrypt(password, salt, 64);
  const expected = Buffer.from(expectedHash, 'hex');
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

function unauthorized(res) {
  return res.status(401).json({
    success: false,
    error: { code: 'INVALID_CREDENTIALS', message: 'Email or password is incorrect.' }
  });
}

async function register(req, res) {
  const password = await hashPassword(req.body.password);
  const user = {
    id: newId(),
    full_name: req.body.full_name.trim(),
    email: req.body.email.trim().toLowerCase(),
    password_salt: password.salt,
    password_hash: password.hash,
    province: req.body.province.trim(),
    role: 'youth',
    created_at: now()
  };

  try {
    const session = db.transaction(() => {
      db.prepare(`
        INSERT INTO profiles (id, full_name, email, password_salt, password_hash, province, role, created_at)
        VALUES (@id, @full_name, @email, @password_salt, @password_hash, @province, @role, @created_at)
      `).run(user);
      return issueSession(user.id);
    })();
    return res.status(201).json({
      success: true,
      data: { user: safeUser(user), session, message: 'Account created and signed in.' }
    });
  } catch (error) {
    if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return res.status(409).json({
        success: false,
        error: { code: 'EMAIL_ALREADY_REGISTERED', message: 'An account with this email already exists. Sign in instead.' }
      });
    }
    throw error;
  }
}

async function login(req, res) {
  const user = db.prepare('SELECT * FROM profiles WHERE email = ? COLLATE NOCASE').get(req.body.email.trim());
  if (!user || !await passwordMatches(req.body.password, user.password_salt, user.password_hash)) return unauthorized(res);
  return res.json({ success: true, data: { user: safeUser(user), session: issueSession(user.id) } });
}

function refresh(req, res) {
  const row = db.prepare(`
    SELECT sessions.id AS session_id, profiles.*
    FROM sessions JOIN profiles ON profiles.id = sessions.user_id
    WHERE sessions.refresh_token_hash = ? AND sessions.refresh_expires_at > ?
  `).get(hashToken(req.body.refresh_token), Date.now());
  if (!row) return unauthorized(res);

  const accessToken = randomBytes(32).toString('base64url');
  const refreshToken = randomBytes(32).toString('base64url');
  db.prepare(`
    UPDATE sessions
    SET access_token_hash = ?, refresh_token_hash = ?, access_expires_at = ?, refresh_expires_at = ?
    WHERE id = ?
  `).run(hashToken(accessToken), hashToken(refreshToken), Date.now() + ACCESS_TOKEN_TTL, Date.now() + REFRESH_TOKEN_TTL, row.session_id);
  return res.json({ success: true, data: { user: safeUser(row), session: sessionTokens(accessToken, refreshToken) } });
}

function logout(req, res) {
  db.prepare('DELETE FROM sessions WHERE id = ?').run(req.sessionId);
  return res.json({ success: true, data: { message: 'Session ended.' } });
}

function currentUser(req, res) {
  return res.json({ success: true, data: { user: safeUser(req.user) } });
}

function updateProfile(req, res) {
  const updates = {};
  if (req.body.full_name !== undefined) updates.full_name = req.body.full_name.trim();
  if (req.body.province !== undefined) updates.province = req.body.province.trim();
  const assignments = Object.keys(updates).map((field) => `${field} = @${field}`).join(', ');
  db.prepare(`UPDATE profiles SET ${assignments} WHERE id = @id`).run({ ...updates, id: req.user.id });
  const user = db.prepare('SELECT * FROM profiles WHERE id = ?').get(req.user.id);
  return res.json({ success: true, data: { user: safeUser(user) } });
}

module.exports = { currentUser, login, logout, refresh, register, updateProfile };
