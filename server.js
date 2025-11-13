// ================== IMPORTS ==================
import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import bcrypt from "bcrypt";
import Database from "better-sqlite3";
import path from "path";
import fs from "fs";
import PDFDocument from "pdfkit";
import pkg from "pdfkit-table";
import multer from "multer";
const { default: PDFTable } = pkg;


// ================== CONFIGURACIÓN ==================
const app = express();
const PORT = process.env.PORT || 4000;
const DB_PATH = path.resolve("database.db");

// ================== MIDDLEWARE ==================
app.use(cors({
  origin: [
    "https://danielsaavc.github.io",
    "https://danielsaavc.github.io/Monutin",
    "https://monutinbackend-production.up.railway.app"
  ],
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type"]
}));
app.use(bodyParser.json({ limit: "25mb" }));

// ================== BASE DE DATOS ==================
let db;
try {
  db = new Database(DB_PATH);
  console.log(`✅ Conectado a SQLite en: ${DB_PATH}`);
} catch (err) {
  console.error("❌ Error conectando a SQLite:", err.message);
  process.exit(1);
}

// === Configurar almacenamiento para fotos de reportes ===
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) =>
    cb(null, Date.now() + "_" + file.originalname)
});

const upload = multer({ storage });

// === Servir imágenes ===
app.use("/uploads", express.static("uploads"));
// ================== CREACIÓN DE TABLAS ==================
const crearTablas = [
  `CREATE TABLE IF NOT EXISTS usuarios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT,
    apellidopaterno TEXT,
    apellidomaterno TEXT,
    usuario TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    email TEXT NOT NULL,
    tipo TEXT NOT NULL,
    codigo TEXT
  )`,
  `CREATE TABLE IF NOT EXISTS sensores (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    device TEXT,
    temperatura REAL,
    humedad REAL,
    ambtemp REAL,
    objtemp REAL,
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`,
  
  `CREATE TABLE IF NOT EXISTS seguimiento (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  usuario_id INTEGER,
  equipo_id INTEGER,
  fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
  FOREIGN KEY (equipo_id) REFERENCES fichas_tecnicas(id)
)`,

  `CREATE TABLE IF NOT EXISTS proveedores (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT,
    direccion TEXT,
    telefono TEXT,
    correo TEXT
  )`,
 `CREATE TABLE IF NOT EXISTS fichas_tecnicas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    proveedor_id INTEGER,
    nombre_equipo TEXT,
    marca TEXT,
    modelo TEXT,
    serie TEXT,
    codigo TEXT,
    servicio TEXT,
    ubicacion TEXT,
    garantia TEXT,
    procedencia TEXT,
    fecha_compra TEXT,
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
  )`,
  `CREATE TABLE IF NOT EXISTS reportes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    id_enfermera INTEGER,
    nombre_enfermera TEXT,
    equipo TEXT,
    descripcion TEXT,
    foto TEXT,
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    estado TEXT DEFAULT 'pendiente'
  )`,

  `CREATE TABLE IF NOT EXISTS notificaciones (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    mensaje TEXT,
    rol_destino TEXT,
    estado TEXT DEFAULT 'no_leido',
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`, 
  // En tu array 'crearTablas' en server.js
`CREATE TABLE IF NOT EXISTS suscripciones_push (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  subscription_json TEXT NOT NULL,
  usuario_id INTEGER,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
)`,
`CREATE TABLE IF NOT EXISTS delegaciones (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  notificacion_id INTEGER,
  tecnico_id INTEGER,
  biomedico_id INTEGER,
  fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (notificacion_id) REFERENCES notificaciones(id),
  FOREIGN KEY (tecnico_id) REFERENCES usuarios(id),
  FOREIGN KEY (biomedico_id) REFERENCES usuarios(id)
)`,
`CREATE TABLE IF NOT EXISTS mantenimientos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  equipo_id INTEGER,
  tecnico_id INTEGER,
  fecha TEXT DEFAULT (datetime('now')),
  descripcion TEXT,
  repuestos TEXT,
  observaciones TEXT,
  tipo TEXT,
  pdf_path TEXT, 
  FOREIGN KEY (equipo_id) REFERENCES fichas_tecnicas(id),
  FOREIGN KEY (tecnico_id) REFERENCES usuarios(id)
)`



];
// ... (tu código)
crearTablas.forEach(sql => db.prepare(sql).run());
console.log("✅ Tablas listas");

// ====================================================
// 🚀 MIGRACIÓN DE BD (Solo se ejecuta si es necesario)
// ====================================================
try {
  // 1. Intenta añadir la nueva columna 'endpoint'
  db.prepare("ALTER TABLE suscripciones_push ADD COLUMN endpoint TEXT").run();
  console.log("✅ Migración: Columna 'endpoint' añadida.");

  // 2. Añade un índice único a esa columna
  db.prepare("CREATE UNIQUE INDEX IF NOT EXISTS idx_endpoint ON suscripciones_push (endpoint)").run();
  console.log("✅ Migración: Índice 'endpoint' creado.");

} catch (e) {
  if (e.message.includes("duplicate column name")) {
    console.log("ℹ️ Migración: Columna 'endpoint' ya existe.");
  } else {
    console.error("❌ Error en migración de BD:", e.message);
  }
}
// ====================================================

// ... (resto de tu server.js)
// ================== FUNCIONES AUXILIARES ==================
const findUserByUsername = usuario =>
  db.prepare("SELECT * FROM usuarios WHERE usuario = ?").get(usuario.toLowerCase());
// ================== ENDPOINTS SEGUIMIENTO ==================

// 🔹 Agregar un equipo al seguimiento
app.post("/api/seguimiento", (req, res) => {
  const { usuario_id, equipo_id } = req.body;

  try {
    const existe = db.prepare(`
      SELECT * FROM seguimiento WHERE usuario_id = ? AND equipo_id = ?
    `).get(usuario_id, equipo_id);

    if (existe) {
      return res.status(400).json({ error: "El equipo ya está en seguimiento" });
    }

    db.prepare(`
      INSERT INTO seguimiento (usuario_id, equipo_id)
      VALUES (?, ?)
    `).run(usuario_id, equipo_id);

    res.json({ message: "✅ Equipo agregado al seguimiento" });
  } catch (err) {
    console.error("❌ Error al agregar a seguimiento:", err);
    res.status(500).json({ error: "Error interno al agregar a seguimiento" });
  }
});
  
// 🔹 Eliminar un equipo del seguimiento por usuario y equipo
app.delete("/api/seguimiento/:usuario_id/:equipo_id", (req, res) => {
  const { usuario_id, equipo_id } = req.params;

  try {
    const result = db
      .prepare("DELETE FROM seguimiento WHERE usuario_id = ? AND equipo_id = ?")
      .run(usuario_id, equipo_id);

    if (!result.changes) {
      return res.status(404).json({ error: "No estaba en seguimiento" });
    }

    res.json({ message: "🗑️ Equipo eliminado del seguimiento" });
  } catch (err) {
    console.error("❌ Error al quitar seguimiento:", err);
    res.status(500).json({ error: "Error al quitar equipo del seguimiento" });
  }
});


// 🔹 Obtener lista de seguimiento de un usuario
app.get("/api/seguimiento/:usuario_id", (req, res) => {
  const { usuario_id } = req.params;
  try {
    const rows = db.prepare(`
      SELECT f.*
      FROM fichas_tecnicas f
      JOIN seguimiento s ON f.id = s.equipo_id
      WHERE s.usuario_id = ?
      ORDER BY s.fecha DESC
    `).all(usuario_id);

    res.json(rows);
  } catch (err) {
    console.error("❌ Error al obtener seguimiento:", err);
    res.status(500).json({ error: "Error al obtener seguimiento" });
  }
});
// ================== ENDPOINT: Equipos delegados por técnico ==================
app.get("/api/delegaciones/:tecnico_id", (req, res) => {
  try {
    const { tecnico_id } = req.params;
    const equipos = db.prepare(`
      SELECT d.id AS delegacion_id, f.id AS equipo_id, f.nombre_equipo, f.marca, f.modelo, r.descripcion
      FROM delegaciones d
      JOIN notificaciones n ON d.notificacion_id = n.id
      LEFT JOIN fichas_tecnicas f ON n.mensaje LIKE '%' || f.nombre_equipo || '%'
      LEFT JOIN reportes r ON r.equipo = f.nombre_equipo
      WHERE d.tecnico_id = ?
    `).all(tecnico_id);

    res.json(equipos);
  } catch (error) {
    console.error("❌ Error al obtener equipos delegados:", error.message);
    res.status(500).json({ message: "Error al obtener equipos delegados" });
  }
});
// ================== ENDPOINT: Registrar mantenimiento ==================

app.post("/api/mantenimientos", async (req, res) => {
  try {
    const { equipo_id, tecnico_id, descripcion, repuestos, observaciones, tipo } = req.body;

    // 🔹 Obtener datos del técnico y del equipo
    const tecnico = db.prepare("SELECT nombre, apellidopaterno FROM usuarios WHERE id = ?").get(tecnico_id);
    const equipo = db.prepare("SELECT nombre_equipo, marca, modelo, codigo FROM fichas_tecnicas WHERE id = ?").get(equipo_id);

    if (!tecnico || !equipo) {
      return res.status(400).json({ message: "Datos de técnico o equipo no encontrados" });
    }

    // 🔹 Crear registro en BD
    const stmt = db.prepare(`
      INSERT INTO mantenimientos (equipo_id, tecnico_id, descripcion, repuestos, observaciones, tipo)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    const result = stmt.run(equipo_id, tecnico_id, descripcion, repuestos, observaciones, tipo);

    const mantenimientoId = result.lastInsertRowid;

    // 🔹 Crear carpeta de PDFs si no existe
    const dir = "uploads/mantenimientos";
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    // 🔹 Generar PDF
    const pdfPath = `${dir}/mantenimiento_${mantenimientoId}.pdf`;
    const doc = new PDFDocument();

    doc.pipe(fs.createWriteStream(pdfPath));

    // === ENCABEZADO ===
    doc.fontSize(20).fillColor("#00BFA6").text("HOJA DE MANTENIMIENTO", 150, 40);
    doc.moveDown(2);

    // === DATOS DEL EQUIPO ===
    doc.fontSize(12).fillColor("black");
    doc.text(`📅 Fecha: ${new Date().toLocaleString("es-BO")}`);
    doc.text(`🧾 Código: ${equipo.codigo || "No asignado"}`);
    doc.text(`🔧 Equipo: ${equipo.nombre_equipo}`);
    doc.text(`🏷 Marca/Modelo: ${equipo.marca} / ${equipo.modelo}`);
    doc.text(`👨‍🔧 Técnico: ${tecnico.nombre} ${tecnico.apellidopaterno}`);
    doc.text(`🛠 Tipo de mantenimiento: ${tipo}`);
    doc.moveDown(1);

    // === SECCIÓN DESCRIPTIVA ===
    doc.fontSize(12).fillColor("black");
    doc.text("Descripción del trabajo:", { underline: true });
    doc.text(descripcion || "No especificada", { indent: 20, align: "justify" });

    doc.moveDown(1);
    doc.text("Repuestos utilizados:", { underline: true });
    doc.text(repuestos || "Ninguno", { indent: 20, align: "justify" });

    doc.moveDown(1);
    doc.text("Observaciones:", { underline: true });
    doc.text(observaciones || "Sin observaciones", { indent: 20, align: "justify" });

    doc.end();

    // 🔹 Guardar ruta del PDF
    db.prepare("UPDATE mantenimientos SET pdf_path = ? WHERE id = ?").run(pdfPath, mantenimientoId);

    res.json({ message: "✅ Mantenimiento registrado y PDF generado", pdf_path: pdfPath });
  } catch (error) {
    console.error("❌ Error al registrar mantenimiento:", error.message);
    res.status(500).json({ message: "Error al registrar mantenimiento" });
  }
});
// ================== ENDPOINT: Descargar hoja de mantenimiento ==================
app.get("/api/mantenimientos/pdf/:id", (req, res) => {
  try {
    const { id } = req.params;
    const mantenimiento = db.prepare("SELECT pdf_path FROM mantenimientos WHERE id = ?").get(id);

    if (!mantenimiento || !mantenimiento.pdf_path || !fs.existsSync(mantenimiento.pdf_path)) {
      return res.status(404).json({ message: "PDF no encontrado" });
    }

    res.download(mantenimiento.pdf_path);
  } catch (error) {
    console.error("❌ Error al descargar PDF:", error.message);
    res.status(500).json({ message: "Error al descargar PDF" });
  }
});

// ================== ENDPOINTS USUARIOS ==================
// ================== ENDPOINT: Listar técnicos disponibles ==================
app.get("/api/tecnicos", (req, res) => {
  try {
    const tecnicos = db.prepare(
      "SELECT id, nombre, apellidopaterno, apellidomaterno, usuario, email FROM usuarios WHERE tipo = ?"
    ).all("tecnico");

    res.json(tecnicos);
  } catch (error) {
    console.error("❌ Error al obtener técnicos:", error.message);
    res.status(500).json({ message: "Error al obtener técnicos" });
  }
});
// ================== ENDPOINT: Delegar equipo ==================
app.post("/api/delegar", (req, res) => {
  try {
    const { notificacion_id, tecnico_id, biomedico_id } = req.body;

    if (!notificacion_id || !tecnico_id || !biomedico_id) {
      return res.status(400).json({ message: "Faltan datos para delegar" });
    }

    // Registrar delegación
    db.prepare(
      "INSERT INTO delegaciones (notificacion_id, tecnico_id, biomedico_id) VALUES (?, ?, ?)"
    ).run(notificacion_id, tecnico_id, biomedico_id);

    // ✅ Obtener el mensaje original para incluirlo
    const notifOriginal = db.prepare(
      "SELECT mensaje FROM notificaciones WHERE id = ?"
    ).get(notificacion_id);

    // ✅ Crear notificación CON usuario_id
    const mensaje = `Se te ha delegado un equipo para revisión: ${notifOriginal?.mensaje || ''}`;
    db.prepare(
      "INSERT INTO notificaciones (mensaje, rol_destino, estado, usuario_id) VALUES (?, ?, 'no_leido', ?)"
    ).run(mensaje, "tecnico", tecnico_id); // ⬅️ Agregar tecnico_id aquí

    res.json({ message: "Delegación registrada y notificación enviada" });
  } catch (error) {
    console.error("❌ Error al delegar:", error.message);
    res.status(500).json({ message: "Error al delegar equipo" });
  }
});
// ================== ENDPOINT: Crear notificación ==================
app.post("/api/notificaciones", (req, res) => {
  try {
    const { mensaje, rol_destino, estado } = req.body;

    if (!mensaje || !rol_destino) {
      return res.status(400).json({ message: "Faltan datos para crear la notificación" });
    }

    db.prepare(
      "INSERT INTO notificaciones (mensaje, rol_destino, estado) VALUES (?, ?, ?)"
    ).run(mensaje, rol_destino, estado || "no_leido");

    res.json({ message: "Notificación creada correctamente" });
  } catch (error) {
    console.error("❌ Error al crear notificación:", error.message);
    res.status(500).json({ message: "Error al crear notificación" });
  }
});
// ================== ENDPOINT: Obtener notificaciones por rol ==================
app.get("/api/notificaciones", (req, res) => {
  try {
    const rol = req.query.rol;
    let notificaciones;

    if (rol) {
      notificaciones = db.prepare(
        "SELECT * FROM notificaciones WHERE rol_destino = ? ORDER BY fecha DESC"
      ).all(rol);
    } else {
      notificaciones = db.prepare("SELECT * FROM notificaciones ORDER BY fecha DESC").all();
    }

    res.json(notificaciones);
  } catch (error) {
    console.error("❌ Error al obtener notificaciones:", error.message);
    res.status(500).json({ message: "Error al obtener notificaciones" });
  }
});

// Registro
app.post("/register", async (req, res) => {
  const { nombre, apellidopaterno, apellidomaterno, usuario, password, email, tipo, codigo } = req.body;
  try {
    if (findUserByUsername(usuario)) {
      return res.status(400).json({ error: "El usuario ya existe." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const stmt = db.prepare(`
      INSERT INTO usuarios (nombre, apellidopaterno, apellidomaterno, usuario, password, email, tipo, codigo)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const info = stmt.run(nombre, apellidopaterno, apellidomaterno, usuario.toLowerCase(), hashedPassword, email, tipo, codigo || null);

    res.json({ message: "✅ Usuario registrado", id: info.lastInsertRowid });
  } catch {
    res.status(500).json({ error: "Error al registrar usuario" });
  }
});

// Login
app.post("/login", async (req, res) => {
  const { usuario, password } = req.body;
  try {
    const user = findUserByUsername(usuario);
    if (!user) return res.status(401).json({ error: "Usuario no encontrado" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ error: "Contraseña incorrecta" });

    res.json({ message: "✅ Login correcto", user: { ...user, id: user.id } });
  } catch {
    res.status(500).json({ error: "Error en la base de datos" });
  }
});

// Actualizar usuario
app.put("/updateUser/:id", async (req, res) => {
  const { id } = req.params;
  let { nombre, apellidopaterno, apellidomaterno, usuario, email, password, tipo, codigo } = req.body;

  try {
    const user = db.prepare("SELECT * FROM usuarios WHERE id = ?").get(id);
    if (!user) return res.status(404).json({ error: "Usuario no encontrado" });

    const hashedPassword = password?.trim()
      ? await bcrypt.hash(password, 10)
      : user.password;

    const stmt = db.prepare(`
      UPDATE usuarios SET
        nombre = ?, apellidopaterno = ?, apellidomaterno = ?, usuario = ?,
        email = ?, password = ?, tipo = ?, codigo = ?
      WHERE id = ?
    `);

    stmt.run(
      nombre?.trim() || user.nombre,
      apellidopaterno?.trim() || user.apellidopaterno,
      apellidomaterno?.trim() || user.apellidomaterno,
      usuario?.trim().toLowerCase() || user.usuario,
      email?.trim() || user.email,
      hashedPassword,
      tipo?.trim() || user.tipo,
      codigo?.trim() || user.codigo,
      id
    );

    res.json({ message: "✅ Usuario actualizado correctamente" });
  } catch {
    res.status(500).json({ error: "Error al actualizar usuario" });
  }
});

// Eliminar usuario
app.delete("/deleteUser/:id", (req, res) => {
  try {
    const result = db.prepare("DELETE FROM usuarios WHERE id = ?").run(req.params.id);
    if (!result.changes) return res.status(404).json({ error: "Usuario no encontrado" });
    res.json({ message: "✅ Usuario eliminado correctamente" });
  } catch {
    res.status(500).json({ error: "Error al eliminar usuario" });
  }
});
// ================== ENDPOINTS REPORTES ==================

// 🩺 ENVIAR REPORTE (desde Enfermera.jsx)
// ================== ENDPOINT REPORTES (con notificación push) ==================
app.post("/api/reportes", upload.single("foto"), async (req, res) => {
  try {
    const { id_enfermera, nombre_enfermera, equipo, descripcion } = req.body;
    const foto = req.file ? `/uploads/${req.file.filename}` : null;

    // Guardar reporte en BD
    db.prepare(`
      INSERT INTO reportes (id_enfermera, nombre_enfermera, equipo, descripcion, foto, estado)
      VALUES (?, ?, ?, ?, ?, 'pendiente')
    `).run(id_enfermera, nombre_enfermera, equipo, descripcion, foto);

    // Crear notificación interna
    const mensaje = `La enfermera ${nombre_enfermera} reportó un problema en ${equipo}`;
    db.prepare(`
      INSERT INTO notificaciones (mensaje, rol_destino, estado)
      VALUES (?, 'biomedico', 'no_leido')
    `).run(mensaje);

    // 📢 Enviar notificación push a todos los suscritos
try {
// 1. Buscar solo las suscripciones de los 'biomedico'
const suscripcionesBiomedico = db.prepare(`
  SELECT s.subscription_json, s.endpoint
  FROM suscripciones_push s
  JOIN usuarios u ON s.usuario_id = u.id
  WHERE u.tipo = 'biomedico'
`).all();

  if (suscripcionesBiomedico.length > 0) {
    const payload = JSON.stringify({
      title: "🚨 Nuevo reporte de enfermería",
      body: `La enfermera ${nombre_enfermera} reportó un problema en ${equipo}`,
      icon: "/icons/icon-192.png",
      vibrate: [200, 100, 200, 100, 300],
      url: "/biomedico",
    });
// 2. Enviar notificaciones
await Promise.all(
  suscripcionesBiomedico.map((row) => {
    // 🔹 PARSEAR el JSON string → objeto
    const sub = JSON.parse(row.subscription_json);
    
    return webpush.sendNotification(sub, payload).catch((err) => {
      if (err.statusCode === 410 || err.statusCode === 404) {
        console.log("🗑️ Eliminando suscripción inválida");
        // 🔹 Usar el endpoint de 'row' (string), no de 'sub'
        db.prepare(
          "DELETE FROM suscripciones_push WHERE endpoint = ?"
        ).run(row.endpoint); // ⬅️ Correcto
      } else {
        console.error("❌ Error push:", err);
      }
    });
  })
);
  }
} catch (pushError) {
  console.error("❌ Error en la lógica de envío push:", pushError);
}

    res.json({ success: true, message: "✅ Reporte guardado y notificación enviada" });
  } catch (error) {
    console.error("❌ Error al guardar reporte:", error);
    res.status(500).json({ error: "Error al guardar el reporte" });
  }
});


// 📋 HISTORIAL DE REPORTES DE UNA ENFERMERA
app.get("/api/reportes/enfermera/:id", (req, res) => {
  try {
    const { id } = req.params;
    const reportes = db
      .prepare("SELECT * FROM reportes WHERE id_enfermera = ? ORDER BY fecha DESC")
      .all(id);
    res.json(reportes);
  } catch (error) {
    console.error("❌ Error al obtener reportes:", error);
    res.status(500).json({ error: "Error al obtener reportes" });
  }
});

// ================== ENDPOINTS NOTIFICACIONES ==================

// 🔔 OBTENER NOTIFICACIONES POR ROL
app.get("/api/notificaciones", (req, res) => {
  try {
    const { rol } = req.query;
    const result = db
      .prepare("SELECT * FROM notificaciones WHERE rol_destino = ? ORDER BY fecha DESC")
      .all(rol);
    res.json(result);
  } catch (error) {
    console.error("❌ Error al obtener notificaciones:", error);
    res.status(500).json({ error: "Error al obtener notificaciones" });
  }
});

// 🔔 MARCAR NOTIFICACIÓN COMO LEÍDA
app.put("/api/notificaciones/:id/leida", (req, res) => {
  try {
    const { id } = req.params;
    db.prepare("UPDATE notificaciones SET estado = 'leido' WHERE id = ?").run(id);
    res.json({ success: true });
  } catch (error) {
    console.error("❌ Error al marcar notificación:", error);
    res.status(500).json({ error: "Error al actualizar notificación" });
  }
}); 
// ================== ENDPOINTS SENSORES (SIN PESO) ==================

app.post("/api/sensores", async (req, res) => {
  try {
    const { device, temperatura, humedad, ambtemp, objtemp } = req.body;

    // 1. Guardar en la base de datos (sin peso)
    const stmt = db.prepare(`
      INSERT INTO sensores (device, temperatura, humedad, ambtemp, objtemp)
      VALUES (?, ?, ?, ?, ?)
    `);
    const info = stmt.run(device, temperatura, humedad, ambtemp, objtemp);

    // 2. 🚨 Detectar condiciones críticas
    let alertas = [];
    if (temperatura > 37.5) {
      alertas.push(`Temp. externa alta: ${temperatura.toFixed(1)} °C`);
    }
    if (humedad < 40) {
      alertas.push(`Humedad baja: ${humedad.toFixed(1)} %`);
    }
    if (objtemp > 37.5) {
      alertas.push(`Temp. paciente alta: ${objtemp.toFixed(1)} °C`);
    }

    // 3. Si hay alertas → Enviar notificación push (LEYENDO DE LA BD)
    if (alertas.length > 0) {
      
      // 3.1. Buscar solo suscripciones de 'biomedico'
      const suscripcionesBiomedico = db.prepare(`
        SELECT s.subscription_json, s.endpoint
        FROM suscripciones_push s
        JOIN usuarios u ON s.usuario_id = u.id
        WHERE u.tipo = 'biomedico'
      `).all();

      if (suscripcionesBiomedico.length > 0) {
        const payload = JSON.stringify({
          title: "⚠️ Alerta Monutin",
          body: alertas.join(" | "),
        });

        // 3.2. Enviar a todos los biomédicos suscritos
        await Promise.all(
          suscripcionesBiomedico.map((row) => {
            const sub = JSON.parse(row.subscription_json); // Convertir de texto a objeto
            
            return webpush.sendNotification(sub, payload).catch((err) => {
              
              // 3.3. Si falla (410 o 404), borra la suscripción de la BD
              if (err.statusCode === 410 || err.statusCode === 404) {
                console.log("🗑️ Eliminando suscripción inválida de la BD (desde sensores)");
                db.prepare(
                  "DELETE FROM suscripciones_push WHERE endpoint = ?"
                ).run(row.endpoint);
              } else {
                console.error("❌ Error push (sensores):", err);
              }
            });
          })
        );
        console.log("📢 Notificación automática enviada:", alertas.join(" | "));
      }
    }

    // Respuesta normal
    res.json({ message: "✅ Datos guardados y analizados", id: info.lastInsertRowid });
  
  } catch (err) {
    console.error("❌ Error en /api/sensores:", err);
    res.status(500).json({ error: "Error al guardar datos de sensor" });
  }
});

app.get("/api/sensores", (_, res) => {
  try {
    const rows = db.prepare("SELECT * FROM sensores ORDER BY fecha DESC LIMIT 20").all();
    res.json(rows);
  } catch {
    res.status(500).json({ error: "Error al consultar sensores" });
  }
});
// ================== NUEVO ENDPOINT: LISTAR EQUIPOS ==================
app.get("/api/equipos", (req, res) => {
  try {
    const rows = db.prepare(`
      SELECT 
        id,
        nombre_equipo,
        marca,
        modelo,
        serie,
        servicio,
        ubicacion,
        datos_tecnicos,
        accesorios,
        imagen_base64
      FROM fichas_tecnicas
      ORDER BY fecha_registro DESC
    `).all();

    // Convertir campos JSON a objetos reales
    const equipos = rows.map(eq => ({
      ...eq,
      datos_tecnicos: JSON.parse(eq.datos_tecnicos || "[]"),
      accesorios: JSON.parse(eq.accesorios || "[]")
    }));

    res.json(equipos);
  } catch (err) {
    console.error("❌ Error al obtener equipos:", err);
    res.status(500).json({ error: "Error al consultar equipos" });
  }
});
// ================== ENDPOINTS FICHAS TÉCNICAS (Añadir esto) ==================

// 🔹 Obtener una ficha específica por ID (para el PDF)
app.get("/api/fichatecnica/:id", (req, res) => {
  try {
    const { id } = req.params;
    const row = db.prepare("SELECT * FROM fichas_tecnicas WHERE id = ?").get(id);

    if (!row) {
      return res.status(404).json({ error: "Ficha técnica no encontrada" });
    }
    
    // Convertir campos JSON a objetos
    const ficha = {
      ...row,
      datos_tecnicos: JSON.parse(row.datos_tecnicos || "[]"),
      accesorios: JSON.parse(row.accesorios || "[]"),
      observaciones: JSON.parse(row.observaciones || "[]"),
    };

    res.json(ficha);
  } catch (err) {
    console.error("❌ Error al obtener ficha:", err);
    res.status(500).json({ error: "Error al consultar ficha técnica" });
  }
});


// 🔹 Generar y descargar PDF de una ficha técnica
// 🔹 Generar y descargar PDF de una ficha técnica (VERSIÓN MEJORADA)
app.get("/api/fichatecnica/:id/pdf", (req, res) => {
  try {
    const { id } = req.params;
    const ficha = db.prepare("SELECT * FROM fichas_tecnicas WHERE id = ?").get(id);
    
    if (!ficha) {
      return res.status(404).send("Ficha no encontrada");
    }

    // Parsear datos JSON
    const datosTecnicos = JSON.parse(ficha.datos_tecnicos || "[]");
    const accesorios = JSON.parse(ficha.accesorios || "[]");
    const observaciones = JSON.parse(ficha.observaciones || "[]");

    // Configurar PDFKit
    const doc = new PDFDocument({ 
      margin: 40, 
      size: 'A4',
      bufferPages: true
    });

    // Configurar cabeceras
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=Ficha_Tecnica_${ficha.codigo || id}.pdf`);

    doc.pipe(res);

    // ==================== ENCABEZADO ====================
    const headerHeight = 80;
    
    // Rectángulo azul para el encabezado
    doc.rect(40, 40, 515, headerHeight)
       .fillAndStroke('#1e3a8a', '#1e3a8a');

    // Título en blanco
    doc.fontSize(22)
       .fillColor('#ffffff')
       .font('Helvetica-Bold')
       .text('FICHA TÉCNICA DE EQUIPO MEDICO', 50, 65, { align: 'left' });

    // Logo/Nombre empresa (esquina derecha)
    doc.fontSize(16)
       .fillColor('#ffffff')
       .font('Helvetica-Bold')
       .text('MONUTIN', 450, 65)
       .fontSize(10)
       .font('Helvetica')
       .text('ENGINEERING', 450, 85);

    doc.fillColor('#000000'); // Resetear color

    let yPosition = headerHeight + 60;

    // ==================== INFORMACIÓN PRINCIPAL ====================
    // Tabla de información básica
    const drawInfoTable = (y) => {
      const cellHeight = 25;
      const col1Width = 130;
      const col2Width = 180;
      const col3Width = 130;
      const col4Width = 75;

      // Fila 1: REALIZADO POR y FECHA
      doc.rect(40, y, col1Width, cellHeight).stroke();
      doc.rect(40 + col1Width, y, col2Width, cellHeight).stroke();
      doc.rect(40 + col1Width + col2Width, y, col3Width, cellHeight).stroke();
      doc.rect(40 + col1Width + col2Width + col3Width, y, col4Width, cellHeight).stroke();

      doc.fontSize(9).font('Helvetica-Bold')
         .text('REALIZADO POR:', 45, y + 8);
      doc.fontSize(10).font('Helvetica')
         .text(ficha.elaborado_por || 'N/A', 45 + col1Width, y + 8);
      
      doc.fontSize(9).font('Helvetica-Bold')
         .text('Fecha:', 45 + col1Width + col2Width, y + 8);
      doc.fontSize(10).font('Helvetica')
         .text(ficha.fecha_compra || new Date().toLocaleDateString('es-ES'), 45 + col1Width + col2Width + col3Width, y + 8);

      y += cellHeight;

      // Fila 2: MÁQUINA-EQUIPO y UBICACIÓN
      doc.rect(40, y, col1Width, cellHeight).stroke();
      doc.rect(40 + col1Width, y, col2Width, cellHeight).stroke();
      doc.rect(40 + col1Width + col2Width, y, col3Width, cellHeight).stroke();
      doc.rect(40 + col1Width + col2Width + col3Width, y, col4Width, cellHeight).stroke();

      doc.fontSize(9).font('Helvetica-Bold')
         .text('EQUIPO', 45, y + 8);
      doc.fontSize(10).font('Helvetica')
         .text(ficha.nombre_equipo || 'N/A', 45 + col1Width, y + 8);
      
      doc.fontSize(9).font('Helvetica-Bold')
         .text('UBICACIÓN', 45 + col1Width + col2Width, y + 8);
      doc.fontSize(10).font('Helvetica')
         .text(ficha.ubicacion || 'N/A', 45 + col1Width + col2Width + col3Width, y + 8);

      y += cellHeight;

      // Fila 3: FABRICANTE y SECCIÓN
      doc.rect(40, y, col1Width, cellHeight).stroke();
      doc.rect(40 + col1Width, y, col2Width, cellHeight).stroke();
      doc.rect(40 + col1Width + col2Width, y, col3Width, cellHeight).stroke();
      doc.rect(40 + col1Width + col2Width + col3Width, y, col4Width, cellHeight).stroke();

      doc.fontSize(9).font('Helvetica-Bold')
         .text('FABRICANTE', 45, y + 8);
      doc.fontSize(10).font('Helvetica')
         .text(ficha.marca || 'N/A', 45 + col1Width, y + 8);
      
      doc.fontSize(9).font('Helvetica-Bold')
         .text('SECCIÓN', 45 + col1Width + col2Width, y + 8);
      doc.fontSize(10).font('Helvetica')
         .text(ficha.servicio || 'N/A', 45 + col1Width + col2Width + col3Width, y + 8);

      y += cellHeight;

      // Fila 4: MODELO y CÓDIGO INVENTARIO
      doc.rect(40, y, col1Width, cellHeight).stroke();
      doc.rect(40 + col1Width, y, col2Width, cellHeight).stroke();
      doc.rect(40 + col1Width + col2Width, y, col3Width, cellHeight).stroke();
      doc.rect(40 + col1Width + col2Width + col3Width, y, col4Width, cellHeight).stroke();

      doc.fontSize(9).font('Helvetica-Bold')
         .text('MODELO', 45, y + 8);
      doc.fontSize(10).font('Helvetica')
         .text(ficha.modelo || 'N/A', 45 + col1Width, y + 8);
      
      doc.fontSize(9).font('Helvetica-Bold')
         .text('CÓDIGO INVENTARIO', 45 + col1Width + col2Width, y + 8);
      doc.fontSize(10).font('Helvetica')
         .text(ficha.codigo || 'N/A', 45 + col1Width + col2Width + col3Width, y + 8);

      return y + cellHeight;
    };

    yPosition = drawInfoTable(yPosition);
    yPosition += 20;

    // ==================== CARACTERÍSTICAS GENERALES ====================
    doc.fontSize(11).font('Helvetica-Bold')
       .fillColor('#1e3a8a')
       .text('CARACTERÍSTICAS GENERALES', 40, yPosition);
    
    yPosition += 25;

    // Tabla de dimensiones
    const dimHeight = 30;
    const dimCellWidth = 515 / 6;

    // Encabezados
    doc.rect(40, yPosition, dimCellWidth, dimHeight).fillAndStroke('#e5e7eb', '#000000');
    doc.rect(40 + dimCellWidth, yPosition, dimCellWidth, dimHeight).fillAndStroke('#ffffff', '#000000');
    doc.rect(40 + dimCellWidth * 2, yPosition, dimCellWidth, dimHeight).fillAndStroke('#e5e7eb', '#000000');
    doc.rect(40 + dimCellWidth * 3, yPosition, dimCellWidth, dimHeight).fillAndStroke('#ffffff', '#000000');
    doc.rect(40 + dimCellWidth * 4, yPosition, dimCellWidth, dimHeight).fillAndStroke('#e5e7eb', '#000000');
    doc.rect(40 + dimCellWidth * 5, yPosition, dimCellWidth, dimHeight).fillAndStroke('#ffffff', '#000000');

    doc.fontSize(9).font('Helvetica-Bold').fillColor('#000000')
       .text('PESO', 45, yPosition + 10)
       .text('XXX', 45 + dimCellWidth + 20, yPosition + 10)
       .text('ALTURA', 45 + dimCellWidth * 2 + 10, yPosition + 10)
       .text('XXX mm', 45 + dimCellWidth * 3 + 15, yPosition + 10)
       .text('ANCHO', 45 + dimCellWidth * 4 + 10, yPosition + 10)
       .text('XXX mm', 45 + dimCellWidth * 5 + 15, yPosition + 10);

    yPosition += dimHeight + 20;

    // ==================== SECCIÓN CON IMAGEN Y DATOS TÉCNICOS ====================
    const sectionY = yPosition;
    const imageWidth = 200;
    const textColumnX = 60 + imageWidth;

    // Título de sección
    doc.fontSize(11).font('Helvetica-Bold')
       .fillColor('#1e3a8a')
       .text('CARACTERÍSTICAS TÉCNICAS', 40, yPosition);

    yPosition += 25;

    // Dibujar borde de la sección
    const sectionHeight = 250;
    doc.rect(40, yPosition, 515, sectionHeight).stroke();

    // Insertar imagen si existe
    if (ficha.imagen_base64) {
      try {
        const imageBuffer = Buffer.from(ficha.imagen_base64.replace(/^data:image\/\w+;base64,/, ""), 'base64');
        doc.image(imageBuffer, 300, yPosition + 20, { 
          width: 180,
          height: 200,
          align: 'center'
        });
      } catch (err) {
        console.error("Error insertando imagen:", err);
      }
    }

    // Datos técnicos (columna izquierda)
    let textY = yPosition + 20;
    doc.fontSize(10).font('Helvetica-Bold').fillColor('#000000')
       .text('Especificaciones:', 50, textY);
    
    textY += 20;
    doc.fontSize(9).font('Helvetica');

    if (datosTecnicos.length > 0) {
      datosTecnicos.slice(0, 6).forEach(dt => {
        doc.text(`• ${dt.funcion || 'Dato'}: ${dt.info || 'N/A'}`, 50, textY, {
          width: 220
        });
        textY += 20;
      });
    } else {
      doc.text('No hay datos técnicos registrados.', 50, textY);
    }

    yPosition += sectionHeight + 20;

    // ==================== FUNCIÓN ====================
    doc.fontSize(11).font('Helvetica-Bold')
       .fillColor('#1e3a8a')
       .text('FUNCIÓN', 40, yPosition);
    
    yPosition += 20;

    doc.fontSize(9).font('Helvetica').fillColor('#000000');
    const funcionTexto = observaciones.length > 0 
      ? observaciones.map(obs => `• ${obs.funcion || ''}: ${obs.info || ''}`).join('\n')
      : 'Equipo especializado para el desarrollo de operaciones técnicas.';
    
    doc.text(funcionTexto, 50, yPosition, { width: 500 });

    yPosition += 60;

    // ==================== ACCESORIOS ====================
    if (accesorios.length > 0) {
      doc.fontSize(11).font('Helvetica-Bold')
         .fillColor('#1e3a8a')
         .text('ACCESORIOS', 40, yPosition);
      
      yPosition += 20;
      doc.fontSize(9).font('Helvetica').fillColor('#000000');
      
      accesorios.forEach(acc => {
        doc.text(`• ${acc.funcion || 'Accesorio'}: ${acc.info || 'N/A'}`, 50, yPosition);
        yPosition += 15;
      });

      yPosition += 10;
    }

    // ==================== FECHA DE MANTENIMIENTO ====================
    doc.fontSize(10).font('Helvetica-Bold')
       .fillColor('#000000')
       .text(`FECHA DE MANTENIMIENTO: ${ficha.frecuencia || 'N/A'}`, 40, yPosition);

    // Finalizar PDF
    doc.end();
    console.log(`✅ PDF generado para Ficha ID: ${id}`);
    
  } catch (err) {
    console.error("❌ Error generando PDF:", err);
    res.status(500).send("Error al generar el PDF");
  }
});

// ================== ENDPOINTS FICHAS TÉCNICAS ==================
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
    nombreEquipo,
    marca,
    modelo,
    serie,
    codigo,
    servicio,
    ubicacion,
    garantia,
    procedencia,
    fechaCompra
  } = req.body;

  try {
    let proveedor_id = null;
    if (proveedor?.nombre) {
      const existente = db.prepare("SELECT id FROM proveedores WHERE nombre = ?").get(proveedor.nombre);
      if (existente) proveedor_id = existente.id;
      else {
        const infoProv = db.prepare(
          "INSERT INTO proveedores (nombre, direccion, telefono, correo) VALUES (?, ?, ?, ?)"
        ).run(proveedor.nombre, proveedor.direccion || "", proveedor.telefono || "", proveedor.correo || "");
        proveedor_id = infoProv.lastInsertRowid;
      }
    }

    const stmt = db.prepare(`
      INSERT INTO fichas_tecnicas (
        proveedor_id, nombre_equipo, marca, modelo, serie, codigo, servicio, ubicacion,
        garantia, procedencia, fecha_compra,
        datos_tecnicos, accesorios, observaciones,
        manual_operacion, manual_instalacion, manual_servicio,
        estado_nuevo, estado_bueno, estado_reparable, estado_descartable,
        frecuencia, elaborado_por, imagen_base64
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const info = stmt.run(
      proveedor_id,
      nombreEquipo || "",
      marca || "",
      modelo || "",
      serie || "",
      codigo || "",
      servicio || "",
      ubicacion || "",
      garantia || "",
      procedencia || "",
      fechaCompra || "",
      JSON.stringify(datosTecnicos || []),
      JSON.stringify(accesorios || []),
      JSON.stringify(observaciones || []),
      manuales?.operacion || "",
      manuales?.instalacion || "",
      manuales?.servicio || "",
      estado?.nuevo ? 1 : 0,
      estado?.bueno ? 1 : 0,
      estado?.reparable ? 1 : 0,
      estado?.descartable ? 1 : 0,
      frecuencia || "",
      nombreElaboracion || "",
      imagenBase64 || null
    );

    res.json({ message: "✅ Ficha técnica guardada", id: info.lastInsertRowid });
  } catch (err) {
    console.error("❌ Error:", err);
    res.status(500).json({ error: "Error al guardar ficha técnica" });
  }
});

// ================== ACTUALIZAR ESTADO DEL EQUIPO ==================
app.put("/api/equipos/:id", (req, res) => {
  const { id } = req.params;
  const { estado } = req.body;

  try {
    // ✅ Buscar en la tabla correcta
    const equipoExistente = db.prepare("SELECT * FROM fichas_tecnicas WHERE id = ?").get(id);
    if (!equipoExistente) {
      return res.status(404).json({ error: "Equipo no encontrado" });
    }

    // ✅ Actualizar estado textual
    const stmt = db.prepare("UPDATE fichas_tecnicas SET estado = ? WHERE id = ?");
    stmt.run(estado, id);

    console.log(`✅ Estado del equipo ID ${id} actualizado a "${estado}"`);
    res.json({ success: true, message: "Estado actualizado correctamente", estado });
  } catch (error) {
    console.error("❌ Error al actualizar estado del equipo:", error);
    res.status(500).json({ error: "Error al actualizar estado del equipo" });
  }
});

// ================== ROOT ==================
app.get("/", (_, res) => res.send("🚀 Backend Monutin activo en Railway (better-sqlite3)"));

// ================== NOTIFICACIONES PUSH (PWA) ==================
import webpush from "web-push";

// 🗝️ Claves VAPID generadas (NO cambian nunca)
const VAPID_PUBLIC_KEY = "BPa9Ypp_D-5nqP2NvdMWAlJvz5z9IpZHHFUZdtVRDgf4Grx1Txr4h8Bzi1ljCimbK2zFgnqfkZ6VaPLHf7dwA3M";
const VAPID_PRIVATE_KEY = "srq_Qj913_ClF6bNbK5mDksxim_Nhc0upRHjMVNOFYw";

// Configurar servicio web-push
webpush.setVapidDetails(
  "mailto:monutin@soporte.com",
  VAPID_PUBLIC_KEY,
  VAPID_PRIVATE_KEY
);

// 📡 Base en memoria para suscripciones (puedes guardar en SQLite más adelante)
let suscripciones = [];

// Endpoint para registrar suscripciones
app.post("/api/suscribir", (req, res) => {
try {
    // --- NUEVO LOG PARA DEPURAR ---
    console.log("--- NUEVA SOLICITUD A /api/suscribir ---");
    console.log("BODY RECIBIDO:", JSON.stringify(req.body, null, 2));
    // ---------------------------------

    const { subscription, usuario_id } = req.body;

    // 1. Validar que la suscripción es correcta
    if (!subscription || !subscription.endpoint) {
      console.error("❌ Suscripción inválida recibida:", req.body);
      return res.status(400).json({ error: "Suscripción inválida" });
    }

    // 2. Extraer los datos
    const endpoint = subscription.endpoint;
    const sub_json = JSON.stringify(subscription);

    // 3. Usar "INSERT ... ON CONFLICT"
    // Esto inserta solo si el 'endpoint' (que es UNIQUE) no existe.
    // Es mucho más seguro y rápido que un SELECT + INSERT.
    const stmt = db.prepare(`
      INSERT INTO suscripciones_push (endpoint, subscription_json, usuario_id)
      VALUES (?, ?, ?)
      ON CONFLICT(endpoint) DO NOTHING
    `);
    
    const info = stmt.run(endpoint, sub_json, usuario_id);

    if (info.changes > 0) {
      console.log("✅ Suscripción guardada en BD:", endpoint);
    } else {
      console.log("ℹ️ Suscripción ya existía:", endpoint);
    }

    res.status(201).json({ message: "Suscripción registrada" });

  } catch (err) {
    console.error("❌ Error al guardar suscripción:", err.message);
    res.status(500).json({ error: "Error guardando suscripción", details: err.message });
  }
});

// Endpoint manual para enviar notificación (por si la necesitas probar)
app.post("/api/notificar", async (req, res) => {
  const { title, body } = req.body;
  const payload = JSON.stringify({ title, body });

  try {
    await Promise.all(suscripciones.map((sub) => webpush.sendNotification(sub, payload)));
    console.log("📨 Notificaciones enviadas manualmente");
    res.json({ message: "Notificaciones enviadas correctamente" });
  } catch (err) {
    console.error("❌ Error al enviar notificación:", err);
    res.status(500).json({ error: "Error enviando notificaciones" });
  }
});
// ================== ENDPOINTS PROVEEDORES ==================

// Listar proveedores
app.get("/api/proveedores", (req, res) => {
  try {
    const rows = db.prepare("SELECT * FROM proveedores ORDER BY id DESC").all();
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: "Error al obtener proveedores" });
  }
});

// Agregar nuevo proveedor
app.post("/api/proveedores", (req, res) => {
  try {
    const { nombre, direccion, telefono, correo } = req.body;
    const stmt = db.prepare("INSERT INTO proveedores (nombre, direccion, telefono, correo) VALUES (?, ?, ?, ?)");
    const info = stmt.run(nombre, direccion || "", telefono || "", correo || "");
    res.json({ message: "✅ Proveedor registrado", id: info.lastInsertRowid });
  } catch (err) {
    res.status(500).json({ error: "Error al registrar proveedor" });
  }
});

// Eliminar proveedor
app.delete("/api/proveedores/:id", (req, res) => {
  try {
    const { id } = req.params;
    const result = db.prepare("DELETE FROM proveedores WHERE id = ?").run(id);
    if (!result.changes) return res.status(404).json({ error: "Proveedor no encontrado" });
    res.json({ message: "🗑️ Proveedor eliminado correctamente" });
  } catch {
    res.status(500).json({ error: "Error al eliminar proveedor" });
  }
});

// ================== SERVIDOR ==================
app.listen(PORT, "0.0.0.0", () => console.log(`🚀 Servidor corriendo en puerto ${PORT}`));