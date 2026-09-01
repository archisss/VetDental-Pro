import express from 'express';
import cors from 'cors';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import { executeLocalQuery } from './services/localDb';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Database connection configuration (supports standard variables and Railway environment variables)
const dbHost = process.env.MYSQL_HOST || process.env.MYSQLHOST;
const dbUser = process.env.MYSQL_USER || process.env.MYSQLUSER;
const dbPassword = process.env.MYSQL_PASSWORD || process.env.MYSQLPASSWORD || '';
const dbName = process.env.MYSQL_DATABASE || process.env.MYSQLDATABASE;
const dbPort = Number(process.env.MYSQL_PORT || process.env.MYSQLPORT) || 3306;
const dbUrl = process.env.MYSQL_URL || process.env.DATABASE_URL || process.env.MYSQL_PUBLIC_URL;

let useLocalFallback = false;

if (!dbUrl && (!dbHost || !dbUser || !dbName)) {
  console.warn('⚠️  Database environment variables are missing. Defaulting to local JSON database.');
  useLocalFallback = true;
}

const poolConfig: any = dbUrl
  ? { uri: dbUrl, waitForConnections: true, connectionLimit: 10, queueLimit: 0 }
  : {
      host: dbHost || 'localhost',
      user: dbUser,
      password: dbPassword,
      database: dbName,
      port: dbPort,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    };

const mysqlPool = mysql.createPool(poolConfig);

const pool = {
  async query(sql: string, params?: any[]): Promise<[any, any]> {
    if (useLocalFallback) {
      return executeLocalQuery(sql, params);
    }
    try {
      return await mysqlPool.query(sql, params);
    } catch (err: any) {
      console.error('MySQL query error, falling back to local JSON database. Error:', err.message);
      useLocalFallback = true;
      return executeLocalQuery(sql, params);
    }
  },
  async getConnection(): Promise<any> {
    if (useLocalFallback) {
      return {
        query: async (sql: string, params?: any[]) => executeLocalQuery(sql, params),
        release: () => {}
      };
    }
    try {
      const conn = await mysqlPool.getConnection();
      return {
        query: async (sql: string, params?: any[]) => {
          try {
            return await conn.query(sql, params);
          } catch (err: any) {
            console.error('Connection query error, falling back to local:', err.message);
            useLocalFallback = true;
            return executeLocalQuery(sql, params);
          }
        },
        release: () => conn.release()
      };
    } catch (err: any) {
      console.error('MySQL pool.getConnection failed, falling back to local JSON database. Error:', err.message);
      useLocalFallback = true;
      return {
        query: async (sql: string, params?: any[]) => executeLocalQuery(sql, params),
        release: () => {}
      };
    }
  }
};

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
        age INT DEFAULT 0,
        ageMonths INT DEFAULT 0,
        clinicName VARCHAR(255) NOT NULL,
        skullType VARCHAR(50),
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS reports (
        id VARCHAR(36) PRIMARY KEY,
        petId VARCHAR(36) NOT NULL,
        date VARCHAR(255) NOT NULL,
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
        isMirrored TINYINT(1) DEFAULT 0,
        position INT DEFAULT 0,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (reportId) REFERENCES reports(id) ON DELETE CASCADE
      )
    `);

    // Migrations for pets table
    try {
      // Check if ownerName exists and rename to clinicName
      const [ownerCols]: any = await connection.query('SHOW COLUMNS FROM pets LIKE "ownerName"');
      if (ownerCols.length > 0) {
        console.log('Renaming ownerName to clinicName in pets');
        await connection.query('ALTER TABLE pets CHANGE ownerName clinicName VARCHAR(255) NOT NULL');
      }
      
      // Check if skullType exists
      const [skullCols]: any = await connection.query('SHOW COLUMNS FROM pets LIKE "skullType"');
      if (skullCols.length === 0) {
        console.log('Adding skullType column to pets');
        await connection.query('ALTER TABLE pets ADD COLUMN skullType VARCHAR(50)');
      }

      // Check if ageMonths exists
      const [monthCols]: any = await connection.query('SHOW COLUMNS FROM pets LIKE "ageMonths"');
      if (monthCols.length === 0) {
        console.log('Adding ageMonths column to pets');
        await connection.query('ALTER TABLE pets ADD COLUMN ageMonths INT DEFAULT 0');
      }
    } catch (e) {
      console.error('Error migrating pets table:', e);
    }

    await connection.query(`
      CREATE TABLE IF NOT EXISTS appointments (
        id VARCHAR(36) PRIMARY KEY,
        petId VARCHAR(36) NOT NULL,
        petName VARCHAR(255),
        clinicName VARCHAR(255),
        date VARCHAR(255) NOT NULL,
        time VARCHAR(50),
        service VARCHAR(255),
        status VARCHAR(50) DEFAULT 'Pendiente',
        FOREIGN KEY (petId) REFERENCES pets(id) ON DELETE CASCADE
      )
    `);

    // Migration for appointments table
    try {
      const [ownerColsApp]: any = await connection.query('SHOW COLUMNS FROM appointments LIKE "ownerName"');
      if (ownerColsApp.length > 0) {
        console.log('Renaming ownerName to clinicName in appointments');
        await connection.query('ALTER TABLE appointments CHANGE ownerName clinicName VARCHAR(255)');
      }
    } catch (e) {
      console.error('Error migrating appointments table:', e);
    }

    // Migration for report_items positioning
    try {
      const [posCols]: any = await connection.query('SHOW COLUMNS FROM report_items LIKE "position"');
      if (posCols.length === 0) {
        console.log('Adding position column to report_items');
        await connection.query('ALTER TABLE report_items ADD COLUMN position INT DEFAULT 0');
      }
    } catch (e) {
      console.error('Error migrating report_items table:', e);
    }

    // Create users table and seed default admin
    try {
      await connection.query(`
        CREATE TABLE IF NOT EXISTS users (
          id VARCHAR(36) PRIMARY KEY,
          username VARCHAR(255) UNIQUE NOT NULL,
          password VARCHAR(255) NOT NULL,
          role VARCHAR(50) NOT NULL DEFAULT 'assistant',
          createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      const [adminRows]: any = await connection.query('SELECT * FROM users WHERE role = "admin"');
      if (adminRows.length === 0) {
        console.log('Seeding default admin user');
        // Simple random ID generation without external dependency
        const adminId = 'admin-default-id-000000000000000000';
        await connection.query(
          'INSERT INTO users (id, username, password, role) VALUES (?, ?, ?, ?)',
          [adminId, 'admin', 'admin', 'admin']
        );
      }
    } catch (e) {
      console.error('Error creating users table / seeding admin:', e);
    }

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
    const { id, name, type, breed, age, ageMonths, clinicName, skullType } = req.body;
    const safeAge = age !== undefined && age !== '' && age !== null ? Number(age) : 0;
    const safeMonths = ageMonths !== undefined && ageMonths !== '' && ageMonths !== null ? Number(ageMonths) : 0;
    await pool.query(
      'INSERT INTO pets (id, name, type, breed, age, ageMonths, clinicName, skullType) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [id, name, type, breed, safeAge, safeMonths, clinicName, skullType]
    );
    res.status(201).json({ id, name, type, breed, age: safeAge, ageMonths: safeMonths, clinicName, skullType });
  } catch (error) {
    console.error('Error saving pet:', error);
    res.status(500).json({ error: 'Failed to save pet' });
  }
});

app.put('/api/pets/:id', async (req, res) => {
  try {
    const { name, type, breed, age, ageMonths, clinicName, skullType } = req.body;
    const safeAge = age !== undefined && age !== '' && age !== null ? Number(age) : 0;
    const safeMonths = ageMonths !== undefined && ageMonths !== '' && ageMonths !== null ? Number(ageMonths) : 0;
    await pool.query(
      'UPDATE pets SET name = ?, type = ?, breed = ?, age = ?, ageMonths = ?, clinicName = ?, skullType = ? WHERE id = ?',
      [name, type, breed, safeAge, safeMonths, clinicName, skullType, req.params.id]
    );
    res.json({ id: req.params.id, name, type, breed, age: safeAge, ageMonths: safeMonths, clinicName, skullType });
  } catch (error) {
    console.error('Error updating pet:', error);
    res.status(500).json({ error: 'Failed to update pet' });
  }
});

app.delete('/api/pets/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM pets WHERE id = ?', [req.params.id]);
    res.json({ status: 'success', message: 'Pet deleted successfully' });
  } catch (error) {
    console.error('Error deleting pet:', error);
    res.status(500).json({ error: 'Failed to delete pet' });
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
    console.log('Saving report:', req.body.id);
    const { id, petId, date, clinicalHistory, recommendedTreatment, otherComments, notes } = req.body;
    await pool.query(
      'INSERT INTO reports (id, petId, date, clinicalHistory, recommendedTreatment, otherComments, notes) VALUES (?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE date=?, clinicalHistory=?, recommendedTreatment=?, otherComments=?, notes=?',
      [id, petId, date, clinicalHistory, recommendedTreatment, otherComments, notes, date, clinicalHistory, recommendedTreatment, otherComments, notes]
    );
    res.status(201).json(req.body);
  } catch (error) {
    console.error('Error saving report:', error);
    res.status(500).json({ error: 'Failed to save report' });
  }
});

// Report Items
app.get('/api/reports/:reportId/items', async (req, res) => {
  try {
    console.log('Fetching items for report:', req.params.reportId);
    const [rows] = await pool.query('SELECT * FROM report_items WHERE reportId = ? ORDER BY position ASC, createdAt ASC', [req.params.reportId]);
    console.log(`Found ${Array.isArray(rows) ? rows.length : 0} items`);
    res.json(rows);
  } catch (error) {
    console.error('Error fetching report items:', error);
    res.status(500).json({ error: 'Failed to fetch report items' });
  }
});

app.post('/api/report-items', async (req, res) => {
  try {
    console.log('Saving report item for report:', req.body.reportId);
    const { id, reportId, imageData, description, rotation, isMirrored, position } = req.body;
    // Convert boolean to 0/1 for MySQL
    const mirroredValue = isMirrored ? 1 : 0;
    const positionValue = position !== undefined ? position : 0;
    
    await pool.query(
      'INSERT INTO report_items (id, reportId, imageData, description, rotation, isMirrored, position) VALUES (?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE imageData=?, description=?, rotation=?, isMirrored=?, position=?',
      [id, reportId, imageData, description, rotation, mirroredValue, positionValue, imageData, description, rotation, mirroredValue, positionValue]
    );
    res.status(201).json(req.body);
  } catch (error) {
    console.error('Error saving report item:', error);
    res.status(500).json({ error: 'Failed to save report item' });
  }
});

app.post('/api/report-items/reorder', async (req, res) => {
  try {
    const { items } = req.body; // array of { id, position }
    console.log('Reordering report items:', items?.length);
    if (Array.isArray(items)) {
      for (const item of items) {
        await pool.query('UPDATE report_items SET position = ? WHERE id = ?', [item.position, item.id]);
      }
    }
    res.json({ success: true });
  } catch (error) {
    console.error('Error reordering report items:', error);
    res.status(500).json({ error: 'Failed to reorder report items' });
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
    const { id, petId, petName, clinicName, date, time, service, status } = req.body;
    await pool.query(
      'INSERT INTO appointments (id, petId, petName, clinicName, date, time, service, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE date=?, time=?, service=?, status=?',
      [id, petId, petName, clinicName, date, time, service, status, date, time, service, status]
    );
    res.status(201).json(req.body);
  } catch (error) {
    console.error('Error saving appointment:', error);
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

// Auth and Users / Assistants Management
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const [rows]: any = await pool.query('SELECT * FROM users WHERE username = ? AND password = ?', [username, password]);
    if (rows.length > 0) {
      const user = rows[0];
      res.json({
        success: true,
        user: {
          id: user.id,
          username: user.username,
          role: user.role
        }
      });
    } else {
      res.status(401).json({ success: false, error: 'Credenciales inválidas.' });
    }
  } catch (error) {
    console.error('Error logging in:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

app.post('/api/auth/change-password', async (req, res) => {
  try {
    const { username, currentPassword, newPassword } = req.body;
    const [rows]: any = await pool.query('SELECT * FROM users WHERE username = ? AND password = ?', [username, currentPassword]);
    if (rows.length > 0) {
      await pool.query('UPDATE users SET password = ? WHERE username = ?', [newPassword, username]);
      res.json({ success: true });
    } else {
      res.status(400).json({ success: false, error: 'Contraseña actual incorrecta.' });
    }
  } catch (error) {
    console.error('Error changing password:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

app.get('/api/assistants', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT id, username, password, role, createdAt FROM users WHERE role = "assistant" ORDER BY createdAt DESC');
    res.json(rows);
  } catch (error) {
    console.error('Error fetching assistants:', error);
    res.status(500).json({ error: 'Failed to fetch assistants' });
  }
});

app.post('/api/assistants', async (req, res) => {
  try {
    const { username, password } = req.body;
    // Check if username already exists
    const [existing]: any = await pool.query('SELECT id FROM users WHERE username = ?', [username]);
    if (existing.length > 0) {
      return res.status(400).json({ error: 'El nombre de usuario ya existe' });
    }
    const id = 'ast-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    await pool.query(
      'INSERT INTO users (id, username, password, role) VALUES (?, ?, ?, "assistant")',
      [id, username, password]
    );
    res.status(201).json({ id, username, password, role: 'assistant' });
  } catch (error) {
    console.error('Error creating assistant:', error);
    res.status(500).json({ error: 'Failed to create assistant' });
  }
});

app.put('/api/assistants/:id', async (req, res) => {
  try {
    const { password } = req.body;
    await pool.query('UPDATE users SET password = ? WHERE id = ?', [password, req.params.id]);
    res.json({ success: true });
  } catch (error) {
    console.error('Error updating assistant:', error);
    res.status(500).json({ error: 'Failed to update assistant' });
  }
});

app.delete('/api/assistants/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM users WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting assistant:', error);
    res.status(500).json({ error: 'Failed to delete assistant' });
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
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    // SPA catch-all
    app.use((req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
