#!/bin/bash
# DEPRECATED: this script has been consolidated into ./start.sh
# Was 99% identical to startwallet.sh; both now share one entrypoint.
# Forward all args verbatim. New work should call ./start.sh directly.

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
echo "[deprecation] startwallet-admin.sh now delegates to start.sh — call ./start.sh directly going forward."
exec "$SCRIPT_DIR/start.sh" "$@"
