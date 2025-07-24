const express = require('express');
const { Pool } = require('pg');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const port = 5208;

// DB connection
const db = new Pool({
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: 'Xue.1005',
    database: 'node_rest_sql'
});

// Establish DB connection
db.connect((err) => {
    if (err) {
        console.error('Error connecting to the database:', err);
        return;
    }
    console.log('Connected to the database');
});

// Middleware
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

/* === Routers === */

// Get all users
app.get('/api/get-users', (req, res) => {
    // Execute SQL query to fetch all users
    db.query('select * from users;', (err, results) => {
        if (err) {
            console.error('Error fetching users list:', err);
            res.status(500).json({ error: 'Internal server error' });
            return;
        }
        res.json(results.rows);
    });
});

// Add a new user using a POST request
app.post('/api/add-users', (req, res) => {
    const { username, password } = req.body;

    // Check if username is provided
    if (!username) {
        return res.status(400).json({ error: 'Username is required' });
    }

    // Execute SQL query to insert a new user with RETURNING id to fetch the created id
    const queryText = 'INSERT INTO users (username, password) VALUES ($1, $2) RETURNING id';
    const queryValues = [username, password];

    db.query(queryText, queryValues, (err, results) => {
        if (err) {
            console.error('Error adding user:', err);
            res.status(500).json({ error: 'Internal server error' });
            return;
        }
        res.status(200).json({ message: 'User added successfully', userId: results.rows[0].id });
    });
});

// Update exsisting user using a PUT request
// Note: This endpoint expects the params.id same as the var behind the : in the URL
app.put('/api/users/:id', (req, res) => {
    const userId = req.params.id;
    const { username, password } = req.body;

    // Check if username is provided
    if (!username) {
        return res.status(400).json({ error: 'Username is required' });
    }

    // Execute SQL query to update the user
    const queryText = 'UPDATE users SET username = $1, password = $2 WHERE id = $3';
    const queryValues = [username, password, userId];

    db.query(queryText, queryValues, (err, results) => {
        if (err) {
            console.error('Error updating user:', err);
            res.status(500).json({ error: 'Internal server error' });
            return;
        }
        // Consider if the query affected zero row
        if (results.rowCount === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.status(200).json({ message: 'User info updated successfully' });
    });
});

// Delete a user
// When there is no username provided, the user will be deleted by the id
app.delete('/api/users/:id', (req, res) => {
    const userId = req.params.id;

    // Execute SQL query to delete the user
    const queryText = 'DELETE FROM users WHERE id = $1';
    const queryValues = [userId];

    db.query(queryText, queryValues, (err, results) => {
        if (err) {
            console.error('Error deleting user:', err);
            res.status(500).json({ error: 'Internal server error' });
            return;
        }
        // Consider if the query affected zero row
        if (results.rowCount === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.status(204).json({ message: 'User deleted successfully' });
    });
});

// Start your Express server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});