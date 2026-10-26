const { db, newId, now } = require('../db/database');

async function listRequests(req, res) {
  const requests = req.user.role === 'admin'
    ? db.prepare('SELECT * FROM requests ORDER BY created_at DESC').all()
    : db.prepare('SELECT * FROM requests WHERE user_id = ? ORDER BY created_at DESC').all(req.user.id);
  return res.json({ success: true, data: { requests } });
}

async function listMyRequests(req, res) {
  const requests = db.prepare('SELECT * FROM requests WHERE user_id = ? ORDER BY created_at DESC').all(req.user.id);
  return res.json({ success: true, data: { requests, total: requests.length } });
}

async function createRequest(req, res) {
  const request = {
    id: newId(), user_id: req.user.id, title: req.body.title,
    description: req.body.description, category: req.body.category,
    status: 'pending', created_at: now(), updated_at: now()
  };
  db.prepare(`
    INSERT INTO requests (id, user_id, title, description, category, status, created_at, updated_at)
    VALUES (@id, @user_id, @title, @description, @category, @status, @created_at, @updated_at)
  `).run(request);
  return res.status(201).json({ success: true, data: { request } });
}

async function updateRequest(req, res) {
  const updates = {};
  for (const field of ['title', 'description', 'category']) {
    if (req.body[field] !== undefined) updates[field] = req.body[field];
  }
  updates.updated_at = now();
  const assignments = Object.keys(updates).map((field) => `${field} = @${field}`).join(', ');
  const result = db.prepare(`
    UPDATE requests SET ${assignments}
    WHERE id = @id AND user_id = @user_id AND status = 'pending'
  `).run({ ...updates, id: req.params.id, user_id: req.user.id });
  if (!result.changes) {
    return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Request was not found or is no longer editable.' } });
  }
  const request = db.prepare('SELECT * FROM requests WHERE id = ?').get(req.params.id);
  return res.json({ success: true, data: { request } });
}

async function deleteRequest(req, res) {
  const result = db.prepare('DELETE FROM requests WHERE id = ? AND (user_id = ? OR ? = \'admin\')')
    .run(req.params.id, req.user.id, req.user.role);
  if (!result.changes) {
    return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Request was not found.' } });
  }
  return res.json({ success: true, data: { message: 'Request deleted.' } });
}

async function reviewRequest(req, res) {
  const result = db.prepare('UPDATE requests SET status = ?, updated_at = ? WHERE id = ?')
    .run(req.body.status, now(), req.params.id);
  if (!result.changes) {
    return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Request was not found.' } });
  }
  const request = db.prepare('SELECT * FROM requests WHERE id = ?').get(req.params.id);
  return res.json({ success: true, data: { request } });
}

module.exports = { createRequest, deleteRequest, listMyRequests, listRequests, reviewRequest, updateRequest };
