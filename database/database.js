const sqlite3 = require('sqlite3').verbose();
let sql;

const requestsPerMinute = 1;

const db = new sqlite3.Database('./database/database.db', (err) => {
    if (err) {
        console.error(err.message);
    }
    console.log('Connected to the database.');
})

function insertCryptoData(data, name) {
    // Vérifier le nombre de lignes actuel dans la table
    const countRowsQuery = 'SELECT COUNT(*) as rowCount FROM crypto';

    db.get(countRowsQuery, [], (err, result) => {
        if (err) {
            console.error(err.message);
            return;
        }

        const rowCount = result.rowCount;

        // Si le nombre de lignes atteint ou dépasse 1000, supprimer la dernière entrée
        if (rowCount >= requestsPerMinute * 60 * 24 * 9) {
            const deleteLastRowQuery = 'DELETE FROM crypto WHERE id = (SELECT MIN(id) FROM crypto)';

            db.run(deleteLastRowQuery, [], (deleteErr) => {
                if (deleteErr) {
                    console.error(deleteErr.message);
                    return;
                }

                // console.log('Deleted last crypto data.');
                // Continuer avec l'insertion après la suppression
                performInsertion(data, name);
            });
        } else {
            // Si le nombre de lignes est inférieur à 1000, effectuer simplement l'insertion
            performInsertion(data, name);
        }
    });
}

function performInsertion(data, name) {
    // Effectuer l'insertion comme d'habitude
    const sql = `INSERT INTO crypto (name, price, volume, timestamp) VALUES (?, ?, ?, ?)`;
    const date = new Date();
    const timestamp = date.getTime();

    db.run(sql, [name, data.price, data.volume, timestamp], (err) => {
        if (err) {
            console.error(err.message);
            return;
        }
        // console.log('Inserted crypto data.');
    });
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

function getNB_OF_MESSAGES_TO_KEEP() {
    return new Promise((resolve, reject) => {
        sql = `SELECT value FROM various WHERE name = 'NB_OF_MESSAGES_TO_KEEP'`;
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

function setNB_OF_MESSAGES_TO_KEEP(value) {
    return new Promise((resolve, reject) => {
        sql = `UPDATE various SET value = '${value}' WHERE name = 'NB_OF_MESSAGES_TO_KEEP'`;
        db.run(sql, (err) => {
            if (err) {
                console.error(err.message);
                reject(err);
            } else {
                resolve();
            }
        });
    });
}

function getAlertThresholdShitcoinDb() {
    return new Promise((resolve, reject) => {
        sql = `SELECT value FROM various WHERE name = 'ALERT_THRESHOLD_SHITCOIN'`;
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

function setAlertThresholdShitcoinDb(value) {
    return new Promise((resolve, reject) => {
        sql = `UPDATE various SET value = '${value}' WHERE name = 'ALERT_THRESHOLD_SHITCOIN'`;
        db.run(sql, (err) => {
            if (err) {
                console.error(err.message);
                reject(err);
            } else {
                resolve();
            }
        });
    });
}

function getAlertThresholdDb() {
    return new Promise((resolve, reject) => {
        sql = `SELECT value FROM various WHERE name = 'ALERT_THRESHOLD'`;
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

function setAlertThresholdDb(value) {
    return new Promise((resolve, reject) => {
        sql = `UPDATE various SET value = '${value}' WHERE name = 'ALERT_THRESHOLD'`;
        db.run(sql, (err) => {
            if (err) {
                console.error(err.message);
                reject(err);
            } else {
                resolve();
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
    getNB_OF_MESSAGES_TO_KEEP,
    setNB_OF_MESSAGES_TO_KEEP,
    getAlertThresholdShitcoinDb,
    setAlertThresholdShitcoinDb,
    getAlertThresholdDb,
    setAlertThresholdDb,
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
// sql = `CREATE TABLE IF NOT EXISTS various (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, value TEXT)`;
// db.run(sql, (err) => {
//     if (err) {
//         console.error(err.message);
//     }
//     console.log('Table Created.');
// })

// sql = `INSERT INTO various (name, value) VALUES (?, ?)`;

// db.run(sql, ['ALERT_THRESHOLD_SHITCOIN', 2], (err) => {
//     if (err) {
//         console.error(err.message);
//         return;
//     }
//     console.log('Inserted crypto data.');
// });
// SELECT price,timestamp FROM crypto WHERE name = 'bitcoin' ORDER BY timestamp DESC LIMIT 10
// SELECT price,timestamp FROM crypto WHERE name = 'bitcoin' ORDER BY timestamp ASC LIMIT 10
// SELECT price,timestamp FROM crypto WHERE name = 'bitcoin' ORDER BY timestamp DESC LIMIT 100


// modify bitcoin quantity in crypto_quantity table
// sql = `UPDATE crypto_quantity SET quantity = 0.13931606 WHERE name = 'bitcoin'`;
// db.run(sql, (err) => {
//     if (err) {
//         console.error(err.message);
//     }
//     console.log('Updated crypto quantity.');
// })
