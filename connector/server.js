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
const fs = require("fs");

const { META_APP_ID, META_APP_SECRET, META_CONFIG_ID, IG_REDIRECT, DASH_URL = "/", PORT = 8787 } = process.env;
const GRAPH = "https://graph.facebook.com/v26.0";
const states = new Map(); // state anti-CSRF -> { exp, modo }
// Conta da própria WAYTOP, conectada uma vez: usada para buscar perfis públicos pelo @ (Business Discovery)
const CONTA = (process.env.STATE_DIRECTORY || "/var/lib/waytop-ig") + "/conta.json";
const lerConta = () => { try { return JSON.parse(fs.readFileSync(CONTA, "utf8")); } catch { return null; } };
const DIR = process.env.STATE_DIRECTORY || "/var/lib/waytop-ig";
const PED = DIR + "/pedidos";
try { fs.mkdirSync(PED, { recursive: true, mode: 0o700 }); } catch {}
const pedArq = id => /^[a-f0-9]{32}$/.test(id) ? `${PED}/${id}.json` : null;
const lerPed = id => { const a = pedArq(id); try { return a && JSON.parse(fs.readFileSync(a, "utf8")); } catch { return null; } };
const salvarPed = p => fs.writeFileSync(pedArq(p.id), JSON.stringify(p), { mode: 0o600 });
const html = (res, code, corpo) => { res.writeHead(code, { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" }); res.end(`<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>WAYTOP · Avaliação de perfil</title><style>body{margin:0;min-height:100vh;display:grid;place-items:center;background:#0a0a0f;color:#f4f4f5;font:16px/1.5 system-ui,-apple-system,sans-serif;padding:24px;box-sizing:border-box}.c{max-width:440px;background:#12121a;border:1px solid #26263a;border-radius:18px;padding:28px}h1{font-size:22px;margin:0 0 8px}p{color:#a1a1aa;margin:0 0 14px}ul{color:#a1a1aa;padding-left:18px;margin:0 0 18px}a.b{display:block;text-align:center;background:#fb923c;color:#111;font-weight:700;text-decoration:none;padding:14px;border-radius:12px}.e{font-size:12px;color:#71717a;margin:14px 0 0}</style></head><body><div class="c">${corpo}</div></body></html>`); };
const escH = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const lerCorpo = req => new Promise(ok => { let b = ""; req.on("data", c => { b += c; if (b.length > 2e3) req.destroy(); }); req.on("end", () => { try { ok(JSON.parse(b)); } catch { ok({}); } }); });
const json = (res, code, d) => { res.writeHead(code, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" }); res.end(JSON.stringify(d)); };

// Busca pelo @: só números públicos (seguidores, posts, curtidas e comentários). Público e alcance de stories não são públicos.
async function buscar(usuario) {
  const c = lerConta();
  if (!c) throw new Error("a conta da WAYTOP ainda não foi conectada");
  const u = usuario.replace(/^@/, "").trim();
  if (!/^[A-Za-z0-9._]{1,30}$/.test(u)) throw new Error("@ inválido");
  const f = `business_discovery.username(${u}){username,name,followers_count,media_count,media.limit(12){like_count,comments_count,media_product_type}}`;
  let d;
  try { d = await j(`${GRAPH}/${c.ig}?fields=${encodeURIComponent(f)}&access_token=${encodeURIComponent(c.token)}`); }
  catch (e) {
    if (/Invalid user id|cannot be found|does not exist|not.*business/i.test(e.message)) throw new Error(`@${u} não encontrado ou não é conta profissional (Criador ou Comercial)`);
    throw e;
  }
  const b = d.business_discovery || {};
  const posts = (b.media?.data || []).filter(m => m.media_product_type !== "STORY" && m.like_count != null);
  const inter = posts.length ? Math.round(posts.reduce((s, m) => s + (m.like_count || 0) + (m.comments_count || 0), 0) / posts.length) : "";
  const faltam = ["alcance dos stories", "público no Brasil", "público de 18 a 34"];
  if (inter === "") faltam.unshift("curtidas e comentários (perfil oculta curtidas)");
  return { h: "@" + (b.username || u), nome: b.name || "", seg: b.followers_count ?? "", inter, posts: b.media_count ?? "", faltam };
}

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

// Stories no ar agora, com o alcance de cada um
async function lerStories(igId, t) {
  const st = await tryJ(`${GRAPH}/${igId}/stories?fields=id,timestamp&limit=50&${t}`);
  const out = [];
  for (const s of (st?.data || []).slice(0, 50)) {
    const ins = await tryJ(`${GRAPH}/${s.id}/insights?metric=reach&${t}`);
    const v = ins?.data?.[0]?.values?.[0]?.value ?? ins?.data?.[0]?.total_value?.value;
    if (typeof v === "number") out.push({ id: s.id, ts: s.timestamp || new Date().toISOString(), reach: v });
  }
  return out;
}

// Coleta de stories por 7 dias depois da autorização (a cada 6 h). O acesso do candidato fica só no servidor e é apagado no fim.
const DIAS_COLETA = 7, DIA = 864e5;
const diaBR = iso => new Date(new Date(iso).getTime() - 3 * 36e5).toISOString().slice(0, 10);
function resumoStories(p) {
  const l = Object.values(p.st || {});
  const ini = new Date(p.coleta.inicio).getTime(), fim = Math.min(Date.now(), new Date(p.coleta.fim).getTime());
  const dias = Math.max(1, Math.min(DIAS_COLETA, Math.ceil((fim - ini) / DIA)));
  const porDia = {};
  for (const x of l) { const d = diaBR(x.ts); (porDia[d] = porDia[d] || { n: 0, alcance: 0 }); porDia[d].n++; porDia[d].alcance += x.reach; }
  p.dados.alcN = l.length ? Math.round(l.reduce((a, x) => a + x.reach, 0) / l.length) : "";
  p.dados.stories = { n: l.length, dias, por_dia: l.length ? Math.round(l.length / dias * 10) / 10 : 0, dias_lista: porDia,
    coletando: !p.coleta.encerrada, ate: p.coleta.fim, erro: p.coleta.erro || "" };
}
async function coletar() {
  let arqs = [];
  try { arqs = fs.readdirSync(PED).filter(f => f.endsWith(".json")); } catch { return; }
  for (const f of arqs) {
    const p = lerPed(f.slice(0, -5));
    if (!p || !p.token || !p.coleta || p.coleta.encerrada) continue;
    try {
      if (Date.now() > new Date(p.coleta.fim).getTime()) { p.coleta.encerrada = true; delete p.token; }
      else {
        const novos = await lerStories(p.ig, `access_token=${encodeURIComponent(p.token)}`);
        p.st = p.st || {};
        for (const x of novos) p.st[x.id] = { ts: x.ts, reach: Math.max(x.reach, p.st[x.id]?.reach || 0) };
        p.coleta.ultima = new Date().toISOString(); p.coleta.erro = "";
      }
    } catch (e) { p.coleta.erro = e.message.slice(0, 120); console.error(new Date().toISOString(), "coleta", p.h, e.message); }
    resumoStories(p); salvarPed(p);
  }
}
const pub = p => { const { token, ig, st, ...r } = p; return r; };

async function medir(token) {
  const t = `access_token=${encodeURIComponent(token)}`;
  // O token é do "usuário do sistema" da empresa do candidato; a conta do Instagram vem por assigned_instagram_accounts
  const contas = await j(`${GRAPH}/me/assigned_instagram_accounts?fields=id,username&${t}`);
  const ig = contas.data?.[0];
  if (!ig) throw new Error("nenhuma conta profissional do Instagram foi autorizada");
  const me = await tryJ(`${GRAPH}/${ig.id}?fields=username,name,biography,website,followers_count,follows_count,media_count,profile_picture_url&${t}`)
    || await j(`${GRAPH}/${ig.id}?fields=username,name,followers_count,media_count&${t}`);
  const seg = me.followers_count || 0;

  // Engajamento: média de curtidas + comentários dos últimos 12 posts do feed
  const media = await tryJ(`${GRAPH}/${ig.id}/media?fields=like_count,comments_count,media_type,media_product_type,timestamp,permalink,caption&limit=12&${t}`);
  const posts = (media?.data || []).filter(m => m.media_product_type !== "STORY");
  const inter = posts.length ? Math.round(posts.reduce((s, m) => s + (m.like_count || 0) + (m.comments_count || 0), 0) / posts.length) : "";
  const media_ = (k) => posts.length ? Math.round(posts.reduce((s, m) => s + (m[k] || 0), 0) / posts.length) : "";
  // Alcance e salvamentos de cada post (insights do próprio dono)
  for (const m of posts) {
    const ins = await tryJ(`${GRAPH}/${m.id}/insights?metric=reach,saved&${t}`);
    for (const x of ins?.data || []) m[x.name] = x.values?.[0]?.value ?? x.total_value?.value;
  }
  const dias = posts.length > 1 ? (new Date(posts[0].timestamp) - new Date(posts[posts.length - 1].timestamp)) / 864e5 : 0;
  const lista = posts.map(m => ({ data: (m.timestamp || "").slice(0, 10), tipo: m.media_product_type === "REELS" ? "Reels" : m.media_type === "CAROUSEL_ALBUM" ? "Carrossel" : m.media_type === "VIDEO" ? "Vídeo" : "Foto",
    curtidas: m.like_count ?? null, comentarios: m.comments_count ?? null, alcance: m.reach ?? null, salvos: m.saved ?? null, link: m.permalink || "", legenda: (m.caption || "").slice(0, 90) }));

  // Stories: a API só lista stories no ar (últimas 24 h). A coleta continua por 7 dias (ver coletar()).
  const stories = await lerStories(ig.id, t);
  let alcN = "";
  if (stories.length) alcN = Math.round(stories.reduce((a, x) => a + x.reach, 0) / stories.length);

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
  let br = "", idade = "", genero = "", cidades = [];
  const pais = await demo("country");
  if (pais.tot) br = Math.round((pais.res.filter(r => r.dimension_values?.[0] === "BR").reduce((s, r) => s + r.value, 0) / pais.tot) * 1000) / 10;
  const age = await demo("age");
  if (age.tot) idade = Math.round((age.res.filter(r => ["18-24", "25-34"].includes(r.dimension_values?.[0])).reduce((s, r) => s + r.value, 0) / age.tot) * 1000) / 10;

  const gen = await demo("gender");
  if (gen.tot) { const f = gen.res.filter(r => r.dimension_values?.[0] === "F").reduce((s, r) => s + r.value, 0); genero = `${Math.round(f / gen.tot * 100)}% mulheres`; }
  const cid = await demo("city");
  if (cid.tot) cidades = cid.res.sort((a, b) => b.value - a.value).map(r => ({ nome: r.dimension_values?.[0] || "", pct: Math.round(r.value / cid.tot * 1000) / 10 }));
  const faltam = [];
  if (inter === "") faltam.push("curtidas e comentários");
  if (br === "") faltam.push("público no Brasil");
  if (idade === "") faltam.push("público de 18 a 34");
  return { h: "@" + (me.username || ig.username), nome: me.name || "", bio: me.biography || "", site: me.website || "", foto: me.profile_picture_url || "",
    seg, seguindo: me.follows_count ?? "", posts_total: me.media_count ?? "", inter,
    curtidas: media_("like_count"), comentarios: media_("comments_count"), alcance_post: posts.some(m => m.reach != null) ? media_("reach") : "", salvos: posts.some(m => m.saved != null) ? media_("saved") : "",
    eng: seg && inter !== "" ? Math.round(inter / seg * 1000) / 10 : "", por_semana: dias ? Math.round(posts.length / dias * 7 * 10) / 10 : "",
    reels: posts.length ? Math.round(posts.filter(m => m.media_product_type === "REELS").length / posts.length * 100) : "",
    alcN, br, idade, genero, cidades, ultimos: lista, faltam, _ig: ig.id, _stories: stories };
}

http.createServer(async (req, res) => {
  const u = new URL(req.url, "http://x");
  try {
    if (u.pathname === "/api/ig/pedido" && req.method === "POST") {
      const b = await lerCorpo(req);
      const h = String(b.h || "").trim().replace(/^https?:\/\//, "").replace(/^(www\.)?instagram\.com\//, "").replace(/[/?#].*$/, "").replace(/^@/, "");
      if (!/^[A-Za-z0-9._]{1,30}$/.test(h)) return json(res, 400, { erro: "@ inválido" });
      const p = { id: crypto.randomBytes(16).toString("hex"), h: "@" + h, nome: String(b.nome || "").slice(0, 80), status: "aguardando", criado: new Date().toISOString() };
      salvarPed(p);
      return json(res, 200, { ...p, link: new URL(`/api/ig/autorizar/${p.id}`, DASH_URL).href });
    }
    let m;
    if ((m = u.pathname.match(/^\/api\/ig\/pedido\/([a-f0-9]{32})$/))) {
      const p = lerPed(m[1]);
      if (!p) return json(res, 404, { erro: "pedido não encontrado" });
      if (req.method === "DELETE") { fs.rmSync(pedArq(p.id), { force: true }); return json(res, 200, { ok: true }); }
      return json(res, 200, { ...pub(p), link: new URL(`/api/ig/autorizar/${p.id}`, DASH_URL).href });
    }
    if ((m = u.pathname.match(/^\/api\/ig\/autorizar\/([a-f0-9]{32})$/))) {
      const p = lerPed(m[1]);
      if (!p) return html(res, 404, `<h1>Link inválido</h1><p>Peça um novo link para a equipe WAYTOP.</p>`);
      if (p.status === "aprovado") return html(res, 200, `<h1>Tudo certo ✅</h1><p>Você já autorizou. Obrigado!</p>`);
      return html(res, 200, `<h1>A WAYTOP quer conhecer o seu perfil</h1><p>Para avaliar a parceria com <b>${escH(p.h)}</b>, precisamos ler alguns números do seu Instagram:</p><ul><li>seguidores e publicações</li><li>curtidas, comentários, alcance e salvamentos dos posts recentes</li><li>alcance dos seus stories durante 7 dias</li><li>público por país, cidade, idade e gênero</li></ul><a class="b" href="/api/ig/login?p=${p.id}">Autorizar com o Instagram</a><p class="e">Você entra na própria página da Meta. Não vemos sua senha e não publicamos nada. O acesso fica guardado só para medir os stories por 7 dias e depois é apagado. Você pode remover a qualquer momento no Instagram (Configurações › Apps e sites). A conta precisa ser profissional (Criador ou Comercial).</p>`);
    }
    if (u.pathname === "/api/ig/obrigado") return html(res, 200, u.searchParams.get("e")
      ? `<h1>Não deu certo</h1><p>${escH(u.searchParams.get("e"))}</p><p>Tente de novo pelo mesmo link ou fale com a equipe WAYTOP.</p>`
      : `<h1>Obrigado! ✅</h1><p>Autorização recebida. A equipe WAYTOP já está vendo os seus números e entra em contato.</p>`);
    if (u.pathname === "/api/ig/status") {
      const c = lerConta();
      return json(res, 200, { conectado: !!c, conta: c ? "@" + c.username : null });
    }
    if (u.pathname === "/api/ig/perfil") {
      try { return json(res, 200, await buscar(u.searchParams.get("u") || "")); }
      catch (e) { console.error(new Date().toISOString(), "perfil:", e.message); return json(res, 400, { erro: e.message.slice(0, 160) }); }
    }
    if (u.pathname === "/api/ig/login" || u.pathname === "/api/ig/conectar") {
      const state = crypto.randomBytes(16).toString("hex");
      const pid = u.searchParams.get("p");
      states.set(state, { exp: Date.now() + 600e3, modo: u.pathname.endsWith("conectar") ? "conta" : "candidato", p: pid && lerPed(pid) ? pid : null });
      const q = new URLSearchParams({ client_id: META_APP_ID, config_id: META_CONFIG_ID, redirect_uri: IG_REDIRECT, response_type: "code", prompt: "login", state });
      res.writeHead(302, { Location: "https://www.facebook.com/dialog/oauth?" + q });
      return res.end();
    }
    if (u.pathname === "/api/ig/callback") {
      const state = u.searchParams.get("state"), code = u.searchParams.get("code");
      const pend = state && states.get(state);
      if (u.searchParams.get("error")) {
        if (pend?.p) { const p = lerPed(pend.p); if (p && p.status !== "aprovado") { p.status = "recusado"; salvarPed(p); } res.writeHead(302, { Location: "/api/ig/obrigado?e=" + encodeURIComponent("A autorização foi cancelada.") }); return res.end(); }
        return erro(res, "O candidato não autorizou o acesso.");
      }
      const st = state && states.get(state);
      if (!st || !(st.exp > Date.now())) return erro(res, "Sessão expirada, tente de novo.");
      states.delete(state);
      res.pedido = !!st.p;
      const q = new URLSearchParams({ client_id: META_APP_ID, client_secret: META_APP_SECRET, redirect_uri: IG_REDIRECT, code: (code || "").replace(/#_$/, "") });
      const tok = await j(`${GRAPH}/oauth/access_token?${q}`);
      if (st.modo === "conta") {
        const t = `access_token=${encodeURIComponent(tok.access_token)}`;
        const ig = (await j(`${GRAPH}/me/assigned_instagram_accounts?fields=id,username&${t}`)).data?.[0];
        if (!ig) return erro(res, "Nenhuma conta profissional do Instagram foi autorizada.");
        const atual = lerConta();
        if (atual && atual.username !== ig.username && process.env.IG_CONTA !== ig.username)
          return erro(res, `A busca já está ligada à conta @${atual.username}.`);
        fs.writeFileSync(CONTA, JSON.stringify({ ig: ig.id, username: ig.username, token: tok.access_token, em: new Date().toISOString() }), { mode: 0o600 });
        return back(res, "ig_conta=" + encodeURIComponent("@" + ig.username));
      }
      const dados = await medir(tok.access_token);
      if (st.p) {
        const p = lerPed(st.p);
        if (p) {
          const { _ig, _stories, ...limpos } = dados;
          const agora = new Date();
          Object.assign(p, { status: "aprovado", aprovado: agora.toISOString(), conta: dados.h, dados: limpos, token: tok.access_token, ig: _ig,
            st: Object.fromEntries(_stories.map(x => [x.id, { ts: x.ts, reach: x.reach }])),
            coleta: { inicio: agora.toISOString(), fim: new Date(agora.getTime() + DIAS_COLETA * DIA).toISOString(), ultima: agora.toISOString() } });
          resumoStories(p); salvarPed(p);
        }
        res.writeHead(302, { Location: "/api/ig/obrigado" }); return res.end();
      }
      const { _ig, _stories, ...semIds } = dados;
      return back(res, "ig=" + b64url(JSON.stringify(semIds)));
    }
    res.writeHead(404); res.end();
  } catch (e) {
    console.error(new Date().toISOString(), e.message);
    if (u.pathname === "/api/ig/callback" && res.pedido) { res.writeHead(302, { Location: "/api/ig/obrigado?e=" + encodeURIComponent("Não conseguimos ler o Instagram: " + e.message.slice(0, 120)) }); return res.end(); }
    erro(res, "Não foi possível ler o Instagram: " + e.message.slice(0, 120));
  }
}).listen(PORT, "127.0.0.1", () => console.log("conector IG na porta " + PORT));

setTimeout(coletar, 60e3).unref();
setInterval(coletar, 6 * 36e5).unref();
setInterval(() => { const n = Date.now(); for (const [k, v] of states) if (v.exp < n) states.delete(k); }, 60e3).unref();
