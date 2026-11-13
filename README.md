# Dashboard Comercial WAYTOP

Painel de influencers e indicação de alunos, publicado em https://waytop.7bee.ai.

- `site/`: a página (HTML único + `beerobot.webp`). Mesma versão do artefato no Claude.
- `connector/`: servidor do conector Instagram (avaliação de perfil). Veja `connector/LEIA-ME.md`.
- `deploy/nginx-waytop.conf`: site do nginx (inclui a rota `/api/ig/`).
- `deploy.sh` + `.github/workflows/deploy.yml`: a cada push na `main`, o runner self-hosted publica o site e reinicia o conector.

## Instalação no servidor (uma vez)

1. Registrar um runner self-hosted para este repositório (ou usar um runner da organização 7Beeai).
2. DNS: registro A de `waytop.7bee.ai` para o IP do servidor.
3. nginx: `sudo cp deploy/nginx-waytop.conf /etc/nginx/sites-available/waytop.7bee.ai && sudo ln -s /etc/nginx/sites-available/waytop.7bee.ai /etc/nginx/sites-enabled/ && sudo nginx -t && sudo systemctl reload nginx`
4. HTTPS: `sudo certbot --nginx -d waytop.7bee.ai`
5. Conector: seguir `connector/LEIA-ME.md` (a chave secreta da Meta vai só em `/etc/waytop-ig.env`, nunca no repositório).
