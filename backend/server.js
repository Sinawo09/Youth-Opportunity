require('dotenv').config();

const app = require('./src/app');
const { db } = require('./db/database');

const port = Number(process.env.PORT) || 5000;

const server = app.listen(port, () => console.log(`SQLite API listening on port ${port}.`));

function closeServer() {
  server.close(() => {
    db.close();
    process.exit(0);
  });
}

process.on('SIGINT', closeServer);
process.on('SIGTERM', closeServer);