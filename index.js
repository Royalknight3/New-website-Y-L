
const express = require('express');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const db = require('./db');
const cors = require('cors');
const SECRET = 'secret123';
const app = express();
app.use(cors());
app.use(bodyParser.json());

(async () => {
  const u = await db.get('select * from users where username=?', ['admin']);
  if(!u){
    const hash = await bcrypt.hash('admin123',10);
    await db.run('insert into users(username,password_hash,is_admin) values(?,?,1)', ['admin',hash]);
  }
})();

app.post('/api/login', async (req,res)=>{
  const {username,password} = req.body;
  const user = await db.get('select * from users where username=?',[username]);
  if(!user) return res.status(401).json({error:'Invalid'});
  const ok = await bcrypt.compare(password,user.password_hash);
  if(!ok) return res.status(401).json({error:'Invalid'});
  const token = jwt.sign({id:user.id,username:user.username,is_admin:user.is_admin}, SECRET,{expiresIn:'8h'});
  res.json({token});
});

function auth(req,res,next){
  const h = req.headers.authorization;
  if(!h) return res.status(401).json({error:'no token'});
  try{
    req.user = jwt.verify(h.replace('Bearer ',''), SECRET);
    next();
  }catch(e){ return res.status(401).json({error:'bad token'});}
}

app.get('/api/categories', async (req,res)=>{
  res.json(await db.all('select * from categories order by parent_id,name'));
});

app.post('/api/categories', auth, async (req,res)=>{
  if(!req.user.is_admin) return res.status(403).json({error:'forbidden'});
  const {name,parent_id} = req.body;
  const r = await db.run('insert into categories(name,parent_id) values(?,?)',[name,parent_id||null]);
  res.json({id:r.lastID});
});

app.get('/api/products', async (req,res)=>{
  const {category_id} = req.query;
  const sql = category_id ? 'select * from products where category_id=?':'select * from products';
  const rows = category_id ? await db.all(sql,[category_id]): await db.all(sql);
  res.json(rows);
});

app.post('/api/products', auth, async (req,res)=>{
  if(!req.user.is_admin) return res.status(403).json({error:'forbidden'});
  const {title,description,price,images,category_id,attributes}=req.body;
  const r = await db.run(
    'insert into products(title,description,price,images,category_id,attributes) values(?,?,?,?,?,?)',
    [title,description,price,JSON.stringify(images||[]),category_id,JSON.stringify(attributes||{})]
  );
  res.json({id:r.lastID});
});

app.get('/api/products/:id', async (req,res)=>{
  const p = await db.get('select * from products where id=?',[req.params.id]);
  if(!p) return res.status(404).json({error:'not found'});
  p.images = JSON.parse(p.images||'[]');
  p.attributes = JSON.parse(p.attributes||'{}');
  res.json(p);
});

const PORT = 4000;
app.listen(PORT, ()=> console.log("server on",PORT));
