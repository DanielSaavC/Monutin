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
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"], // ✅ añadimos PUT y DELETE
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

    // Verificar si ya existe el usuario
    const existe = db.prepare("SELECT id FROM usuarios WHERE usuario = ?").get(usuario.toLowerCase());
    if (existe) {
      return res.status(400).json({ error: "El usuario ya existe. Usa otro nombre de usuario." });
    }

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
    // Buscar usuario
    const user = db.prepare(`SELECT * FROM usuarios WHERE usuario = ?`).get(usuario.toLowerCase());

    if (!user) {
      console.warn("❌ Usuario no encontrado:", usuario);
      return res.status(401).json({ error: "Usuario no encontrado" });
    }

    // Verificar contraseña
    const isMatch = await bcrypt.compare(password, user.password);
    if (isMatch) {
      console.log("✅ Login correcto:", user.usuario);

      // 👇 Aquí colocamos correctamente la línea que asegura incluir el ID
      res.json({ message: "Login correcto ✅", user: { ...user, id: user.id } });
    } else {
      console.warn("⚠️ Contraseña incorrecta para:", usuario);
      res.status(401).json({ error: "Contraseña incorrecta" });
    }
  } catch (err) {
    console.error("❌ Error al consultar usuario:", err);
    res.status(500).json({ error: "Error en la base de datos" });
  }
});

// ================== ACTUALIZAR USUARIO ==================
app.put("/updateUser/:id", async (req, res) => {
  const { id } = req.params;
  const { nombre, apellidopaterno, apellidomaterno, usuario, email, password, tipo, codigo } = req.body;

  try {
    const userExistente = db.prepare("SELECT * FROM usuarios WHERE id = ?").get(id);
    if (!userExistente) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    // ⚙️ Mantener la contraseña anterior si no se manda nueva
    let hashedPassword = userExistente.password;
    if (password && password.trim() !== "") {
      hashedPassword = await bcrypt.hash(password, 10);
    }

    // 👇 Asegurar que no se reemplace con null/undefined
    const stmt = db.prepare(`
      UPDATE usuarios
      SET nombre = COALESCE(?, nombre),
          apellidopaterno = COALESCE(?, apellidopaterno),
          apellidomaterno = COALESCE(?, apellidomaterno),
          usuario = COALESCE(?, usuario),
          email = COALESCE(?, email),
          password = ?,
          tipo = COALESCE(?, tipo),
          codigo = COALESCE(?, codigo)
      WHERE id = ?
    `);

    stmt.run(
      nombre,
      apellidopaterno,
      apellidomaterno,
      usuario ? usuario.toLowerCase() : null,
      email,
      hashedPassword,
      tipo,
      codigo,
      id
    );

    console.log(`✅ Usuario ID ${id} actualizado correctamente`);
    res.json({ message: "Usuario actualizado correctamente ✅" });
  } catch (err) {
    console.error("❌ Error al actualizar usuario:", err);
    res.status(500).json({ error: "Error al actualizar usuario" });
  }
});

// ================== ELIMINAR USUARIO ==================
app.delete("/deleteUser/:id", (req, res) => {
  const { id } = req.params;

  try {
    const stmt = db.prepare("DELETE FROM usuarios WHERE id = ?");
    const result = stmt.run(id);

    if (result.changes === 0) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    console.log(`🗑️ Usuario ID ${id} eliminado correctamente`);
    res.json({ message: "Usuario eliminado correctamente ✅" });
  } catch (err) {
    console.error("❌ Error al eliminar usuario:", err);
    res.status(500).json({ error: "Error al eliminar usuario" });
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
