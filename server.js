const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const app = express();
app.use(express.json());
app.use(express.static('public'));

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

const { RpcProvider, Account, ec, num } = require('starknet');

// Initialize the provider to point to your running Madara sequencer
const provider = new RpcProvider({ nodeUrl: 'http://127.0.0.1:9944' });

// Devnet standard private key for account execution 
// NOTE: In production, user keys should be securely managed/encrypted
const DEVNET_PRIVATE_KEY = "0x0514977443078cf1e0c36bc88b89ada9a46061a5cf728f40274caea21d76f174"; 
const TOKEN_ADDRESS = "0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7";

// DECIMALS & NONCE REINFORCED APPMANAGER ROUTER
app.post('/api/financial/transfer', async (req, res) => {
    const { 
        senderUsername, 
        recipientAccountNumber, 
        amount, 
        transactionPin, 
        password,       
        biometricValid  
    } = req.body;

    const cleanAmount = parseFloat(amount);
        // 1. Convert to Base Token Units (Fixed-point: 2 decimals for Bank Fiat Cents)
        // Example: $99.99 becomes 9999 units. $5.50 becomes 550 units.
    const onChainAmountUnits = Math.round(cleanAmount * 100);

    // Evaluate Progressive MFA using normalized dollar bounds
    if (cleanAmount > 100000) {
        return res.status(202).json({ 
            status: "Queued for Audit", 
            securityRating: "Tier-4 Institutional Hold",
            details: "Transfer exceeds $100k maximum automated velocity boundary. Sent to Operations Control Room for manual admin signature verification." 
        });
    }

    db.get(`SELECT * FROM users WHERE username = ?`, [senderUsername], async (err, sender) => {
        if (err || !sender) {
            return res.status(404).json({ error: "Sender profile error." });
        }

        // Validate Baseline PIN
        if (!transactionPin || transactionPin !== sender.transaction_pin) {
            return res.status(401).json({ error: "Security Exception", details: "Invalid Transaction PIN. Operation aborted." });
        }

        // Progressive Step-Up checks using clear currency definitions
        if (cleanAmount > 10000 && cleanAmount <= 20000) {
            if (!password || password !== sender.password) {
                return res.status(401).json({ error: "MFA Challenge Failed", details: "Tier 1: Valid Account Password required." });
            }
        } 
        else if (cleanAmount > 20000 && cleanAmount <= 40000) {
            if (!biometricValid) {
                return res.status(401).json({ error: "MFA Challenge Failed", details: "Tier 2: Biometric/Passkey signature required." });
            }
        } 
        else if (cleanAmount > 40000 && cleanAmount <= 100000) {
            if (!password || password !== sender.password || !biometricValid) {
                return res.status(401).json({ error: "MFA Challenge Failed", details: "Tier 3: Password and Biometric verification required." });
            }
        }

db.get(`SELECT blockchain_address FROM users WHERE account_number = ?`, [recipientAccountNumber], async (err, recipient) => {
            if (err || !recipient || !recipient.blockchain_address) {
                return res.status(404).json({ error: "Recipient bank account not found." });
            }

            try {
                const formattedSenderAddress = num.toHex(sender.blockchain_address);
                const formattedRecipientAddress = num.toHex(recipient.blockchain_address);

                const senderAccount = new Account({
                    provider: provider,
                    address: formattedSenderAddress,
                    signer: DEVNET_PRIVATE_KEY
                });

                // Fetch the network baseline nonce
                const networkNonceStr = await provider.getNonceForAddress(formattedSenderAddress);
                const networkNonce = Number(networkNonceStr);

                // Initialize or synchronize our local in-memory cache tracking
                if (nonceCache[formattedSenderAddress] === undefined || nonceCache[formattedSenderAddress] < networkNonce) {
                    nonceCache[formattedSenderAddress] = networkNonce;
                }

                // Assign the correct sequential nonce to use
                const finalNonceToUse = nonceCache[formattedSenderAddress];
                
                // Optimistically increment our cache for the next immediate inbound click
                nonceCache[formattedSenderAddress]++;

                const transferCall = {
                    contractAddress: TOKEN_ADDRESS,
                    entrypoint: 'transfer',
                    calldata: [
                        formattedRecipientAddress, 
                        num.toHex(onChainAmountUnits), 
                        '0x0'
                    ]
                };

                // Inject the enforced incremental nonce
                const { transaction_hash } = await senderAccount.execute(transferCall, undefined, { 
                    maxFee: 0,
                    nonce: num.toHex(finalNonceToUse)
                });
                
                res.json({
                    status: "Settled",
                    securityRating: cleanAmount > 10000 ? "MFA Verified (Step-Up Enforced)" : "Standard Authorized",
                    transactionHash: transaction_hash,
                    details: { 
                        inputAmount: `$${cleanAmount.toFixed(2)}`, 
                        unitsTransferred: onChainAmountUnits,
                        to: recipientAccountNumber 
                    }
                });

            } catch (txError) {
                console.error(txError);
                // If the transaction fails to broadcast completely, roll back the local cache sync
                nonceCache[num.toHex(sender.blockchain_address)]--;
                res.status(500).json({ error: "Appchain Execution Fault", details: txError.message });
            }
        });
    });
});

app.listen(PORT, () => {
    console.log(`Private Banking Auth API listening on port ${PORT}`);
});