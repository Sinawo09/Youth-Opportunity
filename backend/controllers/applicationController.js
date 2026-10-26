const { db, newId, now } = require('../db/database');

function applicationRow(row) {
  return {
    id: row.id,
    user_id: row.user_id,
    opportunity_id: row.opportunity_id,
    status: row.status,
    created_at: row.created_at,
    opportunities: {
      title: row.title,
      organisation: row.organisation,
      application_deadline: row.application_deadline
    }
  };
}

async function createApplication(req, res) {
  const opportunity = db.prepare(`
    SELECT id FROM opportunities WHERE id = ? AND is_published = 1
      AND verification_status = 'verified' AND date(application_deadline) >= date('now')
  `).get(req.body.opportunity_id);
  if (!opportunity) {
    return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Published opportunity was not found.' } });
  }
  const application = { id: newId(), user_id: req.user.id, opportunity_id: opportunity.id, status: 'submitted', created_at: now() };
  try {
    db.prepare('INSERT INTO applications (id, user_id, opportunity_id, status, created_at) VALUES (@id, @user_id, @opportunity_id, @status, @created_at)').run(application);
  } catch (error) {
    if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return res.status(409).json({ success: false, error: { code: 'ALREADY_APPLIED', message: 'You have already applied to this opportunity.' } });
    }
    throw error;
  }
  return res.status(201).json({ success: true, data: { application } });
}

async function listMyApplications(req, res) {
  const rows = db.prepare(`
    SELECT applications.*, opportunities.title, opportunities.organisation, opportunities.application_deadline
    FROM applications JOIN opportunities ON opportunities.id = applications.opportunity_id
    WHERE applications.user_id = ? ORDER BY applications.created_at DESC
  `).all(req.user.id);
  const applications = rows.map(applicationRow);
  return res.json({ success: true, data: { applications, total: applications.length } });
}

async function withdrawApplication(req, res) {
  const result = db.prepare(`
    UPDATE applications SET status = 'withdrawn'
    WHERE id = ? AND user_id = ? AND status = 'submitted'
  `).run(req.params.id, req.user.id);
  if (!result.changes) {
    return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Application was not found or cannot be withdrawn.' } });
  }
  const application = db.prepare('SELECT * FROM applications WHERE id = ?').get(req.params.id);
  return res.json({ success: true, data: { application } });
}

async function reviewApplication(req, res) {
  const result = db.prepare('UPDATE applications SET status = ? WHERE id = ?').run(req.body.status, req.params.id);
  if (!result.changes) {
    return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Application was not found.' } });
  }
  const application = db.prepare('SELECT * FROM applications WHERE id = ?').get(req.params.id);
  return res.json({ success: true, data: { application } });
}

async function deleteApplication(req, res) {
  const result = db.prepare('DELETE FROM applications WHERE id = ? AND (user_id = ? OR ? = \'admin\')')
    .run(req.params.id, req.user.id, req.user.role);
  if (!result.changes) {
    return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Application was not found.' } });
  }
  return res.json({ success: true, data: { message: 'Application deleted.' } });
}

module.exports = { createApplication, deleteApplication, listMyApplications, reviewApplication, withdrawApplication };
