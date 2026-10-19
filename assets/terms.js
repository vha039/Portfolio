window.R8Terms={entries:[["semantisk-modell","Semantisk modell","Tabeller, relasjoner og beregningsregler som gir data en felles faglig betydning. Modellen rapportene bygger på."],["datakorn","Datakorn","Hva én rad representerer, for eksempel en organisatorisk enhet i en bestemt periode."],["dimensjon","Dimensjon","Opplysninger som brukes til å avgrense eller gruppere fakta, som tid, organisasjon eller kategori."],["stjerneskjema","Stjerneskjema","Et modellmønster der faktatabeller kobles direkte til felles dimensjoner, uten lag av oppslag mellom dimensjonene."],["filterkontekst","Filterkontekst","Utvalget en beregning gjelder for. Endrer du utvalget, kan både teller og grunnlag endre seg."],["dax","DAX","Beregningsspråket i Power BI, brukt til blant annet mål og beregnede kolonner."],["power-query","Power Query","Et verktøy for å hente, bearbeide og sammenstille data før de brukes videre."],["drg","DRG","Diagnoserelaterte grupper. DRG-poeng brukes som aktivitetsmål og er ikke antall pasienter."],["paritet","Atferdsparitet","At to implementeringer oppfører seg likt innenfor en fastsatt toleranse under et eksplisitt, avgrenset oppsett. I løpende tekst kalt samsvar. Det er ikke et mål på prognosenøyaktighet."],["holdout","Holdout","Data som holdes utenfor modelltilpasningen og brukes til å undersøke resultatet på andre observasjoner."],["rullerende-validering","Rullerende validering","Modellen tilpasses på data fram til et tidspunkt og prøves på perioden etter. Dette gjentas for flere tidspunkter."],["proxy","Proxy","Et indirekte signal brukt når direkte måling ikke gir et godt nok grunnlag. Antakelsene må kunne undersøkes."],["prisnivaa","Prisnivå","Grunnlaget som gjør beløp fra ulike prisår sammenlignbare. En eksplisitt faktor trengs før beløpet regnes om."],["kodeagent","Kodeagent","En språkmodell med verktøy som kan undersøke og endre kode innenfor en avgrenset oppgave. Et menneske vurderer integrasjon og bruk."],["styrings-bi","Styrings-BI","Rapporter som samler tall om økonomi og drift, slik at ledere kan følge utviklingen."],["vba","VBA","Programmeringsspråket for makroer og automatisering i Microsoft Office-programmer som Excel."],["arsverk","Årsverk","Et mål på arbeidsmengde. Ett årsverk tilsvarer arbeid i én fulltidsstilling i ett år."],["periodisering","Periodisering","Å fordele et beløp eller en mengde på periodene det gjelder."],["snoflakskjema","Snøflakskjema","Et modellmønster der dimensjonene deles i flere tabeller med oppslag mellom seg. Et alternativ til stjerneskjema."],["faktatabell","Faktatabell","En tabell med målinger, for eksempel beløp, DRG-poeng eller fraværsdager, som kobles til felles dimensjoner."],["referansemodell","Referansemodell","En enkel modell som brukes som sammenligningsgrunnlag når andre prognosemodeller vurderes."],["akseptansekriterier","Akseptansekriterier","Krav som må være oppfylt for at en leveranse eller endring skal kunne godtas."],["xgboost","XGBoost","En maskinlæringsmetode som kombinerer beslutningstrær. Nye trær bygges for å redusere feil i de samlede anslagene."],["gam","GAM","Generalisert additiv modell. En statistisk modell der sammenhengen mellom en variabel og utfallet kan beskrives med en jevn kurve."],["sarimax","SARIMAX","En tidsseriemodell som kan bruke tidligere verdier, sesongmønstre og andre forklaringsvariabler."],["token","Token","Enheter som brukes til å telle hvor mye innhold språkmodeller behandler. Registrert bearbeiding kan omfatte samme innhold flere ganger."],["float32","Float32","En talltype med begrenset presisjon. Avrunding til float32 kan skjule både lagringsforskjeller og små reelle forskjeller."],["eksponerte-dager","Eksponerte dager","Dagene fraværet måles mot. Fraværsprosenten beregnes som fraværsdager delt på eksponerte dager, ganget med 100."],["observasjonsnokkel","Observasjonsnøkkel","En identifikator som brukes til å finne igjen samme observasjon på begge sider av en sammenligning."],["prisaar","Prisår","Året som brukes som felles prisnivå når beløp fra ulike år sammenlignes."],["signalnormalisering","Normalisering av signaler","Hvert signal regnes om til andeler av sin egen total før signalene vektes sammen."],["lesemodus","Lesemodus","Oversikt lar deg åpne tekniske utdypinger enkeltvis. Teknisk åpner dem automatisk. Du kan alltid åpne og lukke delene selv."],["demo-lenke","Lenke til disse valgene","Lenke til sist beregnede eksempel. Kopier lenkeadressen for å dele eksemplet med de samme valgene."],["testpar-samsvar","Sammenligning av testpar","Eksemplet viser sammenligning av fiktive tallpar. Samsvar er ikke et mål på prognosenøyaktighet."],["egen-redegjorelse","Egen redegjørelse","Min beskrivelse av eget arbeid, samarbeid og status. Står uten merke."],["inspisert-artefakt","Inspisert artefakt","En avgrenset observasjon av struktur eller kode, som omfanget av BI-modellen. Den sier ikke hvem som skrev hva."],["rapportert-resultat","Rapportert resultat","Et oppgitt resultat eller bruk, uten påstand om uavhengig reproduksjon."],["redaksjonell-rekonstruksjon","Redaksjonell rekonstruksjon","Nyskrevne diagrammer og forklaringer av sammenhenger, som de forenklede figurene på prosjektsidene. De er ikke historiske beslutningsprotokoller."],["syntetisk-illustrasjon","Syntetisk illustrasjon","Nye fiktive data og beregninger som forklarer en mekanisme. De kjører ikke originalsystemet."]]};
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
    if (!entry) throw new Error("Ukjent begrep: " + key);
    const button = document.createElement("button");
    button.type = "button";
    button.dataset.term = key;
    button.className = visibleText == null ? "term-helper enhancement" : "term-inline";
    button.setAttribute("aria-describedby", "term-description-" + key);
    if (visibleText == null) {
      button.setAttribute("aria-label", "Forklar «" + entry[1] + "»");
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
