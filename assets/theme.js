"use strict";
document.documentElement.classList.add("js");
// CORS preloads fail for opaque file origins, while relative CSS font loads work.
// Hosted pages still preload the two first-screen fonts before the stylesheet.
if (location.protocol === "http:" || location.protocol === "https:") {
  for (const font of ["source-sans", "source-serif"]) {
    const link = document.createElement("link");
    link.rel = "preload";
    link.href = "assets/fonts/" + font + ".woff2";
    link.as = "font";
    link.type = "font/woff2";
    link.crossOrigin = "anonymous";
    document.head.append(link);
  }
}
try {
  const p = JSON.parse(localStorage.getItem("r8.preferences") || "{}");
  if (p.theme === "lys" || p.theme === "mork")
    document.documentElement.dataset.theme = p.theme;
} catch {}
