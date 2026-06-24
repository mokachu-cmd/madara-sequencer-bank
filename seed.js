const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');

// Connect to the SQLite database file we created
const db = new sqlite3.Database('./bank.db');

async function seedDatabase() {
    const saltRounds = 12;

    // 1. Generate secure Web2 password hashes
    const adminHash = await bcrypt.hash('AdminPass123', saltRounds);
    const userHash = await bcrypt.hash('UserPass123', saltRounds);

    // 2. Define our Phase 1 identities mapped to Madara on-chain addresses
    // TODO: REPLACE THE BLOCKCHAIN ADDRESSES BELOW WITH YOUR TERMINAL OUTPUT ADDRESSES
    const users = [
        {
            username: 'admin_bank',
            password_hash: adminHash,
            role: 'admin',
            blockchain_address: '0x055be462e718c4166d656d11f89e341115b8bc82389c3762a10eade04fcb225d', // Replace me
            account_number: 'BANK-ADM-001'
        },
        {
            username: 'client_alice',
            password_hash: userHash,
            role: 'user',
            blockchain_address: '0x008a1719e7ca19f3d91e8ef50a48fc456575f645497a1d55f30e3781f786afe4', // Replace me
            account_number: 'BANK-USR-101'
        },
        {
            username: 'client_bob',
            password_hash: userHash,
            role: 'user',
            blockchain_address: '0x0733a8e2bcced14dcc2608462bd96524fb64eef061689b6d976708efc2c8ddfd', // Replace me
            account_number: 'BANK-USR-102'
        },
        {
            username: 'client_charlie',
            password_hash: userHash,
            role: 'user',
            blockchain_address: '0x025073e0772b1e348a5da66ea67fb46f75ecdca1bd24dbbc98567cbf4a0e00b3', // Replace me
            account_number: 'BANK-USR-103'
        }
    ];

    // 3. Insert records into the table
    db.serialize(() => {
        const stmt = db.prepare(`
            INSERT OR IGNORE INTO users (username, password_hash, role, blockchain_address, account_number)
            VALUES (?, ?, ?, ?, ?)
        `);

        users.forEach(user => {
            stmt.run(user.username, user.password_hash, user.role, user.blockchain_address, user.account_number);
            console.log(`Successfully prepared record for: ${user.username}`);
        });

        stmt.finalize();
        console.log("Database seeding complete.");
    });

    db.close();
}

seedDatabase().catch(err => console.error("Error seeding database:", err));