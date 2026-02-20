import express from 'express';
import cors from 'cors';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Database connection pool
const dbConfig = {
  host: process.env.MYSQL_HOST,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE,
  port: Number(process.env.MYSQL_PORT) || 3306,
};

if (!dbConfig.host || !dbConfig.user || !dbConfig.database) {
  console.warn('⚠️  Database environment variables are missing. Defaulting to localhost (this will fail in production).');
}

const pool = mysql.createPool({
  ...dbConfig,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Initialize database tables
async function initDB() {
  try {
    const connection = await pool.getConnection();
    console.log('Connected to MySQL');

    await connection.query(`
      CREATE TABLE IF NOT EXISTS pets (
        id VARCHAR(36) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        type VARCHAR(50) NOT NULL,
        breed VARCHAR(255),
        age INT,
        ownerName VARCHAR(255) NOT NULL,
        medicalNotes TEXT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS reports (
        id VARCHAR(36) PRIMARY KEY,
        petId VARCHAR(36) NOT NULL,
        date DATETIME NOT NULL,
        clinicalHistory TEXT,
        recommendedTreatment TEXT,
        otherComments TEXT,
        notes TEXT,
        FOREIGN KEY (petId) REFERENCES pets(id) ON DELETE CASCADE
      )
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS report_items (
        id VARCHAR(36) PRIMARY KEY,
        reportId VARCHAR(36) NOT NULL,
        imageData LONGTEXT NOT NULL,
        description TEXT,
        rotation INT DEFAULT 0,
        isMirrored BOOLEAN DEFAULT FALSE,
        FOREIGN KEY (reportId) REFERENCES reports(id) ON DELETE CASCADE
      )
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS appointments (
        id VARCHAR(36) PRIMARY KEY,
        petId VARCHAR(36) NOT NULL,
        petName VARCHAR(255),
        ownerName VARCHAR(255),
        date VARCHAR(255) NOT NULL,
        time VARCHAR(50),
        service VARCHAR(255),
        status VARCHAR(50) DEFAULT 'Pendiente',
        FOREIGN KEY (petId) REFERENCES pets(id) ON DELETE CASCADE
      )
    `);

    connection.release();
    console.log('Database tables initialized');
  } catch (error) {
    console.error('Error initializing database:', error);
  }
}

// API Routes
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

// Pets
app.get('/api/pets', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM pets ORDER BY createdAt DESC');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch pets' });
  }
});

app.post('/api/pets', async (req, res) => {
  try {
    const { id, name, type, breed, age, ownerName, medicalNotes } = req.body;
    await pool.query(
      'INSERT INTO pets (id, name, type, breed, age, ownerName, medicalNotes) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [id, name, type, breed, age, ownerName, medicalNotes]
    );
    res.status(201).json(req.body);
  } catch (error) {
    res.status(500).json({ error: 'Failed to save pet' });
  }
});

// Reports
app.get('/api/reports', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM reports ORDER BY date DESC');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch reports' });
  }
});

app.get('/api/reports/:id', async (req, res) => {
  try {
    const [rows]: any = await pool.query('SELECT * FROM reports WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Report not found' });
    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch report' });
  }
});

app.get('/api/pets/:petId/reports', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM reports WHERE petId = ? ORDER BY date DESC', [req.params.petId]);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch reports for pet' });
  }
});

app.post('/api/reports', async (req, res) => {
  try {
    const { id, petId, date, clinicalHistory, recommendedTreatment, otherComments, notes } = req.body;
    await pool.query(
      'INSERT INTO reports (id, petId, date, clinicalHistory, recommendedTreatment, otherComments, notes) VALUES (?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE clinicalHistory=?, recommendedTreatment=?, otherComments=?, notes=?',
      [id, petId, date, clinicalHistory, recommendedTreatment, otherComments, notes, clinicalHistory, recommendedTreatment, otherComments, notes]
    );
    res.status(201).json(req.body);
  } catch (error) {
    res.status(500).json({ error: 'Failed to save report' });
  }
});

// Report Items
app.get('/api/reports/:reportId/items', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM report_items WHERE reportId = ?', [req.params.reportId]);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch report items' });
  }
});

app.post('/api/report-items', async (req, res) => {
  try {
    const { id, reportId, imageData, description, rotation, isMirrored } = req.body;
    await pool.query(
      'INSERT INTO report_items (id, reportId, imageData, description, rotation, isMirrored) VALUES (?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE imageData=?, description=?, rotation=?, isMirrored=?',
      [id, reportId, imageData, description, rotation, isMirrored, imageData, description, rotation, isMirrored]
    );
    res.status(201).json(req.body);
  } catch (error) {
    res.status(500).json({ error: 'Failed to save report item' });
  }
});

app.delete('/api/report-items/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM report_items WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete report item' });
  }
});

// Appointments
app.get('/api/appointments', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM appointments ORDER BY date ASC');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch appointments' });
  }
});

app.post('/api/appointments', async (req, res) => {
  try {
    const { id, petId, petName, ownerName, date, time, service, status } = req.body;
    await pool.query(
      'INSERT INTO appointments (id, petId, petName, ownerName, date, time, service, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE date=?, time=?, service=?, status=?',
      [id, petId, petName, ownerName, date, time, service, status, date, time, service, status]
    );
    res.status(201).json(req.body);
  } catch (error) {
    res.status(500).json({ error: 'Failed to save appointment' });
  }
});

app.delete('/api/appointments/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM appointments WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete appointment' });
  }
});

// Vite middleware for development
async function startServer() {
  await initDB();

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    // Express 5 requires '/*' or '(.*)' for wildcards
    app.get('/*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
