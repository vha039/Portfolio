/*Synthetic examples.*/ (function (root) {
  "use strict";
  const own = (o, k) => Object.prototype.hasOwnProperty.call(o, k);
  const MAX = Number.MAX_SAFE_INTEGER;
  const stop = (message) => {
    throw new Error(message);
  };
  const DEFAULTS = Object.freeze({
    bi: Object.freeze({
      tabell: "okonomi",
      enhet: "alle",
      fra: "2025-01",
      til: "2025-12",
    }),
    budsjett: Object.freeze({ arsverk: 37.4, perioder: 12 }),
    gevinst: Object.freeze({
      belop: 100000,
      type: "gevinst",
      fra: 2026,
      til: 2030,
      prisaar: 2026,
    }),
    prognose: Object.freeze({ scenario: "likt", normalisering: "ingen" }),
    utfyllende: Object.freeze({ vekt: "45,35,20", scenario: "normal" }),
  });
  const DATA_factors = Object.freeze({
    2026: 1,
    2027: 1.02,
    2028: 1.04,
    2029: 1.06,
    2030: 1.08,
  });
  const enums = {
    tabell: ["okonomi", "aktivitet", "bemanning", "fravaer"],
    enhet: ["alle", "SYN-A", "SYN-B"],
    type: ["gevinst", "investering"],
    normalisering: ["ingen", "float32"],
  };
  const cases = {
    prognose: "likt endret manglende duplikat blank bare-mangler float32".split(" "),
    utfyllende: ["normal", "duplikat", "mangler"],
  };
  function fmt(v, dp = 0) {
    if (v === null) return "Mangler";
    if (typeof v !== "number" || !Number.isFinite(v))
      stop("Tallet er ikke endelig.");
    if (!Number.isInteger(dp) || dp < 0 || dp > 100)
      stop("Ugyldig tallpresisjon.");
    let text = Math.abs(v).toFixed(dp);
    if (text.includes("e")) {
      const [mant, exp] = text.split("e");
      const digits = mant.replace(".", "");
      text = digits.padEnd(mant.split(".")[0].length + Number(exp), "0");
      if (dp) text += "." + "0".repeat(dp);
    }
    const [int, frac] = text.split(".");
    return (
      (v < 0 ? "\u2212" : "") +
      int.replace(/\B(?=(\d{3})+(?!\d))/g, "\u00a0") +
      (frac ? "," + frac : "")
    );
  }
  function scaled(v, dp, label) {
    const text = typeof v === "number" && Number.isFinite(v) ? String(v) : v;
    if (typeof text !== "string") stop(label + " må være et gyldig tall.");
    const match = /^(0|[1-9]\d*)(?:\.(\d+))?$/.exec(text);
    const dec = match ? (match[2] || "").replace(/0+$/, "") : "";
    if (!match || dec.length > dp)
      stop(
        label +
          " må være et ikke-negativt tall med høyst " +
          (dp === 1 ? "én desimal." : dp + " desimaler."),
      );
    const units =
      BigInt(match[1]) * 10n ** BigInt(dp) + BigInt(dec.padEnd(dp, "0") || "0");
    if (units > BigInt(MAX))
      stop(label + " har for mange sifre til å beregnes nøyaktig.");
    const number = Number(text);
    if (
      !Number.isFinite(number) ||
      BigInt(number.toFixed(dp).replace(".", "")) !== units
    )
      stop(label + " kan ikke beregnes nøyaktig.");
    return Number(units);
  }
  function int(v, min, max, label) {
    if (!/^(0|[1-9]\d*)$/.test(String(v))) stop(label + " må være et heltall.");
    const n = Number(v);
    if (!Number.isSafeInteger(n) || n < min || n > max)
      stop(label + " må være mellom " + min + " og " + max + ".");
    return n;
  }
  function weights(v) {
    const parts = String(v).split(",");
    if (parts.length !== 3)
      stop("Oppgi tre heltallsvekter, adskilt med komma.");
    const res = parts.map((v) => int(v, 0, 100, "Vekten"));
    if (res.reduce((s, v) => s + v, 0) !== 100)
      stop("Vektene må summere til 100 prosent.");
    return res;
  }
  function validateParams(page, search = "") {
    if (!own(DEFAULTS, page))
      return { values: {}, errors: ["Ukjent demonstrasjon."] };
    const values = { ...DEFAULTS[page] },
      errors = [];
    if (typeof search !== "string" && !(search instanceof URLSearchParams))
      return { values, errors: ["Ugyldige URL-valg."] };
    const text = String(search).replace(/^\?/, "");
    if (text.length > 2500)
      return {
        values,
        errors: ["Lenken er for lang. Velg innstillingene på siden."],
      };
    try {
      decodeURIComponent(text.replace(/\+/g, " "));
    } catch {
      return { values, errors: ["Lenken inneholder ugyldig prosentkoding."] };
    }
    const params = new URLSearchParams(text);
    for (const key of new Set(params.keys())) {
      if (
        key.length > 32 ||
        params.getAll(key).some((value) => value.length > 500)
      ) {
        errors.push(
          "Et valg i lenken er for langt. Velg innstillingene på siden.",
        );
        continue;
      }
      if (!own(DEFAULTS[page], key)) {
        errors.push("Lenken har et ukjent valg: «" + key + "».");
        continue;
      }
      if (params.getAll(key).length !== 1) {
        errors.push("Lenken har valget «" + key + "» mer enn én gang.");
        continue;
      }
      const v = params.get(key);
      try {
        if (own(enums, key)) {
          if (!enums[key].includes(v)) stop("Lenken har en ugyldig verdi for «" + key + "».");
          values[key] = v;
        } else if (key === "scenario") {
          if (!cases[page].includes(v)) stop("Ukjent kontrollsituasjon.");
          values[key] = v;
        } else if (page === "bi") {
          if (!/^2025-(0[1-9]|1[0-2])$/.test(v))
            stop("Datoen er ikke gyldig. Velg en gyldig periode.");
          values[key] = v;
        } else if (key === "arsverk" || key === "belop") {
          scaled(
            v,
            key === "arsverk" ? 1 : 2,
            key === "arsverk" ? "Årsverk" : "Beløpet",
          );
          values[key] = Number(v);
        } else if (key === "perioder")
          values[key] = int(v, 1, 12, "Antall perioder");
        else if (key === "vekt") values[key] = weights(v).join(",");
        else values[key] = int(v, 2026, 2030, "Året");
      } catch (error) {
        errors.push(error.message);
      }
    }
    if (own(values, "fra") && values.fra > values.til)
      errors.push("Fra-perioden må komme før eller være lik til-perioden.");
    return { values, errors };
  }
  function read(page, input) {
    if (input === undefined) return { ...DEFAULTS[page] };
    if (!input || typeof input !== "object" || Array.isArray(input))
      stop("Valgene må være et objekt.");
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(input)) {
      if (
        typeof v !== "string" &&
        typeof v !== "number" &&
        !(k === "vekt" && Array.isArray(v))
      )
        stop("Ugyldig verdi for " + k + ".");
      params.set(k, String(v));
    }
    const parsed = validateParams(page, params);
    if (parsed.errors.length) stop(parsed.errors.join(" "));
    return parsed.values;
  }
  const months = Object.freeze(
    Array.from(
      { length: 12 },
      (_, i) => "2025-" + String(i + 1).padStart(2, "0"),
    ),
  );
  const units = Object.freeze(["SYN-A", "SYN-B"]);
  const freshness = Object.freeze({
    okonomi: "2025-12",
    aktivitet: "2025-11",
    bemanning: "2025-12",
    fravaer: "2025-10",
  });
  const tables = {};
  for (const domain of enums.tabell) {
    tables[domain] = Object.freeze(
      months
        .filter((m) => m <= freshness[domain])
        .flatMap((period, i) =>
          units.map((enhet, u) => {
            let fields;
            if (domain === "okonomi")
              fields = {
                actual: 80000 + u * 30000 + [0, 6000, -2000, 4000][i % 4],
                budget: 85000 + u * 28000,
              };
            if (domain === "aktivitet")
              fields = {
                actual: 100 + u * 50 + [0, 8, -4, 12][i % 4],
                budget: period === "2025-07" && u === 1 ? null : 110 + u * 45,
              };
            if (domain === "bemanning")
              fields = { actualTenths: 210 + u * 100 + [0, 4, -2, 8][i % 4] };
            if (domain === "fravaer")
              fields = {
                absent: 80 + u * 55 + [0, 12, 4, 20][i % 4],
                exposure: 1600 + u * 700 + i * 20,
              };
            return Object.freeze({ period, enhet, ...fields });
          }),
        ),
    );
  }
  const BI_DATA = Object.freeze({
    year: 2025,
    units,
    months,
    freshness,
    tables: Object.freeze(tables),
  });
  function bi(input) {
    const p = read("bi", input),
      data = BI_DATA.tables[p.tabell];
    const sel = months.filter((m) => m >= p.fra && m <= p.til);
    const pick = data.filter(
      (r) =>
        (p.enhet === "alle" || r.enhet === p.enhet) &&
        r.period >= p.fra &&
        r.period <= p.til,
    );
    const titles = {
      okonomi: "Økonomiavvik",
      aktivitet: "Aktivitetsavvik",
      bemanning: "Bemanning per måned",
      fravaer: "Vektet sykefravær",
    };
    const sum = (rows, key) => rows.reduce((s, r) => s + r[key], 0);
    const paired = p.tabell === "okonomi" || p.tabell === "aktivitet";
    const unit =
      p.tabell === "okonomi"
        ? "kr"
        : p.tabell === "aktivitet"
          ? "poeng"
          : p.tabell === "bemanning"
            ? "årsverk"
            : "%";
    const columns = paired
      ? [
          { label: "Måned" },
          { label: "Faktisk", precision: 0, unit },
          { label: "Budsjett", precision: 0, unit },
          { label: "Avvik", precision: 0, unit },
        ]
      : p.tabell === "bemanning"
        ? [{ label: "Måned" }, { label: "Årsverk", precision: 1, unit }]
        : [
            { label: "Måned" },
            { label: "Fraværsdager", precision: 0 },
            { label: "Eksponerte dager", precision: 0, term: "eksponerte-dager" },
            { label: "Fravær", precision: 2, unit: "%" },
          ];
    const rows = sel.map((period) => {
      const rs = pick.filter((r) => r.period === period);
      if (!rs.length) return [period, ...columns.slice(1).map(() => null)];
      if (paired) {
        const actual = sum(rs, "actual"),
          budget = rs.every((r) => r.budget !== null)
            ? sum(rs, "budget")
            : null;
        return [
          period,
          actual,
          budget,
          budget === null
            ? null
            : p.tabell === "okonomi"
              ? budget - actual
              : actual - budget,
        ];
      }
      if (p.tabell === "bemanning")
        return [period, sum(rs, "actualTenths") / 10];
      const exposure = sum(rs, "exposure");
      if (exposure <= 0)
        stop("Fravær kan ikke beregnes uten positiv eksponering.");
      return [
        period,
        sum(rs, "absent"),
        exposure,
        (sum(rs, "absent") / exposure) * 100,
      ];
    });
    const seen = rows.filter((r) => r[1] !== null).length;
    const coverage = seen + " av " + sel.length + " valgte måneder";
    const summary = [
      "Valgt periode: " + p.fra + " til " + p.til + ".",
      "Siste tilgjengelige måned: " + freshness[p.tabell] + ".",
    ];
    let detail = "Manglende tall vises som «Mangler».";
    if (!seen) summary.push("Det finnes ingen data for denne perioden.");
    else if (p.tabell === "bemanning")
      summary.push(
        "Gjennomsnitt: " +
          fmt(sum(pick, "actualTenths") / 10 / seen, 1) +
          " årsverk over " +
          (seen === sel.length ? seen + " måneder." : coverage + " med data."),
      );
    else if (p.tabell === "fravaer")
      summary.push(
        "Samlet vektet fravær: " +
          fmt((sum(pick, "absent") / sum(pick, "exposure")) * 100, 2) +
          " %" +
          (seen === sel.length ? "." : " for " + coverage + " med data."),
      );
    else {
      // A total for the whole selection needs every selected month comparable.
      const comparable = rows.filter((r) => r[3] !== null);
      if (comparable.length === sel.length) {
        const diff = comparable.reduce((s, r) => s + r[3], 0);
        summary.push(
          "Avvik i perioden: " +
            fmt(diff) +
            (p.tabell === "okonomi" ? " kr." : " poeng."),
        );
      } else
        summary.push(
          "Data for " +
            coverage +
            ", sammenlignbart budsjett for " +
            comparable.length +
            ". Samlet avvik vises bare når alle valgte måneder kan sammenlignes.",
        );
      detail +=
        p.tabell === "okonomi"
          ? " Avvik er budsjett minus faktisk. Et positivt avvik betyr at faktisk beløp er lavere enn budsjettert."
          : " Avvik er faktisk minus budsjett. Et positivt avvik betyr mer aktivitet enn budsjettert. Poengene er fiktive.";
    }
    return {
      title: titles[p.tabell],
      columns,
      rows,
      summary,
      detail,
      status: seen ? "Syntetisk beregning" : "Mangler grunnlag",
      series: rows.map((r) => ({
        label: r[0],
        value: r.at(-1),
        unit,
        precision:
          p.tabell === "bemanning" ? 1 : p.tabell === "fravaer" ? 2 : 0,
      })),
    };
  }
  function budget(input) {
    const p = read("budsjett", input),
      total = scaled(p.arsverk, 1, "Årsverk");
    const first = Math.floor(total / p.perioder);
    const shares = Array.from({ length: p.perioder }, (_, i) =>
      i === p.perioder - 1 ? total - first * (p.perioder - 1) : first,
    );
    return {
      title: "Fordeling med avrundingsrest",
      columns: [{ label: "Periode" }, { label: "Årsverk", precision: 1 }],
      rows: shares.map((n, i) => [String(i + 1), n / 10]),
      summary: ["Eksakt sum: " + fmt(total / 10, 1) + " årsverk."],
      detail:
        "Tidelene avrundes ned, og siste periode får resten. Totalen bevares.",
      status: "Syntetisk fordeling",
    };
  }
  function compare(left, right, mode = "ingen") {
    const res = {
      ok: false,
      status: "Kan ikke sammenlignes",
      detail: "",
      matched: 0,
      unmatched: 0,
      duplicates: 0,
      missing: 0,
      comparable: 0,
      maxDelta: null,
    };
    if (!enums.normalisering.includes(mode))
      return { ...res, detail: "Ukjent normalisering." };
    if (
      !Array.isArray(left) ||
      !Array.isArray(right) ||
      !left.length ||
      !right.length
    )
      return { ...res, detail: "Begge datasett må ha rader." };
    const maps = [];
    for (const rows of [left, right]) {
      const map = new Map();
      for (const row of rows) {
        if (
          !row ||
          typeof row !== "object" ||
          Array.isArray(row) ||
          !own(row, "id") ||
          typeof row.id !== "string" ||
          !row.id.trim() ||
          row.id !== row.id.trim()
        )
          return {
            ...res,
            detail:
              "Hver rad krever en synlig nøkkel uten omkringliggende mellomrom.",
          };
        if (
          !own(row, "value") ||
          (row.value !== null &&
            (typeof row.value !== "number" || !Number.isFinite(row.value)))
        )
          return {
            ...res,
            detail: "Verdier må være endelige tall eller eksplisitt null.",
          };
        if (map.has(row.id)) res.duplicates++;
        map.set(row.id, row.value);
      }
      maps.push(map);
    }
    const [a, b] = maps;
    res.matched = [...a.keys()].filter((k) => b.has(k)).length;
    res.unmatched =
      [...a.keys()].filter((k) => !b.has(k)).length +
      [...b.keys()].filter((k) => !a.has(k)).length;
    if (res.duplicates || res.unmatched)
      return {
        ...res,
        status: "Nøkkelavvik",
        detail: "Duplikater og ulike nøkkelsett stopper kontrollen.",
      };
    let max = 0;
    for (const [id, x0] of a) {
      const y0 = b.get(id);
      if (x0 === null || y0 === null) {
        if (x0 !== y0)
          return {
            ...res,
            status: "Manglende verdi",
            detail: "Manglende og oppgitt verdi kan ikke likestilles.",
          };
        res.missing++;
        continue;
      }
      const x = mode === "float32" ? Math.fround(x0) : x0;
      const y = mode === "float32" ? Math.fround(y0) : y0;
      if (!Number.isFinite(x) || !Number.isFinite(y))
        return { ...res, detail: "Normalisering ga et ikke-endelig tall." };
      const delta = Math.abs(x - y);
      if (!Number.isFinite(delta))
        return { ...res, detail: "Tallforskjellen er ikke endelig." };
      max = Math.max(max, delta);
      res.comparable++;
    }
    if (!res.comparable) return { ...res, detail: "Ingen tall å sammenligne." };
    return {
      ...res,
      ok: max === 0,
      maxDelta: max,
      status: max === 0 ? "Samsvar i testparet" : "Tallavvik",
      detail:
        mode === "float32"
          ? "Sammenlignet etter float32-normalisering."
          : "Sammenlignet uten normalisering.",
    };
  }
  function forecast(input) {
    const p = read("prognose", input);
    const left = [
      { id: "SYN-1", value: 12.5 },
      { id: "SYN-2", value: 20 },
      { id: "SYN-3", value: 7.25 },
    ];
    const right = left.map((r) => ({ ...r }));
    if (p.scenario === "endret") right[1].value++;
    if (p.scenario === "manglende") right.pop();
    if (p.scenario === "duplikat") right.push({ ...right[0] });
    if (p.scenario === "blank") right[0].id = "";
    if (p.scenario === "bare-mangler")
      for (const r of [...left, ...right]) r.value = null;
    if (p.scenario === "float32") {
      left[0].value = 1.00000001;
      right[0].value = 1.00000002;
    }
    const cmp = compare(left, right, p.normalisering);
    const rows =
      cmp.maxDelta === null
        ? []
        : left.map((r) => {
            const n = right.find((n) => n.id === r.id).value;
            const delta =
              r.value === null
                ? null
                : p.normalisering === "float32"
                  ? Math.fround(n) - Math.fround(r.value)
                  : n - r.value;
            return [r.id, r.value, n, delta];
          });
    return {
      title: "Sammenligning av et testpar",
      columns: [
        { label: "Nøkkel", term: "observasjonsnokkel" },
        { label: "Referanse (rå)", precision: 8 },
        { label: "Kandidat (rå)", precision: 8 },
        {
          label:
            p.normalisering === "float32"
              ? "Forskjell etter float32"
              : "Forskjell",
          precision: 8,
        },
      ],
      rows,
      summary: [cmp.status + ".", cmp.comparable + " tallpar sammenlignet."],
      summaryTerm: "testpar-samsvar",
      detail: cmp.detail,
      status: cmp.status,
      comparison: cmp,
    };
  }
  function benefits(input, factors = DATA_factors) {
    const p = read("gevinst", input),
      cents = scaled(p.belop, 2, "Beløpet");
    const factor = (year) => {
      if (
        !factors ||
        typeof factors !== "object" ||
        !own(factors, year) ||
        factors[year] === null ||
        factors[year] === undefined
      )
        stop("Kan ikke beregnes. Prisfaktor for " + year + " mangler.");
      const v = scaled(factors[year], 6, "Prisfaktor for " + year);
      if (!v) stop("Prisfaktor for " + year + " må være positiv.");
      return v;
    };
    const base = BigInt(factor(p.prisaar)),
      sign = p.type === "investering" ? -1 : 1;
    let total = 0;
    const rows = Array.from({ length: p.til - p.fra + 1 }, (_, i) => {
      const year = p.fra + i,
        f = factor(year);
      const rounded = (BigInt(cents) * base + BigInt(f) / 2n) / BigInt(f);
      if (rounded > BigInt(MAX))
        stop("Beløpet i " + year + " er for stort til å beregnes nøyaktig.");
      const amount = Number(rounded) * sign;
      total += amount;
      if (!Number.isSafeInteger(total))
        stop("Summen er for stor til å beregnes nøyaktig.");
      return [String(year), Number(base) / f, amount / 100];
    });
    return {
      title: "Planlagt beløp per år",
      columns: [
        { label: "År" },
        { label: "Relativ prisfaktor", precision: 4 },
        { label: "Planlagt beløp", precision: 2, unit: "kr" },
      ],
      rows,
      summary: ["Sum planlagt beløp: " + fmt(total / 100, 2) + " kr."],
      detail:
        "Grunnbeløpet er nominelt per år. Til valgt prisår brukes faktor for prisåret delt på faktor for effektåret. Faktorene er fiktive. Årsbeløp avrundes til nærmeste øre, med halve øre opp i absoluttbeløpet. Investering er negativ.",
      status: "Syntetisk årsplan",
    };
  }
  function ste(input) {
    const p = read("utfyllende", input),
      w = weights(p.vekt);
    const source = [
      { id: "SYN-A1", clinic: "SYN-A", signals: [40, 30, 20] },
      { id: "SYN-A2", clinic: "SYN-A", signals: [20, 25, 35] },
      { id: "SYN-B1", clinic: "SYN-B", signals: [30, 20, 25] },
      { id: "SYN-B2", clinic: "SYN-B", signals: [10, 25, 20] },
    ];
    if (p.scenario === "duplikat") source.push({ ...source[0] });
    if (p.scenario === "mangler") source[0].clinic = "";
    if (new Set(source.map((r) => r.id)).size !== source.length)
      stop("Kan ikke beregnes. En avdelingsnøkkel er duplisert.");
    if (source.some((r) => !r.id || !units.includes(r.clinic)))
      stop("Kan ikke beregnes. En avdeling mangler gyldig klinikktilordning.");
    const totals = [0, 1, 2].map((i) =>
      source.reduce((s, r) => s + r.signals[i], 0),
    );
    if (
      source.some((r) =>
        r.signals.some((v) => !Number.isFinite(v) || v <= 0),
      ) ||
      totals.some((v) => !Number.isFinite(v) || v <= 0)
    )
      stop("Alle tre signalgrunnlag må være positive.");
    const rows = source.map((r) => {
      const norm = r.signals.map((n, i) => n / totals[i]);
      const share = norm.reduce((s, n, i) => s + (n * w[i]) / 100, 0);
      return [r.id, r.clinic, ...norm.map((n) => n * 100), share * 100];
    });
    const clinics = units.map((id) => ({
      label: id,
      value: rows.filter((r) => r[1] === id).reduce((s, r) => s + r[5], 0),
    }));
    return {
      title: "Fordeling mellom fiktive avdelinger",
      columns: [
        { label: "Avdeling" },
        { label: "Klinikk" },
        ...["Signal A", "Signal B", "Signal C", "Andel"].map((label) => ({
          label,
          precision: 2,
          unit: "%",
        })),
      ],
      rows,
      summary: clinics.map((r) => r.label + ": " + fmt(r.value, 2) + " %."),
      detail:
        "Signalene normaliseres hver for seg. Vektene gir avdelingsandeler, og klinikkene summerer sine avdelinger. Vektene er fiktive.",
      status: "Syntetisk fordeling",
    };
  }
  const api = {
    DEFAULTS,
    BI_DATA,
    DATA_factors,
    fmt,
    validateParams,
    bi,
    budget,
    compare,
    forecast,
    benefits,
    ste,
  };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.R8Calc = api;
})(typeof window !== "undefined" ? window : globalThis);
