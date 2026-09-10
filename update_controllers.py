import os
import re

CONTROLLER_DIR = r"d:\avo-maitrise\back\src\main\java\com\avo\controller"

def update_controller(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    original = content

    # 1. Ensure import jakarta.validation.Valid;
    if '@RequestBody' in content and 'import jakarta.validation.Valid;' not in content:
        # insert after package or last import
        if 'package com.avo.controller;' in content:
            content = content.replace(
                'package com.avo.controller;',
                'package com.avo.controller;\n\nimport jakarta.validation.Valid;'
            )

    # 2. Replace @RequestBody with @Valid @RequestBody (avoiding duplicate @Valid @Valid)
    # Match @RequestBody not preceded by @Valid
    content = re.sub(r'(?<!@Valid\s)@RequestBody', '@Valid @RequestBody', content)

    if content != original:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Updated: {os.path.basename(filepath)}")
    else:
        print(f"No change: {os.path.basename(filepath)}")

for filename in os.listdir(CONTROLLER_DIR):
    if filename.endswith(".java"):
        update_controller(os.path.join(CONTROLLER_DIR, filename))
