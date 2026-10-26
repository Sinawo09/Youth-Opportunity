require('dotenv').config({ path: require('node:path').join(__dirname, '..', '.env') });

const { db } = require('../db/database');

const email = process.argv[2]?.trim();
if (!email) {
  console.error('Usage: npm run admin:promote -- user@example.com');
  process.exitCode = 1;
} else {
  const result = db.prepare('UPDATE profiles SET role = \'admin\' WHERE email = ? COLLATE NOCASE').run(email);
  if (!result.changes) {
    console.error('No account exists with that email. Register the account first.');
    process.exitCode = 1;
  } else {
    console.log('Administrator role granted.');
  }
}

db.close();
