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
  let { nombre, apellidopaterno, apellidomaterno, usuario, email, password, tipo, codigo } = req.body;

  try {
    const user = db.prepare("SELECT * FROM usuarios WHERE id = ?").get(id);
    if (!user) return res.status(404).json({ error: "Usuario no encontrado" });

    // 🔒 Mantener valores anteriores si los nuevos están vacíos
    nombre = nombre?.trim() || user.nombre;
    apellidopaterno = apellidopaterno?.trim() || user.apellidopaterno;
    apellidomaterno = apellidomaterno?.trim() || user.apellidomaterno;
    usuario = usuario?.trim().toLowerCase() || user.usuario;
    email = email?.trim() || user.email;
    tipo = tipo?.trim() || user.tipo;
    codigo = codigo?.trim() || user.codigo;

    // 🔐 Solo actualizar contraseña si se envía una nueva
    let hashedPassword = user.password;
    if (password && password.trim() !== "") {
      hashedPassword = await bcrypt.hash(password, 10);
    }

    // 🧱 Ejecutar el UPDATE limpio y seguro
    const stmt = db.prepare(`
      UPDATE usuarios SET
        nombre = ?,
        apellidopaterno = ?,
        apellidomaterno = ?,
        usuario = ?,
        email = ?,
        password = ?,
        tipo = ?,
        codigo = ?
      WHERE id = ?
    `);

    stmt.run(
      nombre,
      apellidopaterno,
      apellidomaterno,
      usuario,
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
// ================== TABLAS PARA EQUIPOS Y PROVEEDORES ==================
// ================== TABLAS PARA EQUIPOS Y FICHAS ==================
db.prepare(`
  CREATE TABLE IF NOT EXISTS fichas_tecnicas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    proveedor_id INTEGER,
    datos_tecnicos TEXT,
    accesorios TEXT,
    observaciones TEXT,
    manual_operacion TEXT,
    manual_instalacion TEXT,
    manual_servicio TEXT,
    estado_nuevo INTEGER DEFAULT 0,
    estado_bueno INTEGER DEFAULT 0,
    estado_reparable INTEGER DEFAULT 0,
    estado_descartable INTEGER DEFAULT 0,
    frecuencia TEXT,
    elaborado_por TEXT,
    imagen_base64 TEXT,
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (proveedor_id) REFERENCES proveedores(id)
  )
`).run();


console.log("✅ Tablas de equipos y proveedores listas");
// ================== ENDPOINTS FICHAS TÉCNICAS ==================

// ➕ Crear ficha técnica
app.post("/api/fichatecnica", (req, res) => {
  const {
    proveedor,
    datosTecnicos,
    accesorios,
    observaciones,
    manuales,
    estado,
    frecuencia,
    nombreElaboracion,
    imagenBase64,
  } = req.body;

  try {
    // Guardar proveedor si no existe
    let proveedor_id = null;
    if (proveedor?.nombre) {
      const existente = db
        .prepare("SELECT id FROM proveedores WHERE nombre = ?")
        .get(proveedor.nombre);

      if (existente) {
        proveedor_id = existente.id;
      } else {
        const infoProv = db
          .prepare(
            `INSERT INTO proveedores (nombre, direccion, telefono, correo)
             VALUES (?, ?, ?, ?)`
          )
          .run(
            proveedor.nombre,
            proveedor.direccion || "",
            proveedor.telefono || "",
            proveedor.correo || ""
          );
        proveedor_id = infoProv.lastInsertRowid;
      }
    }

    // Insertar ficha técnica
    const stmt = db.prepare(`
      INSERT INTO fichas_tecnicas (
        proveedor_id,
        datos_tecnicos,
        accesorios,
        observaciones,
        manual_operacion,
        manual_instalacion,
        manual_servicio,
        estado_nuevo,
        estado_bueno,
        estado_reparable,
        estado_descartable,
        frecuencia,
        elaborado_por,
        imagen_base64
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const info = stmt.run(
      proveedor_id,
      JSON.stringify(datosTecnicos),
      JSON.stringify(accesorios),
      JSON.stringify(observaciones),
      manuales.operacion || "",
      manuales.instalacion || "",
      manuales.servicio || "",
      estado.nuevo ? 1 : 0,
      estado.bueno ? 1 : 0,
      estado.reparable ? 1 : 0,
      estado.descartable ? 1 : 0,
      frecuencia,
      nombreElaboracion,
      imagenBase64 || null
    );

    res.json({ message: "✅ Ficha técnica guardada", id: info.lastInsertRowid });
  } catch (err) {
    console.error("❌ Error al guardar ficha técnica:", err);
    res.status(500).json({ error: "Error al guardar ficha técnica" });
  }
});

// 📋 Obtener todas las fichas técnicas
app.get("/api/fichatecnica", (req, res) => {
  try {
    const rows = db.prepare(`
      SELECT f.*, p.nombre AS proveedor_nombre
      FROM fichas_tecnicas f
      LEFT JOIN proveedores p ON f.proveedor_id = p.id
      ORDER BY f.fecha_registro DESC
    `).all();

    // Convertir textos JSON a arrays
    rows.forEach(r => {
      r.datos_tecnicos = JSON.parse(r.datos_tecnicos || "[]");
      r.accesorios = JSON.parse(r.accesorios || "[]");
      r.observaciones = JSON.parse(r.observaciones || "[]");
    });

    res.json(rows);
  } catch (err) {
    console.error("❌ Error al consultar fichas técnicas:", err);
    res.status(500).json({ error: "Error al consultar fichas técnicas" });
  }
});
