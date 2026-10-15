(function () {
  "use strict";
  if (!location.hash.startsWith("#/")) return;
  const known = new Map([
    ["home", "index.html"],
    ["work", "index.html#arbeid"],
    ["ai", "ki.html"],
    ["about", "bakgrunn.html"],
    ["contact", "bakgrunn.html#kontakt"],
    ["library", "finn.html"],
    ["summary", "sammendrag.html"],
  ]);
  const projects = new Map([
    ["PRJ-01", "bi.html"],
    ["PRJ-03", "budsjett.html"],
    ["PRJ-04", "gevinst.html"],
    ["PRJ-05", "prognose.html"],
  ]);
  const source = new Map([
    ["m-staff", "bi.html"],
    ["m-org", "bi.html"],
    ["m-calendar", "bi.html"],
    ...[
      "forecast-before",
      "forecast-old-entry",
      "forecast-wrapper",
      "forecast-preset",
      "forecast-compare",
      "forecast-after",
      "forecast-materialization",
      "forecast-plan",
      "forecast-executor",
      "forecast-output",
    ].map((id) => [id, "prognose.html"]),
    ...[
      "budget-state",
      "budget-rounding",
      "budget-rules",
      "budget-lookup",
      "budget-before",
      "budget-random",
    ].map((id) => [id, "budsjett.html"]),
  ]);
  function warn(text) {
    let n = document.getElementById("legacy-message");
    if (!n) {
      n = document.createElement("p");
      n.id = "legacy-message";
      n.className = "source-note";
      n.setAttribute("role", "alert");
      document.querySelector("main")?.prepend(n);
    }
    n.textContent = text;
  }
  try {
    const raw = location.hash.slice(2);
    if (/%(?![0-9a-f]{2})/i.test(raw)) throw Error("encoding");
    const [route, q = ""] = raw.split("?");
    const parts = decodeURIComponent(route).split("/"),
      params = new URLSearchParams(q),
      seen = new Set();
    for (const [k] of params) {
      if (seen.has(k) || !["section", "inspect"].includes(k))
        throw Error("parameter");
      seen.add(k);
    }
    let dest;
    if (parts[0] === "work" && parts.length === 2)
      dest = projects.get(parts[1]);
    else if (parts[0] === "ai" && parts.length <= 2) {
      dest = "ki.html";
      const section = params.get("section") || parts[1];
      if (section) {
        if (section === "workflow") dest += "#arbeidsmate";
        else if (section === "usage") dest += "#brukstall";
        else throw Error("section");
      }
    } else if (parts.length === 1) dest = known.get(parts[0]);
    if (!dest) throw Error("route");
    const inspect = params.get("inspect");
    if (inspect) {
      const file = source.get(inspect.replace(/^snippet:/, ""));
      if (!file) throw Error("inspect");
      dest = file + "#kilder";
    } else if (params.has("section") && parts[0] !== "ai") {
      const section = params.get("section");
      if (
        ![
          "rolle",
          "status",
          "rammer",
          "valg",
          "kilder",
          "grenser",
          "teknisk",
          "oppfolging",
        ].includes(section)
      )
        throw Error("section");
      dest =
        dest.split("#")[0] +
        "#" +
        (section === "teknisk" ? "beregningsgrunnlag" : section);
    }
    location.replace(dest);
  } catch {
    warn(
      "Denne eldre lenken kan ikke åpnes automatisk. Bruk lenkene på siden for å finne leveransen eller delen.",
    );
  }
})();
