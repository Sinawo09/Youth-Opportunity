const { db } = require('../db/database');

function publicUser(user) {
  return {
    id: user.id,
    full_name: user.full_name,
    email: user.email,
    province: user.province,
    role: user.role,
    created_at: user.created_at
  };
}

async function listUsers(req, res) {
  const users = db.prepare('SELECT id, full_name, email, province, role, created_at FROM profiles ORDER BY created_at DESC').all();
  return res.json({ success: true, data: { users } });
}

async function updateRole(req, res) {
  const result = db.prepare('UPDATE profiles SET role = ? WHERE id = ?').run(req.body.role, req.params.id);
  if (!result.changes) {
    return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'User was not found.' } });
  }
  return res.json({ success: true, data: { message: 'User role updated.' } });
}

module.exports = { listUsers, publicUser, updateRole };
