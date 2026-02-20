import sqlite3
import datetime
import sys
import json
import argparse
from pathlib import Path

SKILL_ROOT = Path(__file__).parent.parent
# Re-use DB logic or just duplicate for independence
def get_db_path():
    import os
    env_path = os.environ.get("LLM_BILLING_DB_PATH")
    if env_path: return Path(env_path)
    # Fallback same as track.py
    data_dir = SKILL_ROOT / "data"
    if not data_dir.exists():
        # Try finding in parent .agent
        current = Path.cwd()
        for _ in range(5):
            if (current / ".agent").exists():
                return current / ".agent" / "data" / "llm_billing.sqlite3"
            current = current.parent
    return data_dir / "llm_billing.sqlite3"

DB_PATH = get_db_path()

def generate_report(period="day", date_str=None, fmt="text"):
    if not DB_PATH.exists():
        return "Database not found."
        
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    if period == "day":
        target_date = date_str or datetime.datetime.now().strftime("%Y-%m-%d")
        query = """
            SELECT 
                provider, model, 
                SUM(cost_usd) as total_cost, 
                SUM(input_tokens) as total_input,
                SUM(output_tokens) as total_output,
                COUNT(*) as call_count
            FROM llm_calls
            WHERE date(timestamp) = ?
            GROUP BY provider, model
            ORDER BY total_cost DESC
        """
        cursor.execute(query, (target_date,))
        rows = cursor.fetchall()
        
        # Grand total
        cursor.execute("SELECT SUM(cost_usd) FROM llm_calls WHERE date(timestamp) = ?", (target_date,))
        grand_total = cursor.fetchone()[0] or 0.0
        
        if fmt == "json":
            data = {
                "date": target_date,
                "total_cost_usd": grand_total,
                "breakdown": [dict(r) for r in rows]
            }
            return json.dumps(data, indent=2)
        else:
            lines = [f"LLM Cost Report for {target_date}", "="*30]
            lines.append(f"Total Cost: ${grand_total:.4f}\n")
            lines.append(f"{'Provider':<12} {'Model':<25} {'Calls':<6} {'Cost':<10}")
            lines.append("-" * 60)
            for r in rows:
                lines.append(f"{r['provider']:<12} {r['model']:<25} {r['call_count']:<6} ${r['total_cost']:.4f}")
            return "\n".join(lines)

    elif period == "month":
        # Simplified month logic
        target_month = date_str or datetime.datetime.now().strftime("%Y-%m") # YYYY-MM
        query = """
             SELECT 
                date(timestamp) as day,
                SUM(cost_usd) as daily_cost
            FROM llm_calls
            WHERE strftime('%Y-%m', timestamp) = ?
            GROUP BY day
            ORDER BY day
        """
        cursor.execute(query, (target_month,))
        rows = cursor.fetchall()
        
        cursor.execute("SELECT SUM(cost_usd) FROM llm_calls WHERE strftime('%Y-%m', timestamp) = ?", (target_month,))
        grand_total = cursor.fetchone()[0] or 0.0
        
        if fmt == "json":
            return json.dumps({"month": target_month, "total": grand_total, "days": [dict(r) for r in rows]})
        else:
            lines = [f"Monthly Report: {target_month}", f"Total: ${grand_total:.4f}", "-"*20]
            for r in rows:
                lines.append(f"{r['day']}: ${r['daily_cost']:.4f}")
            return "\n".join(lines)

    conn.close()

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--period", default="day", choices=["day", "month"])
    parser.add_argument("--date", help="YYYY-MM-DD or YYYY-MM")
    parser.add_argument("--format", default="text", choices=["text", "json"])
    args = parser.parse_args()
    
    print(generate_report(args.period, args.date, args.format))
