
const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
let dbp = open({filename:'./data.db',driver:sqlite3.Database});
module.exports = {
  get: async (s,p=[])=>{const db=await dbp;return db.get(s,p);},
  all: async (s,p=[])=>{const db=await dbp;return db.all(s,p);},
  run: async (s,p=[])=>{const db=await dbp;return db.run(s,p);}
};
