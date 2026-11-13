# Conector Instagram da avaliação de perfil

## Pedido de autorização (padrão desde 13/11)

1. Na avaliação, digite o @ e clique em **Pedir autorização**. O servidor cria um pedido (/var/lib/waytop-ig/pedidos/<id>.json) e devolve o link `https://waytop.7bee.ai/api/ig/autorizar/<id>`.
2. Mande o link ao candidato (botões Copiar link e WhatsApp). Na lista, o pedido fica **aguardando aprovação**; a página confere a cada 15 s.
3. O candidato abre o link, clica em **Autorizar com o Instagram** e entra na Meta. Os números são lidos uma vez, gravados no pedido e o token é descartado.
4. O status muda para **aprovado** e o botão **Ver dados** mostra perfil, bio, seguidores, seguindo, publicações, curtidas, comentários, alcance e salvos por post, engajamento, posts por semana, % de Reels, alcance dos stories, público (Brasil, 18–34, gênero, cidades) e os últimos posts. O nicho é escolhido à mão.

A lista de pedidos fica guardada no navegador de quem criou (os ids); os dados ficam no servidor. Enquanto o app estiver em modo de desenvolvimento, só contas testadoras conseguem autorizar. Para qualquer candidato, o app precisa da Análise do app da Meta.

A busca pelo @ (Business Discovery, `/api/ig/perfil`) e o login direto (`/api/ig/login`) continuam no servidor, sem botão na página.

## O que vem do Instagram

| Campo da nota | De onde vem | Observação |
|---|---|---|
| Seguidores | perfil | sempre vem |
| Curtidas + comentários por post | média dos últimos 12 posts do feed | sempre vem se houver posts |
| Público no Brasil | demografia dos seguidores por país | exige 100 ou mais seguidores |
| Público de 18 a 34 | demografia por idade (18–24 + 25–34) | exige 100 ou mais seguidores |
| Alcance médio dos stories | stories ativos no momento | a API só mostra stories das últimas 24 h. Sem story ativo, o campo fica para preencher à mão |

## Passo 1: app na Meta (feito em 13/11: app "WAYTOP Comercial", empresa 7B3 - WTP)

A Meta agora obriga apps novos a usar o **login unificado**: o candidato entra com Instagram ou Facebook por uma "configuração" do app.

1. Casos de uso > Gerenciar mensagens e conteúdo no Instagram > Personalizar > **API setup with Unified login**.
2. Em "URL de redirecionamento", salve `https://waytop.7bee.ai/api/ig/callback`.
3. **Criar nova configuração**: em "Editar permissões", adicione `instagram_manage_insights` (sem ela não vem país nem idade). Anote o **ID da configuração** (META_CONFIG_ID).
4. Configurações do app > Básico: **ID do app** (META_APP_ID) e **Chave secreta do app** (META_APP_SECRET).
5. Testador: no passo "2. Gerar tokens de acesso" > Adicionar conta, convide o Instagram profissional que será testado. O dono aceita no Instagram pela web: Configurações > Permissões do site > Apps e sites > Convites de testador.

Para avaliar candidatos sem convite de testador, o app precisa da **Análise do app** (acesso avançado às permissões) e ficar em modo Publicado.
O candidato precisa de conta profissional do Instagram; pela documentação, o login unificado também pede um portfólio empresarial dono da conta (a própria Meta oferece criar no fluxo).

## Passo 2: servidor (junto com o waytop.7bee.ai)

```bash
sudo mkdir -p /opt/waytop-ig && sudo cp server.js /opt/waytop-ig/
sudo cp waytop-ig.env.exemplo /etc/waytop-ig.env && sudo chmod 600 /etc/waytop-ig.env
sudo nano /etc/waytop-ig.env        # preencher META_APP_ID, META_APP_SECRET e META_CONFIG_ID
sudo cp waytop-ig.service /etc/systemd/system/
sudo systemctl daemon-reload && sudo systemctl enable --now waytop-ig
```

No nginx, o arquivo `../deploy/nginx-waytop.conf` já tem a rota `/api/ig/`. Depois de copiar, rode `sudo nginx -t && sudo systemctl reload nginx`.

Precisa de Node 18 ou mais novo (`node -v`).

## Testar

Abra `https://waytop.7bee.ai/#avaliacao`, clique em **Conectar Instagram do candidato**, entre com a conta testadora e autorize. Você volta para o formulário preenchido. Se algo falhar, a mensagem aparece em vermelho no formulário e o detalhe fica em `journalctl -u waytop-ig`.

## Ainda não testado contra a Meta

O código segue a documentação da API, mas só foi testado localmente (redirecionamento e erros). O primeiro teste real é com o app e a conta testadora acima. Se a Meta mudar algum nome de métrica, o campo afetado aparece como "preencher à mão" em vez de quebrar.
