
const fs = require('fs');
const db = require('./db');
(async ()=>{
  const sql = fs.readFileSync('./migrations.sql','utf8');
  const parts = sql.split(';').map(s=>s.trim()).filter(Boolean);
  for(const p of parts) await db.run(p);
  console.log('DB ok');
  process.exit(0);
})();
