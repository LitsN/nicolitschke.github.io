document.addEventListener('DOMContentLoaded', () => {
  (function () {
    // ---------- Konstanten ----------
    const LABELS = {
      "engineering": "Engineering",
      "fuehren-managen": "Führen & Managen",
      "mastery-lernen": "Mastery & Lernen",
      "safety-risiko": "Safety & Risiko",
      "skills-tools": "Skills & Tools",
      "systemik": "Systemdenken"
    };


    const CANONICAL = new Set(Object.keys(LABELS));

    const DATA_URL = "assets/data/articles.json";
    const HERO_SRC = (name) => `assets/img/${name}/hero.png`;
    const ARTICLE_HREF = (name) => `texte/${name}.html`;

    const grid = document.getElementById('card-grid');
    const noMsg = document.getElementById('no-results-message');
    const tagButtons = document.querySelectorAll('.filter-button');
    const andFilterToggle = document.getElementById('and-filter-toggle');

    if (!grid) return;

    function normalizeTags(tags) {
      if (!Array.isArray(tags)) return [];
      const seen = new Set(), out = [];
      for (const t of tags) {
        if (CANONICAL.has(t) && !seen.has(t)) { seen.add(t); out.push(t); }
      }
      return out;
    }

    // ---------- Card-Generator ----------
    function createCard(a) {
      const { title, name, tags, excerpt } = a;
      const tagsNorm = normalizeTags(tags);

      const art = document.createElement('article');
      art.className = 'card';
      art.setAttribute('data-tags', tagsNorm.join(', '));

      const imgWrap = document.createElement('div');
      imgWrap.className = 'card-img';
      const img = document.createElement('img');
      img.src = HERO_SRC(name);
      img.alt = "";
      imgWrap.appendChild(img);

      const body = document.createElement('div');
      body.className = 'card-body';

      // Die Liste (Container)
      const tagLine = document.createElement('ul');
      tagLine.className = 'card-tag-line';

      tagsNorm.forEach(t => {
        const li = document.createElement('li');
        li.className = 'card-tag';
        li.dataset.tag = t;
        li.textContent = LABELS[t] || t;
        tagLine.appendChild(li);
      });

      const h2 = document.createElement('h2');
      const mainLink = document.createElement('a');
      mainLink.href = ARTICLE_HREF(name);
      mainLink.className = 'card-title-link';
      mainLink.textContent = title;
      h2.appendChild(mainLink);

      const pText = document.createElement('p');
      pText.className = 'card-text';
      pText.innerHTML = excerpt;

      body.append(tagLine, h2, pText);
      art.append(imgWrap, body);
      return art;
    }

    function renderArticles(articles) {
      grid.innerHTML = '';
      const frag = document.createDocumentFragment();
      articles.forEach(a => frag.appendChild(createCard(a)));
      grid.appendChild(frag);
    }

    // ---------- Filter Logik ----------
    let activeTags = [];

    // NEU: Diese Funktion prüft beim Start die URL
    function checkUrlForFilters() {
      const params = new URLSearchParams(window.location.search);
      const tag = params.get('tag');
      if (tag && CANONICAL.has(tag)) {
        activeTags = [tag];
      }
    }

    function articleMatchesFilter(articleEl) {
      if (activeTags.length === 0) return true;
      const articleTags = (articleEl.getAttribute('data-tags') || '')
        .split(',').map(s => s.trim()).filter(Boolean);
      const useAnd = andFilterToggle && andFilterToggle.checked;
      return useAnd
        ? activeTags.every(t => articleTags.includes(t))
        : activeTags.some(t => articleTags.includes(t));
    }

    function applyFilter() {
      const cards = grid.querySelectorAll('.card');
      let any = false;
      cards.forEach(card => {
        const vis = articleMatchesFilter(card);
        card.style.display = vis ? '' : 'none'; // '' lässt CSS Grid entscheiden
        if (vis) any = true;
      });
      if (noMsg) noMsg.style.display = any ? 'none' : 'block';
      if (activeTags.length > 0) {
        window.scrollTo({ top: grid.offsetTop - 100, behavior: 'smooth' });
      }
    }

    function syncFilterButtons() {
      tagButtons.forEach(btn => {
        const t = btn.dataset.tag;
        if (t === '__all') btn.classList.toggle('active', activeTags.length === 0);
        else btn.classList.toggle('active', activeTags.includes(t));
      });
    }

    function wireFilters() {
      tagButtons.forEach(button => {
        button.addEventListener('click', () => {
          const tag = button.dataset.tag;
          if (tag === '__all') {
            activeTags = [];
          } else {
            if (activeTags.includes(tag)) activeTags = activeTags.filter(t => t !== tag);
            else activeTags.push(tag);
          }
          syncFilterButtons();
          applyFilter();
        });
      });
      if (andFilterToggle) andFilterToggle.addEventListener('change', applyFilter);
    }

    // ---------- Init ----------
    fetch(DATA_URL, { cache: "no-store" })
      .then(res => res.json())
      .then(data => {
        const arr = Array.isArray(data) ? data : (data.articles || []);
        const articles = arr
          .filter(a => a?.title && a?.name)
          .map(a => ({ ...a, tags: normalizeTags(a.tags) }))
          .sort((a, b) => String(b.date).localeCompare(String(a.date)));

        checkUrlForFilters(); // 1. URL Parameter checken
        renderArticles(articles);
        wireFilters();
        syncFilterButtons(); // 2. Buttons basierend auf URL aktivieren
        applyFilter();       // 3. Sofort filtern
      })
      .catch(err => console.error("Fehler:", err));

  })();
});