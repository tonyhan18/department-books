(() => {
  "use strict";
  const $ = (selector, root = document) => root.querySelector(selector);
  const esc = (value) => String(value ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const state = { data: null, filter: "all", query: "" };

  const themeButton = $("#theme-button");
  themeButton.addEventListener("click", () => {
    const dark = document.documentElement.dataset.theme === "dark" || (!document.documentElement.dataset.theme && matchMedia("(prefers-color-scheme: dark)").matches);
    document.documentElement.dataset.theme = dark ? "light" : "dark";
    try { localStorage.setItem("department-books-theme", document.documentElement.dataset.theme); } catch (_) {}
  });

  function categoryMap() {
    return Object.fromEntries(state.data.categories.map(category => [category.id, category]));
  }

  function renderStats() {
    const books = state.data.books;
    $("#stat-total").textContent = books.length;
    $("#stat-published").textContent = books.filter(book => book.status === "published").length;
    $("#stat-writing").textContent = books.filter(book => book.status === "writing").length;
    $("#stat-categories").textContent = state.data.categories.length;
  }

  function renderFilters() {
    const filters = [
      ["all", "전체"],
      ["published", "공개"],
      ["writing", "작성 중"],
      ["planned", "예정"],
      ...state.data.categories.map(category => [category.id, category.name])
    ];
    $("#filter-bar").innerHTML = filters.map(([id, label]) => `<button class="filter-button${id === state.filter ? " active" : ""}" type="button" data-filter="${esc(id)}">${esc(label)}</button>`).join("");
    $("#filter-bar").addEventListener("click", event => {
      const button = event.target.closest("[data-filter]");
      if (!button) return;
      state.filter = button.dataset.filter;
      renderFilters();
      renderBooks();
    }, { once: true });
  }

  function visibleBooks() {
    const query = state.query.trim().toLocaleLowerCase("ko");
    return state.data.books.filter(book => {
      const filterMatch = state.filter === "all" || book.status === state.filter || book.category === state.filter;
      const haystack = [book.title, book.subtitle, book.headline, book.description, ...(book.topics || [])].join(" ").toLocaleLowerCase("ko");
      return filterMatch && (!query || haystack.includes(query));
    });
  }

  function renderBooks() {
    const categories = categoryMap();
    const books = visibleBooks();
    $("#empty-state").hidden = books.length > 0;
    $("#book-grid").innerHTML = books.map(book => {
      const category = categories[book.category];
      const canOpen = book.status === "published" && Array.isArray(book.sections);
      return `<article class="book-card" style="--book-color:${esc(category.color)}">
        <div class="book-card-head"><span class="book-code">${esc(book.code)}</span><span class="status">${esc(state.data.statusLabels[book.status])}</span></div>
        <h3>${esc(book.title)}</h3><p class="subtitle">${esc(book.subtitle)}</p>
        <p class="description">${esc(book.description)}</p>
        <div class="topics">${(book.topics || []).slice(0, 5).map(topic => `<span>${esc(topic)}</span>`).join("")}</div>
        <div class="card-foot"><span>${esc(category.name)} · ${esc(book.level)}</span><button class="open-book" type="button" data-book="${esc(book.id)}" ${canOpen ? "" : "disabled"}>${canOpen ? "펼쳐 보기 →" : state.data.statusLabels[book.status]}</button></div>
      </article>`;
    }).join("");
  }

  function renderRoadmap() {
    const statuses = [["published", "공개", "#0f766e"], ["writing", "작성 중", "#b45309"], ["planned", "예정", "#746b67"]];
    const published = state.data.books.filter(book => book.status === "published").length;
    const percent = Math.round(published / state.data.books.length * 100);
    $("#progress-value").textContent = `${percent}%`;
    requestAnimationFrame(() => { $("#progress-bar").style.width = `${percent}%`; });
    $("#roadmap-columns").innerHTML = statuses.map(([status, label, color]) => {
      const books = state.data.books.filter(book => book.status === status);
      return `<section class="roadmap-column" style="--column-color:${color}"><h3>${label}<span>${books.length}권</span></h3><ul>${books.map(book => `<li>${esc(book.title)} <small>· ${esc(book.subtitle)}</small></li>`).join("")}</ul></section>`;
    }).join("");
  }

  function openBook(id) {
    const book = state.data.books.find(item => item.id === id);
    if (!book || !book.sections) return;
    const category = categoryMap()[book.category];
    const dialog = $("#book-dialog");
    $("#dialog-content").innerHTML = `<article class="dialog-inner" style="--dialog-color:${esc(category.color)}">
      <div class="dialog-kicker">${esc(book.code)} · ${esc(category.name)}</div>
      <h2 id="dialog-title">${esc(book.title)}</h2>
      <p><strong>${esc(book.headline)}</strong><br>${esc(book.description)}</p>
      <div class="dialog-meta"><span>${esc(book.level)}</span><span>${book.chapters}개 장</span><span>최근 갱신 ${esc(book.updated)}</span></div>
      <div>${book.sections.map((section, index) => `<section class="chapter"><h3>${String(index + 1).padStart(2, "0")} · ${esc(section.title)}</h3><p>${esc(section.body)}</p></section>`).join("")}</div>
      <p class="dialog-note">이 내용은 초기 템플릿입니다. 실제 부서의 담당자, 링크, 예외 조건과 검토 주기로 교체해 사용하세요.</p>
    </article>`;
    dialog.showModal();
  }

  $("#book-grid").addEventListener("click", event => {
    const button = event.target.closest("[data-book]");
    if (button) openBook(button.dataset.book);
  });
  $(".dialog-close").addEventListener("click", () => $("#book-dialog").close());
  $("#book-dialog").addEventListener("click", event => { if (event.target === event.currentTarget) event.currentTarget.close(); });
  $("#search-input").addEventListener("input", event => { state.query = event.target.value; renderBooks(); });

  fetch("./data/books.json", { cache: "no-cache" })
    .then(response => { if (!response.ok) throw new Error(`HTTP ${response.status}`); return response.json(); })
    .then(data => {
      state.data = data;
      document.title = `${data.site.name} · ${data.site.koreanName}`;
      renderStats(); renderFilters(); renderBooks(); renderRoadmap();
    })
    .catch(error => {
      console.error(error);
      $("#book-grid").innerHTML = '<p class="empty-state">책 목록을 불러오지 못했습니다. 잠시 뒤 다시 시도해 주세요.</p>';
    });
})();
