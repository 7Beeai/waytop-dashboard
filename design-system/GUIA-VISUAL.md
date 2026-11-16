# Guia visual do Dashboard WAYTOP

Referência completa do visual de https://waytop.7bee.ai, para aplicar a outro projeto sem mudar nenhuma funcionalidade dele.
A ideia é trocar só a pele: cores, fontes, raios, sombras e a forma dos componentes. A lógica, os dados e as rotas do outro projeto continuam como estão.

Arquivos desta pasta:

| Arquivo | Para que serve |
|---|---|
| `GUIA-VISUAL.md` | Este guia: todos os parâmetros, explicados |
| `waytop-visual.css` | O CSS exato do dashboard publicado, pronto para copiar (é a fonte da verdade) |
| `exemplo.html` | Página estática com os componentes principais montados, para comparar lado a lado |

Se este guia e o `waytop-visual.css` discordarem em algum valor, vale o CSS.

---

## 1. Princípios

- **Fundo escuro nos dois temas.** O tema padrão é escuro com laranja. O alternativo, pelo botão sol/lua, é escuro com lilás. Os nomes no código são "modo dia" (laranja, sem atributo) e "modo noite" (lilás, `data-theme="dark"`).
- **Uma cor de destaque por tema** (`--accent`), usada com moderação: aba ativa, botão primário, barra lateral dos KPIs, borda no hover, número do KPI em destaque.
- **Tudo vem de variáveis CSS.** Nenhum componente usa cor fixa, a não ser as medalhas do ranking e o branco do texto dentro do funil. Para trocar de tema, basta trocar as variáveis.
- **Cartões arredondados (18–20px)** com borda fina. No hover, a borda acende na cor de destaque e aparece um brilho suave.
- **Números sempre tabulares** (`font-variant-numeric: tabular-nums`), para não "pularem" quando mudam.
- **Textura de colmeia** (hexágonos) sumindo da direita para a esquerda no cabeçalho, nos cards "quentes" e no KPI em destaque. É herança do Dashboard CDT.

---

## 2. Fontes

```html
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Figtree:wght@400;500;600;700;800&family=Nunito:wght@700;800;900&display=swap">
```

| Variável | Fonte | Uso |
|---|---|---|
| `--f-ui` | `'Figtree', system-ui, -apple-system, sans-serif` | Texto, botões, tabelas, formulários |
| `--f-display` | `'Nunito', 'Figtree', system-ui, sans-serif` | Títulos (h1, h2 de card, título do cabeçalho, nome em destaque) |
| `--f-mono` | `'Figtree', system-ui, sans-serif` + `tabular-nums` | Números (KPIs, valores de ranking, tabelas) |

Base do `body`: 15px, line-height 1.5, `-webkit-font-smoothing: antialiased`.

### Escala tipográfica

| Elemento | Fonte | Tamanho | Peso | Extras |
|---|---|---|---|---|
| Título do cabeçalho ("Dashboard") | Nunito | `clamp(1.5rem, 4vw, 2.25rem)` | 900 | letter-spacing -0.015em, line-height 1.08, cor `--ink` (sólida) |
| Nome em destaque do cabeçalho ("Comercial") | Nunito | `clamp(1.25rem, 2.6vw, 1.75rem)` | 900 | line-height 1.15 |
| h1 de seção | Nunito | 22px | 800 | quadradinho de 12×12 na cor de destaque antes, raio 4px |
| Título de card (h2) | Nunito | 16px | 800 | |
| Título do destaque do mês | Nunito | 19px | 800 | `text-wrap: balance` |
| Valor do KPI | Figtree | 24px | 800 | tabular-nums, letter-spacing -0.01em |
| Texto normal | Figtree | 15px | 400 | |
| Linhas de ranking e listas | Figtree | 13.5px | 500 (nome) / 700 (valor) | |
| Tabela | Figtree | 13px | 400 | |
| Subtítulo de card / legenda | Figtree | 12.5px / 12px | 400 | cor `--muted` |
| Rótulo do KPI | Figtree | 12px | 600 | cor `--muted` |
| Cabeçalho de tabela | Figtree | 11px | 700 | MAIÚSCULAS, letter-spacing 0.08em |
| "Eyebrow" (rótulo acima de título) | Figtree | 11px | 700 | MAIÚSCULAS, letter-spacing 0.12em, cor `--accent-2` |
| Selo da marca ("WAYTOP") | Figtree | 11px | 700 | MAIÚSCULAS, letter-spacing 0.12em |
| Rótulo pequeno do cabeçalho ("Visão geral") | Figtree | 10.5px | 700 | MAIÚSCULAS, letter-spacing 0.12em |

---

## 3. Cores

### 3.1 Tema padrão: escuro com laranja (`:root`)

| Variável | Hex | HSL (para Tailwind/shadcn) | Uso |
|---|---|---|---|
| `--bg` | `#0a0a0f` | `240 20% 5%` | Fundo da página |
| `--card` | `#12121a` | `240 18% 9%` | Fundo dos cards |
| `--card-2` | `#0f0f16` | `240 19% 7%` | Fundo de blocos dentro de cards |
| `--fg` / `--ink` | `#e8e8ed` | `240 12% 92%` | Texto principal |
| `--muted` | `#6b6b80` | `240 9% 46%` | Texto secundário, rótulos |
| `--muted-2` | `#8a8aa3` | `240 12% 59%` | Texto de apoio um pouco mais claro |
| `--border` | `#1e1e2e` | `240 21% 15%` | Bordas e divisórias |
| `--border-2` | `#262638` | `240 19% 18%` | Bordas de campos e menus |
| `--secondary` | `#1a1a26` | `240 19% 13%` | Pílulas inativas, trilhos de barra, hover |
| `--accent` | `#fb923c` | `27 96% 61%` | Cor de destaque |
| `--accent-2` | `#fdba74` | `31 97% 72%` | Destaque claro (texto sobre escuro, eyebrow) |
| `--accent-deep` | `#ea580c` | `21 90% 48%` | Destaque escuro |
| `--on-accent` | `#1a0d00` | `30 100% 5%` | Texto sobre fundo `--accent` |
| `--mel-1` … `--mel-5` | `#ffedd5` `#fdba74` `#fb923c` `#f97316` `#ea580c` | | Escala para gradientes (título, barras, funil) |
| `--ok` / `--lime` | `#c6f25a` | `77 85% 65%` | Positivo, "Contratar", alta |
| `--warn` | `#fbbf24` | `43 96% 56%` | Atenção, dados de exemplo |
| `--bad` | `#f87171` | `0 91% 71%` | Negativo, "Não indicado", queda |
| `--info` | `#fde047` | `50 98% 64%` | Segunda série de dados (ex.: Indicação de alunos) |
| `--glow-rgb` / `--glow2-rgb` | `251 146 60` / `234 88 12` | | Brilhos e colmeia (formato `rgb(var(--glow-rgb) / .2)`) |

### 3.2 Tema alternativo: escuro com lilás (`:root[data-theme="dark"]`)

| Variável | Hex | HSL |
|---|---|---|
| `--bg` | `#0c0a12` | `255 29% 5%` |
| `--card` | `#14111d` | `255 26% 9%` |
| `--card-2` | `#181425` | `254 30% 11%` |
| `--fg` | `#f5f2fb` | `260 53% 97%` |
| `--ink` | `#e4d8ff` | `258 100% 92%` |
| `--muted` | `#a39cb8` | `255 16% 67%` |
| `--muted-2` | `#bdb6d2` | `255 24% 77%` |
| `--border` | `#2a2440` | `253 28% 20%` |
| `--border-2` | `#352d50` | `254 28% 25%` |
| `--secondary` | `#1e1930` | `253 32% 14%` |
| `--accent` | `#a78bfa` | `255 92% 76%` |
| `--accent-2` | `#c4b5fd` | `252 95% 85%` |
| `--accent-deep` | `#7c3aed` | `262 83% 58%` |
| `--on-accent` | `#1b1033` | `259 52% 13%` |
| `--mel-1` … `--mel-5` | `#ede9fe` `#c4b5fd` `#a78bfa` `#8b5cf6` `#7c3aed` | |
| `--ok` / `--lime` | `#c6f25a` | `77 85% 65%` |
| `--warn` | `#fbbf24` | `43 96% 56%` |
| `--bad` | `#f87171` | `0 91% 71%` |
| `--info` | `#f472b6` | `329 86% 70%` (rosa pink) |
| `--glow-rgb` / `--glow2-rgb` | `167 139 250` / `124 58 237` | |

### 3.3 Cores derivadas e efeitos

| Variável / efeito | Laranja | Lilás |
|---|---|---|
| `--field-bg` (fundo dos campos) | `color-mix(in srgb, var(--accent) 4%, var(--card-2))` | `#181425` |
| `--field-border` (borda dos campos) | `color-mix(in srgb, var(--accent) 14%, var(--border-2))` | `#352d50` |
| `--row-hover` (linha da tabela no hover) | `color-mix(in srgb, var(--accent) 7%, var(--secondary))` | `#1e1930` |
| `--shadow-lift` (brilho do card no hover) | `inset 0 0 31px rgb(251 146 60 / .10), 0 0 24px rgb(251 146 60 / .10)` | `0 18px 40px -18px rgba(0,0,0,.8), 0 0 0 1px rgb(167 139 250 / .24), 0 0 32px -8px rgb(167 139 250 / .28)` |
| Medalhas do ranking | ouro `hsl(45 100% 50%)`, prata `hsl(0 0% 75%)`, bronze `hsl(30 60% 45%)` | iguais |
| Gradiente do título | O CSS tem uma regra de gradiente para `.hero-title` (`linear-gradient(100deg, var(--mel-1), var(--mel-3) 45%, var(--mel-4))`), mas uma regra posterior define `color: var(--ink)`. Por isso, no site publicado, o título aparece em cor sólida. Copie o CSS como está para ficar igual | igual |
| Fundo da página | dois brilhos radiais fixos sobre `--bg`: `radial-gradient(900px 520px at 8% -8%, rgb(var(--glow-rgb) / .08), transparent 62%)` e `radial-gradient(760px 460px at 100% -4%, rgb(var(--glow2-rgb) / .06), transparent 60%)`, com `background-attachment: fixed` | igual |

Etiquetas e selos coloridos seguem uma fórmula só: **fundo com a cor a 14% de opacidade e texto na cor cheia**, por exemplo `background: color-mix(in srgb, var(--ok) 14%, transparent); color: var(--ok)`. Para `--warn`, o fundo é a 16%.

---

## 4. Formas, espaçamentos e sombras

| Item | Valor |
|---|---|
| Largura máxima do conteúdo | 1280px, centralizado |
| Margem lateral da página | 16px no celular, 28px a partir de 640px (respeitando `safe-area-inset`) |
| Espaço entre blocos da página | 22px (`.page`), 20px dentro das seções (`.wrap`) |
| Espaço entre cards em grade | 16px |
| Espaço entre KPIs | 12px |
| Raio do cabeçalho | 20px |
| Raio dos cards e KPIs | 18px |
| Raio de menus suspensos e caixas internas | 14px |
| Raio de mini-cards e itens de lista | 12px |
| Raio de campos de formulário | 10px |
| Raio de pílulas, botões, abas e etiquetas | 999px (totalmente arredondado) |
| Raio das barras do funil | 9px |
| Padding do card | 20px |
| Padding do KPI | 16px 16px 14px 18px |
| Padding do cabeçalho | 20px 22px |
| Altura de botão | 36px (pequeno: 30px) |
| Altura de campo | 38px |
| Borda padrão | 1px solid `var(--border)` |
| Linha sob o cabeçalho de seção | 2px solid `var(--border)` |
| Foco do teclado | `outline: 3px solid var(--accent); outline-offset: 3px` (campos: 2px, offset 1px) |
| Sombra de menus suspensos | `0 18px 40px rgb(0 0 0 / .35)` |
| Sombra do seletor de período | `0 24px 48px -16px rgb(0 0 0 / .35)` |

---

## 5. Layout da página

```
.page (máx. 1280px, colunas com gap 22px)
├── header.hero-top            cabeçalho em card, raio 20px, com brilho radial e colmeia
│   ├── .hero-bg               camada decorativa (círculo de brilho + colmeia)
│   ├── img.mascote            mascote no canto direito (opcional)
│   ├── .hero-row              à esquerda: marca e títulos; à direita: ações
│   │   ├── .brandtag          selo "WAYTOP"
│   │   ├── .hero-title        "Dashboard" (Nunito 900, cor --ink)
│   │   ├── .hero-sub          data e relógio ao vivo
│   │   ├── .hero-unit         ícone quadrado 44×44 + rótulo pequeno + nome grande
│   │   └── .hero-actions      botão de tema, granularidade, período
│   └── nav.navpills           abas em pílula (a ativa fica na cor de destaque)
└── main > .wrap > section     uma seção por aba
    ├── .head                  eyebrow (período) + h1 + subtítulo, com linha de 2px embaixo
    ├── .kpis                  grade de KPIs
    └── .grid (.g2 / .g3 / .g-main)  cards
```

### Pontos de quebra (breakpoints)

| Largura | O que muda |
|---|---|
| < 640px | Margem 16px; mascote com 118px de altura; seletor de período abre em tela cheia |
| ≥ 640px | Margem 28px; mascote com 160px |
| ≥ 720px | `.g2` vira 2 colunas, `.g3` vira 3; KPIs em 3 colunas |
| ≥ 1024px | Mascote com 184px, centralizado na vertical; abas deixam espaço para a mascote |
| ≥ 1080px | `.g-main` vira 1.35fr / .65fr; `.g-main-r` vira .8fr / 1.2fr; `.kpis.six` em 6 colunas |
| ≥ 1180px | Cabeçalho vira linha: títulos à esquerda e ações à direita |

KPIs começam com 2 colunas no celular.

---

## 6. Componentes

Todas as classes abaixo estão no `waytop-visual.css`. O HTML mínimo de cada uma está no `exemplo.html`.

### Cabeçalho (`.hero-top`)
Card com raio 20px, fundo `--card` e borda `--border`. Por trás:
- um círculo de brilho radial de 820px no canto superior direito (`.hero-bg::after`);
- a textura de colmeia, que some da direita para a esquerda (`.hero-bg::before`).

O selo `.brandtag` tem raio 14px, fundo `--secondary`, texto 11px em maiúsculas e espaçamento 0.12em. O bloco `.hero-unit` reproduz o padrão do CDT ("Rede / Visão Macro"): um ícone em quadrado de 44×44, raio 14px, fundo `--accent`, ícone `--on-accent` de 20px; ao lado, um rótulo pequeno e um nome grande.

### Abas (`.navpills`)
Pílulas com padding 8px 16px, 14px e peso 700, fundo `--secondary`. No hover, o fundo recebe 20% da cor de destaque. A aba ativa fica com fundo `--accent` e texto `--on-accent`. Com muitas abas, a barra rola na horizontal.

### Botões (`.btn`)
36px de altura, pílula, borda `--border`, fundo `--card`, 13px e peso 600; no hover, fundo `--secondary`. Variantes:
- `.btn.pri`: fundo e borda `--accent`, texto `--on-accent`.
- `.btn.sm`: 30px de altura.
- desabilitado: opacidade 0.45.
- botão só com ícone: 36×36, ícone de 15px.

### Alternadores (`.pill-tabs`, `.gran`)
Trilho em pílula com fundo `--secondary` e padding 3px. Cada opção tem 13px, peso 700 e padding 6px 14px. Opção ativa:
- `.pill-tabs`: fundo `--accent`, texto `--on-accent`.
- `.gran`: fundo `--card` com sombra leve, texto `--fg`.

### Card (`.card`)
Raio 18px, padding 20px, fundo `--card`, borda `--border`. No hover, a borda passa a `--accent` e aparece `--shadow-lift`. Cabeçalho do card (`.card-h`): título h2 em Nunito 16/800, subtítulo 12.5px `--muted`, etiqueta opcional à direita.
- Variante `.card.hot`, para o card de destaque: borda com 35% de destaque, brilho interno, gradiente radial no canto superior direito e colmeia.

### KPI (`.kpi`)
Raio 18px. Tem uma **barra vertical de 3px na cor de destaque** encostada à esquerda (de 16px do topo a 16px do fim). No hover, **sobe 3px**, a borda acende e o brilho aparece. Ao carregar, entra com a animação `fade-slide-up` de 0,5s. Estrutura:
- `.l`: rótulo, 12/600, `--muted`.
- `.v`: valor, 24/800, tabular.
- `.d`: detalhe, 12px, com `.up` em `--ok` e `.dn` em `--bad`.
- Variante `.kpi.acc` (destaque): borda com 55% de destaque, valor em `--accent-2`, meia-lua `--secondary` no canto superior direito e colmeia.

### Etiquetas (`.tag`)
Pílula com 11px, peso 700, maiúsculas, espaçamento 0.06em e padding 4px 10px. Variantes `.acc`, `.ok`, `.lime`, `.warn`, `.bad`, todas com a fórmula "fundo a 14%, texto na cor".

### Nota (`.score`)
Caixa de 38×24 com raio 8px, 12.5px e peso 800, nas mesmas cores das etiquetas.

### Ranking (`.rank` > `.row`)
- Posição: círculo de 32px (`.pos`); 1º com troféu em ouro, 2º prata, 3º bronze, os demais `--secondary`.
- Linha: nome 13.5/500 e valor 13.5/700 tabular.
- Barra: trilho de 6px `--secondary` com preenchimento em gradiente `--mel-3` → `--mel-5`. Variantes `.alt` (`--info`) e `.grp` (`--ok`).

### Funil (`.funnel` > `.fstep`)
Grade com rótulo (até 160px), barra e porcentagem. A barra tem 28px de altura e raio 9px. A cor vai do mais claro no topo ao mais escuro embaixo: `color-mix(in srgb, var(--mel-5) X%, var(--mel-2))`, com X subindo de 0 a 100. O número fica dentro da barra quando ela tem pelo menos 9% de largura. Abaixo de 520px, a barra desce para baixo do rótulo.

### Lista de valores (`.stat-list`)
Linhas com padding 10px 0, divisória `--border` (sem divisória na última), texto 13.5px, rótulo `--muted-2` e valor em peso 800.

### Tabela
- Largura mínima de 620px, com rolagem horizontal dentro de `.tbl-wrap`.
- Cabeçalho: 11px, maiúsculas, espaçamento 0.08em, `--muted`, linha de 2px embaixo.
- Células: padding 10px 8px, divisória de 1px. Números alinhados à direita (`.num`).
- Hover da linha: `--row-hover`. Rodapé: linha de 2px em cima e peso 800.
- Linha clicável (`tr.clk`): destaque a 6%; quando aberta (`tr.aberto`), a 10%.

### Formulários (`.av-form`, `.ped-form`)
- Grade de 1 coluna; 2 a partir de 620px e 4 a partir de 1000px.
- Rótulo: 12/600, `--muted-2`, com dica em `<small>` 11px.
- Campo: 38px de altura, raio 10px, fundo `--field-bg`, borda `--field-border`, 14/600. No foco, contorno de 2px em `--accent` e a borda some.

### Menu suspenso (padrão do CDT, `.cid-btn` + `.cid-menu`)
- Botão com raio 12px, borda que acende no hover ou quando aberto, e seta que gira 180°.
- Menu com raio 14px, borda `--border-2`, sombra forte, altura máxima de 360px com rolagem.
- Cada item tem nome e detalhe em duas linhas, mais uma barrinha de 3px proporcional ao valor.

### Seletor de período (`.dp-btn` + `.dp`)
- Botão em pílula com rótulo "PERÍODO".
- Painel com raio 18px: atalhos à esquerda e calendário à direita.
- No calendário, os dias são pílulas de 32px: hoje com anel `--accent`, intervalo a 22%, início e fim cheios.

### Gráfico de barras (SVG)
- Linhas de grade em `--border` e eixo em `--muted` 11px.
- Barras empilhadas com raio 3px: `--accent` (série principal), `--info` (segunda) e `--ok` (terceira). Total em cima de cada barra.
- Legenda com quadradinhos de 10×10 e raio 3px.

### Aviso de dados de exemplo (`.demo`)
Borda tracejada a 60% de `--warn`, fundo a 8%, texto `--warn` e raio 14px.

---

## 7. Movimento

| Efeito | Valor |
|---|---|
| Hover de card | borda e sombra em 0,18s ease |
| Hover de KPI | sobe 3px (`translateY(-3px)`) em 0,18s |
| Entrada dos KPIs | `fade-slide-up`: de opacidade 0 e 8px abaixo até a posição final, 0,5s |
| Barras de ranking e funil | largura animada em 0,6s ease-out |
| Seta de menu | gira 180° em 0,15s |
| Movimento reduzido | com `prefers-reduced-motion: reduce`, nada se move |

---

## 8. Ícones, marca e mascote

- **Ícones:** traço (estilo Lucide/Feather), `stroke="currentColor"`, `stroke-width="2"`, sem preenchimento; 15px em botões, 20px no ícone do cabeçalho, 14px em menus.
- **Favicon:** as três barras brancas da WAYTOP sobre um quadrado escuro arredondado (`favicon.png` 64×64 e `apple-touch-icon.png` 180×180, na pasta `site/`).
- **Mascote:** `beerobot.webp`, no canto direito do cabeçalho, com sombra leve, sem receber cliques. É opcional no outro projeto.
- **Texto da marca:** o selo mostra só "WAYTOP".

---

## 9. Troca de tema

- Sem atributo = laranja. Com `<html data-theme="dark">` = lilás.
- A escolha fica salva em `localStorage` na chave `wt-modo` (`"light"` ou `"dark"`).
- O botão mostra só o ícone (lua no laranja, sol no lilás), com `title` e `aria-label`.

Para os dois projetos lembrarem a mesma escolha quando estiverem no mesmo domínio, use a mesma chave `wt-modo`.

---

## 10. Como aplicar no outro projeto sem afetar funcionalidades

### Se o outro projeto é HTML/CSS simples
1. Inclua as fontes (seção 2) e o `waytop-visual.css`.
2. Troque as classes dos elementos visuais pelas equivalentes deste guia (`.card`, `.kpi`, `.btn`, `.navpills`…), sem mexer em `id`, `name`, `data-*`, eventos ou JavaScript.
3. Se houver conflito de nomes de classe, use o CSS dentro de um prefixo (por exemplo `.wt .card`) ou renomeie as classes do CSS.

### Se o outro projeto é React + Tailwind + shadcn/ui (como o Dashboard CDT)
Mapeie as variáveis do shadcn para as cores da tabela (valores HSL sem `hsl()`):

```css
:root{ /* laranja */
  --background:240 20% 5%;   --foreground:240 12% 92%;
  --card:240 18% 9%;         --card-foreground:240 12% 92%;
  --popover:240 18% 9%;      --popover-foreground:240 12% 92%;
  --primary:27 96% 61%;      --primary-foreground:30 100% 5%;
  --secondary:240 19% 13%;   --secondary-foreground:240 12% 92%;
  --muted:240 19% 13%;       --muted-foreground:240 9% 46%;
  --accent:31 97% 72%;       --accent-foreground:30 100% 5%;
  --destructive:0 91% 71%;   --destructive-foreground:30 100% 5%;
  --border:240 21% 15%;      --input:240 19% 18%;   --ring:27 96% 61%;
  --radius:1.125rem; /* 18px */
}
.dark, [data-theme="dark"]{ /* lilás */
  --background:255 29% 5%;   --foreground:260 53% 97%;
  --card:255 26% 9%;         --card-foreground:260 53% 97%;
  --popover:255 26% 9%;      --popover-foreground:260 53% 97%;
  --primary:255 92% 76%;     --primary-foreground:259 52% 13%;
  --secondary:253 32% 14%;   --secondary-foreground:258 100% 92%;
  --muted:253 32% 14%;       --muted-foreground:255 16% 67%;
  --accent:252 95% 85%;      --accent-foreground:259 52% 13%;
  --destructive:0 91% 71%;   --destructive-foreground:259 52% 13%;
  --border:253 28% 20%;      --input:254 28% 25%;   --ring:255 92% 76%;
}
```

No `tailwind.config`, use as fontes:

```js
fontFamily: {
  sans: ['Figtree', 'system-ui', 'sans-serif'],
  display: ['Nunito', 'Figtree', 'system-ui', 'sans-serif'],
}
```

Depois, ajuste só as classes visuais dos componentes:
- cards: `rounded-[18px] border bg-card p-5 hover:border-primary`;
- pílulas: `rounded-full px-4 py-2 text-sm font-bold`;
- números: `tabular-nums`.

Props, estados, hooks e chamadas de API ficam intactos.

### Conferência final
- [ ] Os dois temas trocam pelo botão e a escolha fica salva.
- [ ] Nenhuma cor fixa sobrou nos componentes (tudo via variável).
- [ ] Números com `tabular-nums`.
- [ ] Hover dos cards e KPIs com borda acesa e brilho.
- [ ] Layout testado em 375px, 768px e 1280px.
- [ ] Todas as funções do outro projeto continuam funcionando como antes. Rode os testes, se houver.
