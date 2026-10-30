window.R8Terms={entries:[["semantisk-modell","Semantic model","Tables, relationships and calculation rules that give data a shared business meaning. The model the reports are built on."],["datakorn","Data grain","What one row represents, for example an organisational unit in a particular period."],["dimensjon","Dimension","Information used to narrow down or group facts, such as time, organisation or category."],["stjerneskjema","Star schema","A modelling pattern in which fact tables connect directly to shared dimensions, with no layers of lookups between the dimensions."],["filterkontekst","Filter context","The selection a calculation applies to. If you change the selection, both the numerator and the base can change."],["dax","DAX","Data Analysis Expressions. The calculation language in Power BI, used for measures and calculated columns, among other things."],["power-query","Power Query","A tool for fetching, processing and combining data before it is used further."],["drg","DRG","Diagnosis-related groups. DRG points are used as a measure of activity and are not a count of patients."],["paritet","Behavioural parity","That two implementations behave the same way within a set tolerance under an explicit, limited set-up. In running text called conformance. It is not a measure of forecast accuracy."],["holdout","Holdout","Data that is held out from model fitting and used to examine the result on other observations."],["rullerende-validering","Rolling validation","The model is fitted on data up to a point in time and tested on the period after. This is repeated for several points in time."],["proxy","Proxy","An indirect signal used when direct measurement does not give a good enough basis. The assumptions must be open to examination."],["prisnivaa","Price level","The basis that makes amounts from different price years comparable. An explicit factor is needed before the amount is converted."],["kodeagent","Coding agent","A language model with tools that can examine and change code within a defined task. A human assesses integration and use."],["styrings-bi","Management BI","Reports that bring together figures on finance and operations, so that managers can follow developments."],["vba","VBA","The programming language for macros and automation in Microsoft Office programs such as Excel."],["arsverk","FTE","Full-time equivalent, a measure of workload. One FTE corresponds to the work of one full-time position for one year (Norwegian: årsverk)."],["periodisering","Period allocation","Distributing an amount or quantity across the periods it relates to."],["snoflakskjema","Snowflake schema","A modelling pattern in which the dimensions are split into several tables with lookups between them. An alternative to the star schema."],["faktatabell","Fact table","A table of measurements, for example amounts, DRG points or days of absence, linked to shared dimensions."],["referansemodell","Baseline model","A simple model used as a point of comparison when other forecasting models are assessed."],["akseptansekriterier","Acceptance criteria","Requirements that must be met for a delivery or change to be accepted."],["xgboost","XGBoost","A machine learning method that combines decision trees. New trees are built to reduce the errors in the combined estimates."],["gam","GAM","Generalised additive model. A statistical model in which the relationship between a variable and the outcome can be described with a smooth curve."],["sarimax","SARIMAX","A time series model that can use past values, seasonal patterns and other explanatory variables."],["token","Token","Units used to count how much content language models process. Registered processing can include the same content several times."],["float32","Float32","A number type with limited precision. Rounding to float32 can hide both storage differences and small real differences."],["eksponerte-dager","Days in the absence denominator","The days against which absence is measured. The absence percentage is days of absence divided by these days, multiplied by 100."],["observasjonsnokkel","Observation key","An identifier used to find the same observation again on both sides of a comparison."],["prisaar","Price year","The year used as the shared price level when amounts from different years are compared."],["signalnormalisering","Signal normalisation","Each signal is converted to shares of its own total before the signals are weighted together."],["lesemodus","Reading mode","Overview lets you open the technical detail sections one at a time. Technical opens them automatically. You can always open and close the sections yourself."],["demo-lenke","Link to these choices","Link to the most recently calculated example. Copy the link address to share the example with the same choices."],["testpar-samsvar","Comparison of a test pair","The example shows a comparison of fictitious pairs of figures. Conformance is not a measure of forecast accuracy."],["egen-redegjorelse","Own account","My description of my own work, collaboration and status. Appears without a label."],["inspisert-artefakt","Inspected artefact","A limited observation of structure or code, such as the scope of the BI model. It does not say who wrote what."],["rapportert-resultat","Reported result","A stated result or use, without any claim of independent reproduction."],["redaksjonell-rekonstruksjon","Editorial reconstruction","Newly written diagrams and explanations of relationships, like the simplified figures on the project pages. They are not historical decision records."],["syntetisk-illustrasjon","Synthetic illustration","New fictitious data and calculations that explain a mechanism. They do not run the original system."]]};
(function () {
"use strict";
const entries = new Map(window.R8Terms.entries.map((entry) => [entry[0], entry]));
const descriptions = document.createElement("div");
descriptions.id = "term-descriptions";
descriptions.hidden = true;
for (const [key, , definition] of entries.values()) {
  const description = document.createElement("span");
  description.id = "term-description-" + key;
  description.textContent = definition;
  descriptions.append(description);
}
const panel = document.createElement("div");
panel.className = "term-panel";
panel.hidden = true;
panel.setAttribute("aria-hidden", "true");
document.body.append(descriptions, panel);
function createButton(key, visibleText) {
  const entry = entries.get(key);
  if (!entry) throw new Error(("Unknown term: ") + key);
  const button = document.createElement("button");
  button.type = "button";
  button.dataset.term = key;
  button.className = visibleText == null ? "term-helper enhancement" : "term-inline";
  button.setAttribute("aria-describedby", "term-description-" + key);
  if (visibleText == null) {
    button.setAttribute("aria-label", ("Explain “") + entry[1] + ("”"));
    const icon = document.createElement("span");
    icon.setAttribute("aria-hidden", "true");
    icon.textContent = "?";
    button.append(icon);
  } else button.textContent = visibleText;
  return button;
}
window.R8Terms = { createButton };
document.querySelectorAll("span[data-term]").forEach((span) => {
  span.replaceWith(createButton(span.dataset.term, span.hidden ? undefined : span.textContent));
});
let trigger = null, pinned = false, dismissed = null, hoverTimer, leaveTimer;
const buttonAt = (node) => node instanceof Element ? node.closest("button[data-term]") : null;
function cancelTimers() {
  clearTimeout(hoverTimer);
  clearTimeout(leaveTimer);
}
function close() {
  cancelTimers();
  dismissed = trigger;
  trigger = null;
  pinned = false;
  panel.hidden = true;
}
function position() {
  if (!trigger) return;
  if (!trigger.isConnected || !trigger.getClientRects().length) return close();
  const rect = trigger.getBoundingClientRect();
  const width = document.documentElement.clientWidth;
  const height = window.innerHeight;
  const box = panel.getBoundingClientRect();
  const below = rect.bottom + 8;
  const top = below + box.height <= height - 16 ? below : rect.top - box.height - 8;
  panel.style.left = Math.max(16, Math.min(rect.left, width - box.width - 16)) + "px";
  panel.style.top = Math.max(16, Math.min(top, height - box.height - 16)) + "px";
}
function open(button, explicit = false) {
  cancelTimers();
  if (!button.isConnected || button.closest("dialog")) return;
  if (!explicit && dismissed === button) return;
  trigger = button;
  pinned = explicit;
  dismissed = null;
  panel.textContent = entries.get(button.dataset.term)[2];
  panel.hidden = false;
  position();
}
document.addEventListener("pointerover", (event) => {
  if (event.pointerType !== "mouse") return;
  if (panel.contains(event.target)) return clearTimeout(leaveTimer);
  const button = buttonAt(event.target);
  if (!button || button.contains(event.relatedTarget)) return;
  clearTimeout(leaveTimer);
  if (pinned) return;
  hoverTimer = setTimeout(() => open(button), 250);
});
document.addEventListener("pointerout", (event) => {
  const button = buttonAt(event.target);
  if (button && button.contains(event.relatedTarget)) return;
  if (button || panel.contains(event.target)) {
    clearTimeout(hoverTimer);
    if (dismissed === button) dismissed = null;
    if (!pinned && !trigger?.matches(":focus-visible") && !panel.contains(event.relatedTarget) && !trigger?.contains(event.relatedTarget))
      leaveTimer = setTimeout(close, 150);
  }
});
document.addEventListener("focusin", (event) => {
  const button = buttonAt(event.target);
  if (button?.matches(":focus-visible")) open(button);
  else if (trigger && event.target !== trigger && !panel.contains(event.target)) close();
});
document.addEventListener("focusout", (event) => {
  if (dismissed === event.target) dismissed = null;
  if (trigger === event.target && !panel.contains(event.relatedTarget)) close();
});
document.addEventListener("pointerdown", (event) => {
  clearTimeout(hoverTimer);
  if (trigger && !trigger.contains(event.target) && !panel.contains(event.target)) close();
}, true);
document.addEventListener("click", (event) => {
  const button = buttonAt(event.target);
  if (!button) return;
  if (trigger === button && pinned) close();
  else open(button, true);
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && trigger) {
    close();
    event.preventDefault();
    event.stopPropagation();
  }
}, true);
window.addEventListener("r8:demochange", close);
new MutationObserver(() => { if (trigger && !trigger.isConnected) close(); })
  .observe(document.querySelector("main"), { childList: true, subtree: true });
window.addEventListener("resize", position);
window.addEventListener("scroll", position, true);
})();
