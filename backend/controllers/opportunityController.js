const { db, newId, now } = require('../db/database');

function parseList(value) {
  try {
    const parsed = JSON.parse(value || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function isHttpUrl(value) {
  try {
    return ['http:', 'https:'].includes(new URL(value).protocol);
  } catch {
    return false;
  }
}

function opportunityRow(row) {
  if (!row) return null;
  return {
    ...row,
    eligibility: parseList(row.eligibility),
    qualifications: parseList(row.qualifications),
    documents: parseList(row.documents),
    tags: parseList(row.tags),
    is_published: Boolean(row.is_published),
    expired: row.verification_status === 'expired' || row.application_deadline < now().slice(0, 10)
  };
}

async function listOpportunities(req, res) {
  const includeAll = req.query.include_all === 'true';
  const includeExpired = req.query.include_expired === 'true';
  if (includeAll && req.user?.role !== 'admin') {
    return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Administrator access is required.' } });
  }
  const opportunities = includeAll
    ? db.prepare('SELECT * FROM opportunities ORDER BY application_deadline ASC, created_at DESC').all().map(opportunityRow)
    : includeExpired
      ? db.prepare(`
        SELECT * FROM opportunities
        WHERE verification_status IN ('verified', 'expired')
          AND (verification_status = 'expired' OR date(application_deadline) < date('now'))
        ORDER BY application_deadline DESC
      `).all().map(opportunityRow)
    : db.prepare(`
      SELECT * FROM opportunities
      WHERE is_published = 1 AND verification_status = 'verified'
        AND date(application_deadline) >= date('now')
      ORDER BY application_deadline ASC
    `).all().map(opportunityRow);
  return res.json({ success: true, data: { opportunities, total: opportunities.length } });
}

async function createOpportunity(req, res) {
  const location = req.body.location || req.body.province;
  const deadline = req.body.closing_date || req.body.application_deadline;
  const duplicate = db.prepare(`
    SELECT id FROM opportunities
    WHERE lower(trim(source_url)) = lower(trim(?)) AND verification_status != 'removed'
  `).get(req.body.source_url);
  if (duplicate) {
    return res.status(409).json({ success: false, error: { code: 'DUPLICATE_OPPORTUNITY', message: 'An opportunity with this official source URL already exists.' } });
  }
  const opportunity = {
    id: newId(),
    title: req.body.title,
    organisation: req.body.organisation,
    source_url: req.body.source_url,
    application_url: req.body.application_url,
    minimum_qualification: req.body.minimum_qualification,
    date_checked: null,
    verification_status: 'unverified',
    category: req.body.category,
    location,
    province: req.body.province || location,
    closing_date: deadline,
    application_deadline: deadline,
    experience_level: req.body.experience_level || 'entry',
    description: req.body.description,
    full_description: req.body.full_description || req.body.description,
    eligibility: JSON.stringify(req.body.eligibility || []),
    qualifications: JSON.stringify(req.body.qualifications || []),
    documents: JSON.stringify(req.body.documents || []),
    application_instructions: req.body.application_instructions || '',
    stipend: req.body.stipend || '',
    date_added: now().slice(0, 10),
    tags: JSON.stringify(req.body.tags || []),
    is_published: 0,
    created_at: now()
  };
  db.prepare(`
    INSERT INTO opportunities (
      id, title, organisation, source_url, application_url, minimum_qualification,
      date_checked, verification_status, category, location, province, closing_date,
      application_deadline, experience_level, description, full_description, eligibility,
      qualifications, documents, application_instructions, stipend,
      date_added, tags, is_published, created_at
    ) VALUES (
      @id, @title, @organisation, @source_url, @application_url, @minimum_qualification,
      @date_checked, @verification_status, @category, @location, @province, @closing_date,
      @application_deadline, @experience_level, @description, @full_description, @eligibility,
      @qualifications, @documents, @application_instructions, @stipend,
      @date_added, @tags, @is_published, @created_at
    )
  `).run(opportunity);
  return res.status(201).json({ success: true, data: { opportunity: opportunityRow(opportunity) } });
}

async function updateOpportunity(req, res) {
  const allowed = ['title', 'organisation', 'source_url', 'application_url', 'minimum_qualification', 'description', 'full_description', 'category', 'province', 'location', 'closing_date', 'application_deadline', 'experience_level', 'eligibility', 'qualifications', 'documents', 'application_instructions', 'stipend', 'tags'];
  const updates = Object.fromEntries(allowed.filter((field) => req.body[field] !== undefined).map((field) => [field, ['eligibility', 'qualifications', 'documents', 'tags'].includes(field) ? JSON.stringify(req.body[field]) : req.body[field]]));
  if (updates.province !== undefined && updates.location === undefined) updates.location = updates.province;
  if (updates.application_deadline !== undefined && updates.closing_date === undefined) updates.closing_date = updates.application_deadline;
  if (updates.closing_date !== undefined && updates.application_deadline === undefined) updates.application_deadline = updates.closing_date;
  if (updates.source_url !== undefined) {
    const duplicate = db.prepare(`
      SELECT id FROM opportunities
      WHERE lower(trim(source_url)) = lower(trim(?)) AND id != ? AND verification_status != 'removed'
    `).get(updates.source_url, req.params.id);
    if (duplicate) {
      return res.status(409).json({ success: false, error: { code: 'DUPLICATE_OPPORTUNITY', message: 'An opportunity with this official source URL already exists.' } });
    }
  }
  updates.verification_status = 'unverified';
  updates.date_checked = null;
  updates.is_published = 0;
  const assignments = Object.keys(updates).map((field) => `${field} = @${field}`).join(', ');
  const result = db.prepare(`UPDATE opportunities SET ${assignments} WHERE id = @id`).run({ ...updates, id: req.params.id });
  if (!result.changes) {
    return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Opportunity was not found.' } });
  }
  const opportunity = opportunityRow(db.prepare('SELECT * FROM opportunities WHERE id = ?').get(req.params.id));
  return res.json({ success: true, data: { opportunity } });
}

async function deleteOpportunity(req, res) {
  const result = db.prepare("UPDATE opportunities SET is_published = 0, verification_status = 'removed', date_checked = NULL WHERE id = ? AND verification_status != 'removed'").run(req.params.id);
  if (!result.changes) {
    return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Opportunity was not found.' } });
  }
  return res.json({ success: true, data: { message: 'Opportunity removed from listings.' } });
}

async function verifyOpportunity(req, res) {
  const opportunity = db.prepare('SELECT * FROM opportunities WHERE id = ?').get(req.params.id);
  if (!opportunity || opportunity.verification_status === 'removed') {
    return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Opportunity was not found.' } });
  }
  const today = now().slice(0, 10);
  if (!isHttpUrl(opportunity.source_url) || !isHttpUrl(opportunity.application_url) || !opportunity.minimum_qualification
    || !parseList(opportunity.eligibility).length
    || opportunity.application_deadline < today) {
    return res.status(400).json({ success: false, error: { code: 'NOT_VERIFIABLE', message: 'A current opportunity needs valid HTTP(S) official source and application URLs, eligibility, minimum qualification, and a future closing date.' } });
  }
  const duplicate = db.prepare(`
    SELECT id FROM opportunities
    WHERE lower(trim(source_url)) = lower(trim(?)) AND id != ? AND verification_status != 'removed'
  `).get(opportunity.source_url, opportunity.id);
  if (duplicate) {
    return res.status(409).json({ success: false, error: { code: 'DUPLICATE_OPPORTUNITY', message: 'An opportunity with this official source URL already exists.' } });
  }
  db.prepare("UPDATE opportunities SET verification_status = 'verified', date_checked = ?, is_published = 1 WHERE id = ?")
    .run(now(), opportunity.id);
  return res.json({ success: true, data: { opportunity: opportunityRow(db.prepare('SELECT * FROM opportunities WHERE id = ?').get(opportunity.id)) } });
}

async function expireOpportunity(req, res) {
  const result = db.prepare("UPDATE opportunities SET is_published = 0, verification_status = 'expired' WHERE id = ? AND verification_status != 'removed'")
    .run(req.params.id);
  if (!result.changes) {
    return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Opportunity was not found.' } });
  }
  return res.json({ success: true, data: { opportunity: opportunityRow(db.prepare('SELECT * FROM opportunities WHERE id = ?').get(req.params.id)) } });
}

module.exports = { createOpportunity, deleteOpportunity, expireOpportunity, listOpportunities, opportunityRow, updateOpportunity, verifyOpportunity };
