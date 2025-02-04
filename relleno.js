const mysql = require("mysql2");

const db = mysql.createConnection({
    host: "database-1.cimczpaiejqo.us-east-1.rds.amazonaws.com",
    user: "admin",
    password: "12345678",
    database: "androidStudio"
});

db.connect(err => {
    if (err) {
        console.error("Error conectando a MySQL: ", err);
        return;
    }
    console.log("Conectado a MySQL");

    const products = [
        ["1", "Laptop", 1200.99, "https://example.com/laptop.jpg"],
        ["2", "Smartphone", 799.99, "https://example.com/smartphone.jpg"],
        ["3", "Headphones", 199.99, "https://example.com/headphones.jpg"]
    ];
    
    const users = [
        ["1", "user1", "password123"],
        ["2", "user2", "securepass"],
        ["3", "user3", "mypassword"]
    ];
    
    db.query("INSERT INTO products (id, name, price, imageUrl) VALUES ?", [products], err => {
        if (err) console.error("Error insertando productos: ", err);
        else console.log("Productos insertados");
    });

    db.query("INSERT INTO users (id, username, password) VALUES ?", [users], err => {
        if (err) console.error("Error insertando usuarios: ", err);
        else console.log("Usuarios insertados");
    });

    db.end();
});
