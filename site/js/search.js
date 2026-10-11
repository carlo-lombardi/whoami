// Hybrid retrieval over the sections of this page: BM25 + a similarity ranker, fused with
// reciprocal rank fusion. A small working model of the RAG retrieval described in the CV.

const STOPWORDS = new Set(
  'a an and are as at be by for from i in is it my of on or that the this to was what with you your'.split(' ')
);
const K1 = 1.5;
const B = 0.75;
const RRF_K = 60;
const TOP = 5;

export function tokenize(text) {
  return text
    .toLowerCase()
    .split(/[^a-z0-9+#]+/)
    .filter((t) => t.length > 1 && !STOPWORDS.has(t))
    .map((t) => (t.length > 3 && t.endsWith('s') ? t.slice(0, -1) : t));
}

export function trigrams(text) {
  const clean = ` ${text.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()} `;
  const grams = new Map();
  for (let i = 0; i < clean.length - 2; i++) {
    const gram = clean.slice(i, i + 3);
    grams.set(gram, (grams.get(gram) || 0) + 1);
  }
  return grams;
}

export function buildIndex(docs) {
  const df = new Map();
  const gramDf = new Map();

  const entries = docs.map((doc) => {
    // The title counts twice: a match in a heading matters more than one in the body.
    const tokens = tokenize(`${doc.title} ${doc.title} ${doc.text}`);
    const tf = new Map();
    tokens.forEach((t) => tf.set(t, (tf.get(t) || 0) + 1));
    tf.forEach((_, t) => df.set(t, (df.get(t) || 0) + 1));

    const grams = trigrams(`${doc.title} ${doc.text}`);
    grams.forEach((_, g) => gramDf.set(g, (gramDf.get(g) || 0) + 1));

    return { doc, tf, length: tokens.length, grams };
  });

  const n = entries.length;
  const avgLength = entries.reduce((sum, e) => sum + e.length, 0) / n;
  const gramIdf = (g) => Math.log(1 + n / (gramDf.get(g) || 0.5));

  entries.forEach((entry) => {
    let norm = 0;
    entry.vector = new Map();
    entry.grams.forEach((count, g) => {
      const weight = (1 + Math.log(count)) * gramIdf(g);
      entry.vector.set(g, weight);
      norm += weight * weight;
    });
    entry.norm = Math.sqrt(norm);
  });

  return { entries, df, n, avgLength, gramIdf };
}

export function bm25(index, query) {
  const terms = tokenize(query);
  return index.entries
    .map((entry) => {
      let score = 0;
      for (const term of terms) {
        const f = entry.tf.get(term);
        if (!f) continue;
        const d = index.df.get(term);
        const idf = Math.log(1 + (index.n - d + 0.5) / (d + 0.5));
        score += (idf * f * (K1 + 1)) / (f + K1 * (1 - B + (B * entry.length) / index.avgLength));
      }
      return { doc: entry.doc, score };
    })
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score);
}

export function similarity(index, query) {
  const grams = trigrams(query);
  let norm = 0;
  const vector = new Map();
  grams.forEach((count, g) => {
    const weight = (1 + Math.log(count)) * index.gramIdf(g);
    vector.set(g, weight);
    norm += weight * weight;
  });
  norm = Math.sqrt(norm);
  if (!norm) return [];

  return index.entries
    .map((entry) => {
      let dot = 0;
      vector.forEach((weight, g) => {
        const other = entry.vector.get(g);
        if (other) dot += weight * other;
      });
      return { doc: entry.doc, score: dot / (norm * entry.norm) };
    })
    .filter((r) => r.score > 0.015)
    .sort((a, b) => b.score - a.score);
}

export function fuse(lists) {
  const fused = new Map();
  lists.forEach((list, which) => {
    list.slice(0, 10).forEach((result, i) => {
      const item = fused.get(result.doc.id) || { doc: result.doc, score: 0, ranks: [] };
      item.score += 1 / (RRF_K + i + 1);
      item.ranks[which] = i + 1;
      fused.set(result.doc.id, item);
    });
  });
  return [...fused.values()].sort((a, b) => b.score - a.score);
}

function collectDocs() {
  return [...document.querySelectorAll('[data-doc]')].map((el, i) => {
    if (!el.id) el.id = `doc-${i}`;
    const full = el.dataset.doc;
    const clone = el.cloneNode(true);
    clone.querySelectorAll('.demo, .cv-line').forEach((node) => node.remove());
    return {
      id: el.id,
      title: full,
      label: full.split(/\s[—:]\s|:\s|,\s/)[0],
      text: clone.textContent.replace(/\s+/g, ' ').trim()
    };
  });
}

function renderList(list, results, describe) {
  list.textContent = '';
  if (!results.length) {
    const li = document.createElement('li');
    li.className = 'empty';
    li.textContent = 'no match';
    list.append(li);
    return;
  }
  results.slice(0, TOP).forEach((result, i) => {
    const li = document.createElement('li');
    const n = document.createElement('span');
    n.className = 'n';
    n.textContent = `#${i + 1}`;
    const score = document.createElement('span');
    score.className = 's';
    score.textContent = describe(result);

    if (list.id === 'rank-fused') {
      const link = document.createElement('a');
      link.href = `#${result.doc.id}`;
      link.textContent = result.doc.label;
      li.append(n, link, score);
    } else {
      li.append(n, result.doc.label, score);
    }
    list.append(li);
  });
}

export function initSearch() {
  const form = document.getElementById('search-form');
  const input = document.getElementById('search-input');
  if (!form || !input) return;

  const lists = {
    bm25: document.getElementById('rank-bm25'),
    sim: document.getElementById('rank-sim'),
    fused: document.getElementById('rank-fused')
  };
  const index = buildIndex(collectDocs());

  function run(query) {
    const keyword = bm25(index, query);
    const similar = similarity(index, query);
    renderList(lists.bm25, keyword, (r) => `score ${r.score.toFixed(2)}`);
    renderList(lists.sim, similar, (r) => `cosine ${r.score.toFixed(3)}`);
    renderList(lists.fused, fuse([keyword, similar]), (r) => {
      const from = [`bm25 ${r.ranks[0] ? `#${r.ranks[0]}` : '–'}`, `sim ${r.ranks[1] ? `#${r.ranks[1]}` : '–'}`];
      return `${from.join(' + ')} → ${r.score.toFixed(4)}`;
    });
  }

  const chips = document.getElementById('search-chips');
  ['certificates', 'kubernetes', 'identity', 'hospital outage', 'pyhton'].forEach((query) => {
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = 'chip';
    chip.textContent = query;
    chip.addEventListener('click', () => {
      input.value = query;
      run(query);
    });
    chips.append(chip);
  });

  form.addEventListener('submit', (event) => event.preventDefault());
  input.addEventListener('input', () => run(input.value));

  input.value = 'certificates';
  run(input.value);
}
