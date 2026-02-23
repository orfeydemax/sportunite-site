import argparse
import json
import zipfile
import sys
import logging
import os

# Configure logging
logging.basicConfig(level=logging.INFO, format="%(message)s", stream=sys.stdout)
logger = logging.getLogger(__name__)


def extract_content_json(xmind_path):
    """
    Extracts content.json from the XMind Zen (ZIP) archive.
    """
    try:
        with zipfile.ZipFile(xmind_path, "r") as zf:
            if "content.json" in zf.namelist():
                return json.loads(zf.read("content.json"))
            else:
                logger.error("Error: content.json not found in the XMind file.")
                return None
    except Exception as e:
        logger.error(f"Error reading XMind file: {e}")
        return None


def parse_topic(topic, level=0):
    """
    Recursively parses the topic structure and yields formatted strings.
    """
    indent = "  " * level
    title = topic.get("title", "Untitled")

    # Format: - Title
    output = [f"{indent}- {title}"]

    # Check for images
    image = topic.get("image", {})
    if image and image.get("src"):
        output.append(f"{indent}  (Image: {image.get('src')})")

    # Check for notes
    notes = topic.get("notes", {}).get("plain", {}).get("content", "")
    if notes:
        output.append(f"{indent}  (Note: {notes.strip()})")

    # Access children. In XMind Zen, children are often under "children" -> "attached"
    children_wrapper = topic.get("children", {})
    attached_children = children_wrapper.get("attached", [])

    # Sometimes structure is different, check direct list if "attached" is missing but "children" is a list (rare in proper Zen, but good for safety)
    if isinstance(children_wrapper, list):
        attached_children = children_wrapper

    for child in attached_children:
        output.extend(parse_topic(child, level + 1))

    return output


def main():
    parser = argparse.ArgumentParser(
        description="Read and output content from an XMind Zen file."
    )
    parser.add_argument("file", help="Path to the .xmind file")

    args = parser.parse_args()

    if not os.path.exists(args.file):
        logger.error(f"File not found: {args.file}")
        sys.exit(1)

    content_data = extract_content_json(args.file)

    if content_data:
        # XMind Zen content.json matches a list of sheets
        print(f"\n📄 Reading XMind: {os.path.basename(args.file)}\n")

        for sheet in content_data:
            sheet_title = sheet.get("title", "Untitled Sheet")
            print(f"# 📑 Sheet: {sheet_title}\n")

            root_topic = sheet.get("rootTopic")
            if root_topic:
                lines = parse_topic(root_topic)
                for line in lines:
                    print(line)
            print("\n" + "-" * 40 + "\n")


if __name__ == "__main__":
    main()
