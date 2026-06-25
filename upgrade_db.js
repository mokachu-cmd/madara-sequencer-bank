const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./bank.db');

db.serialize(() => {
    // Add columns for our Phase 5 security layer
    db.run(`ALTER TABLE users ADD COLUMN password TEXT`);
    db.run(`ALTER TABLE users ADD COLUMN transaction_pin TEXT`);
    db.run(`ALTER TABLE users ADD COLUMN passkey_registered INTEGER DEFAULT 0`);

    // Update Alice and Bob with dummy security credentials for our PoC
    db.run(`UPDATE users SET password = 'AliceSecurePassword123', transaction_pin = '4321', passkey_registered = 1 WHERE username = 'client_alice'`);
    db.run(`UPDATE users SET password = 'BobSecurePassword456', transaction_pin = '8765', passkey_registered = 1 WHERE username = 'client_bob'`);
    
    console.log("Database schema successfully upgraded with Phase 5 Security Credentials.");
});
db.close();