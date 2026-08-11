const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const DATA_DIR = path.join(__dirname, 'data');
const FILES = {
  workers: path.join(DATA_DIR, 'workers.json'),
  products: path.join(DATA_DIR, 'products.json'),
  requests: path.join(DATA_DIR, 'requests.json'),
};

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

function readJson(file, fallback) {
  try {
    if (!fs.existsSync(file)) return fallback;
    const raw = fs.readFileSync(file, 'utf8').trim();
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to read', file, e.message);
    return fallback;
  }
}

// naive write queue per file so concurrent writes don't clobber each other
const queues = {};
function writeJson(file, data) {
  const prev = queues[file] || Promise.resolve();
  const next = prev
    .catch(() => {})
    .then(() => fs.promises.writeFile(file, JSON.stringify(data, null, 2), 'utf8'));
  queues[file] = next;
  return next;
}

function writeJsonSync(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf8');
}

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 9);
}

// ---------- seed ----------
function ensureSeed() {
  const workers = readJson(FILES.workers, null);
  if (!workers || !workers.length) {
    const seeded = [
      {
        id: uid(),
        name: 'Admin',
        username: 'admin',
        passwordHash: bcrypt.hashSync('admin123', 10),
        role: 'admin',
      },
    ];
    writeJsonSync(FILES.workers, seeded);
    console.log('Seeded default admin account -> username: admin / password: admin123');
  }
  if (!fs.existsSync(FILES.products)) writeJsonSync(FILES.products, []);
  if (!fs.existsSync(FILES.requests)) writeJsonSync(FILES.requests, []);
}
ensureSeed();

module.exports = {
  uid,
  workers: {
    all: () => readJson(FILES.workers, []),
    save: (list) => writeJson(FILES.workers, list),
  },
  products: {
    all: () => readJson(FILES.products, []),
    save: (list) => writeJson(FILES.products, list),
  },
  requests: {
    all: () => readJson(FILES.requests, []),
    save: (list) => writeJson(FILES.requests, list),
  },
};
