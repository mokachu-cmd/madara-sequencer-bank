// Simulating the frontend storage capture environment
let sessionToken = null;
let activeUserDashboard = null;

/**
 * 1. Simulates handling the raw response from our API login request
 */
function handleAuthResponse(apiResponse) {
    console.log("=== Frontend Router: Processing Auth Token ===");
    
    // Save token to localStorage/Session storage
    sessionToken = apiResponse.token;
    const userProfile = apiResponse.user;

    console.log(`Token Saved securely for session. User verified: ${userProfile.username}`);
    
    // Execute deep link routing logic based on user database roles
    routeToDashboard(userProfile);
}

/**
 * 2. Processes client or admin attributes to load the correct workspace view
 */
function routeToDashboard(profile) {
    if (profile.role === 'admin') {
        activeUserDashboard = "ADMIN_CONSOLE_VIEW";
        renderAdminDashboard(profile);
    } else if (profile.role === 'user') {
        activeUserDashboard = "CLIENT_PORTAL_VIEW";
        renderClientDashboard(profile);
    } else {
        console.error("Access Denied: Unrecognized system authorization role.");
    }
}

/**
 * 3. Render functions mapping the Web2 identity context to Web3 locations
 */
function renderAdminDashboard(profile) {
    console.log("\n-----------------------------------------------------");
    console.log("[LAUNCHING SYSTEM VIEW: BANK MANAGER CONSOLE]");
    console.log(`Welcome Back, Administrator: ${profile.username}`);
    console.log(`Routing ID:         ${profile.accountNumber}`);
    console.log(`System Vault Node:  ${profile.blockchainAddress}`);
    console.log("-----------------------------------------------------");
    console.log("Actions Available: [1] Audit Vault, [2] Mint Asset, [3] Authorize New Account");
}

function renderClientDashboard(profile) {
    console.log("\n-----------------------------------------------------");
    console.log("[LAUNCHING CUSTOMER VIEW: PORTAL ONLINE]");
    console.log(`Welcome Back, Client: ${profile.username}`);
    console.log(`Account Number:      ${profile.accountNumber}`);
    console.log(`On-Chain Wallet:     ${profile.blockchainAddress}`);
    console.log("-----------------------------------------------------");
    console.log("Actions Available: [1] View Ledger, [2] Transfer Funds, [3] Deposit Wire");
}


// =========================================================================
// RUN MOCK CONSOLE TEST
// =========================================================================

// Mock payload representing Alice logging into the portal
const mockAliceResponse = {
    token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    user: {
        username: "client_alice",
        role: "user",
        accountNumber: "BANK-USR-101",
        blockchainAddress: "0x008a1719e7ca19f3d91e8ef50a48fc456575f645497a1d55f30e3781f786afe4" // Your live address here
    }
};

// Run the script to see the frontend routing logic parse the role in real time
handleAuthResponse(mockAliceResponse);