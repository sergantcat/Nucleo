async function reportStatus(botName, status) {
    try {
        const res = await fetch('https://fsri.pages.dev/api/status', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.STATUS_API_KEY}`
            },
            body: JSON.stringify({ bot: botName, status })
        });

        if (res.ok) {
            console.log(`✅ Sent status "${status}" for "${botName}"`);
        } else {
            console.error(`⚠️ Status report failed for "${botName}" — HTTP ${res.status}`);
        }
    } catch (err) {
        console.error('Failed to report status:', err);
    }
}

module.exports = { reportStatus };