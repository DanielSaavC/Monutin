const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const cors = require("cors");
const bodyParser = require("body-parser");

const app = express();
const PORT = process.env.PORT || 4000; // 🔹 Render asigna el puerto

// Middlewares
app.use(cors());
app.use(bodyParser.json());

// Conexión a la base de datos SQLite
const db = new sqlite3.Database("./database.db", (err) => {
  if (err) {
    console.error("Error al conectar con SQLite:", err);
  } else {
    console.log("Conectado a SQLite ✅");
  }
});

// Crear tabla usuarios si no existe
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
const bcrypt = require("bcrypt");

// Registro con contraseña encriptada
app.post("/register", async (req, res) => {
  const { nickname, password, email, tipo, codigo } = req.body;

  const hashedPassword = await bcrypt.hash(password, 10);

  db.run(
    `INSERT INTO usuarios (nickname, password, email, tipo, codigo) VALUES (?, ?, ?, ?, ?)`,
    [nickname, hashedPassword, email, tipo, codigo || null],
    function (err) {
      if (err) {
        res.status(500).json({ error: "Error al registrar usuario" });
      } else {
        res.json({ message: "Usuario registrado ✅", id: this.lastID });
      }
    }
  );
});

// Login verificando hash
app.post("/login", (req, res) => {
  const { nickname, password } = req.body;

  db.get(`SELECT * FROM usuarios WHERE nickname = ?`, [nickname], async (err, row) => {
    if (err) {
      res.status(500).json({ error: "Error en login" });
    } else if (row && (await bcrypt.compare(password, row.password))) {
      res.json({ message: "Login correcto ✅", user: row });
    } else {
      res.status(401).json({ error: "Usuario o contraseña incorrectos" });
    }
  });
});


app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});
