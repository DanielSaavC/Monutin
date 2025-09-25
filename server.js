const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const cors = require("cors");
const bodyParser = require("body-parser");

const app = express();
const PORT = 4000;

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

// Ruta para registrar usuario
app.post("/register", (req, res) => {
  const { nickname, password, email, tipo, codigo } = req.body;

  db.run(
    `INSERT INTO usuarios (nickname, password, email, tipo, codigo) VALUES (?, ?, ?, ?, ?)`,
    [nickname, password, email, tipo, codigo || null],
    function (err) {
      if (err) {
        res.status(500).json({ error: "Error al registrar usuario" });
      } else {
        res.json({ message: "Usuario registrado ✅", id: this.lastID });
      }
    }
  );
});

// Ruta para login
app.post("/login", (req, res) => {
  const { nickname, password } = req.body;

  db.get(
    `SELECT * FROM usuarios WHERE nickname = ? AND password = ?`,
    [nickname, password],
    (err, row) => {
      if (err) {
        res.status(500).json({ error: "Error en login" });
      } else if (row) {
        res.json({ message: "Login correcto ✅", user: row });
      } else {
        res.status(401).json({ error: "Usuario o contraseña incorrectos" });
      }
    }
  );
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
