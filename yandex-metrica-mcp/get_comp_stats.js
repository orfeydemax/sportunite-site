import axios from 'axios';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '.env') });

const OAUTH_TOKEN = process.env.YANDEX_METRIKA_TOKEN || process.env.YANDEX_METRIKA_ACCESS_TOKEN;

const api = axios.create({
    baseURL: 'https://api-metrika.yandex.net',
    headers: {
        Authorization: `OAuth ${OAUTH_TOKEN}`,
        "Content-Type": "application/json",
    },
});

const counterId = '107040995';

async function fetchStats(name, params) {
    console.log(`\n--- Fetching ${name} ---`);
    try {
        const res = await api.get('/stat/v1/data', { params: { ids: counterId, ...params } });
        return res.data;
    } catch (e) {
        console.error(`Error fetching ${name}:`, e.response?.data?.message || e.message);
        return null;
    }
}

async function run() {
    const period = { date1: '30daysAgo', date2: 'today' };

    // 1. Overall
    const overall = await fetchStats('Overall', {
        ...period,
        metrics: 'ym:s:visits,ym:s:users,ym:s:pageviews,ym:s:bounceRate,ym:s:avgVisitDurationSeconds',
    });

    if (overall && overall.totals) {
        console.log("=== OVERALL ===");
        console.log(`Visits: ${overall.totals[0]}`);
        console.log(`Users: ${overall.totals[1]}`);
        console.log(`Pageviews: ${overall.totals[2]}`);
        console.log(`Bounce Rate: ${overall.totals[3]?.toFixed(2)}%`);
        console.log(`Avg Duration: ${overall.totals[4]?.toFixed(2)} sec`);
    }

    // 2. Sources
    const sources = await fetchStats('Sources', {
        ...period,
        metrics: 'ym:s:visits',
        dimensions: 'ym:s:trafficSource',
        sort: '-ym:s:visits',
        limit: 10
    });
    if (sources && sources.data) {
        console.log("\n=== TRAFFIC SOURCES ===");
        sources.data.forEach(row => {
            console.log(`${row.dimensions[0].name}: ${row.metrics[0]}`);
        });
    }

    // 3. Devices
    const devices = await fetchStats('Devices', {
        ...period,
        metrics: 'ym:s:visits',
        dimensions: 'ym:s:deviceCategory',
        sort: '-ym:s:visits',
    });
    if (devices && devices.data) {
        console.log("\n=== DEVICES ===");
        devices.data.forEach(row => {
            console.log(`${row.dimensions[0].name}: ${row.metrics[0]}`);
        });
    }

    // 4. Browsers
    const browsers = await fetchStats('Browsers', {
        ...period,
        metrics: 'ym:s:visits',
        dimensions: 'ym:s:browser',
        sort: '-ym:s:visits',
        limit: 5
    });
    if (browsers && browsers.data) {
        console.log("\n=== BROWSERS ===");
        browsers.data.forEach(row => {
            console.log(`${row.dimensions[0].name}: ${row.metrics[0]}`);
        });
    }
}

run();
