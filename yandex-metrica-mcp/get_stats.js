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

async function run() {
    try {
        const counterId = '107040995'; // Sport Unite

        console.log(`\n📊 Статистика для сайта Sport Unite (ID: ${counterId}) за сегодня:`);

        const params = {
            ids: counterId,
            date1: 'today',
            date2: 'today',
            metrics: 'ym:s:visits,ym:s:pageviews,ym:s:users'
        };
        const statsRes = await api.get('/stat/v1/data', { params });
        const totals = statsRes.data.totals;

        console.log('-----------------------------------');
        console.log(`👤 Посетители (уникальные): ${totals[2]}`);
        console.log(`🚪 Визиты (сессии):         ${totals[0]}`);
        console.log(`📄 Просмотры страниц:      ${totals[1]}`);
        console.log('-----------------------------------\n');

    } catch (e) {
        console.error("❌ Ошибка при запросе к API Метрики:");
        console.error(e.response ? JSON.stringify(e.response.data, null, 2) : e.message);
    }
}
run();
