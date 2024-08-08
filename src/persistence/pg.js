const waitPort = require('wait-port');
const fs = require('fs');
const { Pool } = require('pg');

const {
    POSTGRES_HOST: HOST,
    POSTGRES_HOST_FILE: HOST_FILE,
    POSTGRES_USER: USER,
    POSTGRES_USER_FILE: USER_FILE,
    POSTGRES_PASSWORD: PASSWORD,
    POSTGRES_PASSWORD_FILE: PASSWORD_FILE,
    POSTGRES_DB: DB,
    POSTGRES_DB_FILE: DB_FILE,
} = process.env;

let pool;

async function init() {
    const host = HOST_FILE ? fs.readFileSync(HOST_FILE) : HOST;
    const user = USER_FILE ? fs.readFileSync(USER_FILE) : USER;
    const password = PASSWORD_FILE ? fs.readFileSync(PASSWORD_FILE) : PASSWORD;
    const database = DB_FILE ? fs.readFileSync(DB_FILE) : DB;

    await waitPort({ 
        host, 
        port: 5432, // PostgreSQL default port
        timeout: 10000,
        waitForDns: true,
    });

    pool = new Pool({
        user,
        host,
        database,
        password,
        port: 5432, // PostgreSQL default port
    });

    return new Promise((resolve, reject) => {
        pool.query(
            'CREATE TABLE IF NOT EXISTS todo_items (id uuid PRIMARY KEY, name varchar(255), completed boolean)',
            (err) => {
                if (err) return reject(err);

                console.log(`Connected to PostgreSQL database at host ${HOST}`);
                resolve();
            }
        );
    });
}

async function teardown() {
    return new Promise((resolve, reject) => {
        pool.end((err) => {
            if (err) reject(err);
            else resolve();
        });
    });
}

async function getItems() {
    return new Promise((resolve, reject) => {
        pool.query('SELECT * FROM todo_items', (err, result) => {
            if (err) return reject(err);
            resolve(result.rows);
        });
    });
}

async function getItem(id) {
    return new Promise((resolve, reject) => {
        pool.query('SELECT * FROM todo_items WHERE id=$1', [id], (err, result) => {
            if (err) return reject(err);
            resolve(result.rows[0]);
        });
    });
}

async function storeItem(item) {
    return new Promise((resolve, reject) => {
        pool.query(
            'INSERT INTO todo_items (id, name, completed) VALUES ($1, $2, $3)',
            [item.id, item.name, item.completed],
            (err) => {
                if (err) return reject(err);
                resolve();
            }
        );
    });
}

async function updateItem(id, item) {
    return new Promise((resolve, reject) => {
        pool.query(
            'UPDATE todo_items SET name=$1, completed=$2 WHERE id=$3',
            [item.name, item.completed, id],
            (err) => {
                if (err) return reject(err);
                resolve();
            }
        );
    });
}

async function removeItem(id) {
    return new Promise((resolve, reject) => {
        pool.query('DELETE FROM todo_items WHERE id = $1', [id], (err) => {
            if (err) return reject(err);
            resolve();
        });
    });
}

module.exports = {
    init,
    teardown,
    getItems,
    getItem,
    storeItem,
    updateItem,
    removeItem,
};

