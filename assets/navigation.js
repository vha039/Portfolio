(function () {
  "use strict";
  const page = document.body.dataset.page;
  const pages = new Set(
    "index bi budsjett gevinst prognose ki utfyllende bakgrunn finn sammendrag".split(" "),
  );
  // Resume order on the Finn dialog.
  const workspaces = ["budsjett", "bi", "prognose", "gevinst", "ki"];
  if (!pages.has(page)) return;
  const index = Array.isArray(window.R8Index)
    ? window.R8Index.map(([label, href, kind, terms]) => ({
        label,
        href,
        kind: "Side Del Valg Teknisk Påstand Ordliste Illustrasjon".split(" ")[kind],
        terms,
      }))
    : [];
  const own = (o, k) => !!o && Object.hasOwn(o, k);
  const object = (o) => !!o && typeof o === "object" && !Array.isArray(o);
  const $ = (id) => document.getElementById(id);
  const dialog = $("finn-dialog"),
    search = $("dialog-search"),
    message = $("nav-message");
  const chapters = [
    ...document.querySelectorAll('details[data-depth="teknisk"]'),
  ];
  const manual = new Map();
  // Firefox keeps local-file storage separate. Do not promise cross-file handover there.
  const isolatedFiles =
    location.protocol === "file:" && /Firefox\//.test(navigator.userAgent);
  const gone =
    "Denne delen finnes ikke lenger. Åpne siden eller fjern den festede visningen.";
  const storageMessage =
    "Denne visningen kan ikke lagres i nettleseren. Du kan fortsatt bruke lenken.";
  let storageIssue = false;
  let trigger = null,
    beforeDialog = null,
    leavingDialog = false;
  let restoring = false,
    timer = null,
    contentFocus = "";
  // Reader input or a newer navigation cancels a pending restore.
  let generation = 0,
    pairedHash = "";
  const cancel = () => generation++;
  for (const type of ["pointerdown", "wheel", "touchstart", "keydown"])
    addEventListener(type, cancel, { capture: true, passive: true });
  const el = (tag, text) => {
    const n = document.createElement(tag);
    if (text != null) n.textContent = text;
    return n;
  };
  // Explicit zero tabindex keeps generated links in WebKit's keyboard order.
  const link = (text, href) => {
    const a = el("a", text);
    a.tabIndex = 0;
    a.href = href;
    return a;
  };
  function notice(text) {
    if (message) {
      message.textContent = text;
      message.hidden = !text;
    }
  }
  function read(store, key, fallback) {
    try {
      const x = window[store].getItem(key);
      return x ? JSON.parse(x) : fallback;
    } catch {
      storageIssue = true;
      return fallback;
    }
  }
  function write(store, key, value) {
    try {
      window[store].setItem(key, JSON.stringify(value));
      return true;
    } catch {
      return false;
    }
  }
  let preferences = read("localStorage", "r8.preferences", {});
  if (!object(preferences)) {
    storageIssue = true;
    preferences = {};
  }
  if (
    (own(preferences, "lens") &&
      !["oversikt", "teknisk"].includes(preferences.lens)) ||
    (own(preferences, "theme") &&
      !["system", "lys", "mork"].includes(preferences.theme))
  )
    storageIssue = true;
  let lens =
    own(preferences, "lens") && preferences.lens === "teknisk"
      ? "teknisk"
      : "oversikt";
  let shortcut = own(preferences, "shortcut") && preferences.shortcut === true;
  // Other tabs may have written since: every mutation rereads.
  function readReading() {
    let r = read("sessionStorage", "r8.reading", {});
    if (!object(r)) (storageIssue = true), (r = {});
    if (own(r, "contexts") && !object(r.contexts)) storageIssue = true;
    if (!object(r.contexts)) r.contexts = {};
    return r;
  }
  function readPins() {
    const p = read("localStorage", "r8.pins", []);
    if (!Array.isArray(p)) storageIssue = true;
    return Array.isArray(p) ? p.filter(object) : [];
  }
  // A message at the top of <main>; no text removes it.
  function banner(id, className, role, text) {
    let n = $(id);
    if (!text) return n?.remove();
    if (!n) {
      n = el("p");
      n.id = id;
      n.className = className;
      n.setAttribute("role", role);
      $("main").prepend(n);
    }
    n.textContent = text;
  }
  function prefer(key, value) {
    const p = read("localStorage", "r8.preferences", {});
    banner(
      "preference-message",
      "nav-message",
      "status",
      write("localStorage", "r8.preferences", { ...(object(p) ? p : {}), [key]: value })
        ? ""
        : "Valget gjelder denne siden, men kunne ikke lagres i nettleseren.",
    );
  }
  let reading = readReading();
  let pins = readPins();
  const keys = Object.fromEntries(
    Object.entries(window.R8Calc?.DEFAULTS || {}).map(([id, defaults]) => [
      id,
      Object.keys(defaults),
    ]),
  );
  keys.finn = ["q"];
  function validURL(href) {
    // Malformed percent-encoding throws in the decodes below.
    if (typeof href !== "string" || href.length > 2500) return null;
    const match = href.match(/^([a-z]+)\.html(?:\?[^#]*)?(?:#.*)?$/);
    if (!match || !pages.has(match[1])) return null;
    try {
      const u = new URL(href, location.href),
        seen = new Set(),
        allowed = own(keys, match[1]) ? keys[match[1]] : [];
      decodeURIComponent(u.search.replace(/\+/g, " "));
      for (const [k, v] of u.searchParams) {
        if (seen.has(k) || !allowed.includes(k) || v.length > 500) return null;
        seen.add(k);
      }
      const anchor = decodeURIComponent(u.hash.slice(1));
      if (anchor && !/^[a-zA-Z0-9_-]+$/.test(anchor)) return null;
      if (
        own(window.R8Calc?.DEFAULTS, match[1]) &&
        window.R8Calc.validateParams(match[1], u.search).errors.length
      )
        return null;
      return {
        page: match[1],
        href: match[1] + ".html" + u.search + u.hash,
        anchor,
      };
    } catch {
      return null;
    }
  }
  function validContext(c) {
    if (!object(c) || !own(c, "href")) return null;
    const u = validURL(c.href);
    if (!u || !own(c, "page") || c.page !== u.page) return null;
    const a = Array.isArray(c.openDetails)
      ? c.openDetails
          .filter((x) => typeof x === "string" && /^[a-zA-Z0-9_-]+$/.test(x))
          .slice(0, 60)
      : [];
    return {
      page: u.page,
      href: u.href,
      openDetails: a,
      scroll:
        Number.isFinite(c.scroll) && c.scroll >= 0
          ? Math.min(c.scroll, 1e7)
          : 0,
      focusID:
        typeof c.focusID === "string" && /^[a-zA-Z0-9_-]+$/.test(c.focusID)
          ? c.focusID
          : "",
      lens: c.lens === "teknisk" ? "teknisk" : "oversikt",
      manual: object(c.manual) ? c.manual : {},
    };
  }
  function anchorKnown(c) {
    const u = validURL(c.href);
    if (!u) return false;
    if (!u.anchor) return true;
    // This page's DOM decides its own anchors. Another page's static anchor is
    // checked by that page on arrival, which reports a missing part visibly.
    if (u.page === page && !u.anchor.startsWith("bi-point-"))
      return !!$(u.anchor);
    if (u.page === "bi" && u.anchor.startsWith("bi-point-")) {
      if (!window.R8Calc) return false;
      const month = u.anchor.slice("bi-point-".length);
      const parsed = window.R8Calc.validateParams(
        "bi",
        new URL(u.href, location.href).search,
      );
      return (
        new RegExp("^" + window.R8Calc.BI_DATA.year + "-(0[1-9]|1[0-2])$").test(
          month,
        ) &&
        !parsed.errors.length &&
        month >= parsed.values.fra &&
        month <= parsed.values.til
      );
    }
    return true;
  }
  const snapshot = () =>
    validContext(object(history.state) ? history.state.r8Context : null);
  const saveReading = () => write("sessionStorage", "r8.reading", reading);
  const focus = (n) => n?.focus({ preventScroll: true });
  function currentHref() {
    return page + ".html" + location.search + location.hash;
  }
  function capture() {
    const active = document.activeElement;
    const c = {
      page,
      href: currentHref(),
      openDetails: [...document.querySelectorAll("details[id][open]")].map(
        (n) => n.id,
      ),
      scroll: scrollY,
      focusID:
        active &&
        active.id &&
        !dialog?.contains(active) &&
        !active.closest(".site-header")
          ? active.id
          : contentFocus,
      lens,
      manual: Object.fromEntries(manual),
    };
    return validContext(c);
  }
  function keep(c, track = true) {
    if (!c) return;
    reading = readReading();
    if (workspaces.includes(c.page))
      reading.contexts[c.page] = c;
    const last = validContext(own(reading, "last") ? reading.last : null);
    if (track && last && last.page !== c.page) reading.previous = last;
    reading.last = c;
    const old = object(history.state) ? history.state : {};
    try {
      history.replaceState({ ...old, r8Context: c }, "", location.href);
    } catch {}
    saveReading();
  }
  function save() {
    if (!restoring && !dialog?.open) keep(capture());
  }
  function schedule() {
    if (timer || restoring || dialog?.open) return;
    timer = setTimeout(() => {
      timer = null;
      save();
    }, 180);
  }
  function target() {
    try {
      return $(decodeURIComponent(location.hash.slice(1)));
    } catch {
      return null;
    }
  }
  function openAncestors(node) {
    for (let p = node; p; p = p.parentElement)
      if (p.tagName === "DETAILS") p.open = true;
  }
  function revealHash(focus = false) {
    const n = target();
    if (!n) return false;
    openAncestors(n);
    if (focus) {
      if (
        !n.hasAttribute("tabindex") &&
        !n.matches("a,button,input,select,textarea,summary")
      )
        n.tabIndex = -1;
      n.focus({ preventScroll: true });
      n.scrollIntoView({ block: "start" });
    }
    return true;
  }
  function setLens(next, persist = true) {
    lens = next === "teknisk" ? "teknisk" : "oversikt";
    document.documentElement.dataset.lens = lens;
    for (const d of chapters) {
      const m = manual.get(d.id);
      const active = d.contains(document.activeElement) || d.contains(target());
      d.open = active || (m !== undefined ? m : lens === "teknisk");
    }
    document.querySelectorAll(".lens [data-lens]").forEach((a) => {
      a.setAttribute("aria-pressed", String(a.dataset.lens === lens));
    });
    if (persist) {
      prefer("lens", lens);
      save();
    }
  }
  for (const d of chapters)
    d.querySelector(":scope > summary").addEventListener("click", () => {
      // Mouse clicks do not focus summary consistently across engines. Native
      // activation expresses the reader's intent before the default toggle.
      manual.set(d.id, !d.open);
      schedule();
    });
  document.querySelectorAll(".lens [data-lens]").forEach((a) => {
    a.addEventListener("click", (e) => {
      e.preventDefault();
      setLens(a.dataset.lens);
    });
  });
  document.querySelector(".lens")?.removeAttribute("hidden");
  function restore(c, local = false, pin = false, stale = false) {
    c = validContext(c);
    if (!c || c.page !== page || c.href !== currentHref()) return false;
    const gen = ++generation;
    restoring = true;
    // The URL owns demo inputs; demos.js re-renders it.
    if (local) window.dispatchEvent(new Event("r8:restore"));
    manual.clear();
    for (const d of chapters)
      if (own(c.manual, d.id) && typeof c.manual[d.id] === "boolean")
        manual.set(d.id, c.manual[d.id]);
    setLens(c.lens, false);
    const disclose = () => {
      for (const d of document.querySelectorAll("details[id]"))
        d.open = c.openDetails.includes(d.id);
    };
    disclose();
    document.fonts.ready.then(() =>
      requestAnimationFrame(() =>
        requestAnimationFrame(() => {
          restoring = false;
          if (stale || gen !== generation || c.href !== currentHref()) return;
          // Chromium opens a fragment's <details> on traversal.
          disclose();
          if (pin && location.hash) revealHash(true);
          else {
            scrollTo(0, c.scroll);
            const n = $(c.focusID);
            if (n && !dialog?.contains(n) && n.getClientRects().length)
              focus(n);
          }
          keep(c);
        }),
      ),
    );
    return true;
  }
  const normalize = (text) =>
    String(text)
      .normalize("NFC")
      .toLocaleLowerCase("nb")
      .replace(/\u00ad/g, "")
      .replace(/æ/g, "ae")
      .replace(/ø/g, "oe")
      .replace(/å/g, "aa")
      .replace(/[^\p{L}\p{N}]+/gu, " ");
  function words(q) {
    return normalize(q)
      .replace(/\bai\b/g, "ki")
      .replace(/\bforecast\b/g, "prognose")
      .replace(/\bavviklet\b/g, "avvikling")
      .split(/\s+/)
      .filter(Boolean);
  }
  function say(container, text) {
    const n = $(container.id + "-status");
    if (n) (n.textContent = text), (n.hidden = !text);
  }
  function results(q, container) {
    if (!container) return;
    container.replaceChildren();
    say(container, "");
    if (q.length > 500)
      return say(container, "Søket kan inneholde høyst 500 tegn. Kort ned søket.");
    const tokens = words(q);
    if (!index.length && tokens.length)
      return container
        .appendChild(el("li", "Søket er ikke tilgjengelig. "))
        .append(link("Bruk spørsmålene på Finn-siden.", "finn.html#sporsmal"));
    let found = index.filter(
      (r) =>
        typeof r.label === "string" &&
        validURL(r.href) &&
        tokens.every((t) =>
          normalize(
            r.label + " " + r.kind + " " + r.href + " " + r.terms,
          ).includes(t),
        ),
    );
    if (!tokens.length) found = found.filter((r) => r.kind === "Side");
    else {
      // Exact label, then whole-word hits in label and terms, then lens.
      const hits = (text) => tokens.filter((t) => words(text).includes(t)).length;
      const rank = (r) =>
        (words(r.label).join(" ") === tokens.join(" ")) * 1e9 +
        hits(r.label) * 1e6 +
        hits(r.terms) * 1e3 +
        (lens === "teknisk" && r.kind === "Teknisk");
      found.sort((a, b) => rank(b) - rank(a));
      say(
        container,
        found.length + " treff" + (found.length > 30 ? ". Viser de 30 første." : ""),
      );
    }
    if (!found.length)
      return container.append(
        el(
          "li",
          "Ingen treff. Prøv navnet på en leveranse eller et spørsmål, for eksempel «Hva gjorde du selv?»",
        ),
      );
    for (const r of found.slice(0, tokens.length ? 30 : 10)) {
      const a = link(r.label, r.href),
        source = label(r.href.split(/[?#]/)[0]);
      if (source && source !== r.label) a.append(el("small", source));
      container.appendChild(el("li")).append(a);
    }
  }
  const label = (href) => index.find((r) => r.href === href)?.label;
  function title(c) {
    const u = validURL(c.href),
      base =
        label(c.href) ||
        label(c.page + ".html" + (u?.anchor ? "#" + u.anchor : "")) ||
        label(c.page + ".html") ||
        "Lagret visning";
    const s = new URL(c.href, location.href).searchParams;
    const range =
      s.get("fra") && s.get("til")
        ? " · " + s.get("fra") + " til " + s.get("til")
        : "";
    return base + range;
  }
  function go(c, pin = false) {
    const checked = validContext(c);
    if (!checked || !anchorKnown(checked)) {
      notice(gone);
      return;
    }
    reading = readReading();
    reading.pending = { context: checked, focus: true, pin };
    const saved = saveReading();
    if (checked.page !== page && (!saved || isolatedFiles)) {
      notice(
        storageMessage + " Åpne lenken uten lagret rulleposisjon og fokus.",
      );
      message.append(" ", link("Åpne visningen", checked.href));
      return;
    }
    leavingDialog = true;
    dialog?.close();
    restoreUnderlyingFocus();
    if (checked.page === page) {
      reading.pending = null;
      saveReading();
      if (checked.href !== currentHref()) {
        const old = object(history.state) ? history.state : {};
        history.pushState({ ...old, r8Context: checked }, "", checked.href);
      }
      restore(checked, true, pin);
      return;
    }
    location.href = checked.href;
  }
  function group(name, contexts, removable = false) {
    const list = $(name + "-list"),
      section = $(name + "-group");
    if (!list || !section) return;
    list.replaceChildren();
    section.hidden = !contexts.length;
    for (const raw of contexts) {
      const c = validContext(raw),
        li = el("li");
      if (c && anchorKnown(c)) {
        const a = link(title(c), c.href);
        a.addEventListener("click", (e) => {
          if (!ordinary(e)) return;
          e.preventDefault();
          go(c, removable);
        });
        li.append(a);
      } else {
        li.append(el("p", gone));
        if (c) li.append(link("Åpne siden", c.page + ".html"));
      }
      if (removable) {
        const button = el("button", "Fjern");
        button.type = "button";
        button.setAttribute("aria-label", c ? "Fjern «" + title(c) + "»" : "Fjern ugyldig lagret visning");
        button.addEventListener("click", () => {
          const same = (x) =>
            c
              ? validContext(x)?.href === c.href
              : JSON.stringify(x) === JSON.stringify(raw);
          const next = readPins().filter((x) => !same(x));
          if (!write("localStorage", "r8.pins", next))
            return notice(storageMessage);
          pins = next;
          personal();
        });
        li.append(button);
      }
      list.append(li);
    }
  }
  function restoreUnderlyingFocus() {
    if (!beforeDialog) return;
    focus($(beforeDialog.focusID));
    scrollTo(0, beforeDialog.scroll);
  }
  function personal() {
    group(
      "resume",
      workspaces.filter((k) => own(reading.contexts, k)).map((k) => reading.contexts[k]),
    );
    const previous = validContext(
      own(reading, "previous") ? reading.previous : null,
    );
    group("previous", previous ? [previous] : []);
    group("pins", pins, true);
  }
  // Modified clicks keep their native meaning.
  const ordinary = (event) =>
    !event.defaultPrevented &&
    event.button === 0 &&
    !event.ctrlKey &&
    !event.metaKey &&
    !event.altKey &&
    !event.shiftKey;
  function openFinn(e) {
    if (!dialog || (e && !ordinary(e))) return;
    e?.preventDefault();
    trigger = e?.currentTarget || document.activeElement;
    reading = readReading();
    pins = readPins();
    beforeDialog = capture();
    keep(beforeDialog);
    leavingDialog = false;
    notice(
      storageIssue
        ? storageMessage
        : isolatedFiles
          ? storageMessage +
            " Lokale Firefox-filer deler ikke lesetilstand mellom sidene."
          : "",
    );
    personal();
    results("", $("dialog-results"));
    search.value = "";
    dialog.showModal();
    search.focus();
  }
  document.querySelectorAll("[data-open-finn]").forEach((a) => {
    a.setAttribute("aria-haspopup", "dialog");
    a.addEventListener("click", openFinn);
  });
  $("close-finn")?.addEventListener("click", () => dialog.close());
  dialog?.addEventListener("keydown", (event) => {
    // Search inputs otherwise consume the first Escape to clear their value.
    if (event.key === "Escape") {
      event.preventDefault();
      dialog.close();
    }
  });
  dialog?.addEventListener("close", () => {
    if (!leavingDialog && trigger?.isConnected) {
      if (beforeDialog) scrollTo(0, beforeDialog.scroll);
      focus(trigger);
    }
  });
  dialog?.addEventListener("click", (e) => {
    const a = e.target.closest("a[href]");
    if (!a || !ordinary(e)) return;
    if (a.closest("#resume-list,#previous-list,#pins-list")) return;
    const u = validURL(a.getAttribute("href"));
    if (!u) return;
    if (!u.anchor) u.href += "#page-title";
    a.href = u.href;
    reading = readReading();
    reading.pending = { destination: u.href, focus: true };
    saveReading();
    leavingDialog = true;
    dialog.close();
    restoreUnderlyingFocus();
    if (u.page === page) {
      e.preventDefault();
      reading.pending = null;
      saveReading();
      location.href = u.href;
      requestAnimationFrame(() => revealHash(true));
    }
  });
  search?.addEventListener("input", () =>
    results(search.value, $("dialog-results")),
  );
  $("pin-current")?.addEventListener("click", () => {
    if (!beforeDialog)
      return notice("Denne visningen kan ikke festes fordi lenken er ugyldig.");
    const next = readPins(),
      i = next.findIndex((x) => validContext(x)?.href === beforeDialog.href);
    if (i < 0 && next.length >= 50)
      return notice(
        "Du har nådd grensen på 50 festede visninger. Fjern en visning før du lagrer en ny.",
      );
    if (i < 0) next.push(beforeDialog);
    else next[i] = beforeDialog;
    if (!write("localStorage", "r8.pins", next)) return notice(storageMessage);
    pins = next;
    notice(i < 0 ? "Visningen er festet." : "Visningen er oppdatert.");
    personal();
  });
  const opt = $("shortcut-optin");
  if (opt) {
    opt.checked = shortcut;
    opt.addEventListener("change", () => {
      shortcut = opt.checked;
      prefer("shortcut", shortcut);
    });
  }
  document.addEventListener("keydown", (e) => {
    if (
      !shortcut ||
      e.key !== "/" ||
      e.ctrlKey ||
      e.metaKey ||
      e.altKey ||
      e.shiftKey ||
      dialog?.open
    )
      return;
    const n = e.target;
    if (
      n.closest(
        'input,textarea,select,[contenteditable]:not([contenteditable="false"])',
      )
    )
      return;
    e.preventDefault();
    openFinn();
  });
  const ps = $("page-search");
  if (ps) {
    ps.closest(".enhancement").hidden = false;
    const params = new URLSearchParams(location.search);
    if (params.has("q")) ps.value = params.get("q");
    results(ps.value, $("page-results"));
    ps.addEventListener("input", () => {
      const list = $("page-results"),
        u = new URL(location.href);
      results(ps.value, list);
      if (ps.value) u.searchParams.set("q", ps.value);
      else u.searchParams.delete("q");
      if (ps.value.length > 500) return;
      if (("finn.html" + u.search + u.hash).length > 2500) {
        list.replaceChildren();
        return say(list, "Søket gir en for lang lenke. Kort ned søket.");
      }
      try {
        history.replaceState(history.state, "", u);
      } catch {}
      schedule();
    });
  }
  const theme = $("tema");
  if (theme) {
    theme.hidden = false;
    let selected = own(preferences, "theme") ? preferences.theme : "system";
    if (!["system", "lys", "mork"].includes(selected)) selected = "system";
    theme.querySelectorAll("input").forEach((n) => {
      n.checked = n.value === selected;
      n.addEventListener("change", () => {
        if (!n.checked) return;
        document.documentElement.dataset.theme = n.value;
        prefer("theme", n.value);
      });
    });
  }
  const header = document.querySelector(".site-header");
  if (header && window.ResizeObserver)
    new ResizeObserver(() =>
      document.documentElement.style.setProperty(
        "--header-height",
        header.getBoundingClientRect().height + "px",
      ),
    ).observe(header);
  function localURLCheck() {
    const checked = validURL(currentHref()),
      noCalc = !window.R8Calc && document.querySelector("[data-demo]");
    banner(
      "link-message",
      "source-note",
      "alert",
      noCalc
        ? "Regnefunksjonen ble ikke lastet. Resten av siden er tilgjengelig."
        : !checked
          ? "Lenken inneholder et ugyldig valg. Resten av siden er tilgjengelig."
          : checked.anchor && !target() && !(!window.R8Calc && /^bi-point-/.test(checked.anchor))
            ? "Denne delen finnes ikke lenger. Bruk lenkene på siden for å finne riktig del."
            : "",
    );
  }
  setLens(lens, false);
  window.addEventListener("pageshow", (e) => {
    if (e.persisted) {
      reading = readReading();
      pins = readPins();
      // Chromium preserves the document but clears focus on bfcache return.
      // Restore focus only; do not rebuild or reapply input/disclosure state.
      const saved = snapshot();
      if (saved?.href === currentHref())
        requestAnimationFrame(() => {
          const node = $(saved.focusID);
          if (node && node.getClientRects().length && !dialog?.contains(node))
            focus(node);
        });
    } else {
      // Queued pin or resume, dialog result, history snapshot, Back, plain link.
      localURLCheck();
      const pending = object(reading.pending) ? reading.pending : null,
        queued = validContext(
          pending && own(pending, "context") ? pending.context : null,
        ),
        saved = snapshot(),
        prior =
          performance.getEntriesByType("navigation")[0]?.type ===
            "back_forward" && own(reading.contexts, page)
            ? validContext(reading.contexts[page])
            : null,
        here = currentHref(),
        // Input during load (pageshow waits for fonts) beats the saved position.
        stale = generation > 0;
      if (pending) {
        reading.pending = null;
        saveReading();
      }
      if (queued?.href === here) restore(queued, false, pending.pin === true, stale);
      else if (pending?.destination === here) {
        if (!revealHash(true)) focus($("page-title"));
        save();
      } else if (saved?.href === here) restore(saved, false, false, stale);
      else if (prior?.href === here) restore(prior, false, false, stale);
      else {
        revealHash();
        save();
      }
    }
  });
  window.addEventListener("pagehide", () => {
    generation++;
    if (leavingDialog && beforeDialog) keep(beforeDialog, false);
    else if (!dialog?.open) keep(capture());
  });
  window.addEventListener("scroll", schedule, { passive: true });
  document.addEventListener("focusin", (e) => {
    if (
      e.target.id &&
      !dialog?.contains(e.target) &&
      !e.target.closest(".site-header")
    )
      contentFocus = e.target.id;
    schedule();
  });
  document.addEventListener("change", schedule);
  window.addEventListener("r8:demochange", () => {
    localURLCheck();
    save();
  });
  window.addEventListener("hashchange", () => {
    // Skip the hashchange paired with a restoring popstate.
    if (pairedHash && pairedHash === currentHref()) return void (pairedHash = "");
    pairedHash = "";
    localURLCheck();
    revealHash();
    save();
  });
  window.addEventListener("popstate", () => {
    const c = snapshot(),
      restored = c?.href === currentHref() && restore(c);
    pairedHash = restored ? c.href : "";
    // demos.js renders this URL in its own, later popstate listener.
    setTimeout(() => {
      localURLCheck();
      if (!restored) {
        revealHash();
        save();
      }
    }, 0);
  });
})();
