#!/usr/bin/env bash
# ============================================================================
# Porta MT: AirDrive - Self-Hosted Local Web Server (macOS / Linux)
# ============================================================================
#
# Web Bluetooth API is blocked by Chrome/Edge on file:// URLs for security.
# This script starts a local web server at http://localhost:8080 and opens it.
# ============================================================================

cd "$(dirname "$0")"

PORT=8080
URL="http://localhost:${PORT}/airdrive.html"

echo "=========================================================="
echo " Starting Porta MT: AirDrive Self-Hosted Server"
echo " URL: ${URL}"
echo "=========================================================="
echo "Note: To exit, close this terminal window or press Ctrl+C."
echo ""

# Open browser after a brief delay
(sleep 1 && (open "$URL" 2>/dev/null || xdg-open "$URL" 2>/dev/null || sensible-browser "$URL" 2>/dev/null)) &

# Launch Python 3 or Python 2 http server
if command -v python3 >/dev/null 2>&1; then
    python3 -m http.server "$PORT"
elif command -v python >/dev/null 2>&1; then
    python -m SimpleHTTPServer "$PORT"
else
    echo "Error: Python is required to run the local server."
    echo "Please install Python 3 or open airdrive.html through any local web server."
    read -p "Press Enter to exit..."
fi
