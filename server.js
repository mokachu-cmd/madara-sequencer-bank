const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const app = express();
app.use(express.json());

const PORT = 3000;
const JWT_SECRET = 'secure_poc_bank_secret_key'; // In production, use an environment variable

// Connect to your existing SQLite private banking ledger database
const db = new sqlite3.Database('./bank.db', (err) => {
    if (err) console.error('Database connection error:', err.message);
    else console.log('Connected to the banking auth ledger database.');
});

// LOGIN ENDPOINT
app.post('/api/auth/login', (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required' });
    }

    // Query database for the user profile
    const sql = `SELECT * FROM users WHERE username = ?`;
    db.get(sql, [username], async (err, user) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Database processing error' });
        }

        // Safeguard against user lookup failure
        if (!user) {
            return res.status(401).json({ error: 'Invalid username or password' });
        }

        // Verify the provided password matches the secure bcrypt hash on file
        const passwordMatch = await bcrypt.compare(password, user.password_hash);
        if (!passwordMatch) {
            return res.status(401).json({ error: 'Invalid username or password' });
        }

        // Issue a JWT containing Web2 roles AND Web3 mapping info
        const token = jwt.sign(
            { 
                id: user.id, 
                username: user.username, 
                role: user.role, 
                blockchainAddress: user.blockchain_address,
                accountNumber: user.account_number
            }, 
            JWT_SECRET, 
            { expiresIn: '2h' }
        );

        // Send token and matching user session view info to the frontend
        res.json({
            message: "Authentication successful",
            token,
            user: {
                username: user.username,
                role: user.role,
                accountNumber: user.account_number,
                blockchainAddress: user.blockchain_address
            }
        });
    });
});

app.listen(PORT, () => {
    console.log(`Private Banking Auth API listening on port ${PORT}`);
});