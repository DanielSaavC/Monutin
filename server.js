// ================== LIBRERÍAS ==================
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const bcrypt = require("bcrypt");
const Database = require("better-sqlite3");
const path = require("path");

// ================== CONFIGURACIÓN ==================
const app = express();
const PORT = process.env.PORT || 4000;
const DB_PATH = path.join(__dirname, "database.db");

app.use(cors({
  origin: [
    "https://danielsaavc.github.io",
    "https://danielsaavc.github.io/Monutin",
    "https://monutinbackend-production.up.railway.app"
  ],
  methods: ["GET", "POST"],
  allowedHeaders: ["Content-Type"]
}));

app.use(bodyParser.json());

// ================== CONEXIÓN A BETTER-SQLITE3 ==================
let db;
try {
  db = new Database(DB_PATH);
  console.log("✅ Conectado a SQLite local:", DB_PATH);
} catch (err) {
  console.error("❌ Error conectando a SQLite:", err.message);
}

// ================== CREACIÓN DE TABLAS ==================
db.prepare(`
  CREATE TABLE IF NOT EXISTS usuarios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT,
    apellidopaterno TEXT,
    apellidomaterno TEXT,
    usuario TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    email TEXT NOT NULL,
    tipo TEXT NOT NULL,
    codigo TEXT
  )
`).run();

db.prepare(`
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
`).run();

console.log("✅ Tablas listas en SQLite");

// ================== ENDPOINTS USUARIOS ==================

// Registro
app.post("/register", async (req, res) => {
  const { nombre, apellidopaterno, apellidomaterno, usuario, password, email, tipo, codigo } = req.body;

  try {
    console.log("📥 Registro recibido:", req.body);
    const hashedPassword = await bcrypt.hash(password, 10);

    const stmt = db.prepare(`
      INSERT INTO usuarios (nombre, apellidopaterno, apellidomaterno, usuario, password, email, tipo, codigo)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const info = stmt.run(nombre, apellidopaterno, apellidomaterno, usuario.toLowerCase(), hashedPassword, email, tipo, codigo || null);

    console.log("✅ Usuario insertado ID:", info.lastInsertRowid);
    res.json({ message: "Usuario registrado ✅", id: info.lastInsertRowid });
  } catch (err) {
    console.error("❌ Error al registrar usuario:", err);
    res.status(500).json({ error: "Error al registrar usuario" });
  }
});

// Login
app.post("/login", async (req, res) => {
  const { usuario, password } = req.body;
  console.log("🔑 Intento de login:", usuario);

  try {
    const user = db.prepare(`SELECT * FROM usuarios WHERE usuario = ?`).get(usuario.toLowerCase());

    if (!user) {
      console.warn("❌ Usuario no encontrado:", usuario);
      return res.status(401).json({ error: "Usuario no encontrado" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (isMatch) {
      console.log("✅ Login correcto:", user.usuario);
      res.json({ message: "Login correcto ✅", user });
    } else {
      console.warn("⚠️ Contraseña incorrecta para:", usuario);
      res.status(401).json({ error: "Contraseña incorrecta" });
    }
  } catch (err) {
    console.error("❌ Error al consultar usuario:", err);
    res.status(500).json({ error: "Error en la base de datos" });
  }
});

// ================== ENDPOINTS SENSORES ==================
app.post("/api/sensores", (req, res) => {
  const { device, temperatura, humedad, ambtemp, objtemp, peso } = req.body;

  try {
    const stmt = db.prepare(`
      INSERT INTO sensores (device, temperatura, humedad, ambtemp, objtemp, peso)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    const info = stmt.run(device, temperatura, humedad, ambtemp, objtemp, peso);
    res.json({ message: "✅ Datos guardados", id: info.lastInsertRowid });
  } catch (err) {
    console.error("❌ Error al insertar sensor:", err);
    res.status(500).json({ error: "Error al guardar datos de sensor" });
  }
});

app.get("/api/sensores", (req, res) => {
  try {
    const rows = db.prepare(`SELECT * FROM sensores ORDER BY fecha DESC LIMIT 20`).all();
    res.json(rows);
  } catch (err) {
    console.error("❌ Error al consultar sensores:", err);
    res.status(500).json({ error: "Error al consultar sensores" });
  }
});

app.get("/", (req, res) => {
  res.send("🚀 Backend de Monutin funcionando correctamente en Railway (better-sqlite3)");
});

// ================== INICIO DEL SERVIDOR ==================
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
});
