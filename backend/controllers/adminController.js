const { db } = require('../db/database');

function overview(req, res) {
  const totals = {
    youth: db.prepare("SELECT COUNT(*) AS total FROM profiles WHERE role = 'youth'").get().total,
    admins: db.prepare("SELECT COUNT(*) AS total FROM profiles WHERE role = 'admin'").get().total,
    published_opportunities: db.prepare('SELECT COUNT(*) AS total FROM opportunities WHERE is_published = 1').get().total,
    pending_opportunities: db.prepare('SELECT COUNT(*) AS total FROM opportunities WHERE is_published = 0').get().total,
    applications: db.prepare('SELECT COUNT(*) AS total FROM applications').get().total,
    requests: db.prepare('SELECT COUNT(*) AS total FROM requests').get().total
  };
  const recent_users = db.prepare(`
    SELECT id, full_name, email, province, role, created_at
    FROM profiles ORDER BY created_at DESC LIMIT 6
  `).all();
  const recent_requests = db.prepare(`
    SELECT requests.id, requests.title, requests.description, requests.category,
      requests.status, requests.created_at, profiles.full_name, profiles.email
    FROM requests JOIN profiles ON profiles.id = requests.user_id
    ORDER BY requests.created_at DESC LIMIT 8
  `).all();
  const recent_activity = db.prepare(`
    SELECT kind, title, status, created_at FROM (
      SELECT 'application' AS kind, opportunities.title AS title, applications.status AS status, applications.created_at AS created_at
      FROM applications JOIN opportunities ON opportunities.id = applications.opportunity_id
      UNION ALL
      SELECT 'request' AS kind, requests.title AS title, requests.status AS status, requests.created_at AS created_at
      FROM requests
    ) ORDER BY created_at DESC LIMIT 8
  `).all();

  return res.json({ success: true, data: { totals, recent_users, recent_requests, recent_activity } });
}

module.exports = { overview };
