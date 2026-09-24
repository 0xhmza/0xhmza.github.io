(() => {
  "use strict";
  // Search the HTML already on the page: no fetch, index, or search dependency.
  const search = document.getElementById("search-input");
  if (search) {
    document.querySelector(".archive-tools").hidden = false;
    const cards = [...document.querySelectorAll("[data-search]")];
    const normalize = (value) => value.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    const entries = cards.map((card) => ({ card, text: normalize(card.dataset.search) }));
    const filter = () => {
      const terms = normalize(search.value).trim().split(/\s+/).filter(Boolean);
      let count = 0;
      entries.forEach(({ card, text }) => {
        card.hidden = !terms.every((term) => text.includes(term));
        if (!card.hidden) count += 1;
      });
      document.getElementById("search-status").textContent = `${count} article${count === 1 ? "" : "s"}`;
      document.getElementById("search-empty").hidden = count !== 0;
    };
    search.addEventListener("input", filter);
    search.addEventListener("keydown", (event) => {
      if (event.key === "Escape") { search.value = ""; filter(); }
    });
    filter();
  }

  const article = document.querySelector(".article-body");
  if (!article) return;

  const headings = [...article.querySelectorAll("h2[id], h3[id]")];
  const sidebar = document.querySelector(".article-sidebar");
  if (sidebar && headings.length > 1) {
    sidebar.hidden = false;
    const toc = sidebar.querySelector("details");
    toc.open = !window.matchMedia("(max-width: 700px)").matches;
    const list = sidebar.querySelector("ol");
    const hasH2 = headings.some((heading) => heading.tagName === "H2");
    const links = headings.map((heading) => {
      const item = document.createElement("li");
      if (hasH2 && heading.tagName === "H3") item.className = "toc-sub";
      const link = document.createElement("a");
      link.href = "#" + encodeURIComponent(heading.id);
      link.textContent = heading.textContent;
      item.append(link);
      list.append(item);
      return link;
    });
    const markCurrent = (id) => links.forEach((link, index) => {
      if (headings[index].id === id) link.setAttribute("aria-current", "location");
      else link.removeAttribute("aria-current");
    });
    links.forEach((link, index) => link.addEventListener("click", () => markCurrent(headings[index].id)));
    if ("IntersectionObserver" in window) {
      const visible = new Set();
      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => entry.isIntersecting ? visible.add(entry.target) : visible.delete(entry.target));
        const current = headings.find((heading) => visible.has(heading));
        if (current) markCurrent(current.id);
      }, { rootMargin: "-100px 0px -55% 0px" });
      headings.forEach((heading) => observer.observe(heading));
    }
  }

  headings.forEach((heading) => {
    const anchor = document.createElement("a");
    anchor.className = "heading-anchor";
    anchor.href = "#" + encodeURIComponent(heading.id);
    anchor.setAttribute("aria-label", "Link to " + heading.textContent);
    anchor.textContent = "#";
    heading.append(anchor);
  });

  article.querySelectorAll("table").forEach((table) => {
    const wrapper = document.createElement("div");
    wrapper.className = "table-scroll";
    wrapper.tabIndex = 0;
    wrapper.setAttribute("role", "region");
    wrapper.setAttribute("aria-label", table.caption?.textContent || "Scrollable data table");
    table.before(wrapper);
    wrapper.append(table);
  });

  article.querySelectorAll("pre").forEach((pre) => {
    const code = pre.querySelector("code");
    if (!code || pre.classList.contains("mermaid") || code.classList.contains("language-mermaid") || pre.closest(".language-mermaid")) return;
    const wrapper = document.createElement("div");
    wrapper.className = "code-block";
    pre.before(wrapper);
    wrapper.append(pre);
    pre.tabIndex = 0;
    const language = code.className.match(/language-([\w-]+)/)?.[1]
      || pre.closest("[class*='language-']")?.className.match(/language-([\w-]+)/)?.[1];
    if (language && language !== "plaintext") {
      const label = document.createElement("span");
      label.className = "code-language";
      label.textContent = language;
      wrapper.append(label);
    }
    if (!navigator.clipboard?.writeText) return;
    const button = document.createElement("button");
    button.type = "button";
    button.className = "copy-button";
    button.textContent = "Copy";
    button.setAttribute("aria-label", "Copy code");
    button.setAttribute("aria-live", "polite");
    button.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(code.textContent);
        button.textContent = "Copied";
      } catch (_) {
        button.textContent = "Select & copy";
        const range = document.createRange();
        range.selectNodeContents(code);
        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);
      }
      setTimeout(() => { button.textContent = "Copy"; }, 2000);
    });
    wrapper.append(button);
  });
})();
