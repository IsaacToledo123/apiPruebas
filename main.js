const express = require("express");
const bodyParser = require("body-parser");
const mysql = require("mysql2");
const app = express();
const PORT = 3000;

app.use(bodyParser.json());

// Crea un pool de conexiones en lugar de una sola conexión
const db = mysql.createPool({
    host: "database-1.cimczpaiejqo.us-east-1.rds.amazonaws.com",
    user: "admin",
    password: "12345678"
});

// Función para crear la base de datos y las tablas
const initializeDatabase = () => {
    // Primero, crea la base de datos
    db.query("CREATE DATABASE IF NOT EXISTS androidStudio", (err) => {
        if (err) {
            console.error("Error creando base de datos: ", err);
            return;
        }
        
        // Luego, usa la base de datos
        const useDb = mysql.createPool({
            host: "database-1.cimczpaiejqo.us-east-1.rds.amazonaws.com",
            user: "admin",
            password: "12345678",
            database: "androidStudio"
        });

        // Crea tabla de productos
        const createProductsTable = `CREATE TABLE IF NOT EXISTS products (
            id VARCHAR(255) PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            price DOUBLE NOT NULL,
            imageUrl TEXT
        )`;

        // Crea tabla de usuarios
        const createUsersTable = `CREATE TABLE IF NOT EXISTS users (
            id VARCHAR(255) PRIMARY KEY,
            username VARCHAR(255) UNIQUE NOT NULL,
            password VARCHAR(255) NOT NULL
        )`;

        // Ejecuta las creaciones de tablas
        useDb.query(createProductsTable, err => {
            if (err) console.error("Error creando tabla products: ", err);
        });

        useDb.query(createUsersTable, err => {
            if (err) console.error("Error creando tabla users: ", err);
        });

        // Reemplaza la conexión original con la nueva conexión a la base de datos específica
        global.db = useDb;

        // Configura las rutas
        setupRoutes();
    });
};

// Función para configurar las rutas
const setupRoutes = () => {
    // Obtener productos
    app.get("/products", (req, res) => {
        db.query("SELECT * FROM products", (err, results) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json(results);
        });
    });

    // Crear un producto
    app.post("/products", (req, res) => {
        const { id, name, price, imageUrl } = req.body;
        if (!id || !name || !price) {
            return res.status(400).json({ error: "Faltan datos obligatorios" });
        }
        db.query("INSERT INTO products (id, name, price, imageUrl) VALUES (?, ?, ?, ?)", 
            [id, name, price, imageUrl], 
            (err) => {
                if (err) return res.status(500).json({ error: err.message });
                res.status(201).json({ id, name, price, imageUrl });
            }
        );
    });

    // Validar nombre de usuario
    app.get("/users/validate", (req, res) => {
        const { username } = req.query;
        db.query("SELECT * FROM users WHERE username = ?", [username], (err, results) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ isValid: results.length === 0 });
        });
    });

    // Crear usuario
    app.post("/users", (req, res) => {
        const { id, username, password } = req.body;
        if (!id || !username || !password) {
            return res.status(400).json({ error: "Faltan datos obligatorios" });
        }
        db.query("INSERT INTO users (id, username, password) VALUES (?, ?, ?)", 
            [id, username, password], 
            (err) => {
                if (err) return res.status(500).json({ error: err.message });
                res.status(201).json({ id, username });
            }
        );
    });
};

// Inicializa la base de datos
initializeDatabase();

// Inicia el servidor
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});