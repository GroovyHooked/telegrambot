const sqlite3 = require('sqlite3').verbose();

let sql;
const requestsPerMinute = 4;

const db = new sqlite3.Database('./database/database.db', (err) => {
    if (err) {
        console.error(err.message);
    }
    console.log('Connected to the database.');
})

function insertCryptoDataInDb(data, name) {
    const countRowsQuery = 'SELECT COUNT(*) as rowCount FROM crypto';
    
    db.get(countRowsQuery, [], (err, result) => {
        if (err) {
            console.error(err.message);
            return;
        }

        const rowCount = result.rowCount;

        if (rowCount >= requestsPerMinute * 60 * 24 * 9) {
            const deleteLastRowQuery = 'DELETE FROM crypto WHERE id = (SELECT MIN(id) FROM crypto)';

            db.run(deleteLastRowQuery, [], (deleteErr) => {
                if (deleteErr) {
                    console.error(deleteErr.message);
                    return;
                }
                performInsertion(data, name);
            });
        } else {
            performInsertion(data, name);
        }
    });
}

function performInsertion(data, name) {
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

function dbRequestLastpriceAll() {
    return new Promise((resolve, reject) => {
        sql = `SELECT price, name FROM crypto ORDER BY timestamp DESC LIMIT 9`;
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

function dbRequestQuantities(coin) {
    return new Promise((resolve, reject) => {
        sql = `SELECT quantity, short_name FROM crypto_quantity WHERE name = '${coin}'`;
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

function dbRequestAllQuantities() {
    return new Promise((resolve, reject) => {
        sql = `SELECT quantity, name FROM crypto_quantity`;
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

function dbUpdateQuantity(coin, quantity) {
    return new Promise((resolve, reject) => {
        sql = `UPDATE crypto_quantity SET quantity = '${quantity}' WHERE name = '${coin}'`;
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

function dbRequestNbOfMessagesToKeep() {
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

function dbSetNbOfMessagesToKeep(value) {
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

async function dbRequestAlertThresholdShitcoinDb() {
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

function dbSetAlertThresholdShitcoinDb(value) {
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

function dbRequestAlertThresholdDb() {
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

function dbSetAlertThresholdDb(value) {
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

function dbUpdateExchangeRate(value) {
    return new Promise((resolve, reject) => {
        sql = `UPDATE various SET value = '${value}' WHERE name = 'EXCHANGE_RATE_USD_TO_EUR'`;
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

function dbRequestExchangeRate() {
    return new Promise((resolve, reject) => {
        sql = `SELECT value FROM various WHERE name = 'EXCHANGE_RATE_USD_TO_EUR'`;
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
    insertCryptoDataInDb,
    dbRequestLastprices,
    dbRequestLastprice,
    dbRequestLastpriceAll,
    dbRequestQuantities,
    dbRequestAllQuantities,
    dbUpdateQuantity,
    dbRequestNbOfMessagesToKeep,
    dbSetNbOfMessagesToKeep,
    dbRequestAlertThresholdShitcoinDb,
    dbSetAlertThresholdShitcoinDb,
    dbRequestAlertThresholdDb,
    dbSetAlertThresholdDb,
    dbUpdateExchangeRate,
    dbRequestExchangeRate,
}


// Drop crypto table
// sql = `DROP TABLE crypto`;
// db.run(sql, (err) => {
//     if (err) {
//         console.error(err.message);
//     }
//     console.log('Dropped crypto table.');
// })

// sql = `INSERT INTO various (name, value) VALUES (?, ?)`;

// modify bitcoin quantity in crypto_quantity table


//sql = `ALTER TABLE crypto_quantity ADD COLUMN short_name TEXT`;
// sql = `UPDATE crypto_quantity SET short_name = 'SOL' WHERE name = 'solana'`;
// db.run(sql, (err) => {
//     if (err) {
//         console.error(err.message);
//     }
//     console.log('table altered.');
// })

// sql = 'INSERT INTO crypto_quantity (name, quantity, timestamp, short_name) VALUES (?, ?, ?, ?)';

// const date = new Date();
// const timestamp = date.getTime();
// db.run(sql, (err) => {
//     if (err) {
//         console.error(err.message);
//         return;
//     }
//     console.log('Inserted crypto data.');
// });