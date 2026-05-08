#!/bin/bash
# DEPRECATED: this script has been consolidated into ./start.sh
# Kept as a compat shim so existing developer muscle-memory keeps working.
# Forward all args verbatim. New work should call ./start.sh directly.

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
echo "[deprecation] startwallet.sh now delegates to start.sh — call ./start.sh directly going forward."
exec "$SCRIPT_DIR/start.sh" "$@"
