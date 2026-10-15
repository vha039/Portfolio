(function () {
  "use strict";
  const C = window.R8Calc;
  const section = document.querySelector("[data-demo]");
  if (!C || !section) return;
  const page = section.dataset.demo,
    form = section.querySelector("[data-demo-form]");
  const error = section.querySelector("[data-demo-error]"),
    resultRoot = section.querySelector("[data-demo-result]");
  const functions = {
    bi: "bi",
    budsjett: "budget",
    gevinst: "benefits",
    prognose: "forecast",
    utfyllende: "ste",
  };
  const link = section.querySelector("[data-demo-link]");
  const el = (tag, text, cls) => {
    const n = document.createElement(tag);
    if (text != null) n.textContent = text;
    if (cls) n.className = cls;
    return n;
  };
  let series = [];
  const status = section.querySelector("[data-demo-status]");
  const pointText = (point) =>
    point.label +
    ": " +
    (point.value == null
      ? "Mangler"
      : C.fmt(point.value, point.precision ?? 2) + " " + point.unit);
  function inputValues() {
    return Object.fromEntries([...new FormData(form).entries()]);
  }
  function encoded(values) {
    const q = new URLSearchParams();
    for (const k of Object.keys(C.DEFAULTS[page])) q.set(k, String(values[k]));
    return q;
  }
  function readValues() {
    return C.validateParams(page, "?" + encoded(inputValues()).toString());
  }
  function message(messages) {
    status.textContent = "";
    error.textContent = messages.join(" ");
    error.hidden = !messages.length;
    if (messages.length) {
      section.querySelector("[data-demo-fallback]").hidden = true;
      resultRoot.replaceChildren(
        el(
          "p",
          "Resultatet kan ikke beregnes med disse valgene.",
          "demo-summary",
        ),
      );
      link.removeAttribute("href");
    }
  }
  function render(result) {
    const title = result.title || "Beregnet eksempel";
    status.textContent = title;
    resultRoot.replaceChildren(el("h4", title));
    resultRoot.append(
      el(
        "p",
        Array.isArray(result.summary)
          ? result.summary.join(" ")
          : result.summary,
        "demo-summary",
      ),
    );
    if (result.detail) resultRoot.append(el("p", result.detail, "demo-detail"));
    const chart = el("div");
    chart.dataset.chart = "";
    resultRoot.append(chart);
    const region = el("div", null, "table-scroll");
    region.tabIndex = 0;
    region.setAttribute("role", "region");
    region.setAttribute("aria-label", result.title || "Eksemplets tall");
    const table = el("table");
    table.id = "table-" + page;
    table.append(el("caption", result.title || "Eksemplets tall"));
    const head = el("thead"),
      tr = el("tr");
    result.columns.forEach((col) => {
      const th = el("th", col.label || col);
      th.scope = "col";
      tr.append(th);
    });
    head.append(tr);
    table.append(head);
    const body = el("tbody");
    result.rows.forEach((row) => {
      const r = el("tr");
      row.forEach((v, i) => {
        const col = result.columns[i];
        const td = el(
          i ? "td" : "th",
          v == null
            ? "Mangler"
            : typeof v === "number"
              ? C.fmt(v, col?.precision ?? 0) +
                (col?.unit ? " " + col.unit : "")
              : v,
        );
        if (!i) td.scope = "row";
        if (typeof v === "number") td.className = "number";
        r.append(td);
      });
      body.append(r);
    });
    table.append(body);
    region.append(table);
    resultRoot.append(region);
    series = page === "bi" && Array.isArray(result.series) ? result.series : [];
    if (series.length) {
      chart.append(
        el(
          "p",
          "Velg en måned for å se verdien. Søylen viser størrelsen, og fortegnet står i tallet.",
          "demo-detail",
        ),
      );
      const list = el("ul", null, "bar-chart");
      list.setAttribute(
        "aria-label",
        "Månedsverdier i det syntetiske eksemplet",
      );
      const max = Math.max(
        1,
        ...series
          .filter((s) => Number.isFinite(s.value))
          .map((s) => Math.abs(s.value)),
      );
      for (const point of series) {
        const li = el("li", null, "bar-row"),
          button = el("button", point.label, "bar-select");
        button.type = "button";
        button.id = "bi-point-" + point.label;
        button.setAttribute("aria-pressed", "false");
        button.setAttribute("aria-label", pointText(point));
        button.addEventListener("click", () => {
          const url = new URL(location.href);
          url.hash = button.id;
          history.pushState(null, "", url);
          selectPoint(true);
          window.dispatchEvent(new Event("r8:demochange"));
        });
        const track = el("span", null, "bar-track");
        track.setAttribute("aria-hidden", "true");
        if (point.value != null) {
          const fill = el("span", null, "bar-fill");
          fill.style.setProperty(
            "--bar-value",
            String((Math.abs(point.value) / max) * 100),
          );
          track.append(fill);
        }
        const value = el(
          "span",
          point.value == null
            ? "Mangler"
            : C.fmt(point.value, point.precision ?? 2) + " " + point.unit,
          "bar-value" + (point.value == null ? " bar-missing" : ""),
        );
        li.append(button, track, value);
        list.append(li);
      }
      chart.append(list);
      const selected = el("p", "Ingen måned er valgt.", "selected-point");
      selected.id = "bi-selected-point";
      selected.setAttribute("role", "status");
      chart.append(selected);
      selectPoint(false);
    }
  }
  function selectPoint(focus) {
    if (!series.length) return;
    let hash;
    try {
      hash = decodeURIComponent(location.hash.slice(1));
    } catch {
      return;
    }
    const buttons = section.querySelectorAll(".bar-select");
    buttons.forEach((b) =>
      b.setAttribute("aria-pressed", String(b.id === hash)),
    );
    const point = series.find((p) => "bi-point-" + p.label === hash);
    const selected = section.querySelector("#bi-selected-point");
    if (point) {
      selected.textContent = pointText(point);
      if (focus) document.getElementById(hash)?.focus({ preventScroll: true });
    } else selected.textContent = "Ingen måned er valgt.";
  }
  function calculate(parsed, updateURL = false) {
    if (parsed.errors.length) {
      message(parsed.errors);
      return;
    }
    try {
      const result = C[functions[page]](parsed.values);
      message([]);
      render(result);
      section.querySelector("[data-demo-fallback]").hidden = true;
      const url = new URL(location.href);
      url.search = encoded(parsed.values).toString();
      if (
        updateURL &&
        page === "bi" &&
        url.hash.startsWith("#bi-point-") &&
        !document.getElementById(url.hash.slice(1))
      )
        url.hash = section.id;
      link.href = url.href;
      if (updateURL) {
        history.replaceState(history.state, "", url);
        window.dispatchEvent(new Event("r8:demochange"));
      }
    } catch (err) {
      message([err.message || "Beregningen kunne ikke gjennomføres."]);
    }
  }
  function fromURL() {
    const parsed = C.validateParams(page, location.search);
    if (!parsed.errors.length)
      for (const [k, v] of Object.entries(parsed.values)) {
        const control = form.elements.namedItem(k);
        if (control) control.value = String(v);
      }
    calculate(parsed, false);
  }
  form.hidden = false;
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    calculate(readValues(), true);
  });
  form.addEventListener("change", () => calculate(readValues(), true));
  window.addEventListener("popstate", fromURL);
  window.addEventListener("hashchange", () => selectPoint(false));
  window.addEventListener("r8:restore", fromURL);
  fromURL();
})();
