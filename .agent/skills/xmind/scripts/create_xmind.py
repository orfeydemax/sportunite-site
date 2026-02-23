import argparse
import json
import logging
import os
import sys
import zipfile
import uuid
import tempfile
import shutil

# Configure logging
logging.basicConfig(
    level=logging.INFO, format="%(levelname)s: %(message)s", stream=sys.stdout
)
logger = logging.getLogger(__name__)

# XMind Structure Classes
STRUCTURE_MAP = {
    "radial": "org.xmind.ui.map.unbalanced",
    "map": "org.xmind.ui.map.unbalanced",
    "logic_right": "org.xmind.ui.logic.right",
    "flow": "org.xmind.ui.logic.right",
    "logic_left": "org.xmind.ui.logic.left",
    "tree_right": "org.xmind.ui.tree.right",
    "tree_left": "org.xmind.ui.tree.left",
    "tree": "org.xmind.ui.tree.right",
    "org_chart": "org.xmind.ui.org-chart.down",
    "fishbone_right": "org.xmind.ui.fishbone.right",
    "fishbone": "org.xmind.ui.fishbone.right",
    "fishbone_left": "org.xmind.ui.fishbone.left",
    "timeline_horizontal": "org.xmind.ui.timeline.horizontal",
    "timeline": "org.xmind.ui.timeline.horizontal",
    "timeline_vertical": "org.xmind.ui.timeline.vertical",
    "matrix": "org.xmind.ui.spreadsheet",
}

# Semantic Types -> Icons & Labels
TYPE_STYLES = {
    "ai": {"icon": "symbol-check", "label": "AI/LLM", "prefix": "🧠 "},
    "db": {"icon": "symbol-list", "label": "Database", "prefix": "🗄️ "},
    "cloud": {"icon": "symbol-flag", "label": "Cloud", "prefix": "☁️ "},
    "user": {"icon": "symbol-person", "label": "User", "prefix": "👤 "},
    "error": {"icon": "symbol-wrong", "label": "Error", "prefix": "⚠️ "},
    "alert": {"icon": "symbol-warning", "label": "Alert", "prefix": "🚨 "},
    "idea": {"icon": "symbol-lightbulb", "label": "Idea", "prefix": "💡 "},
    "task": {"icon": "symbol-plus", "label": "Task", "prefix": "✅ "},
}

TEMPLATES = {
    "swot": {
        "title": "SWOT Анализ",
        "root": {
            "title": "🎯 Объект Анализа",
            "layout": "radial",
            "children": [
                {
                    "title": "💪 Strengths (Сильые стороны)",
                    "children": [{"title": "Пункт 1"}],
                },
                {
                    "title": "📉 Weaknesses (Слабые стороны)",
                    "children": [{"title": "Пункт 1"}],
                },
                {
                    "title": "🚀 Opportunities (Возможности)",
                    "children": [{"title": "Пункт 1"}],
                },
                {"title": "⚠️ Threats (Угрозы)", "children": [{"title": "Пункт 1"}]},
            ],
        },
    },
    "jtbd": {
        "title": "Job To Be Done",
        "root": {
            "title": "🎯 Основная Работа (Job)",
            "layout": "logic_right",
            "children": [
                {"title": "🎭 Situations (Когда...)"},
                {"title": "⚡ Motivations (Я хочу...)"},
                {"title": "🏆 Outcomes (Чтобы...)"},
            ],
        },
    },
    "journey": {
        "title": "User Journey Map",
        "root": {
            "title": "🗺️ Путь Пользователя",
            "layout": "timeline_horizontal",
            "children": [
                {"title": "1. Awareness", "children": [{"title": "Touchpoint"}]},
                {"title": "2. Consideration", "children": [{"title": "Touchpoint"}]},
                {"title": "3. Conversion", "children": [{"title": "Touchpoint"}]},
                {"title": "4. Retention", "children": [{"title": "Touchpoint"}]},
            ],
        },
    },
}


def generate_id():
    """Generates a unique ID for XMind elements."""
    return str(uuid.uuid4()).replace("-", "")


class XMindCreator:
    def __init__(self):
        self.resources = []  # {local_path, zip_path}
        self.nodes_by_id = {}  # Map user-provided or auto-generated IDs to internal IDs
        self.relationships = []

    def detect_layout(self, node_data, depth):
        """Heuristic to detect layout if 'auto' is specified."""
        children = node_data.get("children", [])
        titles = [str(c.get("title", "")) for c in children]

        if depth == 0:
            if len(children) > 4:
                return "radial"
            return "logic_right"

        # Timeline detection (1., 2. or Mon, Tue...)
        if any(t.strip().split(".")[0].isdigit() for t in titles[:3]):
            return "timeline_horizontal"

        # Fishbone detection
        if any("Cause" in t or "Причина" in t for t in titles):
            return "fishbone"

        if len(children) > 8:
            return "org_chart"

        return None

    def process_node(self, node_data, depth=0):
        """Recursively processes node data into XMind topic structure."""

        # Determine ID
        user_id = node_data.get("id")
        internal_id = generate_id()
        if user_id:
            self.nodes_by_id[user_id] = internal_id

        title = node_data.get("title", "Topic")

        # Apply Type Styling
        node_type = node_data.get("type", "").lower()
        style = TYPE_STYLES.get(node_type)
        labels = node_data.get("labels", [])
        if isinstance(labels, str):
            labels = [labels]

        if style:
            if not title.startswith(style["prefix"]):
                title = style["prefix"] + title
            if style["label"] not in labels:
                labels.append(style["label"])

        topic = {
            "id": internal_id,
            "title": title,
        }

        # Structure/Layout
        layout_key = node_data.get("layout") or node_data.get("structure")
        if layout_key == "auto":
            layout_key = self.detect_layout(node_data, depth)

        if layout_key in STRUCTURE_MAP:
            topic["structureClass"] = STRUCTURE_MAP[layout_key]
        elif depth == 0:
            topic["structureClass"] = STRUCTURE_MAP["map"]  # Default for root

        # Image
        if "image" in node_data and node_data["image"]:
            img_path = node_data["image"]
            if os.path.exists(img_path):
                ext = os.path.splitext(img_path)[1] or ".png"
                resource_name = f"{generate_id()}{ext}"
                zip_path = f"resources/{resource_name}"
                self.resources.append({"local_path": img_path, "zip_path": zip_path})
                topic["image"] = {"src": f"xap:{zip_path}"}
            else:
                logger.warning(f"Image not found: {img_path}")

        # Labels/Notes
        if labels:
            topic["labels"] = labels
        elif "label" in node_data:
            topic["labels"] = [node_data["label"]]

        if "notes" in node_data:
            topic["notes"] = {"plain": {"content": node_data["notes"]}}

        # Children
        children_data = node_data.get("children", [])
        if children_data:
            topic["children"] = {
                "attached": [self.process_node(c, depth + 1) for c in children_data]
            }

        # Detached
        detached_data = node_data.get("detached", [])
        if detached_data:
            if "children" not in topic:
                topic["children"] = {}
            topic["children"]["detached"] = [
                self.process_node(c, depth + 1) for c in detached_data
            ]

        return topic

    def process_relationships(self, rels_data):
        for rel in rels_data:
            start_id = self.nodes_by_id.get(rel.get("from"))
            end_id = self.nodes_by_id.get(rel.get("to"))
            if start_id and end_id:
                self.relationships.append(
                    {
                        "id": generate_id(),
                        "title": rel.get("title", ""),
                        "end1": start_id,
                        "end2": end_id,
                    }
                )

    def save(self, data, output_path):
        root_data = data.get("root", {"title": "Central Topic"})
        root_topic = self.process_node(root_data)

        if "relationships" in data:
            self.process_relationships(data["relationships"])

        sheet = {
            "id": generate_id(),
            "class": "sheet",
            "title": data.get("title", "Sheet 1"),
            "rootTopic": root_topic,
            "topicPositioning": "fixed",
        }
        if self.relationships:
            sheet["relationships"] = self.relationships

        content = [sheet]
        manifest = {
            "file-entries": {"content.json": {}, "metadata.json": {}, "styles.xml": {}}
        }
        for res in self.resources:
            manifest["file-entries"][res["zip_path"]] = {}

        # ATOMIC WRITE: Write to a temp file first
        tmp_fd, tmp_path = tempfile.mkstemp(suffix=".xmind.tmp")
        try:
            with os.fdopen(tmp_fd, "wb") as f:
                with zipfile.ZipFile(f, "w", zipfile.ZIP_DEFLATED) as zf:
                    zf.writestr(
                        "content.json",
                        json.dumps(content, indent=2, ensure_ascii=False),
                    )
                    zf.writestr("manifest.json", json.dumps(manifest, indent=2))
                    zf.writestr(
                        "metadata.json",
                        json.dumps(
                            {
                                "creator": {
                                    "name": "XMind Pro v3",
                                    "version": "3.0.0",
                                }
                            },
                            indent=2,
                        ),
                    )
                    zf.writestr(
                        "styles.xml",
                        '<xmap-styles xmlns:svg="http://www.w3.org/2000/svg" version="2.0"></xmap-styles>',
                    )
                    for res in self.resources:
                        zf.write(res["local_path"], res["zip_path"])

            # Ensure output directory exists
            os.makedirs(os.path.dirname(os.path.abspath(output_path)), exist_ok=True)

            # Atomic replace
            shutil.move(tmp_path, output_path)
            logger.info(f"Successfully created: {output_path}")
        except Exception as e:
            if os.path.exists(tmp_path):
                os.remove(tmp_path)
            logger.error(f"Failed: {e}")
            raise


def main():
    parser = argparse.ArgumentParser(
        description="Create an XMind file from JSON or Template. (Pro v3)",
        add_help=False,
    )
    group = parser.add_argument_group("Arguments")
    group.add_argument("-i", "--input", help="Path to JSON file or '-' for stdin")
    group.add_argument("-o", "--output", help="Output .xmind path")
    group.add_argument(
        "-t", "--template", help=f"Use template: {', '.join(TEMPLATES.keys())}"
    )
    group.add_argument(
        "--delete-input", action="store_true", help="Delete input file after success"
    )
    group.add_argument("-h", "--help", action="help", help="Show this help message")

    args, unknown = parser.parse_known_args()

    if unknown:
        print(f"\n❌ Error: Unknown arguments detected: {unknown}")
        sys.exit(1)

    if not args.output or (not args.input and not args.template):
        parser.print_help()
        sys.exit(1)

    # Load Data
    data = None
    if args.template:
        if args.template.lower() in TEMPLATES:
            data = TEMPLATES[args.template.lower()]
            logger.info(f"Using template: {args.template}")
        else:
            print(
                f"❌ Error: Template '{args.template}' not found. Available: {', '.join(TEMPLATES.keys())}"
            )
            sys.exit(1)
    else:
        try:
            if args.input == "-":
                data = json.load(sys.stdin)
            else:
                if not os.path.exists(args.input):
                    print(f"❌ Error: Input file not found: {args.input}")
                    sys.exit(1)
                with open(args.input, "r", encoding="utf-8") as f:
                    data = json.load(f)
        except json.JSONDecodeError as e:
            print(f"❌ Error: Invalid JSON: {e}")
            sys.exit(1)

    # Output Enforcement
    OUTPUT_DIR = (
        r"D:\MVProfi\AI агентство\Разработка приложений\PlastiLangua\Проект xmind"
    )
    output_path = args.output
    if not os.path.isabs(output_path):
        output_path = os.path.join(OUTPUT_DIR, output_path)
    if not output_path.endswith(".xmind"):
        output_path += ".xmind"

    creator = XMindCreator()
    creator.save(data, output_path)

    if args.delete_input and args.input and args.input != "-":
        try:
            os.remove(args.input)
        except Exception as e:
            logger.debug(f"Could not delete input file: {e}")


if __name__ == "__main__":
    main()
