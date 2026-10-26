CREATE TABLE IF NOT EXISTS profiles (
  id TEXT PRIMARY KEY,
  full_name TEXT NOT NULL CHECK (length(trim(full_name)) BETWEEN 2 AND 100),
  email TEXT NOT NULL UNIQUE COLLATE NOCASE,
  password_salt TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  province TEXT NOT NULL CHECK (length(trim(province)) BETWEEN 2 AND 80),
  role TEXT NOT NULL DEFAULT 'youth' CHECK (role IN ('youth', 'admin')),
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  access_token_hash TEXT NOT NULL UNIQUE,
  refresh_token_hash TEXT NOT NULL UNIQUE,
  access_expires_at INTEGER NOT NULL,
  refresh_expires_at INTEGER NOT NULL,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS sessions_user_idx ON sessions(user_id);

CREATE TABLE IF NOT EXISTS opportunities (
  id TEXT PRIMARY KEY,
  seed_key TEXT UNIQUE,
  title TEXT NOT NULL CHECK (length(trim(title)) BETWEEN 3 AND 180),
  organisation TEXT NOT NULL CHECK (length(trim(organisation)) BETWEEN 2 AND 180),
  source_url TEXT,
  application_url TEXT,
  minimum_qualification TEXT NOT NULL DEFAULT '',
  date_checked TEXT,
  verification_status TEXT NOT NULL DEFAULT 'unverified',
  category TEXT NOT NULL,
  location TEXT NOT NULL,
  province TEXT NOT NULL,
  closing_date TEXT NOT NULL,
  application_deadline TEXT NOT NULL,
  experience_level TEXT NOT NULL,
  description TEXT NOT NULL,
  full_description TEXT,
  eligibility TEXT NOT NULL DEFAULT '[]',
  qualifications TEXT NOT NULL DEFAULT '[]',
  documents TEXT NOT NULL DEFAULT '[]',
  application_instructions TEXT,
  stipend TEXT,
  date_added TEXT NOT NULL,
  tags TEXT NOT NULL DEFAULT '[]',
  is_published INTEGER NOT NULL DEFAULT 0 CHECK (is_published IN (0, 1)),
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS opportunities_public_deadline_idx
  ON opportunities(is_published, application_deadline);

CREATE TABLE IF NOT EXISTS requests (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL CHECK (length(trim(title)) BETWEEN 3 AND 160),
  description TEXT NOT NULL CHECK (length(trim(description)) BETWEEN 10 AND 5000),
  category TEXT NOT NULL CHECK (length(trim(category)) BETWEEN 1 AND 80),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_review', 'approved', 'rejected')),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS requests_user_created_idx ON requests(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS requests_status_created_idx ON requests(status, created_at DESC);

CREATE TABLE IF NOT EXISTS applications (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  opportunity_id TEXT NOT NULL REFERENCES opportunities(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted', 'reviewing', 'accepted', 'rejected', 'withdrawn')),
  created_at TEXT NOT NULL,
  UNIQUE(user_id, opportunity_id)
);

CREATE INDEX IF NOT EXISTS applications_user_created_idx ON applications(user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS saved_opportunities (
  user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  opportunity_id TEXT NOT NULL REFERENCES opportunities(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL,
  PRIMARY KEY(user_id, opportunity_id)
);

CREATE INDEX IF NOT EXISTS saved_opportunities_user_created_idx
  ON saved_opportunities(user_id, created_at DESC);