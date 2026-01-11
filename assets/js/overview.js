document.addEventListener('DOMContentLoaded', () => {
  (function () {
    // ---------- Konstanten ----------
    const LABELS = {
      engineering: "Engineering",
      "fuehren-managen": "Führen & Managen",
      "mastery-lernen": "Mastery & Lernen",
      "safety-risiko": "Safety & Risiko",
      "skills-tools": "Skills & Tools",
      systemik: "Systemdenken",
    };
    const CANONICAL = new Set(Object.keys(LABELS));

    // JSON-Pfad: Texte/index.html liegt eine Ebene unter Root
    const DATA_URL = "../assets/data/articles.json";

    // ---------- DOM ----------
    const grid = document.getElementById("artikel-grid");
    const noMsg = document.getElementById("no-results-message");
    const tagButtons = document.querySelectorAll(".filter-icon-tag");
    const andFilterToggle = document.getElementById("and-filter-toggle");

    if (!grid) {
      console.warn("#artikel-grid nicht gefunden");
      return;
    }

    // ---------- Utils ----------
    function fmtDate(iso) {
      try {
        const d = new Date(iso + "T00:00:00");
        const dd = String(d.getDate()).padStart(2, "0");
        const mm = String(d.getMonth() + 1).padStart(2, "0");
        const yyyy = d.getFullYear();
        return `${dd}.${mm}.${yyyy}`;
      } catch {
        return iso;
      }
    }

    function normalizeTags(tags) {
      if (!Array.isArray(tags)) return [];
      const seen = new Set(),
        out = [];
      for (const t of tags) {
        if (CANONICAL.has(t) && !seen.has(t)) {
          seen.add(t);
          out.push(t);
        }
      }
      return out;
    }

    // ---------- Card-Generator (Overlay-Link) ----------
    function createCard(a) {
      const { title, url, image, tags, date, time, excerpt } = a;
      const tagsNorm = normalizeTags(tags);

      const art = document.createElement("article");
      art.className = "artikel";
      art.setAttribute("data-tags", tagsNorm.join(", "));

      // Overlay-Link als erstes Kind
      const link = document.createElement("a");
      link.className = "artikel-link";
      link.href = url;
      link.setAttribute("aria-label", title || "Beitrag öffnen");
      link.rel = "noopener noreferrer";
      art.appendChild(link);

      // Bild
      const imgWrap = document.createElement("div");
      imgWrap.className = "artikel-img";
      const img = document.createElement("img");
      img.src = image;
      img.alt = title || "";
      img.loading = "lazy";
      img.decoding = "async";
      imgWrap.appendChild(img);

      // Body
      const body = document.createElement("div");
      body.className = "artikel-body";

      const tagList = document.createElement("ul");
      tagList.className = "artikel-tag-line";
      tagsNorm.forEach((t) => {
        const li = document.createElement("li");
        li.className = "artikel-tag";
        li.dataset.tag = t;
        li.textContent = LABELS[t] || t;
        tagList.appendChild(li);
      });

      const h2 = document.createElement("h2");
      h2.textContent = title || "";

      const pText = document.createElement("p");
      pText.className = "artikel-text";
      pText.textContent = excerpt || "";

      // Optional: Metazeile wieder aktivieren, falls du sie später brauchst
      // const pMeta = document.createElement("p");
      // pMeta.className = "content-meta";
      // const dateStr = date ? fmtDate(date) : "";
      // pMeta.innerHTML = `${dateStr}${dateStr && time ? " – " : ""}${time ? "⏱ " + time.replace(" ", "&nbsp;") : ""}`;

      body.append(tagList, h2, pText); //, pMeta);
      art.append(imgWrap, body);
      return art;
    }

    function renderArticles(articles) {
      grid.innerHTML = "";
      const frag = document.createDocumentFragment();
      articles.forEach((a) => frag.appendChild(createCard(a)));
      grid.appendChild(frag);
      if (noMsg) noMsg.style.display = articles.length ? "none" : "block";
    }

    // ---------- Filter ----------
    let activeTags = [];
    function articleMatchesFilter(articleEl) {
      if (activeTags.length === 0) return true;
      const articleTags = (articleEl.getAttribute("data-tags") || "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      const useAnd = andFilterToggle && andFilterToggle.checked;
      return useAnd
        ? activeTags.every((t) => articleTags.includes(t))
        : activeTags.some((t) => articleTags.includes(t));
    }

    function applyFilter() {
      const cards = grid.querySelectorAll(".artikel");
      let any = false;
      cards.forEach((card) => {
        const vis = articleMatchesFilter(card);
        card.style.display = vis ? "block" : "none";
        if (vis) any = true;
      });
      if (noMsg) noMsg.style.display = any ? "none" : "block";
    }

    function syncFilterButtons() {
      tagButtons.forEach((btn) => {
        const t = btn.dataset.tag;
        if (t === "__all")
          btn.classList.toggle("active", activeTags.length === 0);
        else btn.classList.toggle("active", activeTags.includes(t));
      });
    }

    function wireFilters() {
      tagButtons.forEach((button) => {
        button.addEventListener("click", () => {
          const tag = button.dataset.tag;
          if (tag === "__all") {
            activeTags = [];
          } else {
            if (activeTags.includes(tag))
              activeTags = activeTags.filter((t) => t !== tag);
            else activeTags.push(tag);
          }
          syncFilterButtons();
          applyFilter();
        });
      });
      if (andFilterToggle) andFilterToggle.addEventListener("change", applyFilter);
    }

    // ---------- Daten laden & Init ----------
    function extractArticles(data) {
      // erlaubt: { articles: [...] } oder direkt [...]
      const arr = Array.isArray(data)
        ? data
        : Array.isArray(data?.articles)
        ? data.articles
        : [];
      return arr
        .filter((a) => a && a.title && a.url)
        .map((a) => ({ ...a, tags: normalizeTags(a.tags) }))
        .sort((a, b) => String(b.date).localeCompare(String(a.date)));
    }

    fetch(DATA_URL, { cache: "no-store" })
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status} beim Laden von ${DATA_URL}`);
        return r.json();
      })
      .then((data) => {
        const articles = extractArticles(data);
        renderArticles(articles);
        wireFilters();
        syncFilterButtons();
        applyFilter();
      })
      .catch((e) => {
        console.error("Artikel-JSON konnte nicht geladen werden:", e);
        if (noMsg) noMsg.style.display = "block";
      });
  })();
});
