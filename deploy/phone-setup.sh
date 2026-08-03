#!/bin/bash
# Vaultly Android/Termux setup script

set -euo pipefail

echo "===================================================="
echo "    Vaultly Setup Agent - Android Termux/SSH        "
echo "===================================================="

# 1. Update package lists
echo "[*] Updating Termux packages..."
pkg update -y && pkg upgrade -y

# 2. Install core runtimes & compiler tools
# build-essential & python are required for compiling native node bindings (like better-sqlite3)
echo "[*] Installing Node.js, Sqlite, Nginx, and build tools..."
pkg install -y nodejs-lts git build-essential python sqlite nginx

# 3. Install global process manager
echo "[*] Installing global PM2 process manager..."
npm install -g pm2

# 4. Success summary
echo "----------------------------------------------------"
echo "[+] Dependency installation complete!"
echo "----------------------------------------------------"
echo "Next steps to run Vaultly in production:"
echo " 1. Move into the vaultly root directory."
echo " 2. Run 'npm run install:all' to download backend & frontend modules."
echo " 3. Compile the frontend: 'npm run build --prefix web'"
echo " 4. Compile the backend: 'npm run build --prefix server'"
echo " 5. Start Vaultly: 'pm2 start deploy/ecosystem.config.js'"
echo " 6. Setup Nginx using the configuration file in deploy/nginx.conf."
echo "===================================================="
