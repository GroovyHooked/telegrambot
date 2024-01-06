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

module.exports = {
    insertCryptoData,
    getCryptoLast5Prices,
}


// Drop crypto table
// sql = `DROP TABLE crypto`;
// db.run(sql, (err) => {
//     if (err) {
//         console.error(err.message);
//     }
//     console.log('Dropped crypto table.');
// })


// sql = `CREATE TABLE IF NOT EXISTS crypto (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, price REAL, volume REAL, timestamp INTEGER)`;

// db.run(sql, (err) => {
//     if (err) {
//         console.error(err.message);
//     }
//     console.log('Created crypto table.');
// })

