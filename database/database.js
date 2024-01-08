const sqlite3 = require('sqlite3').verbose();
let sql;

const db = new sqlite3.Database('./database/database.db', (err) => {
    if (err) {
        console.error(err.message);
    }
    console.log('Connected to the database.');
})

function insertCryptoData(data, name) {
    sql = `INSERT INTO crypto (name, price, volume, timestamp) VALUES (?, ?, ?, ?)`;
    const date = new Date();
    const timestamp = date.getTime();
    db.run(sql, [name, data.price, data.volume, timestamp], (err) => {
        if (err) {
            console.error(err.message);
        }
        console.log('Inserted crypto data.');
    })
    deleteCryptoData();
}

function getCryptoLast5Prices(name) {
    return new Promise((resolve, reject) => {
        sql = `SELECT price,timestamp FROM crypto WHERE name = '${name}' ORDER BY timestamp DESC LIMIT 5`;
        db.all(sql, (err, rows) => {
            if (err) {
                console.error(err.message);
                reject(err);
            } else {
                resolve(rows);
            }
        });
    });
}

function dbRequestLastprices(name, limit) {
    return new Promise((resolve, reject) => {
        sql = `SELECT price, timestamp FROM crypto WHERE name = '${name}' ORDER BY timestamp DESC LIMIT ${limit}`;
        db.all(sql, (err, rows) => {
            if (err) {
                console.error(err.message);
                reject(err);
            } else {
                resolve(rows);
            }
        });
    });
}


function dbRequestLastprice(name) {
    return new Promise((resolve, reject) => {
        sql = `SELECT price, timestamp FROM crypto WHERE name = '${name}' ORDER BY timestamp DESC LIMIT 1`;
        db.all(sql, (err, rows) => {
            if (err) {
                console.error(err.message);
                reject(err);
            } else {
                resolve(rows);
            }
        });
    });
}

function deleteCryptoData() {
    sql = `DELETE FROM crypto WHERE timestamp < (SELECT MAX(timestamp) FROM crypto) - (24 * 60 * 60 * 1000)`;
    db.run(sql, (err) => {
        if (err) {
            console.error(err.message);
        }
        console.log('Deleted crypto data.');
    })
}

function getQuantities(coin) {
    return new Promise((resolve, reject) => {
        sql = `SELECT quantity FROM crypto_quantity WHERE name = '${coin}'`;
        db.all(sql, (err, rows) => {
            if (err) {
                console.error(err.message);
                reject(err);
            } else {
                resolve(rows);
            }
        });
    });
}

module.exports = {
    insertCryptoData,
    getCryptoLast5Prices,
    dbRequestLastprices,
    dbRequestLastprice,
    getQuantities,
}

// DELETE FROM crypto WHERE timestamp < (SELECT MAX(timestamp) FROM crypto) - (24 * 60 * 60 * 1000);

// DELETE FROM maTable
// WHERE id IN (
//     SELECT id FROM maTable
//     ORDER BY timestamp_column ASC
//     LIMIT (SELECT COUNT(*) - 100 FROM maTable)
// );

// Drop crypto table
// sql = `DROP TABLE crypto`;
// db.run(sql, (err) => {
//     if (err) {
//         console.error(err.message);
//     }
//     console.log('Dropped crypto table.');
// })

// sql = `CREATE TABLE IF NOT EXISTS crypto (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, price REAL, volume REAL, timestamp INTEGER)`;
// sql = `CREATE TABLE IF NOT EXISTS crypto_quantity (name TEXT PRIMARY KEY, quantity REAL, timestamp INTEGER)`;

// db.run(sql, (err) => {
//     if (err) {
//         console.error(err.message);
//     }
//     console.log('Table Created.');
// })

