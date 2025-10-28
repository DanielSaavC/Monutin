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
    peso REAL,
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
  )`
];
crearTablas.forEach(sql => db.prepare(sql).run());
console.log("✅ Tablas listas");

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

// 🔹 Eliminar un equipo del seguimiento
app.delete("/api/seguimiento", (req, res) => {
  const { usuario_id, equipo_id } = req.body;

  try {
    const result = db.prepare(`
      DELETE FROM seguimiento WHERE usuario_id = ? AND equipo_id = ?
    `).run(usuario_id, equipo_id);

    if (!result.changes)
      return res.status(404).json({ error: "No estaba en seguimiento" });

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

// ================== ENDPOINTS USUARIOS ==================

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

// ================== ENDPOINTS SENSORES ==================
app.post("/api/sensores", (req, res) => {
  try {
    const { device, temperatura, humedad, ambtemp, objtemp, peso } = req.body;
    const stmt = db.prepare(`
      INSERT INTO sensores (device, temperatura, humedad, ambtemp, objtemp, peso)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    const info = stmt.run(device, temperatura, humedad, ambtemp, objtemp, peso);
    res.json({ message: "✅ Datos guardados", id: info.lastInsertRowid });
  } catch {
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
  const subscription = req.body;
  // Evita duplicados
  const existe = suscripciones.find((s) => s.endpoint === subscription.endpoint);
  if (!existe) suscripciones.push(subscription);
  console.log("✅ Suscripción guardada:", subscription.endpoint);
  res.status(201).json({ message: "Suscripción registrada correctamente" });
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

// ================== ALERTAS AUTOMÁTICAS SEGÚN SENSORES ==================
// Cuando llega un nuevo dato del sensor, verificamos si hay valores críticos.
const oldPostSensor = app._router.stack.find(r => r.route && r.route.path === "/api/sensores")?.route.stack[0].handle;

app.post("/api/sensores", async (req, res) => {
  try {
    const { device, temperatura, humedad, ambtemp, objtemp, peso } = req.body;

    // Guardar en la base de datos (igual que antes)
    const stmt = db.prepare(`
      INSERT INTO sensores (device, temperatura, humedad, ambtemp, objtemp, peso)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    const info = stmt.run(device, temperatura, humedad, ambtemp, objtemp, peso);

    // 🚨 Detectar condiciones críticas
    let alertas = [];

    if (temperatura > 37.5) {
      alertas.push(`Temperatura externa elevada: ${temperatura.toFixed(1)} °C`);
    }
    if (humedad < 40) {
      alertas.push(`Humedad baja: ${humedad.toFixed(1)} %`);
    }
    if (objtemp > 37.5) {
      alertas.push(`Temperatura del paciente elevada: ${objtemp.toFixed(1)} °C`);
    }

    // Si hay alertas → enviar notificación push
    if (alertas.length > 0 && suscripciones.length > 0) {
      const payload = JSON.stringify({
        title: "⚠️ Alerta Monutin",
        body: alertas.join(" | "),
      });

      await Promise.all(
        suscripciones.map((sub) =>
          webpush.sendNotification(sub, payload).catch((err) => {
            if (err.statusCode === 410 || err.statusCode === 404) {
              console.log("🗑️ Eliminando suscripción inválida");
              suscripciones = suscripciones.filter((s) => s.endpoint !== sub.endpoint);
            } else {
              console.error("❌ Error push:", err);
            }
          })
        )
      );

      console.log("📢 Notificación automática enviada:", alertas.join(" | "));
    }

    // Respuesta normal
    res.json({ message: "✅ Datos guardados y analizados", id: info.lastInsertRowid });
  } catch (err) {
    console.error("❌ Error en /api/sensores:", err);
    res.status(500).json({ error: "Error al guardar datos de sensor" });
  }
});
// ================== SERVIDOR ==================
app.listen(PORT, "0.0.0.0", () => console.log(`🚀 Servidor corriendo en puerto ${PORT}`));
// ================== GENERAR PDF DE FICHA TÉCNICA ==================
app.post("/api/fichatecnica/pdf", async (req, res) => {
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

  const doc = new PDFDocument({
    size: "LETTER",
    margin: 40,
  });

  doc.pipe(res);

  try {
    // === LOGO Y ENCABEZADO ===
    const logoPath = path.join(process.cwd(), "HOSP.png");
    if (fs.existsSync(logoPath)) {
      doc.image(logoPath, 450, 30, { width: 90 });
    }

    doc
      .font("Helvetica-Bold")
      .fontSize(16)
      .text("FICHA TÉCNICA DEL EQUIPO MÉDICO", { align: "center" });
    doc.font("Helvetica").fontSize(12).text("HOSPITAL UNIVALLE", { align: "center" });
    doc.moveDown(1.5);

    // ====== SEPARADOR VISUAL ======
    doc
      .moveTo(40, doc.y)
      .lineTo(570, doc.y)
      .strokeColor("#00796B")
      .lineWidth(2)
      .stroke();
    doc.moveDown(1.5);

    // === 1️⃣ DATOS GENERALES DEL EQUIPO ===
    doc.font("Helvetica-Bold").fontSize(13).fillColor("#00796B").text("1. DATOS GENERALES DEL EQUIPO");
    doc.moveDown(0.5);
    doc.font("Helvetica").fillColor("black").fontSize(10);

    const datosGenerales = [
      ["Equipo", req.body.nombreEquipo],
      ["Marca", req.body.marca],
      ["Modelo", req.body.modelo],
      ["Serie", req.body.serie],
      ["Código", req.body.codigo],
      ["Servicio", req.body.servicio],
      ["Ubicación", req.body.ubicacion],
      ["Garantía", req.body.garantia],
      ["Procedencia", req.body.procedencia],
      ["Fecha de compra", req.body.fechaCompra],
    ];

    datosGenerales.forEach(([campo, valor]) => {
      doc.text(`${campo}: `, { continued: true }).font("Helvetica-Bold").text(valor || "N/A");
      doc.font("Helvetica");
    });

    doc.moveDown(1);

    // === 2️⃣ DATOS DEL PROVEEDOR ===
    doc.font("Helvetica-Bold").fontSize(13).fillColor("#00796B").text("2. DATOS DEL PROVEEDOR");
    doc.moveDown(0.5);
    doc.font("Helvetica").fillColor("black");
    doc.text(`Nombre: ${proveedor?.nombre || "N/A"}`);
    doc.text(`Dirección: ${proveedor?.direccion || "N/A"}`);
    doc.text(`Teléfono: ${proveedor?.telefono || "N/A"}`);
    doc.text(`Correo: ${proveedor?.correo || "N/A"}`);
    doc.moveDown(1);

    // === 3️⃣ DATOS TÉCNICOS ===
    doc.font("Helvetica-Bold").fontSize(13).fillColor("#00796B").text("3. DATOS TÉCNICOS");
    doc.moveDown(0.5);
    doc.font("Helvetica").fillColor("black");
    if (datosTecnicos?.length) {
      datosTecnicos.forEach((dt) => doc.text(`• ${dt.funcion}: ${dt.info}`));
    } else {
      doc.text("N/A");
    }
    doc.moveDown(1);

    // === 4️⃣ IMAGEN DEL EQUIPO ===
    doc.font("Helvetica-Bold").fontSize(13).fillColor("#00796B").text("4. IMAGEN DEL EQUIPO");
    doc.moveDown(0.5);
    if (imagenBase64) {
      try {
        const imageBuffer = Buffer.from(imagenBase64.split(",")[1], "base64");
        doc.image(imageBuffer, { fit: [200, 200], align: "center", valign: "center" });
      } catch {
        doc.font("Helvetica").fillColor("black").text("⚠️ No se pudo insertar imagen.");
      }
    } else {
      doc.font("Helvetica").fillColor("black").text("Sin imagen adjunta.");
    }
    doc.moveDown(1.5);

    // === 5️⃣ ACCESORIOS ===
    doc.font("Helvetica-Bold").fontSize(13).fillColor("#00796B").text("5. ACCESORIOS");
    doc.moveDown(0.5);
    doc.font("Helvetica").fillColor("black");
    if (accesorios?.length) {
      accesorios.forEach((a) => doc.text(`• ${a.funcion}: ${a.info}`));
    } else {
      doc.text("N/A");
    }
    doc.moveDown(1);

    // === 6️⃣ MANUALES ===
    doc.font("Helvetica-Bold").fontSize(13).fillColor("#00796B").text("6. MANUALES");
    doc.moveDown(0.5);
    doc.font("Helvetica").fillColor("black");
    doc.text(
      `Operación: ${manuales?.operacion || "N/A"} | Instalación: ${manuales?.instalacion || "N/A"} | Servicio: ${manuales?.servicio || "N/A"}`
    );
    doc.moveDown(1);

    // === 7️⃣ OBSERVACIONES ===
    doc.font("Helvetica-Bold").fontSize(13).fillColor("#00796B").text("7. OBSERVACIONES");
    doc.moveDown(0.5);
    doc.font("Helvetica").fillColor("black");
    if (observaciones?.length) {
      observaciones.forEach((o) => doc.text(`• ${o.funcion}: ${o.info}`));
    } else {
      doc.text("N/A");
    }
    doc.moveDown(1);

    // === 8️⃣ ESTADO Y FRECUENCIA ===
    doc.font("Helvetica-Bold").fontSize(13).fillColor("#00796B").text("8. ESTADO Y FRECUENCIA");
    doc.moveDown(0.5);
    doc.font("Helvetica").fillColor("black");
    doc.text(
      `Nuevo: ${estado?.nuevo ? "Sí" : "No"} | Bueno: ${estado?.bueno ? "Sí" : "No"} | Reparable: ${estado?.reparable ? "Sí" : "No"} | Descartable: ${estado?.descartable ? "Sí" : "No"}`
    );
    doc.text(`Frecuencia de mantenimiento: ${frecuencia || "N/A"}`);
    doc.moveDown(1.5);

    // === 9️⃣ REGISTRO DE ELABORACIÓN ===
    doc.font("Helvetica-Bold").fontSize(13).fillColor("#00796B").text("9. REGISTRO DE ELABORACIÓN");
    doc.moveDown(0.5);
    doc.font("Helvetica").fillColor("black");
    doc.text(`Elaborado por: ${nombreElaboracion || "N/A"}`);
    doc.text(`Fecha: ${new Date().toISOString().split("T")[0]}`);
    doc.moveDown(1);
    doc.text("Firma: ___________________________");

    // === PIE DE PÁGINA ===
    doc.moveDown(2);
    doc.fontSize(8).fillColor("gray").text("Documento generado automáticamente por el sistema MONUTIN.", {
      align: "center",
    });

    doc.end();
  } catch (err) {
    console.error("❌ Error al generar PDF:", err);
    res.status(500).json({ error: "Error al generar PDF" });
  }
});
