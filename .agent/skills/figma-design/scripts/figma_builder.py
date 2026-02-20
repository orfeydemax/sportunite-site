import json
import argparse
import sys

def generate_color(color_def):
    """
    Generates JS object for RGB color.
    Assumes input color has r, g, b in 0-1 range.
    """
    if not color_def:
        return "{r: 0, g: 0, b: 0}"
    return f"{{r: {color_def.get('r', 0)}, g: {color_def.get('g', 0)}, b: {color_def.get('b', 0)}}}"

def generate_effects(effects_def):
    """
    Generates JS code for effects (Shadows).
    """
    if not effects_def:
        return "[]"
    
    effects_js = []
    for effect in effects_def:
        type_ = effect.get("type", "DROP_SHADOW")
        color = generate_color(effect.get("color", {"r": 0, "g": 0, "b": 0, "a": 0.25}))
        offset = effect.get("offset", {"x": 0, "y": 4})
        radius = effect.get("radius", 4)
        spread = effect.get("spread", 0)
        visible = effect.get("visible", True)
        blendMode = effect.get("blendMode", "NORMAL")
        opacity = effect.get("color", {}).get("a", 1) # Extract alpha from color if valid

        effects_js.append(
            f"{{type: '{type_}', color: {{...{color}, a: {opacity}}}, offset: {{x: {offset['x']}, y: {offset['y']}}}, radius: {radius}, spread: {spread}, visible: {str(visible).lower()}, blendMode: '{blendMode}'}}"
        )
    
    return f"[{', '.join(effects_js)}]"

def generate_node_code(node, parent_var="figma.currentPage"):
    """
    Recursively generates JS code to create nodes.
    """
    node_type = node.get("type", "FRAME")
    node_name = node.get("name", "Generated Node")
    
    code = []
    var_name = f"node_{id(node)}" # Simple unique var name
    
    if node_type == "FRAME":
        code.append(f"const {var_name} = figma.createFrame();")
    elif node_type == "RECTANGLE":
        code.append(f"const {var_name} = figma.createRectangle();")
    elif node_type == "TEXT":
        code.append(f"const {var_name} = figma.createText();")
        # Load font (simplified)
        code.append(f"await figma.loadFontAsync({{ family: 'Inter', style: 'Regular' }});")
        if "characters" in node:
            code.append(f"{var_name}.characters = '{node.get('characters', '')}';")
        if "fontSize" in node:
             code.append(f"{var_name}.fontSize = {node.get('fontSize', 12)};")
        if "textAlignHorizontal" in node:
             code.append(f"{var_name}.textAlignHorizontal = '{node.get('textAlignHorizontal', 'LEFT')}';")
        if "textAlignVertical" in node:
             code.append(f"{var_name}.textAlignVertical = '{node.get('textAlignVertical', 'TOP')}';")
         
    elif node_type == "ELLIPSE":
        code.append(f"const {var_name} = figma.createEllipse();")
    else:
        # Fallback to rectangle for unknown types
        code.append(f"const {var_name} = figma.createRectangle();")
        code.append(f"// Unknown type {node_type}, created Rectangle instead")

    # Common properties
    code.append(f"{var_name}.name = '{node_name}';")
    code.append(f"{var_name}.x = {node.get('x', 0)};")
    code.append(f"{var_name}.y = {node.get('y', 0)};")
    code.append(f"{var_name}.resize({node.get('width', 100)}, {node.get('height', 100)});")
    
    # Corner Radius
    if "cornerRadius" in node:
        code.append(f"{var_name}.cornerRadius = {node['cornerRadius']};")

    # Fills (Simplified: supports single solid color)
    fills = node.get("fills")
    if fills and len(fills) > 0:
        first_fill = fills[0] # Handle only first fill for simplicity in this version
        if first_fill.get("type") == "SOLID":
            color = first_fill.get("color")
            opacity = color.get("a", 1.0)
            code.append(f"{var_name}.fills = [{{type: 'SOLID', color: {generate_color(color)}, opacity: {opacity}}}]")

    # Strokes
    if "strokes" in node and len(node["strokes"]) > 0:
         first_stroke = node["strokes"][0]
         if first_stroke.get("type") == "SOLID":
            color = first_stroke.get("color")
            code.append(f"{var_name}.strokes = [{{type: 'SOLID', color: {generate_color(color)}}}]")
    
    if "strokeWeight" in node:
        code.append(f"{var_name}.strokeWeight = {node['strokeWeight']};")

    # Effects (Shadows)
    if "effects" in node:
        code.append(f"{var_name}.effects = {generate_effects(node['effects'])};")

    # Auto layout (Basic support)
    if "layoutMode" in node:
        code.append(f"{var_name}.layoutMode = '{node['layoutMode']}';")
        code.append(f"{var_name}.primaryAxisSizingMode = '{node.get('primaryAxisSizingMode', 'FIXED')}';")
        code.append(f"{var_name}.counterAxisSizingMode = '{node.get('counterAxisSizingMode', 'FIXED')}';")
        code.append(f"{var_name}.itemSpacing = {node.get('itemSpacing', 0)};")
        code.append(f"{var_name}.paddingLeft = {node.get('paddingLeft', 0)};")
        code.append(f"{var_name}.paddingRight = {node.get('paddingRight', 0)};")
        code.append(f"{var_name}.paddingTop = {node.get('paddingTop', 0)};")
        code.append(f"{var_name}.paddingBottom = {node.get('paddingBottom', 0)};")


    # Connect to parent
    code.append(f"{parent_var}.appendChild({var_name});")
    
    # Children
    children = node.get("children", [])
    for child in children:
        code.append(generate_node_code(child, parent_var=var_name))
        
    return "\n".join(code)

def main():
    parser = argparse.ArgumentParser(description="Generate Figma Plugin Code from JSON")
    parser.add_argument("--input", required=True, help="Input JSON file path with design spec")
    parser.add_argument("--output", help="Output JS file path (optional, prints to stdout)")

    args = parser.parse_args()

    try:
        with open(args.input, "r", encoding="utf-8") as f:
            design_data = json.load(f)
    except Exception as e:
        print(f"Error reading input file: {e}", file=sys.stderr)
        sys.exit(1)

    # Header
    js_code = [
        "// Generated Figma Plugin Code",
        "// Run this in Figma Console or Plugins like Scripter",
        "(async () => {",
    ]

    # Body
    if isinstance(design_data, list):
        for node in design_data:
            js_code.append(generate_node_code(node))
    else:
        js_code.append(generate_node_code(design_data))

    # Footer
    js_code.append("figma.notify('Design generated by AntiGravity');")
    js_code.append("})();")

    final_code = "\n".join(js_code)

    if args.output:
        with open(args.output, "w", encoding="utf-8") as f:
            f.write(final_code)
        print(f"Code written to {args.output}")
    else:
        print(final_code)

if __name__ == "__main__":
    main()
