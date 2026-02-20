import sys
import json
import sqlite3
import datetime
import os
from pathlib import Path

# --- Configuration & Constants ---
SKILL_ROOT = Path(__file__).parent.parent
RESOURCES_DIR = SKILL_ROOT / "resources"
PRICING_REGISTRY_PATH = RESOURCES_DIR / "pricing_registry.json"

# Default DB path: .agent/data/llm_billing.sqlite3 relative to workspace root (assuming script runs from root or skill dir)
# We try to find .agent/data
def get_db_path():
    env_path = os.environ.get("LLM_BILLING_DB_PATH")
    if env_path:
        return Path(env_path)
    
    # Heuristic: look for .agent in parents
    current = Path.cwd()
    for _ in range(5):
        if (current / ".agent").exists():
            data_dir = current / ".agent" / "data"
            data_dir.mkdir(exist_ok=True)
            return data_dir / "llm_billing.sqlite3"
        current = current.parent
    
    # Fallback
    data_dir = SKILL_ROOT.parent.parent / "data" # .agent/skills/llm.. -> .agent/data ??
    # Let's stick to a safe default relative to the skill if .agent not found
    data_dir = SKILL_ROOT / "data"
    data_dir.mkdir(exist_ok=True)
    return data_dir / "llm_billing.sqlite3"

DB_PATH = get_db_path()

# --- Database Schema ---
def init_db():
    conn = sqlite3.connect(DB_PATH)
    conn.execute("PRAGMA journal_mode=WAL;")
    conn.executescript("""
        CREATE TABLE IF NOT EXISTS llm_calls (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp TEXT,
            project TEXT,
            environment TEXT,
            feature TEXT,
            provider TEXT,
            model TEXT,
            service_tier TEXT,
            region TEXT,
            request_id TEXT,
            endpoint TEXT,
            input_tokens INTEGER DEFAULT 0,
            cached_input_tokens INTEGER DEFAULT 0,
            output_tokens INTEGER DEFAULT 0,
            reasoning_tokens INTEGER DEFAULT 0,
            other_units_json TEXT,
            cost_usd REAL DEFAULT 0.0,
            price_missing INTEGER DEFAULT 0,
            price_version TEXT,
            usage_raw_json TEXT,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
        );
        CREATE INDEX IF NOT EXISTS idx_llm_calls_timestamp ON llm_calls(timestamp);
        CREATE INDEX IF NOT EXISTS idx_llm_calls_combo ON llm_calls(provider, model, timestamp);
    """)
    conn.close()

# --- Adapters ---

class BaseAdapter:
    def normalize(self, event):
        """Returns dict with input_tokens, output_tokens, cached_input_tokens, reasoning_tokens, other_units"""
        raise NotImplementedError

class OpenAIAdapter(BaseAdapter):
    def normalize(self, usage):
        # OpenAI usage: prompt_tokens, completion_tokens, total_tokens
        # prompt_tokens_details: { cached_tokens: int }
        # completion_tokens_details: { reasoning_tokens: int }
        
        norm = {
            "input_tokens": usage.get("prompt_tokens", 0),
            "output_tokens": usage.get("completion_tokens", 0),
            "cached_input_tokens": 0,
            "reasoning_tokens": 0,
            "other_units": {}
        }

        # Check for cached tokens
        prompt_details = usage.get("prompt_tokens_details")
        if prompt_details:
             norm["cached_input_tokens"] = prompt_details.get("cached_tokens", 0)
        
        # Check for reasoning tokens
        completion_details = usage.get("completion_tokens_details")
        if completion_details:
             norm["reasoning_tokens"] = completion_details.get("reasoning_tokens", 0)
             
        # Important: OpenAI prompt_tokens INCLUDES cached_tokens usually. 
        # But for pricing, we often separate them.
        # "Cached tokens are charged at a lower rate... they are a subset of prompt_tokens."
        # So billable_input = prompt_tokens - cached_tokens. 
        # We will store 'input_tokens' as the raw count, and 'cached_input_tokens' as the subset.
        # The pricing engine will handle the subtraction logic.
        
        return norm

class AnthropicAdapter(BaseAdapter):
    def normalize(self, usage):
        # input_tokens, output_tokens
        # cache_creation_input_tokens, cache_read_input_tokens
        
        norm = {
            "input_tokens": usage.get("input_tokens", 0),
            "output_tokens": usage.get("output_tokens", 0),
            "cached_input_tokens": usage.get("cache_read_input_tokens", 0),
            "reasoning_tokens": 0,
            "other_units": {}
        }
        
        # Cache creation might be billed differently (often +25% or similar, but simplified here as input)
        # We store cache_creation separately if needed, but for now we'll lump it into input_tokens
        # unless we add a specific field. 
        # Note: Anthropic reports input_tokens separately from cache_read_input_tokens?
        # Docs: "input_tokens: number of tokens... not including cache_read_input_tokens"
        # So here input_tokens IS the non-cached part.
        
        return norm

class GeminiAdapter(BaseAdapter):
    def normalize(self, usage):
        # usageMetadata: promptTokenCount, candidatesTokenCount, totalTokenCount
        
        norm = {
            "input_tokens": usage.get("promptTokenCount", 0),
            "output_tokens": usage.get("candidatesTokenCount", 0),
            "cached_input_tokens": 0, # Gemini has context caching but field might vary
            "reasoning_tokens": 0,
            "other_units": {}
        }
        return norm

class CohereAdapter(BaseAdapter):
    def normalize(self, usage):
        # Cohere usage: billed_units { input_tokens, output_tokens, search_units, classifications }
        # Or sometimes just meta { billed_units: ... }
        # Let's assume usage object passed is the 'billed_units' or 'meta.billed_units'
        
        norm = {
            "input_tokens": usage.get("input_tokens", 0),
            "output_tokens": usage.get("output_tokens", 0),
            "cached_input_tokens": 0,
            "reasoning_tokens": 0,
            "other_units": {
                "search_units": usage.get("search_units", 0),
                "classifications": usage.get("classifications", 0)
            }
        }
        return norm

class XAIAdapter(BaseAdapter):
    def normalize(self, usage):
        # xAI probably similar to OpenAI but might have extra fields
        norm = {
            "input_tokens": usage.get("prompt_tokens", 0),
            "output_tokens": usage.get("completion_tokens", 0),
            "cached_input_tokens": 0,
            "reasoning_tokens": 0,
            "other_units": {}
        }
        # Check for tool usage in output formatting if needed, 
        # but usage object usually just has tokens.
        return norm

class BedrockAdapter(BaseAdapter):
    def normalize(self, usage):
        # Bedrock InvokeModel response body usage: inputTokenCount, outputTokenCount
        norm = {
            "input_tokens": usage.get("inputTokenCount", 0),
            "output_tokens": usage.get("outputTokenCount", 0),
            "cached_input_tokens": 0,
            "reasoning_tokens": 0,
            "other_units": {}
        }
        return norm

def get_adapter(provider):
    p = provider.lower()
    if p == "openai": return OpenAIAdapter()
    if p == "anthropic": return AnthropicAdapter()
    if p == "gemini": return GeminiAdapter()
    if p == "cohere": return CohereAdapter()
    if p == "xai": return XAIAdapter()
    if p == "bedrock" or p == "aws_bedrock": return BedrockAdapter()
    return GenericAdapter()

# --- Pricing Engine ---
def load_registry():
    if not PRICING_REGISTRY_PATH.exists():
        return None
    with open(PRICING_REGISTRY_PATH, "r", encoding="utf-8") as f:
        return json.load(f)

def calculate_cost(registry, provider, model, norm_usage):
    if not registry:
        return 0.0, True
        
    prov_data = registry.get("providers", {}).get(provider)
    if not prov_data:
        return 0.0, True
        
    model_data = prov_data.get("models", {}).get(model)
    if not model_data:
        # Fallback to wildcard or fail
        return 0.0, True

    # Rates are per million usually
    cost = 0.0
    
    # Input
    # OpenAI: prompt_tokens includes cached. So billable input = input - cached.
    # Anthropic: input_tokens excludes cached read.
    # Logic: Adapters should probably clarify this. 
    # Let's assume norm_usage['input_tokens'] is the "Standard Input" amount.
    # And norm_usage['cached_input_tokens'] is the "Cached Input" amount.
    
    # Correction for OpenAI Adapter logic:
    # If OpenAI says 100 prompt, 20 cached. Then 80 are standard input, 20 are cached.
    if provider == "openai" and norm_usage["cached_input_tokens"] > 0:
        billable_input = max(0, norm_usage["input_tokens"] - norm_usage["cached_input_tokens"])
    else:
        billable_input = norm_usage["input_tokens"]

    cost += (billable_input / 1_000_000) * model_data.get("input_cost_per_million", 0)
    cost += (norm_usage["cached_input_tokens"] / 1_000_000) * model_data.get("cached_input_cost_per_million", 0) # defaulting to 0 if free/not set?
    
    # Output
    cost += (norm_usage["output_tokens"] / 1_000_000) * model_data.get("output_cost_per_million", 0)
    
    # Other units
    # ... (images etc)

    return cost, False

# --- Main Logic ---

def process_event(event):
    init_db()
    
    provider = event.get("provider", "unknown")
    model = event.get("model", "unknown")
    usage_raw = event.get("usage_raw", {})
    
    # 1. Normalize
    adapter = get_adapter(provider)
    norm = adapter.normalize(usage_raw)
    
    # 2. Calculate Cost
    registry = load_registry()
    cost, price_missing = calculate_cost(registry, provider, model, norm)
    
    if event.get("cost_override_usd") is not None:
        cost = float(event["cost_override_usd"])
        price_missing = False

    # 3. Store
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Aggregation for daily total
    today_str = datetime.datetime.now().strftime("%Y-%m-%d")
    
    cursor.execute("""
        INSERT INTO llm_calls (
            timestamp, project, environment, feature, provider, model, 
            input_tokens, cached_input_tokens, output_tokens, reasoning_tokens,
            cost_usd, price_missing, usage_raw_json
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        event.get("timestamp", datetime.datetime.now().isoformat()),
        event.get("project", "default"),
        event.get("environment", "dev"),
        event.get("feature", "unknown"),
        provider,
        model,
        norm["input_tokens"],
        norm["cached_input_tokens"],
        norm["output_tokens"],
        norm["reasoning_tokens"],
        cost,
        1 if price_missing else 0,
        json.dumps(usage_raw)
    ))
    conn.commit()
    
    # Get Totals
    cursor.execute("""
        SELECT SUM(cost_usd), SUM(input_tokens + output_tokens)
        FROM llm_calls
        WHERE date(timestamp) = date('now', 'localtime')
    """)
    daily_cost, daily_tokens = cursor.fetchone()
    conn.close()
    
    # 4. Return Receipt
    receipt = {
        "status": "logged_price_missing" if price_missing else "logged",
        "transaction": {
            "cost_usd": cost,
            "input_tokens": norm["input_tokens"],
            "output_tokens": norm["output_tokens"],
            "cached_input_tokens": norm["cached_input_tokens"]
        },
        "totals": {
            "daily_cost_usd": daily_cost or 0.0,
            "daily_tokens_total": daily_tokens or 0
        }
    }
    return receipt

if __name__ == "__main__":
    # Read from stdin
    try:
        input_data = sys.stdin.read()
        if not input_data.strip():
            print(json.dumps({"error": "No input provided"}))
            sys.exit(1)
            
        event = json.loads(input_data)
        receipt = process_event(event)
        print(json.dumps(receipt))
    except Exception as e:
        print(json.dumps({"status": "error", "message": str(e)}))
        sys.exit(1)
