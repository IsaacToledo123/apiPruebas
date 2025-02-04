const express = require("express");
const bodyParser = require("body-parser");
const mysql = require("mysql2");
const cors = require("cors"); // Añade cors para manejar solicitudes cross-origin
const app = express();
const PORT = 3000;

// Middleware
app.use(cors()); // Habilita CORS para todas las rutas
app.use(bodyParser.json());

// Configuración de la base de datos
const db = mysql.createPool({
    host: "database-1.cimczpaiejqo.us-east-1.rds.amazonaws.com",
    user: "admin",
    password: "12345678",
    database: "androidStudio",
    connectionLimit: 10 // Límite de conexiones para mejor rendimiento
});

// Función para crear las tablas si no existen
const initializeDatabase = () => {
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
    db.query(createProductsTable, err => {
        if (err) console.error("Error creando tabla products: ", err);
        else console.log("Tabla products verificada/creada");
    });

    db.query(createUsersTable, err => {
        if (err) console.error("Error creando tabla users: ", err);
        else console.log("Tabla users verificada/creada");
    });
};

// Rutas de productos
const setupProductRoutes = () => {
    // Obtener todos los productos
    app.get("/products", (req, res) => {
        db.query("SELECT * FROM products", (err, results) => {
            if (err) {
                console.error("Error al obtener productos:", err);
                return res.status(500).json({ error: err.message });
            }
            res.json(results);
        });
    });

    // Crear un nuevo producto
    app.post("/products", (req, res) => {
        const { id, name, price, imageUrl } = req.body;
        if (!id || !name || !price) {
            return res.status(400).json({ error: "Faltan datos obligatorios" });
        }
        
        const query = "INSERT INTO products (id, name, price, imageUrl) VALUES (?, ?, ?, ?)";
        db.query(query, [id, name, price, imageUrl], (err, result) => {
            if (err) {
                console.error("Error al crear producto:", err);
                return res.status(500).json({ error: err.message });
            }
            res.status(201).json({ id, name, price, imageUrl });
        });
    });

    // Actualizar un producto
    app.put("/products/:id", (req, res) => {
        const { id } = req.params;
        const { name, price, imageUrl } = req.body;
        
        const query = "UPDATE products SET name = ?, price = ?, imageUrl = ? WHERE id = ?";
        db.query(query, [name, price, imageUrl, id], (err, result) => {
            if (err) {
                console.error("Error al actualizar producto:", err);
                return res.status(500).json({ error: err.message });
            }
            if (result.affectedRows === 0) {
                return res.status(404).json({ error: "Producto no encontrado" });
            }
            res.json({ id, name, price, imageUrl });
        });
    });

    // Eliminar un producto
    app.delete("/products/:id", (req, res) => {
        const { id } = req.params;
        
        const query = "DELETE FROM products WHERE id = ?";
        db.query(query, [id], (err, result) => {
            if (err) {
                console.error("Error al eliminar producto:", err);
                return res.status(500).json({ error: err.message });
            }
            if (result.affectedRows === 0) {
                return res.status(404).json({ error: "Producto no encontrado" });
            }
            res.json({ message: "Producto eliminado correctamente" });
        });
    });
};

// Rutas de usuarios
const setupUserRoutes = () => {
    // Validar nombre de usuario
    app.get("/users/validate", (req, res) => {
        const { username } = req.query;
        db.query("SELECT * FROM users WHERE username = ?", [username], (err, results) => {
            if (err) {
                console.error("Error al validar usuario:", err);
                return res.status(500).json({ error: err.message });
            }
            res.json({ isValid: results.length === 0 });
        });
    });

    // Crear usuario
    app.post("/users", (req, res) => {
        const { id, username, password } = req.body;
        if (!id || !username || !password) {
            return res.status(400).json({ error: "Faltan datos obligatorios" });
        }
        
        const query = "INSERT INTO users (id, username, password) VALUES (?, ?, ?)";
        db.query(query, [id, username, password], (err, result) => {
            if (err) {
                console.error("Error al crear usuario:", err);
                return res.status(500).json({ error: err.message });
            }
            res.status(201).json({ id, username });
        });
    });

    // Iniciar sesión
    app.post("/users/login", (req, res) => {
        const { username, password } = req.body;
        
        const query = "SELECT * FROM users WHERE username = ? AND password = ?";
        db.query(query, [username, password], (err, results) => {
            if (err) {
                console.error("Error al iniciar sesión:", err);
                return res.status(500).json({ error: err.message });
            }
            
            if (results.length > 0) {
                res.json({ 
                    message: "Inicio de sesión exitoso", 
                    user: { 
                        id: results[0].id, 
                        username: results[0].username 
                    } 
                });
            } else {
                res.status(401).json({ error: "Credenciales inválidas" });
            }
        });
    });
};

// Ruta de prueba
app.get("/", (req, res) => {
    res.json({ 
        message: "API de Android Studio funcionando correctamente", 
        status: "online" 
    });
});

// Configuración del servidor
const startServer = () => {
    // Inicializa las tablas
    initializeDatabase();

    // Configura las rutas
    setupProductRoutes();
    setupUserRoutes();

    // Inicia el servidor
    app.listen(PORT, '0.0.0.0', () => {
        console.log(`Servidor corriendo en http://localhost:${PORT}`);
    });
};

// Manejo de errores de conexión a la base de datos
db.getConnection((err, connection) => {
    if (err) {
        console.error("Error conectando a la base de datos:", err);
        return;
    }
    console.log("Conexión a la base de datos establecida correctamente");
    connection.release();
    
    // Inicia el servidor
    startServer();
});

// Manejo de errores no capturados
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});