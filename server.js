const express = require("express");
const { Pool } = require("pg"); // Cliente Postgres
const cors = require("cors");
const bodyParser = require("body-parser");
const bcrypt = require("bcrypt");

const app = express();
const PORT = process.env.PORT || 4000; // Render asigna el puerto

// ------------------- MIDDLEWARES -------------------
app.use(cors());
app.use(bodyParser.json());

// ------------------- CONEXIÓN BD -------------------
const pool = new Pool({
  connectionString: process.env.DATABASE_URL, // Render inyecta DATABASE_URL
  ssl: { rejectUnauthorized: false }
});

// ------------------- CREACIÓN DE TABLAS -------------------
(async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS usuarios (
        id SERIAL PRIMARY KEY,
        nickname TEXT NOT NULL,
        password TEXT NOT NULL,
        email TEXT NOT NULL,  
        tipo TEXT NOT NULL,
        codigo TEXT
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS sensores (
        id SERIAL PRIMARY KEY,
        device TEXT,
        temperatura REAL,
        humedad REAL,
        ambtemp REAL,
        objtemp REAL,
        peso REAL,
        fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log("✅ Tablas listas en PostgreSQL");
  } catch (err) {
    console.error("❌ Error creando tablas:", err);
  }
})();

// ------------------- ENDPOINTS USUARIOS -------------------

// Registro
app.post("/register", async (req, res) => {
  const { nickname, password, email, tipo, codigo } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `INSERT INTO usuarios (nickname, password, email, tipo, codigo)
       VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      [nickname, hashedPassword, email, tipo, codigo || null]
    );

    res.json({ message: "Usuario registrado ✅", id: result.rows[0].id });
  } catch (err) {
    console.error("❌ Error al registrar usuario:", err);
    res.status(500).json({ error: "Error al registrar usuario" });
  }
});

// Login
app.post("/login", async (req, res) => {
  const { nickname, password } = req.body;

  try {
    const result = await pool.query(
      `SELECT * FROM usuarios WHERE nickname = $1`,
      [nickname]
    );

    if (result.rows.length > 0) {
      const user = result.rows[0];
      const isMatch = await bcrypt.compare(password, user.password);

      if (isMatch) {
        res.json({ message: "Login correcto ✅", user });
      } else {
        res.status(401).json({ error: "Contraseña incorrecta" });
      }
    } else {
      res.status(401).json({ error: "Usuario no encontrado" });
    }
  } catch (err) {
    console.error("❌ Error en login:", err);
    res.status(500).json({ error: "Error en login" });
  }
});

// ------------------- ENDPOINTS SENSORES -------------------

// Recibir datos del ESP32
app.post("/api/sensores", async (req, res) => {
  const { device, temperatura, humedad, ambtemp, objtemp, peso } = req.body;

  try {
    const result = await pool.query(
      `INSERT INTO sensores (device, temperatura, humedad, ambtemp, objtemp, peso)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
      [device, temperatura, humedad, ambtemp, objtemp, peso]
    );

    res.json({ message: "✅ Datos guardados", id: result.rows[0].id });
  } catch (err) {
    console.error("❌ Error al insertar sensor:", err);
    res.status(500).json({ error: "Error al guardar datos de sensor" });
  }
});

// Consultar últimos datos de sensores
app.get("/api/sensores", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM sensores ORDER BY fecha DESC LIMIT 20`
    );
    res.json(result.rows);
  } catch (err) {
    console.error("❌ Error al consultar sensores:", err);
    res.status(500).json({ error: "Error al consultar sensores" });
  }
});

// ------------------- INICIO SERVIDOR -------------------
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
});
