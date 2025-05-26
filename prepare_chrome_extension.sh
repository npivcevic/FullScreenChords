#!/bin/bash

# Exit if any command fails
set -e

# Configuration
EXTENSION_DIR="${1:-.}"             # Default to current directory if no argument
OUTPUT_ZIP="chrome-extension.zip"
REQUIRED_FILES=("manifest.json")

echo "Preparing Chrome Extension in: $EXTENSION_DIR"

# Step 1: Check required files
echo "Checking for required files..."
for file in "${REQUIRED_FILES[@]}"; do
    if [[ ! -f "$EXTENSION_DIR/$file" ]]; then
        echo "❌ Missing required file: $file"
        exit 1
    fi
done
echo "✅ All required files found."

# Step 2: Remove previous zip file if exists
if [[ -f "$OUTPUT_ZIP" ]]; then
    echo "Removing existing $OUTPUT_ZIP..."
    rm "$OUTPUT_ZIP"
fi

# Step 3: Create ZIP archive
echo "Creating ZIP archive: $OUTPUT_ZIP..."
cd "$EXTENSION_DIR"
zip -r "../$OUTPUT_ZIP" . -x '*.DS_Store' '*.git*' '*node_modules*' > /dev/null
cd - > /dev/null

echo "✅ Chrome extension ZIP created: $OUTPUT_ZIP"
