document.addEventListener('DOMContentLoaded', async () => {
  const LABELS = {
    "engineering":"Engineering",
    "fuehren-managen":"Führen & Managen",
    "mastery-lernen":"Mastery & Lernen",
    "safety-risiko":"Safety & Risiko",
    "skills-tools":"Skills & Tools",
    "systemik":"Systemdenken"
  };
  const CANONICAL = new Set(Object.keys(LABELS));

  const grid = document.getElementById('artikel-grid');
  const noMsg = document.getElementById('no-results-message');
  const tagButtons = document.querySelectorAll('.filter-icon-tag');
  const andFilterToggle = document.getElementById('and-filter-toggle');

  if (!grid) return;

  function fmtDate(iso){
    try{
      const d = new Date(iso + 'T00:00:00');
      const dd = String(d.getDate()).padStart(2,'0');
      const mm = String(d.getMonth()+1).padStart(2,'0');
      const yyyy = d.getFullYear();
      return `${dd}.${mm}.${yyyy}`;
    }catch{ return iso; }
  }

  function normalizeTags(tags){
    if(!Array.isArray(tags)) return [];
    const seen = new Set(), out=[];
    for(const t of tags){
      if (CANONICAL.has(t) && !seen.has(t)) { seen.add(t); out.push(t); }
    }
    return out;
  }

  function createCard(a){
    const { title, url, image, tags, date, time, excerpt } = a;
    const tagsNorm = normalizeTags(tags);

    const art = document.createElement('article');
    art.className = 'artikel';
    art.setAttribute('data-tags', tagsNorm.join(', '));

    const link = document.createElement('a');
    link.className = 'artikel-link';
    link.href = url;
    link.setAttribute('aria-label', title || 'Beitrag öffnen');
    art.appendChild(link);

    const imgWrap = document.createElement('div');
    imgWrap.className = 'artikel-img';
    const img = document.createElement('img');
    img.src = image || '';
    img.alt = title || '';
    img.loading = 'lazy';
    img.decoding = 'async';
    imgWrap.appendChild(img);

    const body = document.createElement('div');
    body.className = 'artikel-body';

    const tagList = document.createElement('ul');
    tagList.className = 'artikel-tag-line';
    tagsNorm.forEach(t=>{
      const li = document.createElement('li');
      li.className = 'artikel-tag';
      li.dataset.tag = t;
      li.textContent = LABELS[t] || t;
      tagList.appendChild(li);
    });

    const h2 = document.createElement('h2');
    h2.textContent = title || '';

    const pText = document.createElement('p');
    pText.className = 'artikel-text';
    pText.textContent = excerpt || '';

    const pMeta = document.createElement('p');
    pMeta.className = 'content-meta';
    const dateStr = date ? fmtDate(date) : '';
    const timeStr = (time || '').trim();
    pMeta.textContent = `${dateStr}${dateStr && timeStr ? ' – ' : ''}${timeStr ? '⏱ ' + timeStr : ''}`;

    body.append(tagList, h2, pText, pMeta);
    art.append(imgWrap, body);
    return art;
  }

  function renderArticles(articles){
    grid.innerHTML = '';
    const frag = document.createDocumentFragment();
    articles.forEach(a => frag.appendChild(createCard(a)));
    grid.appendChild(frag);
    if (noMsg) noMsg.style.display = articles.length ? 'none' : 'block';
  }

  let activeTags = [];

  function articleMatchesFilter(articleEl){
    if (activeTags.length === 0) return true;
    const articleTags = (articleEl.getAttribute('data-tags') || '')
      .split(',').map(s=>s.trim()).filter(Boolean);
    const useAnd = andFilterToggle && andFilterToggle.checked;
    return useAnd
      ? activeTags.every(t => articleTags.includes(t))
      : activeTags.some(t => articleTags.includes(t));
  }

  function applyFilter(){
    const cards = grid.querySelectorAll('.artikel');
    let any = false;
    cards.forEach(card => {
      const vis = articleMatchesFilter(card);
      card.style.display = vis ? 'block' : 'none';
      if (vis) any = true;
    });
    if (noMsg) noMsg.style.display = any ? 'none' : 'block';
  }

  function syncFilterButtons(){
    tagButtons.forEach(btn => {
      const t = btn.dataset.tag;
      if (t === '__all') btn.classList.toggle('active', activeTags.length === 0);
      else btn.classList.toggle('active', activeTags.includes(t));
    });
  }

  function wireFilters(){
    tagButtons.forEach(button => {
      button.addEventListener('click', () => {
        const tag = button.dataset.tag;
        if (tag === '__all') activeTags = [];
        else activeTags = activeTags.includes(tag)
          ? activeTags.filter(t => t !== tag)
          : [...activeTags, tag];

        syncFilterButtons();
        applyFilter();
      });
    });
    if (andFilterToggle) andFilterToggle.addEventListener('change', applyFilter);
  }

  // Daten laden (relativ zu /Texte/index.html)
  const resp = await fetch('../assets/data/articles.json', { cache: 'no-store' });
  const data = await resp.json();
  const arr = Array.isArray(data?.articles) ? data.articles : [];

  const articles = arr
    .filter(a => a && a.title && a.url)
    .map(a => ({ ...a, tags: normalizeTags(a.tags) }))
    .sort((a,b) => String(b.date).localeCompare(String(a.date)));

  renderArticles(articles);
  wireFilters();
  syncFilterButtons();
  applyFilter();
});
