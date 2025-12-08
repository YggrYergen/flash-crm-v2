const fs = require('fs');
const path = require('path');

const CSV_PATH = 'c:/Users/tomas/flash-crm/leads.csv';

// --- Copied from App.jsx ---
const parseCSVLine = (text) => {
    const re_value = /(?!\s*$)\s*(?:'([^']*)'|"([^"]*)"|([^,'"\s\\]*(?:\s+[^,'"\s\\]+)*))\s*(?:,|$)/g;
    const a = [];
    text.replace(re_value, function (m0, m1, m2, m3) {
        if (m1 !== undefined) a.push(m1.replace(/\\'/g, "'"));
        else if (m2 !== undefined) a.push(m2.replace(/\\"/g, '"'));
        else if (m3 !== undefined) a.push(m3);
        return '';
    });
    if (/,\s*$/.test(text)) a.push('');
    return a;
};

const calculateCompositeScore = (data) => {
    let webScore = 0;
    const web = (data.website || '').toLowerCase();
    const isSocialMedia = web.includes('instagram.com') || web.includes('facebook.com') || web.includes('tiktok.com') || web.includes('linkedin.com');

    if (!web || isSocialMedia) webScore = 100;
    else webScore = 0;

    let gbpScore = 0;
    const isClaimed = data.is_claimed === 'true' || data.is_claimed === true;
    const isVerified = data.verified === 'true' || data.verified === true;
    const reviewCount = parseInt(data.review_count || 0);
    const rating = parseFloat(data.rating || 0);

    if (!isClaimed) gbpScore += 40;
    if (!isVerified) gbpScore += 20;
    if (reviewCount < 5) gbpScore += 20;
    if (rating > 0 && rating < 4.0) gbpScore += 20;
    if (gbpScore > 100) gbpScore = 100;

    let sercotecScore = 0;
    if (isClaimed) sercotecScore += 25;
    if (isVerified) sercotecScore += 25;
    if (reviewCount > 10) sercotecScore += 20;
    if (rating >= 4.0) sercotecScore += 10;
    if (data.phone_number && data.phone_number.length > 5) sercotecScore += 10;
    if (data.full_address && data.full_address.length > 10) sercotecScore += 10;
    if (sercotecScore > 100) sercotecScore = 100;

    const generalScore = Math.round((webScore * 0.4) + (gbpScore * 0.4) + (sercotecScore * 0.2));

    return { webScore, gbpScore, sercotecScore, generalScore };
};

// --- Test Logic ---
try {
    console.log(`Reading file from: ${CSV_PATH}`);
    if (!fs.existsSync(CSV_PATH)) {
        console.error(`File not found: ${CSV_PATH}`);
        process.exit(1);
    }

    const text = fs.readFileSync(CSV_PATH, 'utf8');
    const lines = text.split('\n');
    console.log(`Total lines found: ${lines.length}`);

    const newLeads = [];
    let count = 0;
    let errors = 0;

    for (let i = 0; i < lines.length; i++) { // Starting from 0 to check if header exists or not, user file provided has no header in preview? 
        // Wait, the user file preview starts with "0x...", so it has NO header?
        // The App.jsx loop starts at i=1 (skipping header).
        // Let's check the user file again. 
        // The user file snippet: "0x9689c302baff5d4f:0x135eb80974bf9e2e","+56984522226",...
        // It seems to NOT have a header row like "id,product,name...".
        // If the App.jsx expects a header (i=1), and this file has none, we might skip the first valid row.
        // However, the prompt says "dataset .csv". Usually datasets have headers.
        // The snippet provided:
        // +"0x9689c302baff5d4f:0x135eb80974bf9e2e","+56984522226","VAJ Scan Garage"...
        // This looks like data line 1.
        // If I use the App.jsx logic literally (i=1), I will lose the first record.
        // I should verify if the first line is header or data.

        // For this script, I'll print the first parsed line to see what it looks like.
    }

    // Re-evaluating loop based on checking first line
    const firstLine = lines[0].trim();
    const firstCols = parseCSVLine(firstLine);
    console.log("First line columns:", firstCols);

    // If first col looks like an ID, it's data.
    // "0x96..." is definitely data.
    // So the App.jsx logic skipping line 0 is BAD for this specific CSV if it lacks a header.
    // OR the user followed instructions? 
    // I told the user "the CSV should have a header row".
    // The user file content provided starts immediately with data: "0x..."
    // So the user DID NOT include a header row, contrary to my instruction "include a header row".
    // This means the App.jsx will skip the first real lead.

    // I will simulate the App.jsx logic exactly to report this discrepancy.

    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        const cols = parseCSVLine(line);
        if (cols.length < 3) {
            console.warn(`Line ${i} skipped: fewer than 3 columns`);
            continue;
        }

        const rawData = {
            business_id: cols[0], phone_number: cols[1], name: cols[2], full_address: cols[3],
            review_count: cols[6], rating: cols[7], website: cols[9], place_link: cols[11],
            is_claimed: cols[14], verified: cols[15],
        };

        const scores = calculateCompositeScore(rawData);

        newLeads.push({
            name: rawData.name,
            fitnessScore: scores.generalScore
        });
        count++;
    }

    console.log(`\nImport Simulation Successful!`);
    console.log(`Total Leads Processed (skipping row 0): ${count}`);
    if (count > 0) {
        console.log(`Sample Lead 1: ${JSON.stringify(newLeads[0])}`);
        console.log(`Sample Lead 5: ${JSON.stringify(newLeads[4])}`);
    } else {
        console.warn("No leads imported. Check if file is empty or format is wrong.");
    }

} catch (e) {
    console.error("Verification failed:", e);
}
