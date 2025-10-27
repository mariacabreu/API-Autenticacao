// server.js
// API minimal com SQLite, JWT auth, rota admin, rota pública, alteração de email/senha pelo próprio usuário.
// Requisitos: node >= 14
// Instalar: npm i express better-sqlite3 jsonwebtoken bcryptjs dotenv

require('dotenv').config();
const express = require('express');
const Database = require('better-sqlite3');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const app = express();
app.use(express.json());

// Configs (use .env para produção)
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'troque_essa_chave_para_producao';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '8h';
const DB_FILE = process.env.DB_FILE || './database.sqlite';

// Conecta / cria DB
const db = new Database(DB_FILE);

// Cria tabela users caso não exista
db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  is_admin INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
`);

// Helper: buscar user por email ou id
const getUserByEmail = (email) => db.prepare('SELECT id, email, password_hash, is_admin FROM users WHERE email = ?').get(email);
const getUserById = (id) => db.prepare('SELECT id, email, is_admin FROM users WHERE id = ?').get(id);

// Seeder opcional: cria um admin inicial se não houver nenhum usuário
const adminExists = db.prepare('SELECT 1 FROM users WHERE is_admin = 1 LIMIT 1').get();
if (!adminExists) {
  const defaultAdminEmail = process.env.DEFAULT_ADMIN_EMAIL || 'admin@local';
  const defaultAdminPass = process.env.DEFAULT_ADMIN_PASS || 'adminpass';
  const hash = bcrypt.hashSync(defaultAdminPass, 10);
  try {
    db.prepare('INSERT INTO users (email, password_hash, is_admin) VALUES (?, ?, 1)')
      .run(defaultAdminEmail, hash);
    console.log('Admin inicial criado:', defaultAdminEmail, 'senha:', defaultAdminPass);
  } catch (err) {
    console.error('Não foi possível criar admin inicial:', err.message);
  }
}

// --- Middleware ---
// Verifica e decodifica JWT; coloca userId e is_admin em req.user
function authenticateJWT(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) return res.status(401).json({ error: 'Token não fornecido' });
  const token = auth.slice(7);
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = { id: payload.id, is_admin: !!payload.is_admin };
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token inválido ou expirado' });
  }
}

// Middleware para rota admin
function requireAdmin(req, res, next) {
  if (!req.user) return res.status(401).json({ error: 'Não autenticado' });
  if (!req.user.is_admin) return res.status(403).json({ error: 'Acesso restrito a administradores' });
  next();
}

// --- Rotas ---
// Rota pública (aberta)
app.get('/public', (req, res) => {
  res.json({ message: 'Esta é uma rota totalmente aberta (publica).' });
});

// Rota protegida para administradores
app.get('/admin', authenticateJWT, requireAdmin, (req, res) => {
  res.json({ message: 'Área administrativa acessada', userId: req.user.id });
});

// Cadastro de usuário (open)
app.post('/register', async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'email e password são obrigatórios' });

  // hash da senha
  const password_hash = await bcrypt.hash(password, 10);
  try {
    const info = db.prepare('INSERT INTO users (email, password_hash, is_admin) VALUES (?, ?, 0)').run(email, password_hash);
    const user = getUserById(info.lastInsertRowid);
    return res.status(201).json({ id: user.id, email: user.email });
  } catch (err) {
    if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return res.status(409).json({ error: 'Email já cadastrado' });
    }
    console.error(err);
    return res.status(500).json({ error: 'Erro ao criar usuário' });
  }
});

// Login -> retorna JWT
app.post('/login', async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'email e password são obrigatórios' });

  const userRow = getUserByEmail(email);
  if (!userRow) return res.status(401).json({ error: 'Credenciais inválidas' });

  const match = await bcrypt.compare(password, userRow.password_hash);
  if (!match) return res.status(401).json({ error: 'Credenciais inválidas' });

  const token = jwt.sign({ id: userRow.id, is_admin: !!userRow.is_admin }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
  return res.json({ token, user: { id: userRow.id, email: userRow.email, is_admin: !!userRow.is_admin } });
});

// Rota para usuário autenticado alterar seu próprio email e/ou senha (sem verificação externa)
// Espera: { email?: string, password?: string }
app.patch('/me', authenticateJWT, async (req, res) => {
  const { email, password } = req.body || {};
  if (!email && !password) return res.status(400).json({ error: 'Forneça email e/ou password para atualizar' });

  // busca usuário atual
  const me = getUserById(req.user.id);
  if (!me) return res.status(404).json({ error: 'Usuário não encontrado' });

  // Monta query dinâmica
  const updates = [];
  const values = [];
  if (email) {
    updates.push('email = ?');
    values.push(email);
  }
  if (password) {
    const hash = await bcrypt.hash(password, 10);
    updates.push('password_hash = ?');
    values.push(hash);
  }
  values.push(req.user.id);
  const sql = `UPDATE users SET ${updates.join(', ')} WHERE id = ?`;
  try {
    db.prepare(sql).run(...values);
    const updated = getUserById(req.user.id);
    return res.json({ id: updated.id, email: updated.email, message: 'Atualizado com sucesso' });
  } catch (err) {
    if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return res.status(409).json({ error: 'Email já em uso' });
    }
    console.error(err);
    return res.status(500).json({ error: 'Erro ao atualizar usuário' });
  }
});

// Rota para listar usuários (apenas admin) — útil para admin ver quem está cadastrado
app.get('/users', authenticateJWT, requireAdmin, (req, res) => {
  const rows = db.prepare('SELECT id, email, is_admin, created_at FROM users ORDER BY id').all();
  res.json(rows);
});

// Exemplo de rota que requer autenticação mas não admin
app.get('/private', authenticateJWT, (req, res) => {
  const me = getUserById(req.user.id);
  res.json({ message: 'Rota privada para usuário autenticado', user: me });
});

// Start
app.listen(PORT, () => {
  console.log(`API rodando na porta ${PORT}`);
});
