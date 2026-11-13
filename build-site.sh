#!/bin/bash
# Gera site/index.html a partir do index.html do artefato: cabeçalho completo + página sem a meta do Claude
set -e
SRC=${1:-/mnt/project-files/projeto-comercial/dashboard/index.html}
{ printf '<!doctype html>\n<html lang="pt-BR">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width,initial-scale=1">\n<meta name="robots" content="noindex">\n'; grep -v '<meta name="claude:' "$SRC"; } > site/index.html
