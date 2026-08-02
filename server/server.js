const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS for all local network requests
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Increase JSON payload size limits to allow base64 wound photos
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Database connection configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'wound_user',
  password: process.env.DB_PASSWORD || 'wound_password_2026',
  database: process.env.DB_NAME || 'wound_care_pro',
  port: parseInt(process.env.DB_PORT || '3306'),
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

let pool;

// Initialize Database connection pool
async function initDb() {
  console.log(`Connecting to MariaDB at ${dbConfig.host}:${dbConfig.port}...`);
  try {
    pool = mysql.createPool(dbConfig);
    // Test the connection
    const connection = await pool.getConnection();
    console.log('✔ Successfully connected to MariaDB!');
    connection.release();
  } catch (err) {
    console.error('✘ Database connection failed:', err.message);
    console.log('Retrying db connection in 5 seconds...');
    setTimeout(initDb, 5000);
  }
}

initDb();

// -----------------------------------------------------
// 1. Health Probe Route
// -----------------------------------------------------
app.get('/api/health', async (req, res) => {
  try {
    const [result] = await pool.query('SELECT 1');
    res.json({ 
      status: 'online', 
      database: 'connected', 
      timestamp: new Date().toISOString() 
    });
  } catch (err) {
    res.status(500).json({ 
      status: 'offline', 
      database: 'disconnected', 
      error: err.message 
    });
  }
});

// -----------------------------------------------------
// 2. Patients API Routes
// -----------------------------------------------------
app.get('/api/patients', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, name, DATE_FORMAT(dob, "%Y-%m-%d") as dob, mrn, created_at as createdAt FROM patients ORDER BY name'
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/patients', async (req, res) => {
  const { id, name, dob, mrn, createdAt } = req.body;
  if (!id || !name || !dob || !mrn) {
    return res.status(400).json({ error: 'Missing required patient fields.' });
  }
  
  try {
    const query = `
      INSERT INTO patients (id, name, dob, mrn, created_at) 
      VALUES (?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE 
        name = VALUES(name), 
        dob = VALUES(dob), 
        mrn = VALUES(mrn)
    `;
    const checkDate = dob.slice(0, 10);
    const dbCreatedVal = createdAt ? new Date(createdAt) : new Date();

    await pool.query(query, [id, name, checkDate, mrn, dbCreatedVal]);
    res.status(200).json({ success: true, message: 'Patient saved successfully.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/patients/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM patients WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Patient deleted.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// -----------------------------------------------------
// 3. Wounds API Routes
// -----------------------------------------------------
app.get('/api/wounds', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, patient_id as patientId, location_name as locationName, x, y, view, status, created_at as createdAt FROM wounds'
    );
    // Parse coordinates back to float/numeric
    const parsed = rows.map(w => ({
      ...w,
      x: parseFloat(w.x),
      y: parseFloat(w.y)
    }));
    res.json(parsed);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/wounds', async (req, res) => {
  const { id, patientId, locationName, x, y, view, status, createdAt } = req.body;
  if (!id || !patientId || !locationName || x === undefined || y === undefined) {
    return res.status(400).json({ error: 'Missing required wound fields.' });
  }

  try {
    const query = `
      INSERT INTO wounds (id, patient_id, location_name, x, y, view, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        location_name = VALUES(location_name),
        x = VALUES(x),
        y = VALUES(y),
        view = VALUES(view),
        status = VALUES(status)
    `;
    const dbCreatedVal = createdAt ? new Date(createdAt) : new Date();

    await pool.query(query, [id, patientId, locationName, x, y, view || 'front', status || 'active', dbCreatedVal]);
    res.status(200).json({ success: true, message: 'Wound saved successfully.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/wounds/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM wounds WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Wound deleted.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// -----------------------------------------------------
// 4. Assessments API Routes (Entries)
// -----------------------------------------------------
app.get('/api/entries', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT 
        id, wound_id as woundId, patient_id as patientId, author_id as authorId,
        length, width, depth, edges, phase, 
        exudate_amount as exudateAmount, exudate_type as exudateType, surroundings,
        cleanser, filler, dressing, compression, compression_type as compressionType,
        frequency, subjective_complaints as subjectiveComplaints, notes, image_url as imageUrl,
        created_at as createdAt 
       FROM assessments`
    );
    // Parse dimensions back to float/numeric
    const parsed = rows.map(e => ({
      ...e,
      length: e.length !== null ? parseFloat(e.length) : null,
      width: e.width !== null ? parseFloat(e.width) : null,
      depth: e.depth !== null ? parseFloat(e.depth) : null
    }));
    res.json(parsed);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/entries', async (req, res) => {
  const e = req.body;
  if (!e.id || !e.woundId || !e.patientId) {
    return res.status(400).json({ error: 'Missing core assessment identifiers.' });
  }

  try {
    const query = `
      INSERT INTO assessments (
        id, wound_id, patient_id, author_id,
        length, width, depth, edges, phase,
        exudate_amount, exudate_type, surroundings,
        cleanser, filler, dressing, compression, compression_type,
        frequency, subjective_complaints, notes, image_url, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        length = VALUES(length),
        width = VALUES(width),
        depth = VALUES(depth),
        edges = VALUES(edges),
        phase = VALUES(phase),
        exudate_amount = VALUES(exudate_amount),
        exudate_type = VALUES(exudate_type),
        surroundings = VALUES(surroundings),
        cleanser = VALUES(cleanser),
        filler = VALUES(filler),
        dressing = VALUES(dressing),
        compression = VALUES(compression),
        compression_type = VALUES(compression_type),
        frequency = VALUES(frequency),
        subjective_complaints = VALUES(subjective_complaints),
        notes = VALUES(notes),
        image_url = VALUES(image_url)
    `;
    const dbCreatedVal = e.createdAt ? new Date(e.createdAt) : new Date();

    await pool.query(query, [
      e.id, e.woundId, e.patientId, e.authorId || 'local-user',
      e.length || null, e.width || null, e.depth || null, 
      e.edges || 'Diffus', e.phase || 'Granulation',
      e.exudateAmount || 'Kein', e.exudateType || 'N/A', e.surroundings || 'Intakt',
      e.cleanser || 'NaCl 0.9%', e.filler || 'Keiner', e.dressing || 'Schaumverband',
      e.compression || 'Nein', e.compressionType || null, e.frequency || 'Täglich',
      e.subjectiveComplaints || null, e.notes || null, e.imageUrl || null, dbCreatedVal
    ]);
    res.status(200).json({ success: true, message: 'Assessment saved successfully.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/entries/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM assessments WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Assessment deleted.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Start Express Listener
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on http://0.0.0.0:${PORT}`);
});
