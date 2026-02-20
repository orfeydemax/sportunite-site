import requests
import json
import argparse
import sys
import os

# Default Figma API base URL
API_BASE_URL = "https://api.figma.com/v1"

def get_file_nodes(token, file_key, node_ids=None):
    """
    Fetch specific nodes from a Figma file.
    """
    headers = {"X-Figma-Token": token}
    url = f"{API_BASE_URL}/files/{file_key}"
    
    params = {}
    if node_ids:
        url += "/nodes"
        params["ids"] = node_ids

    try:
        response = requests.get(url, headers=headers, params=params)
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        print(f"Error fetching nodes: {e}", file=sys.stderr)
        return None

def get_image_urls(token, file_key, node_ids, scale=1, format="png"):
    """
    Get image URLs for specific node IDs.
    """
    headers = {"X-Figma-Token": token}
    url = f"{API_BASE_URL}/images/{file_key}"
    
    params = {
        "ids": node_ids,
        "scale": scale,
        "format": format
    }

    try:
        response = requests.get(url, headers=headers, params=params)
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        print(f"Error fetching images: {e}", file=sys.stderr)
        return None

def simplify_node(node):
    """
    Extract key properties from a Figma node for simpler processing.
    """
    simple = {
        "id": node.get("id"),
        "name": node.get("name"),
        "type": node.get("type"),
        "visible": node.get("visible", True),
    }

    if "absoluteBoundingBox" in node:
        bbox = node["absoluteBoundingBox"]
        simple["x"] = bbox["x"]
        simple["y"] = bbox["y"]
        simple["width"] = bbox["width"]
        simple["height"] = bbox["height"]

    if "fills" in node:
        simple["fills"] = node["fills"]
    
    if "strokes" in node:
        simple["strokes"] = node["strokes"]
        
    if "strokeWeight" in node:
        simple["strokeWeight"] = node["strokeWeight"]

    if "style" in node:
        # Text styles
        simple["style"] = node["style"]
    
    if "characters" in node:
        simple["text"] = node["characters"]

    if "children" in node:
        simple["children"] = [simplify_node(child) for child in node["children"]]

    return simple

def main():
    parser = argparse.ArgumentParser(description="Figma API Client for AntiGravity")
    parser.add_argument("--token", required=True, help="Figma Personal Access Token")
    parser.add_argument("--file_key", required=True, help="Figma File Key")
    parser.add_argument("--node_ids", help="Comma-separated list of Node IDs to fetch (optional)")
    parser.add_argument("--action", choices=["get_nodes", "get_images"], default="get_nodes", help="Action to perform")
    parser.add_argument("--output", help="Output JSON file path (optional, prints to stdout if not set)")

    args = parser.parse_args()

    result = {}

    if args.action == "get_nodes":
        data = get_file_nodes(args.token, args.file_key, args.node_ids)
        if data:
            if args.node_ids:
                # If requesting specific nodes, the structure is slightly different
                nodes = data.get("nodes", {})
                processed_nodes = {k: simplify_node(v["document"]) for k, v in nodes.items()}
                result = processed_nodes
            else:
                # Full file
                document = data.get("document", {})
                result = simplify_node(document)
    
    elif args.action == "get_images":
        if not args.node_ids:
            print("Error: --node_ids is required for get_images action", file=sys.stderr)
            sys.exit(1)
        
        data = get_image_urls(args.token, args.file_key, args.node_ids)
        if data:
            result = data.get("images", {})

    # Output
    json_output = json.dumps(result, indent=2, ensure_ascii=False)
    
    if args.output:
        with open(args.output, "w", encoding="utf-8") as f:
            f.write(json_output)
        print(f"Output written to {args.output}")
    else:
        print(json_output)

if __name__ == "__main__":
    main()
