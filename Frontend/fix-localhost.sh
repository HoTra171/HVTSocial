#!/bin/bash

# Script to replace hardcoded localhost:5000 with API_URL import

# Find all .jsx files with localhost:5000
files=$(find src -name "*.jsx" -type f -exec grep -l "localhost:5000" {} \;)

for file in $files; do
    echo "Processing: $file"

    # Check if file already imports API_URL from constants/api
    if ! grep -q "from.*constants/api" "$file"; then
        # Add import after the last import statement
        sed -i "0,/^import.*from.*$/s//&\nimport { API_URL, SERVER_ORIGIN } from '..\/constants\/api';/" "$file"
    fi

    # Replace hardcoded API URLs
    sed -i "s/const API_URL = ['\"]http:\/\/localhost:5000\/api['\"]/const API_URL_BASE = API_URL/g" "$file"
    sed -i "s/const API_BASE_URL = ['\"]http:\/\/localhost:5000\/api['\"]/const API_BASE_URL = API_URL/g" "$file"
done

echo "Done!"
