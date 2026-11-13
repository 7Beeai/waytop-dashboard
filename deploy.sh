#!/bin/bash
# Publica o Dashboard Comercial WAYTOP em waytop.7bee.ai (mesmo esquema do Dashboard CDT:
# runner self-hosted + nginx). Só mexe em pastas do WAYTOP.
set -e
SITE_DIR="/var/www/html/waytop.7bee.ai"
sudo mkdir -p "$SITE_DIR"
sudo rsync -a --delete ./site/ "$SITE_DIR/"
echo "==> Site publicado em https://waytop.7bee.ai"

# Conector Instagram: atualiza só se já foi instalado (existe /etc/waytop-ig.env)
if [ -f /etc/waytop-ig.env ]; then
  sudo mkdir -p /opt/waytop-ig
  sudo cp ./connector/server.js /opt/waytop-ig/server.js
  sudo systemctl restart waytop-ig
  echo "==> Conector Instagram atualizado e reiniciado"
else
  echo "==> Conector Instagram ainda não instalado (ver connector/LEIA-ME.md)"
fi
