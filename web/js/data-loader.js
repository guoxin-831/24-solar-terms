/* ============================================
   data-loader.js — 读取最终交付数据并归一化
   数据源：二十四节气智能体_数据与知识交付
   基础资料 data/solar_terms.json + 知识关系 kg/relations.json
   前端不写死任何节气内容。
   ============================================ */

const DATA_PATHS = {
  terms:     '../二十四节气智能体_数据与知识交付/02_知识工程师最终交付/data/solar_terms.json',
  relations: '../二十四节气智能体_数据与知识交付/02_知识工程师最终交付/kg/relations.json',
  aiResults: '../ai/results.json'
};

/* 交付数据用中文季节，前端内部用英文键驱动配色 */
const SEASON_MAP = {
  '春': { key: 'spring', cn: '春', en: 'SPRING' },
  '夏': { key: 'summer', cn: '夏', en: 'SUMMER' },
  '秋': { key: 'autumn', cn: '秋', en: 'AUTUMN' },
  '冬': { key: 'winter', cn: '冬', en: 'WINTER' }
};
const SEASON_KEYS = ['spring', 'summer', 'autumn', 'winter'];

/* 关系类型 → 前端分组 */
const REL_BUCKET = {
  has_phenology: 'phenology',
  has_custom:    'custom',
  has_food:      'food',
  has_poem:      'poem'
};

const EMPTY_GROUP = () => ({ phenology: [], custom: [], food: [], poem: [] });

/** 拉取单个 JSON，失败返回 null 并记录原因 */
async function fetchJson(key) {
  try {
    const res = await fetch(DATA_PATHS[key]);
    if (!res.ok) return { data: null, error: `${DATA_PATHS[key]} 返回 ${res.status}` };
    return { data: await res.json(), error: null };
  } catch (e) {
    return { data: null, error: `${DATA_PATHS[key]} 无法读取（${e.message}）` };
  }
}

/* ---------- 字段解析 ---------- */

/** 交付数据用全角分号分隔多项内容 */
function splitSemi(value) {
  return String(value || '')
    .split(/[；;]/)
    .map(s => s.trim())
    .filter(Boolean);
}

/** "太阳黄经 315°；公历 2 月 3—5 日" → 黄经与起始日期 */
function parseRule(rule) {
  const s = String(rule || '');
  const sun = /(\d{1,3})\s*°/.exec(s);
  const m = /(\d{1,2})\s*月\s*(\d{1,2})\s*[—\-–~至]\s*(\d{1,2})\s*日/.exec(s);
  return {
    sun: sun ? sun[1] : '',
    month: m ? +m[1] : null,
    day: m ? +m[2] : null,
    endDay: m ? +m[3] : null
  };
}

/** "张栻《立春偶成》：律回岁晚冰霜少……" → 题名 + 正文 */
function parsePoem(raw) {
  const s = String(raw || '').trim();
  if (!s || s.includes('未收录')) return null;
  const i = s.search(/[：:]/);
  if (i < 0) return { title: s, content: '' };
  return { title: s.slice(0, i).trim(), content: s.slice(i + 1).trim() };
}

/** 拆分来源，并识别其中的资料链接 */
function parseSources(raw) {
  return splitSemi(raw).map(text => {
    const m = /https?:\/\/[^\s；;]+/.exec(text);
    return m
      ? { text: text.replace(m[0], '').trim(), url: m[0] }
      : { text, url: null };
  });
}

/* ---------- 知识关系索引 ---------- */

function buildKg(raw) {
  if (!raw || !Array.isArray(raw.nodes) || !Array.isArray(raw.relations)) return null;

  const nodeById = new Map(raw.nodes.map(n => [n.id, n]));
  const solarNodes = raw.nodes.filter(n => n.type === 'solar_term');
  const byName = new Map(solarNodes.map(n => [n.name, n]));
  const groups = new Map();
  const typeCounts = {};

  raw.nodes.forEach(n => { typeCounts[n.type] = (typeCounts[n.type] || 0) + 1; });

  raw.relations.forEach(r => {
    const bucket = REL_BUCKET[r.type];
    if (!bucket) return;
    const from = nodeById.get(r.from);
    const to = nodeById.get(r.to);
    if (!from || from.type !== 'solar_term' || !to) return;
    if (!groups.has(r.from)) groups.set(r.from, EMPTY_GROUP());
    groups.get(r.from)[bucket].push({ node: to, relation: r });
  });

  groups.forEach(g => {
    g.phenology.sort((a, b) => (a.relation.order || 0) - (b.relation.order || 0));
  });

  return {
    raw,
    nodeById,
    solarNodes,
    byName,
    groups,
    stats: {
      nodes: raw.nodes.length,
      relations: raw.relations.length,
      typeCounts
    }
  };
}

/* ---------- 节气记录归一化 ---------- */

function normalizeTerm(raw, index, kg) {
  const node = kg ? kg.byName.get(raw.name) : null;
  const season = SEASON_MAP[node && node.season] ||
    SEASON_MAP[['春', '夏', '秋', '冬'][Math.floor(index / 6)]] ||
    SEASON_MAP['春'];

  const rule = parseRule(raw.term_rule);
  const calendar = splitSemi(raw.term_rule).find(part => part.includes('公历')) || raw.term_rule || '';

  return {
    id: node ? node.id : `ST${String(index + 1).padStart(2, '0')}`,
    index,
    name: raw.name || '',
    season: season.key,
    seasonCn: season.cn,
    seasonEn: season.en,
    term_rule: raw.term_rule || '',
    calendar,
    sun: rule.sun,
    month: rule.month,
    day: rule.day,
    endDay: rule.endDay,
    climate: raw.climate || '',
    phenology: splitSemi(raw.phenology),
    customs: splitSemi(raw.custom),
    foods: splitSemi(raw.food),
    poem: parsePoem(raw.poem),
    regions: splitSemi(raw.region),
    sources: parseSources(raw.sources),
    relations: (kg && kg.groups.get(node && node.id)) || EMPTY_GROUP()
  };
}

function validateTerms(terms, rawList) {
  const problems = [];
  if (!Array.isArray(rawList)) return ['节气表不是数组'];
  rawList.forEach((t, i) => {
    ['name', 'term_rule', 'climate', 'phenology', 'custom', 'food', 'region', 'sources']
      .forEach(f => { if (!t || t[f] === undefined) problems.push(`第 ${i + 1} 条缺少字段 ${f}`); });
  });
  if (terms.length && terms.length !== 24) problems.push(`节气记录为 ${terms.length} 条，预期 24 条`);
  return problems;
}

/* ---------- 对外接口 ---------- */

async function loadAllData() {
  const [termsRes, relRes, aiRes] = await Promise.all([
    fetchJson('terms'), fetchJson('relations'), fetchJson('aiResults')
  ]);

  const problems = [];
  if (termsRes.error) problems.push(termsRes.error);
  if (relRes.error)   problems.push(relRes.error);
  /* ai/results.json 属于 AI 工程师交付，尚未接入时只做状态提示，不视为错误 */
  const aiMissing = !!aiRes.error;

  const kg = relRes.data ? buildKg(relRes.data) : null;
  if (relRes.data && !kg) problems.push('关系数据结构不符（缺少 nodes / relations 数组）');

  const terms = Array.isArray(termsRes.data)
    ? termsRes.data.map((t, i) => normalizeTerm(t, i, kg))
    : null;
  if (terms) problems.push(...validateTerms(terms, termsRes.data));

  return {
    terms,
    kg,
    aiResults: aiRes.data,
    aiMissing,
    problems,
    counts: {
      terms: terms ? terms.length : 0,
      relations: kg ? kg.stats.relations : 0,
      nodes: kg ? kg.stats.nodes : 0
    }
  };
}

/** 页脚状态行：数据接入情况一目了然 */
function renderDataStatus(store) {
  const el = document.getElementById('data-status');
  if (!el) return;
  const parts = [
    `节气 ${cnNum(store.counts.terms)}`,
    `知识关系 ${store.counts.relations ? cnNum(store.counts.relations) : '未就绪'}`,
    `生成结果 ${store.aiResults ? '已接入' : '未接入'}`
  ];
  el.textContent = parts.join(' ｜ ');
}
