import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
    CallToolRequestSchema,
    ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import axios from "axios";
import dotenv from "dotenv";

import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, ".env") });

const API_BASE_URL = "https://api-metrika.yandex.net";
const OAUTH_TOKEN = process.env.YANDEX_METRIKA_TOKEN || process.env.YANDEX_METRIKA_ACCESS_TOKEN;

if (!OAUTH_TOKEN) {
    console.error("Error: YANDEX_METRIKA_TOKEN or YANDEX_METRIKA_ACCESS_TOKEN environment variable is not set.");
    process.exit(1);
}

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        Authorization: `OAuth ${OAUTH_TOKEN}`,
        "Content-Type": "application/json",
    },
});

const server = new Server(
    {
        name: "yandex-metrika-mcp",
        version: "1.0.0",
    },
    {
        capabilities: {
            tools: {},
        },
    }
);

/**
 * List of available tools
 */
server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
        tools: [
            {
                name: "list_counters",
                description: "Получить список доступных счетчиков Яндекс.Метрики",
                inputSchema: {
                    type: "object",
                    properties: {},
                },
            },
            {
                name: "get_counter_info",
                description: "Получить подробную информацию о конкретном счетчике",
                inputSchema: {
                    type: "object",
                    properties: {
                        counterId: {
                            type: "string",
                            description: "ID счетчика",
                        },
                    },
                    required: ["counterId"],
                },
            },
            {
                name: "get_report_traffic",
                description: "Получить отчет о посещаемости (визиты, просмотры, посетители)",
                inputSchema: {
                    type: "object",
                    properties: {
                        ids: { type: "string", description: "ID счетчика" },
                        date1: { type: "string", description: "Начальная дата (YYYY-MM-DD или 'today', '7daysago')" },
                        date2: { type: "string", description: "Конечная дата" },
                        metrics: { type: "string", description: "Метрики через запятую (напр. ym:s:visits,ym:s:pageviews)", default: "ym:s:visits,ym:s:pageviews,ym:s:users" },
                    },
                    required: ["ids"],
                },
            },
            {
                name: "list_goals",
                description: "Получить список целей для счетчика",
                inputSchema: {
                    type: "object",
                    properties: {
                        counterId: { type: "string", description: "ID счетчика" },
                    },
                    required: ["counterId"],
                },
            },
        ],
    };
});

/**
 * Tool execution handler
 */
server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    try {
        switch (name) {
            case "list_counters": {
                const response = await api.get("/management/v1/counters");
                return {
                    content: [{ type: "text", text: JSON.stringify(response.data.counters, null, 2) }],
                };
            }

            case "get_counter_info": {
                const response = await api.get(`/management/v1/counter/${args.counterId}`);
                return {
                    content: [{ type: "text", text: JSON.stringify(response.data.counter, null, 2) }],
                };
            }

            case "get_report_traffic": {
                const params = {
                    ids: args.ids,
                    date1: args.date1 || "30daysago",
                    date2: args.date2 || "today",
                    metrics: args.metrics || "ym:s:visits,ym:s:pageviews,ym:s:users",
                };
                const response = await api.get("/stat/v1/data", { params });
                return {
                    content: [{ type: "text", text: JSON.stringify(response.data, null, 2) }],
                };
            }

            case "list_goals": {
                const response = await api.get(`/management/v1/counter/${args.counterId}/goals`);
                return {
                    content: [{ type: "text", text: JSON.stringify(response.data.goals, null, 2) }],
                };
            }

            default:
                throw new Error(`Unknown tool: ${name}`);
        }
    } catch (error) {
        const errorMessage = error.response ? JSON.stringify(error.response.data) : error.message;
        return {
            isError: true,
            content: [{ type: "text", text: `Ошибка API Яндекс.Метрики: ${errorMessage}` }],
        };
    }
});

async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("Yandex Metrika MCP server running on stdio");
}

main().catch((error) => {
    console.error("Fatal error in main():", error);
    process.exit(1);
});
