#!/usr/bin/env bash
set -euo pipefail

mkdir -p dist
cp "HSK Vocab.html" dist/index.html
cp styles.css tweaks.js dist/

echo "Built dist/ from source"
ls -la dist/
