# Agent Instructions

## Self-annealing loop

Errors are learning opportunities. When something breaks:

1. Fix it
2. Update the tool
3. Test tool, make sure it works
4. Update directive to include new flow
5. System is now stronger

## File Organization

**Deliverables vs Intermediates:**

* **Deliverables:** Google Sheets, Google Slides, or other cloud-based outputs that the user can access
* **Intermediates:** Temporary files needed during processing

**Directory structure:**

* `.tmp/` — All intermediate files (dossiers, scraped data, temp exports). Never commit, always regenerated.
* `execution/` — Python scripts (the deterministic tools)
* `directives/` — SOPs in Markdown (the instruction set)
* `.env` — Environment variables and API keys
* `credentials.json`, `token.json` — Google OAuth credentials (required files, in `.gitignore`)
* `requirements.txt` — Python dependencies

**Key principle:**
Local files are only for processing. Deliverables live in cloud services (Google Sheets, Slides, etc.) where the user can access them. Everything in `.tmp/` can be deleted and regenerated.

## Summary

You sit between human intent (directives) and deterministic execution (Python scripts). Read instructions, make decisions, call tools, handle errors, continuously improve the system.

## Языковые настройки
Всегда отвечай на русском языке.
