/* =========================================================
   Member 페이지 렌더링
   - js/members.js 의 MEMBERS 배열을 읽어서 카드 + 상세 팝업 생성
   ========================================================= */
(function () {
  const list = document.getElementById("memberList");
  const tabs = document.getElementById("memberTabs");
  const modal = document.getElementById("memberModal");
  const modalBody = document.getElementById("modalBody");
  if (!list || typeof MEMBERS === "undefined") return;

  /* ---------- 유틸 ---------- */
  const esc = (s) =>
    String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  const hasItems = (obj) => obj && Object.values(obj).some((arr) => arr && arr.length);
  const count = (obj) => (obj ? Object.values(obj).reduce((n, a) => n + (a ? a.length : 0), 0) : 0);

  // 저자 목록에서 본인 이름 굵게
  function boldSelf(authors, member) {
    let out = esc(authors);
    const names = [].concat(member.citeName || [], member.nameEn || []);
    names.forEach((n) => {
      if (!n) return;
      out = out.split(esc(n)).join(`<strong>${esc(n)}</strong>`);
    });
    return out.replace(/<strong><strong>(.*?)<\/strong><\/strong>/g, "<strong>$1</strong>");
  }

  function photoHTML(m, cls) {
    const initials = (m.nameEn || m.nameKo || "?").split(" ").map((w) => w[0]).join("").slice(0, 2);
    return m.photo
      ? `<img class="${cls}" src="${esc(m.photo)}" alt="${esc(m.nameEn)}" loading="lazy"
           onerror="this.outerHTML='<div class=&quot;${cls} ${cls}--empty&quot;>${esc(initials)}</div>'">`
      : `<div class="${cls} ${cls}--empty">${esc(initials)}</div>`;
  }

  /* ---------- 카드 ---------- */
  function cardHTML(m) {
    return `
      <article class="m-card" tabindex="0" data-id="${esc(m.id)}" aria-label="${esc(m.nameEn)} 상세 보기">
        <div class="m-card__photo">
          ${photoHTML(m, "m-card__img")}
        </div>
        <div class="m-card__body">
          <span class="m-card__position">${esc(m.position)}</span>
          <h3 class="m-card__name">${esc(m.nameEn)}<small>${esc(m.nameKo)}</small></h3>
          ${m.department ? `<p class="m-card__dept">${esc(m.department.en)}</p>` : ""}
          ${m.interests && m.interests.length
            ? `<ul class="m-card__tags">${m.interests.map((t) => `<li>${esc(t)}</li>`).join("")}</ul>` : ""}
          <div class="m-card__foot">
            ${m.email && m.email[0]
              ? `<a class="m-card__mail" href="mailto:${esc(m.email[0])}" onclick="event.stopPropagation()">✉ ${esc(m.email[0])}</a>` : "<span></span>"}
          </div>
        </div>
      </article>`;
  }

  /* ---------- 목록 (그룹별) ---------- */
  function render(filter = "all") {
    const groups = MEMBER_GROUPS.filter((g) => MEMBERS.some((m) => m.group === g.key));
    list.innerHTML = groups
      .filter((g) => filter === "all" || g.key === filter)
      .map((g) => {
        const ms = MEMBERS.filter((m) => m.group === g.key);
        return `
          <div class="m-group" id="${g.key}">
            <div class="m-group__head">
              <h2 class="m-group__title">${esc(g.title)}</h2>
            </div>
            <div class="m-grid">${ms.map(cardHTML).join("")}</div>
          </div>`;
      })
      .join("");

    list.querySelectorAll(".m-card").forEach((card) => {
      card.addEventListener("click", () => openModal(card.dataset.id));
      card.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openModal(card.dataset.id); }
      });
    });
  }

  function renderTabs() {
    const groups = MEMBER_GROUPS.filter((g) => MEMBERS.some((m) => m.group === g.key));
    tabs.innerHTML =
      `<li><button class="is-active" data-filter="all">All</button></li>` +
      groups.map((g) =>
        `<li><button data-filter="${g.key}">${esc(g.title)}</button></li>`
      ).join("");
    tabs.querySelectorAll("button").forEach((b) =>
      b.addEventListener("click", () => {
        tabs.querySelectorAll("button").forEach((x) => x.classList.remove("is-active"));
        b.classList.add("is-active");
        render(b.dataset.filter);
      })
    );
  }

  /* ---------- 상세 팝업 ---------- */
  function pubList(obj, member) {
    return Object.entries(obj)
      .filter(([, arr]) => arr && arr.length)
      .map(([label, arr]) => `
        <div class="pub-block">
          <span class="pub-block__label">${esc(label)}</span>
          <ol class="pub-list">
            ${arr.map((p) => `
              <li>
                <span class="pub__authors">${boldSelf(p.authors, member)}.</span>
                <span class="pub__title">"${esc(p.title)}."</span>
                <span class="pub__venue">${esc(p.venue)}${p.year ? `, ${esc(p.year)}` : ""}.</span>
                ${p.note ? `<span class="pub__note">${esc(p.note)}</span>` : ""}
              </li>`).join("")}
          </ol>
        </div>`)
      .join("");
  }

  function detailHTML(m) {
    const sec = (title, inner) => `<section class="md-sec"><h3 class="md-sec__title">${title}</h3>${inner}</section>`;
    const linkIcons = m.links ? Object.entries(m.links).filter(([, u]) => u)
      .map(([k, u]) => `<a href="${esc(u)}" target="_blank" rel="noopener">${esc(k)}</a>`).join("") : "";
    return `
      <div class="md">
        <aside class="md__side">
          ${photoHTML(m, "md__img")}
          <span class="md__position">${esc(m.position)}</span>
          <h2 class="md__name" id="modalName">${esc(m.nameEn)}</h2>
          <p class="md__name-ko">${esc(m.nameKo)}</p>
          ${m.department ? `<p class="md__dept">${esc(m.department.ko)}<br><span>${esc(m.department.en)}</span></p>` : ""}
          ${m.email && m.email.length ? `<ul class="md__mail">${m.email.map((e) => `<li><a href="mailto:${esc(e)}">✉ ${esc(e)}</a></li>`).join("")}</ul>` : ""}
          ${linkIcons ? `<div class="md__links">${linkIcons}</div>` : ""}
        </aside>
        <div class="md__main">
          ${m.interests && m.interests.length
            ? sec("Research Interests", `<ul class="md__tags">${m.interests.map((t) => `<li>${esc(t)}</li>`).join("")}</ul>`) : ""}
          ${m.awards && m.awards.length
            ? sec("Awards & Honors", `<ul class="md__awards">${m.awards.map((a) =>
                `<li><span class="md__award-icon">🏆</span>${esc(a.title)}${a.year ? ` <em>(${esc(a.year)})</em>` : ""}</li>`).join("")}</ul>`) : ""}
          ${hasItems(m.journals) ? sec(`Journal Papers <span class="md__cnt">${count(m.journals)}</span>`, pubList(m.journals, m)) : ""}
          ${hasItems(m.conferences) ? sec(`Conference Papers <span class="md__cnt">${count(m.conferences)}</span>`, pubList(m.conferences, m)) : ""}
        </div>
      </div>`;
  }

  let lastFocus = null;
  function openModal(id) {
    const m = MEMBERS.find((x) => x.id === id);
    if (!m) return;
    lastFocus = document.activeElement;
    modalBody.innerHTML = detailHTML(m);
    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    modal.querySelector(".modal__dialog").scrollTop = 0;
    modal.querySelector(".modal__close").focus();
    history.replaceState(null, "", `#${id}`);
  }
  function closeModal() {
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
    history.replaceState(null, "", location.pathname);
    if (lastFocus) lastFocus.focus();
  }
  modal.querySelectorAll("[data-close]").forEach((el) => el.addEventListener("click", closeModal));
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && modal.classList.contains("is-open")) closeModal(); });

  /* ---------- 시작 ---------- */
  renderTabs();
  render();

  // 주소로 바로 열기: member.html#yeonsu-park  /  그룹 이동: member.html#current, #faculty
  const hash = decodeURIComponent(location.hash.slice(1));
  if (hash) {
    if (MEMBERS.some((m) => m.id === hash)) openModal(hash);
    else {
      const target = hash === "current" ? list.querySelector(".m-group:not(#faculty)") : document.getElementById(hash);
      if (target) setTimeout(() => target.scrollIntoView({ behavior: "smooth", block: "start" }), 300);
    }
  }
})();
