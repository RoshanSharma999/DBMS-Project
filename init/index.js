const mysql = require('mysql2/promise'); // Note the /promise import
const { v4: uuidv4 } = require('uuid');
const listingData = require('./listingData.js');
const managerData = require('./managerData.js');

const connectionConfig = {
    host: 'localhost',
    user: 'root',
    database: 'dbms',
    password: '#codeRoshan'
};

const amenities = ["WiFi", "Restaurant", "Swimming Pool", "Gym"];
const amenityData = [];

for (const listing of listingData) {
    const numAmenities = Math.floor(Math.random() * amenities.length) + 1;
    const shuffledAmenities = [...amenities].sort(() => 0.5 - Math.random());
    for (let j = 0; j < numAmenities; j++) {
        amenityData.push([ listing[0], shuffledAmenities[j], Math.random() > 0.5 ]);
    }
}
async function initializeDatabase() {
    let connection;
    try {
        connection = await mysql.createConnection(connectionConfig);
        await connection.query("SET FOREIGN_KEY_CHECKS = 0");

        const tablesToTruncate = [
            'bookings', 'listings', 'managers', 
            'users', 'reviews', 'amenities'
        ];
        for (const table of tablesToTruncate) {
            await connection.query(`TRUNCATE TABLE ${table}`);
        }
        await connection.query("SET FOREIGN_KEY_CHECKS = 1");

        await connection.query(
            "INSERT INTO managers VALUES ?",
            [managerData]
        );
        await connection.query(
            "INSERT INTO listings VALUES ?",
            [listingData]
        );
        await connection.query(
            "INSERT INTO amenities VALUES ?",
            [amenityData]
        );
        console.log("Database initialized successfully");
    } catch (error) {
        console.error("Error initializing database:", error);
    } finally {
        if (connection) await connection.end();
    }
}
initializeDatabase();
