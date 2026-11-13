// Conector Instagram da avaliação de perfil (WAYTOP)
// Node 18+ sem dependências. Roda atrás do nginx em /api/ig/.
// Usa a "Instagram API with Unified Login" (padrão da Meta para apps novos): o candidato entra com Instagram ou Facebook
// por uma "configuração" do app (config_id). A conta precisa ser profissional (Criador ou Comercial).
// Nenhum token é guardado: o servidor troca o código, lê os números e devolve só os números à página.
//
// Variáveis de ambiente (arquivo /etc/waytop-ig.env):
//   META_APP_ID, META_APP_SECRET -> Meta for Developers > seu app > Configurações do app > Básico (ID do app e Chave secreta)
//   META_CONFIG_ID             -> Casos de uso > Instagram > API setup with Unified login > configuração criada
//   IG_REDIRECT                -> https://waytop.7bee.ai/api/ig/callback  (igual ao cadastrado no app)
//   DASH_URL                   -> https://waytop.7bee.ai/
//   PORT                       -> 8787 (padrão)

const http = require("http");
const crypto = require("crypto");

const { META_APP_ID, META_APP_SECRET, META_CONFIG_ID, IG_REDIRECT, DASH_URL = "/", PORT = 8787 } = process.env;
const GRAPH = "https://graph.facebook.com/v26.0";
const states = new Map(); // state anti-CSRF -> expira em 10 min

const b64url = s => Buffer.from(s, "utf8").toString("base64url");
const back = (res, q) => { res.writeHead(302, { Location: `${DASH_URL}?${q}#avaliacao` }); res.end(); };
const erro = (res, msg) => back(res, "ig_erro=" + encodeURIComponent(msg));

async function j(url, opt) {
  const r = await fetch(url, opt);
  const d = await r.json().catch(() => ({}));
  if (!r.ok || d.error) throw new Error(d.error?.message || d.error_message || `HTTP ${r.status}`);
  return d;
}
const tryJ = (url) => j(url).catch(() => null);

async function medir(token) {
  const t = `access_token=${encodeURIComponent(token)}`;
  // O token é do "usuário do sistema" da empresa do candidato; a conta do Instagram vem por assigned_instagram_accounts
  const contas = await j(`${GRAPH}/me/assigned_instagram_accounts?fields=id,username&${t}`);
  const ig = contas.data?.[0];
  if (!ig) throw new Error("nenhuma conta profissional do Instagram foi autorizada");
  const me = await j(`${GRAPH}/${ig.id}?fields=username,name,followers_count,media_count&${t}`);
  const seg = me.followers_count || 0;

  // Engajamento: média de curtidas + comentários dos últimos 12 posts do feed
  const media = await tryJ(`${GRAPH}/${ig.id}/media?fields=like_count,comments_count,media_product_type&limit=12&${t}`);
  const posts = (media?.data || []).filter(m => m.media_product_type !== "STORY");
  const inter = posts.length ? Math.round(posts.reduce((s, m) => s + (m.like_count || 0) + (m.comments_count || 0), 0) / posts.length) : "";

  // Alcance dos stories: a API só lista stories ativos (últimas 24 h). Média do alcance deles, se houver.
  let alcN = "";
  const st = await tryJ(`${GRAPH}/${ig.id}/stories?fields=id&${t}`);
  if (st?.data?.length) {
    const reaches = [];
    for (const s of st.data.slice(0, 20)) {
      const ins = await tryJ(`${GRAPH}/${s.id}/insights?metric=reach&${t}`);
      const v = ins?.data?.[0]?.values?.[0]?.value ?? ins?.data?.[0]?.total_value?.value;
      if (typeof v === "number") reaches.push(v);
    }
    if (reaches.length) alcN = Math.round(reaches.reduce((a, b) => a + b, 0) / reaches.length);
  }

  // Público: país e idade dos seguidores (exige 100+ seguidores e a permissão instagram_manage_insights)
  const demo = async (bd) => {
    for (const nome of ["breakdown", "breakdowns"]) { // a documentação usa os dois nomes
      const d = await tryJ(`${GRAPH}/${ig.id}/insights?metric=follower_demographics&period=lifetime&timeframe=last_90_days&metric_type=total_value&${nome}=${bd}&${t}`);
      const res = d?.data?.[0]?.total_value?.breakdowns?.[0]?.results || [];
      const tot = res.reduce((s, r) => s + (r.value || 0), 0);
      if (tot) return { res, tot };
    }
    return { res: [], tot: 0 };
  };
  let br = "", idade = "";
  const pais = await demo("country");
  if (pais.tot) br = Math.round((pais.res.filter(r => r.dimension_values?.[0] === "BR").reduce((s, r) => s + r.value, 0) / pais.tot) * 1000) / 10;
  const age = await demo("age");
  if (age.tot) idade = Math.round((age.res.filter(r => ["18-24", "25-34"].includes(r.dimension_values?.[0])).reduce((s, r) => s + r.value, 0) / age.tot) * 1000) / 10;

  const faltam = [];
  if (inter === "") faltam.push("curtidas e comentários");
  if (alcN === "") faltam.push("alcance dos stories (sem story ativo agora)");
  if (br === "") faltam.push("público no Brasil");
  if (idade === "") faltam.push("público de 18 a 34");
  return { h: "@" + (me.username || ig.username), nome: me.name || "", seg, inter, alcN, br, idade, faltam };
}

http.createServer(async (req, res) => {
  const u = new URL(req.url, "http://x");
  try {
    if (u.pathname === "/api/ig/login") {
      const state = crypto.randomBytes(16).toString("hex");
      states.set(state, Date.now() + 600e3);
      const q = new URLSearchParams({ client_id: META_APP_ID, config_id: META_CONFIG_ID, redirect_uri: IG_REDIRECT, response_type: "code", prompt: "login", state });
      res.writeHead(302, { Location: "https://www.facebook.com/dialog/oauth?" + q });
      return res.end();
    }
    if (u.pathname === "/api/ig/callback") {
      const state = u.searchParams.get("state"), code = u.searchParams.get("code");
      if (u.searchParams.get("error")) return erro(res, "O candidato não autorizou o acesso.");
      if (!state || !(states.get(state) > Date.now())) return erro(res, "Sessão expirada, tente de novo.");
      states.delete(state);
      const q = new URLSearchParams({ client_id: META_APP_ID, client_secret: META_APP_SECRET, redirect_uri: IG_REDIRECT, code: (code || "").replace(/#_$/, "") });
      const tok = await j(`${GRAPH}/oauth/access_token?${q}`);
      const dados = await medir(tok.access_token);
      return back(res, "ig=" + b64url(JSON.stringify(dados)));
    }
    res.writeHead(404); res.end();
  } catch (e) {
    console.error(new Date().toISOString(), e.message);
    erro(res, "Não foi possível ler o Instagram: " + e.message.slice(0, 120));
  }
}).listen(PORT, "127.0.0.1", () => console.log("conector IG na porta " + PORT));

setInterval(() => { const n = Date.now(); for (const [k, v] of states) if (v < n) states.delete(k); }, 60e3).unref();
