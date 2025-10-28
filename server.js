// ================== IMPORTS ==================
import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import bcrypt from "bcrypt";
import Database from "better-sqlite3";
import path from "path";
import fs from "fs";
import PDFDocument from "pdfkit";

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

// ================== DESCARGA DIRECTA DE PDF ==================
app.post("/api/fichatecnica/pdf", (req, res) => {
  try {
    const { proveedor, datosTecnicos, accesorios, observaciones, manuales, estado, frecuencia, nombreElaboracion, imagenBase64 } = req.body;

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=FichaTecnica_${(proveedor?.nombre || "sin_nombre").replace(/\s+/g, "_")}.pdf`
    );

    const doc = new PDFDocument({ size: "LETTER", margin: 30 });
    doc.pipe(res); // 🚀 se envía directamente al navegador

    // ===== ENCABEZADO =====
    doc.font("Helvetica-Bold").fontSize(14).text("FICHA TÉCNICA", { align: "left" });
    doc.text("HOSPITAL UNIVALLE", { align: "center" });
    const logoPath = path.join(process.cwd(), "HOSP.png");
    if (fs.existsSync(logoPath)) doc.image(logoPath, 460, 30, { width: 80 });
    doc.moveDown(2);

    // ===== DATOS GENERALES DEL EQUIPO =====
    doc.font("Helvetica-Bold").fontSize(12).text("DATOS GENERALES DEL EQUIPO:");
    doc.font("Helvetica").fontSize(10);
    doc.text(`Equipo: ${req.body.nombreEquipo || "N/A"}`);
    doc.text(`Marca: ${req.body.marca || "N/A"}`);
    doc.text(`Modelo: ${req.body.modelo || "N/A"}`);
    doc.text(`Serie: ${req.body.serie || "N/A"}`);
    doc.text(`Código: ${req.body.codigo || "N/A"}`);
    doc.text(`Servicio: ${req.body.servicio || "N/A"}`);
    doc.text(`Ubicación: ${req.body.ubicacion || "N/A"}`);
    doc.text(`Garantía: ${req.body.garantia || "N/A"}`);
    doc.text(`Procedencia: ${req.body.procedencia || "N/A"}`);
    doc.text(`Fecha de compra: ${req.body.fechaCompra || "N/A"}`);
    doc.moveDown(1);

    // ===== DATOS DEL PROVEEDOR =====
    doc.font("Helvetica-Bold").fontSize(12).text("DATOS DEL PROVEEDOR:");
    doc.font("Helvetica").fontSize(10)
      .text(`Nombre: ${proveedor?.nombre || "N/A"}`)
      .text(`Dirección: ${proveedor?.direccion || "N/A"}`)
      .text(`Teléfono: ${proveedor?.telefono || "N/A"}`)
      .text(`Correo: ${proveedor?.correo || "N/A"}`);
    doc.moveDown();

    // ===== DATOS TÉCNICOS =====
    doc.font("Helvetica-Bold").text("DATOS TÉCNICOS:");
    datosTecnicos?.forEach(dt => doc.font("Helvetica").text(`• ${dt.funcion}: ${dt.info}`));
    doc.moveDown();

    // ===== IMAGEN CAPTURADA =====
    if (imagenBase64) {
      try {
        const imageBuffer = Buffer.from(imagenBase64.split(",")[1], "base64");
        doc.image(imageBuffer, { fit: [150, 150], align: "center" });
      } catch {
        doc.text("⚠️ No se pudo insertar imagen.");
      }
      doc.moveDown();
    }

    // ===== ACCESORIOS =====
    doc.font("Helvetica-Bold").text("ACCESORIOS:");
    accesorios?.forEach(a => doc.font("Helvetica").text(`• ${a.funcion}: ${a.info}`));
    doc.moveDown();

    // ===== MANUALES =====
    doc.font("Helvetica-Bold").text("MANUALES:");
    doc.font("Helvetica").text(
      `Operación: ${manuales?.operacion || "N/A"} | Instalación: ${manuales?.instalacion || "N/A"} | Servicio: ${manuales?.servicio || "N/A"}`
    );
    doc.moveDown();

    // ===== OBSERVACIONES =====
    doc.font("Helvetica-Bold").text("OBSERVACIONES:");
    observaciones?.forEach(o => doc.font("Helvetica").text(`• ${o.funcion}: ${o.info}`));
    doc.moveDown();

    // ===== ESTADO Y FRECUENCIA =====
    doc.font("Helvetica-Bold").text("ESTADO DEL EQUIPO:");
    doc.font("Helvetica").text(
      `Nuevo: ${estado?.nuevo ? "Sí" : "No"} | Bueno: ${estado?.bueno ? "Sí" : "No"} | Reparable: ${
        estado?.reparable ? "Sí" : "No"
      } | Descartable: ${estado?.descartable ? "Sí" : "No"}`
    );
    doc.moveDown();
    doc.font("Helvetica-Bold").text(`FRECUENCIA DE MANTENIMIENTO: ${frecuencia || "N/A"}`);
    doc.moveDown(2);

    // ===== ELABORACIÓN =====
    doc.font("Helvetica-Bold").text("REGISTRO DE ELABORACIÓN:");
    doc.font("Helvetica").text(`Elaborado por: ${nombreElaboracion || "N/A"}`);
    doc.text(`Fecha: ${new Date().toISOString().split("T")[0]}`);
    doc.moveDown(1);
    doc.text("Firma: ___________________________");

    doc.end(); // 🚀 Envía el PDF al navegador (sin guardarlo)
  } catch (err) {
    console.error("❌ Error al generar PDF:", err);
    res.status(500).json({ error: "Error al generar PDF" });
  }
});


// ================== ROOT ==================
app.get("/", (_, res) => res.send("🚀 Backend Monutin activo en Railway (better-sqlite3)"));
// ================== SERVIDOR ==================
app.listen(PORT, "0.0.0.0", () => console.log(`🚀 Servidor corriendo en puerto ${PORT}`));
