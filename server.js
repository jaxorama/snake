const express = require('express');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;

const DATA_DIR = path.join(__dirname, 'data');
const LOG_FILE = path.join(DATA_DIR, 'visitors.jsonl');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR);
if (!fs.existsSync(LOG_FILE)) fs.writeFileSync(LOG_FILE, '');

// Change these before exposing this anywhere beyond your own machine.
const ADMIN_USER = process.env.ADMIN_USER || 'admin';
const ADMIN_PASS = process.env.ADMIN_PASS || 'changeme';

function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const [scheme, encoded] = header.split(' ');
  if (scheme === 'Basic' && encoded) {
    const [user, pass] = Buffer.from(encoded, 'base64').toString().split(':');
    if (user === ADMIN_USER && pass === ADMIN_PASS) return next();
  }
  res.set('WWW-Authenticate', 'Basic realm="Admin"');
  return res.status(401).send('Authentication required');
}

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.post('/api/log', (req, res) => {
  const forwardedFor = (req.headers['x-forwarded-for'] || '').split(',')[0].trim();
  const record = {
    id: crypto.randomUUID(),
    serverTimestamp: new Date().toISOString(),
    ip: forwardedFor || req.socket.remoteAddress,
    headers: {
      userAgent: req.headers['user-agent'] || null,
      acceptLanguage: req.headers['accept-language'] || null,
      referer: req.headers['referer'] || null,
    },
    client: req.body || {},
  };

  fs.appendFile(LOG_FILE, JSON.stringify(record) + '\n', (err) => {
    if (err) {
      console.error('Failed to write visitor record:', err);
      return res.status(500).json({ ok: false });
    }
    res.json({ ok: true });
  });
});

app.get('/api/visitors', requireAuth, (req, res) => {
  fs.readFile(LOG_FILE, 'utf8', (err, data) => {
    if (err) return res.status(500).json({ ok: false });
    const records = data
      .split('\n')
      .filter(Boolean)
      .map((line) => {
        try {
          return JSON.parse(line);
        } catch {
          return null;
        }
      })
      .filter(Boolean)
      .reverse();
    res.json(records);
  });
});

app.delete('/api/visitors', requireAuth, (req, res) => {
  fs.writeFile(LOG_FILE, '', (err) => {
    if (err) return res.status(500).json({ ok: false });
    res.json({ ok: true });
  });
});

app.get('/admin', requireAuth, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

app.listen(PORT, () => {
  console.log(`Visitor tracking server running at http://localhost:${PORT}`);
  console.log(`Admin dashboard: http://localhost:${PORT}/admin (user: ${ADMIN_USER})`);
});
