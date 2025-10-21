// ================== LIBRERÍAS ==================
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const bcrypt = require("bcrypt");
const sqlite3 = require("sqlite3").verbose();
const path = require("path");

// ================== CONFIGURACIÓN ==================
const app = express();
const PORT = process.env.PORT || 4000;
const DB_PATH = path.join(__dirname, "database.db");

app.use(cors({
  origin: [
    "https://danielsaavc.github.io",  // tu frontend en GitHub Pages
    "http://localhost:3000"           // para pruebas locales
  ],
  methods: ["GET", "POST"],
  allowedHeaders: ["Content-Type"]
}));

app.use(bodyParser.json());

// ================== CONEXIÓN A SQLITE ==================
const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error("❌ Error conectando a SQLite:", err.message);
  } else {
    console.log("✅ Conectado a SQLite local:", DB_PATH);
  }
});

// ================== CREACIÓN DE TABLAS ==================
db.serialize(() => {
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

  db.run(`
    CREATE TABLE IF NOT EXISTS sensores (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      device TEXT,
      temperatura REAL,
      humedad REAL,
      ambtemp REAL,
      objtemp REAL,
      peso REAL,
      fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  console.log("✅ Tablas listas en SQLite");
});

// ================== ENDPOINTS USUARIOS ==================

// Registro
app.post("/register", async (req, res) => {
  const { nickname, password, email, tipo, codigo } = req.body;
  try {
    console.log("📥 Registro recibido:", req.body);

    const hashedPassword = await bcrypt.hash(password, 10);

    const stmt = db.prepare(`
      INSERT INTO usuarios (nickname, password, email, tipo, codigo)
      VALUES (?, ?, ?, ?, ?)
    `);

    stmt.run(
      nickname.toLowerCase(),
      hashedPassword,
      email,
      tipo,
      codigo || null,
      function (err) {
        if (err) {
          console.error("❌ Error al registrar usuario:", err);
          res.status(500).json({ error: "Error al registrar usuario" });
        } else {
          console.log("✅ Usuario insertado ID:", this.lastID);
          res.json({ message: "Usuario registrado ✅", id: this.lastID });
        }
      }
    );
    stmt.finalize();
  } catch (err) {
    console.error("❌ Error general en registro:", err);
    res.status(500).json({ error: "Error al registrar usuario" });
  }
});

// Login
app.post("/login", (req, res) => {
  const { nickname, password } = req.body;
  console.log("🔑 Intento de login:", nickname);

  db.get(
    `SELECT * FROM usuarios WHERE nickname = ?`,
    [nickname.toLowerCase()],
    async (err, user) => {
      if (err) {
        console.error("❌ Error al consultar usuario:", err);
        res.status(500).json({ error: "Error en la base de datos" });
        return;
      }

      if (!user) {
        console.warn("❌ Usuario no encontrado:", nickname);
        res.status(401).json({ error: "Usuario no encontrado" });
        return;
      }
      const isMatch = await bcrypt.compare(password, user.password);
      if (isMatch) {
        console.log("🔎 Comparación bcrypt:", { ingresada: password, hash: user.password, resultado: isMatch });

        console.log("✅ Login correcto:", user.nickname);
        res.json({ message: "Login correcto ✅", user });
      } else {
        console.warn("⚠️ Contraseña incorrecta para:", nickname);
        res.status(401).json({ error: "Contraseña incorrecta" });
      }
    }
  );
});

// ================== ENDPOINTS SENSORES ==================

// Recibir datos del ESP32
app.post("/api/sensores", (req, res) => {
  const { device, temperatura, humedad, ambtemp, objtemp, peso } = req.body;

  const stmt = db.prepare(`
    INSERT INTO sensores (device, temperatura, humedad, ambtemp, objtemp, peso)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  stmt.run(device, temperatura, humedad, ambtemp, objtemp, peso, function (err) {
    if (err) {
      console.error("❌ Error al insertar sensor:", err);
      res.status(500).json({ error: "Error al guardar datos de sensor" });
    } else {
      res.json({ message: "✅ Datos guardados", id: this.lastID });
    }
  });

  stmt.finalize();
});

// Consultar últimos datos de sensores
app.get("/api/sensores", (req, res) => {
  db.all(`SELECT * FROM sensores ORDER BY fecha DESC LIMIT 20`, [], (err, rows) => {
    if (err) {
      console.error("❌ Error al consultar sensores:", err);
      res.status(500).json({ error: "Error al consultar sensores" });
    } else {
      res.json(rows);
    }
  });
});

// ================== INICIO DEL SERVIDOR ==================
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
});



