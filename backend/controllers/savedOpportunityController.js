const { db, now } = require('../db/database');
const { opportunityRow } = require('./opportunityController');

function savedOpportunityRow(row) {
  return {
    opportunity_id: row.opportunity_id,
    created_at: row.created_at,
    opportunity: opportunityRow(row)
  };
}

async function listSavedOpportunities(req, res) {
  const rows = db.prepare(`
    SELECT saved_opportunities.opportunity_id, saved_opportunities.created_at AS saved_at, opportunities.*
    FROM saved_opportunities
    JOIN opportunities ON opportunities.id = saved_opportunities.opportunity_id
    WHERE saved_opportunities.user_id = ? AND opportunities.verification_status != 'removed'
    ORDER BY saved_opportunities.created_at DESC
  `).all(req.user.id);
  const saved_opportunities = rows.map((row) => ({
    opportunity_id: row.opportunity_id,
    created_at: row.saved_at,
    opportunity: opportunityRow(row)
  }));
  return res.json({ success: true, data: { saved_opportunities, total: saved_opportunities.length } });
}

async function saveOpportunity(req, res) {
  const opportunity = db.prepare(`
    SELECT * FROM opportunities WHERE id = ? AND is_published = 1
      AND verification_status = 'verified' AND date(application_deadline) >= date('now')
  `).get(req.body.opportunity_id);
  if (!opportunity) {
    return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Published opportunity was not found.' } });
  }
  try {
    db.prepare('INSERT INTO saved_opportunities (user_id, opportunity_id, created_at) VALUES (?, ?, ?)')
      .run(req.user.id, opportunity.id, now());
  } catch (error) {
    if (error.code === 'SQLITE_CONSTRAINT_PRIMARYKEY' || error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return res.status(409).json({ success: false, error: { code: 'ALREADY_SAVED', message: 'This opportunity is already saved.' } });
    }
    throw error;
  }
  return res.status(201).json({ success: true, data: { saved_opportunity: { opportunity_id: opportunity.id, opportunity: opportunityRow(opportunity) } } });
}

async function unsaveOpportunity(req, res) {
  const result = db.prepare('DELETE FROM saved_opportunities WHERE user_id = ? AND opportunity_id = ?').run(req.user.id, req.params.id);
  if (!result.changes) {
    return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Saved opportunity was not found.' } });
  }
  return res.json({ success: true, data: { message: 'Opportunity removed from saved items.' } });
}

module.exports = { listSavedOpportunities, saveOpportunity, unsaveOpportunity };
