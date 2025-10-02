const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const cors = require("cors");
const bodyParser = require("body-parser");
const bcrypt = require("bcrypt");

const app = express();
const PORT = process.env.PORT || 4000; // Render asigna el puerto

// ------------------- MIDDLEWARES -------------------
app.use(cors());
app.use(bodyParser.json());

// ------------------- CONEXIÓN BD -------------------
const db = new sqlite3.Database("./database.db", (err) => {
  if (err) {
    console.error("❌ Error al conectar con SQLite:", err);
  } else {
    console.log("✅ Conectado a SQLite");
  }
});

// ------------------- TABLAS -------------------

// Usuarios
db.run(`
  CREATE TABLE IF NOT EXISTS usuarios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nickname TEXT NOT NULL,
    password TEXT NOT NULL,
    email TEXT NOT NULL,  
    tipo TEXT NOT NULL,
    codigo TEXT
  )
`);

// Sensores
db.run(`
  CREATE TABLE IF NOT EXISTS sensores (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    device TEXT,
    temperatura REAL,
    humedad REAL,
    ambtemp REAL,
    objtemp REAL,
    peso REAL,
    fecha DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// ------------------- ENDPOINTS USUARIOS -------------------

// Registro
app.post("/register", async (req, res) => {
  const { nickname, password, email, tipo, codigo } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    db.run(
      `INSERT INTO usuarios (nickname, password, email, tipo, codigo) VALUES (?, ?, ?, ?, ?)`,
      [nickname, hashedPassword, email, tipo, codigo || null],
      function (err) {
        if (err) {
          console.error("❌ Error al registrar usuario:", err);
          res.status(500).json({ error: "Error al registrar usuario" });
        } else {
          res.json({ message: "Usuario registrado ✅", id: this.lastID });
        }
      }
    );
  } catch (err) {
    res.status(500).json({ error: "Error interno en registro" });
  }
});

// Login
app.post("/login", (req, res) => {
  const { nickname, password } = req.body;

  db.get(
    `SELECT * FROM usuarios WHERE nickname = ?`,
    [nickname],
    async (err, row) => {
      if (err) {
        console.error("❌ Error en login:", err);
        res.status(500).json({ error: "Error en login" });
      } else if (row && (await bcrypt.compare(password, row.password))) {
        res.json({ message: "Login correcto ✅", user: row });
      } else {
        res.status(401).json({ error: "Usuario o contraseña incorrectos" });
      }
    }
  );
});

// ------------------- ENDPOINTS SENSORES -------------------

// Recibir datos del ESP32
app.post("/api/sensores", (req, res) => {
  const { device, temperatura, humedad, ambtemp, objtemp, peso } = req.body;

  db.run(
    `INSERT INTO sensores (device, temperatura, humedad, ambtemp, objtemp, peso) 
     VALUES (?, ?, ?, ?, ?, ?)`,
    [device, temperatura, humedad, ambtemp, objtemp, peso],
    function (err) {
      if (err) {
        console.error("❌ Error al insertar sensor:", err);
        res.status(500).json({ error: "Error al guardar datos de sensor" });
      } else {
        res.json({ message: "✅ Datos guardados", id: this.lastID });
      }
    }
  );
});

// Consultar últimos datos de sensores
app.get("/api/sensores", (req, res) => {
  db.all(
    `SELECT * FROM sensores ORDER BY fecha DESC LIMIT 20`,
    [],
    (err, rows) => {
      if (err) {
        console.error("❌ Error al consultar sensores:", err);
        res.status(500).json({ error: "Error al consultar sensores" });
      } else {
        res.json(rows);
      }
    }
  );
});

// ------------------- INICIO SERVIDOR -------------------
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
});
