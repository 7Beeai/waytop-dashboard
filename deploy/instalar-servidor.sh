#!/bin/bash
# Instalação única do Dashboard WAYTOP no servidor (o mesmo do dashboard CDT).
# Só cria coisas novas do WAYTOP: /var/www/html/waytop.7bee.ai, /opt/waytop-dashboard,
# /opt/waytop-ig, /etc/waytop-ig.env, o site nginx waytop.7bee.ai e o serviço waytop-ig.
# Não mexe em nenhum arquivo do CDT.
# Uso (no servidor):  curl -fsSL https://raw.githubusercontent.com/7Beeai/waytop-dashboard/main/deploy/instalar-servidor.sh | sudo bash
set -e
REPO=https://github.com/7Beeai/waytop-dashboard
DOM=waytop.7bee.ai

echo "==> 1/5 Código"
if [ -d /opt/waytop-dashboard/.git ]; then git -C /opt/waytop-dashboard pull -q; else git clone -q --depth 1 $REPO /opt/waytop-dashboard; fi
cd /opt/waytop-dashboard

echo "==> 2/5 Site"
mkdir -p /var/www/html/$DOM && rsync -a --delete ./site/ /var/www/html/$DOM/

echo "==> 3/5 nginx"
if [ ! -f /etc/nginx/sites-available/$DOM ]; then
  cp deploy/nginx-waytop.conf /etc/nginx/sites-available/$DOM
  ln -sf /etc/nginx/sites-available/$DOM /etc/nginx/sites-enabled/$DOM
fi
nginx -t && systemctl reload nginx

echo "==> 4/5 HTTPS"
if getent hosts $DOM >/dev/null; then
  certbot --nginx -d $DOM --non-interactive --agree-tos --redirect -m "${CERT_EMAIL:-admin@7bee.ai}" || echo "   certbot falhou: confira o DNS e rode de novo"
else
  echo "   $DOM ainda não aponta para este servidor. Crie o registro DNS e rode o script de novo."
fi

echo "==> 5/5 Conector Instagram"
command -v node >/dev/null || { echo "   Node não encontrado: instale Node 18+ e rode de novo"; exit 1; }
mkdir -p /opt/waytop-ig && cp connector/server.js /opt/waytop-ig/server.js
if [ ! -f /etc/waytop-ig.env ]; then
  cp connector/waytop-ig.env.exemplo /etc/waytop-ig.env && chmod 600 /etc/waytop-ig.env
  read -r -s -p "   Cole a Chave secreta do app da Meta (não aparece na tela) e tecle Enter: " SEG < /dev/tty; echo
  sed -i "s|^META_APP_SECRET=.*|META_APP_SECRET=$SEG|" /etc/waytop-ig.env
fi
sed -i "s|/usr/bin/node|$(command -v node)|" connector/waytop-ig.service
cp connector/waytop-ig.service /etc/systemd/system/waytop-ig.service
systemctl daemon-reload && systemctl enable --now waytop-ig && systemctl restart waytop-ig
sleep 1; curl -s -o /dev/null -w "   conector respondeu HTTP %{http_code} (302 = ok)\n" http://127.0.0.1:8787/api/ig/login || true
echo "==> Pronto: https://$DOM"
