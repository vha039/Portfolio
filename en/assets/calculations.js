/*Synthetic examples.*/ (function (root) {
"use strict";
function create(copy) {
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
    if (v === null) return ("Missing");
    if (typeof v !== "number" || !Number.isFinite(v))
      stop(("The number is not finite."));
    if (!Number.isInteger(dp) || dp < 0 || dp > 100)
      stop(("Invalid number precision."));
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
      int.replace(/\B(?=(\d{3})+(?!\d))/g, (",")) +
      (frac ? (".") + frac : "")
    );
  }
  function scaled(v, dp, label) {
    const text = typeof v === "number" && Number.isFinite(v) ? String(v) : v;
    if (typeof text !== "string") stop(label + (" must be a valid number."));
    const match = /^(0|[1-9]\d*)(?:\.(\d+))?$/.exec(text);
    const dec = match ? (match[2] || "").replace(/0+$/, "") : "";
    if (!match || dec.length > dp)
      stop(
        label +
          (" must be a non-negative number with at most ") +
          (dp === 1 ? ("one decimal.") : dp + (" decimals.")),
      );
    const units =
      BigInt(match[1]) * 10n ** BigInt(dp) + BigInt(dec.padEnd(dp, "0") || "0");
    if (units > BigInt(MAX))
      stop(label + (" has too many digits to be calculated exactly."));
    const number = Number(text);
    if (
      !Number.isFinite(number) ||
      BigInt(number.toFixed(dp).replace(".", "")) !== units
    )
      stop(label + (" cannot be calculated exactly."));
    return Number(units);
  }
  function int(v, min, max, label) {
    if (!/^(0|[1-9]\d*)$/.test(String(v))) stop(label + (" must be a whole number."));
    const n = Number(v);
    if (!Number.isSafeInteger(n) || n < min || n > max)
      stop(label + (" must be between ") + min + (" and ") + max + ".");
    return n;
  }
  function weights(v) {
    const parts = String(v).split(",");
    if (parts.length !== 3)
      stop(("Give three whole-number weights, separated by commas."));
    const res = parts.map((v) => int(v, 0, 100, ("The weight")));
    if (res.reduce((s, v) => s + v, 0) !== 100)
      stop(("The weights must add up to 100 percent."));
    return res;
  }
  function validateParams(page, search = "") {
    if (!own(DEFAULTS, page))
      return { values: {}, errors: [("Unknown demonstration.")] };
    const values = { ...DEFAULTS[page] },
      errors = [];
    if (typeof search !== "string" && !(search instanceof URLSearchParams))
      return { values, errors: [("Invalid URL choices.")] };
    const text = String(search).replace(/^\?/, "");
    if (text.length > 2500)
      return {
        values,
        errors: [("The link is too long. Choose the settings on the page.")],
      };
    try {
      decodeURIComponent(text.replace(/\+/g, " "));
    } catch {
      return { values, errors: [("The link contains invalid percent-encoding.")] };
    }
    const params = new URLSearchParams(text);
    for (const key of new Set(params.keys())) {
      if (
        key.length > 32 ||
        params.getAll(key).some((value) => value.length > 500)
      ) {
        errors.push(
          ("A choice in the link is too long. Choose the settings on the page."),
        );
        continue;
      }
      if (!own(DEFAULTS[page], key)) {
        errors.push(("The link has an unknown choice: “") + key + ("”."));
        continue;
      }
      if (params.getAll(key).length !== 1) {
        errors.push(("The link has the choice “") + key + ("” more than once."));
        continue;
      }
      const v = params.get(key);
      try {
        if (own(enums, key)) {
          if (!enums[key].includes(v)) stop(("The link has an invalid value for “") + key + ("”."));
          values[key] = v;
        } else if (key === "scenario") {
          if (!cases[page].includes(v)) stop(("Unknown check scenario."));
          values[key] = v;
        } else if (page === "bi") {
          if (!/^2025-(0[1-9]|1[0-2])$/.test(v))
            stop(("The date is not valid. Choose a valid period."));
          values[key] = v;
        } else if (key === "arsverk" || key === "belop") {
          scaled(
            v,
            key === "arsverk" ? 1 : 2,
            key === "arsverk" ? ("FTEs") : ("The amount"),
          );
          values[key] = Number(v);
        } else if (key === "perioder")
          values[key] = int(v, 1, 12, ("Number of periods"));
        else if (key === "vekt") values[key] = weights(v).join(",");
        else values[key] = int(v, 2026, 2030, ("The year"));
      } catch (error) {
        errors.push(error.message);
      }
    }
    if (own(values, "fra") && values.fra > values.til)
      errors.push(("The from period must come before or equal the to period."));
    return { values, errors };
  }
  function read(page, input) {
    if (input === undefined) return { ...DEFAULTS[page] };
    if (!input || typeof input !== "object" || Array.isArray(input))
      stop(("The choices must be an object."));
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(input)) {
      if (
        typeof v !== "string" &&
        typeof v !== "number" &&
        !(k === "vekt" && Array.isArray(v))
      )
        stop(("Invalid value for ") + k + ".");
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
      okonomi: ("Financial variance"),
      aktivitet: ("Activity variance"),
      bemanning: ("Staffing per month"),
      fravaer: ("Weighted sickness absence"),
    };
    const sum = (rows, key) => rows.reduce((s, r) => s + r[key], 0);
    const paired = p.tabell === "okonomi" || p.tabell === "aktivitet";
    const unit =
      p.tabell === "okonomi"
        ? ("NOK")
        : p.tabell === "aktivitet"
          ? ("points")
          : p.tabell === "bemanning"
            ? ("FTEs")
            : "%";
    const columns = paired
      ? [
          { label: ("Month") },
          { label: ("Actual"), precision: 0, unit },
          { label: ("Budget"), precision: 0, unit },
          { label: ("Variance"), precision: 0, unit },
        ]
      : p.tabell === "bemanning"
        ? [{ label: ("Month") }, { label: ("FTEs"), precision: 1, unit }]
        : [
            { label: ("Month") },
            { label: ("Days of absence"), precision: 0 },
            { label: ("Exposed days"), precision: 0, term: "eksponerte-dager" },
            { label: ("Absence"), precision: 2, unit: "%" },
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
        stop(("Absence cannot be calculated without positive exposure."));
      return [
        period,
        sum(rs, "absent"),
        exposure,
        (sum(rs, "absent") / exposure) * 100,
      ];
    });
    const seen = rows.filter((r) => r[1] !== null).length;
    const coverage = seen + (" of ") + sel.length + (" selected months");
    const summary = [
      ("Selected period: ") + p.fra + (" to ") + p.til + ".",
      ("Latest available month: ") + freshness[p.tabell] + ".",
    ];
    let detail = ("Missing figures are shown as “Missing”.");
    if (!seen) summary.push(("There is no data for this period."));
    else if (p.tabell === "bemanning")
      summary.push(
        ("Average: ") +
          fmt(sum(pick, "actualTenths") / 10 / seen, 1) +
          (" FTEs over ") +
          (seen === sel.length ? seen + (" months.") : coverage + (" with data.")),
      );
    else if (p.tabell === "fravaer")
      summary.push(
        ("Combined weighted absence: ") +
          fmt((sum(pick, "absent") / sum(pick, "exposure")) * 100, 2) +
          ("%") +
          (seen === sel.length ? "." : " for " + coverage + (" with data.")),
      );
    else {
      // A total for the whole selection needs every selected month comparable.
      const comparable = rows.filter((r) => r[3] !== null);
      if (comparable.length === sel.length) {
        const diff = comparable.reduce((s, r) => s + r[3], 0);
        summary.push(
          ("Variance for the period: ") +
            fmt(diff) +
            (p.tabell === "okonomi" ? (" NOK.") : (" points.")),
        );
      } else
        summary.push(
          "Data for " +
            coverage +
            (", comparable budget for ") +
            comparable.length +
            (". A combined variance is shown only when all selected months can be compared."),
        );
      detail +=
        p.tabell === "okonomi"
          ? (" Variance is budget minus actual. A positive variance means the actual amount is lower than budgeted.")
          : (" Variance is actual minus budget. A positive variance means more activity than budgeted. The points are fictitious.");
    }
    return {
      title: titles[p.tabell],
      columns,
      rows,
      summary,
      detail,
      status: seen ? ("Synthetic calculation") : ("No data"),
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
      total = scaled(p.arsverk, 1, ("FTEs"));
    const first = Math.floor(total / p.perioder);
    const shares = Array.from({ length: p.perioder }, (_, i) =>
      i === p.perioder - 1 ? total - first * (p.perioder - 1) : first,
    );
    return {
      title: ("Distribution with a rounding remainder"),
      columns: [{ label: ("Period") }, { label: ("FTEs"), precision: 1 }],
      rows: shares.map((n, i) => [String(i + 1), n / 10]),
      summary: [("Exact sum: ") + fmt(total / 10, 1) + (" FTEs.")],
      detail:
        ("The tenths are rounded down, and the last period gets the remainder. The total is preserved."),
      status: ("Synthetic distribution"),
    };
  }
  function compare(left, right, mode = "ingen") {
    const res = {
      ok: false,
      status: ("Cannot be compared"),
      detail: "",
      matched: 0,
      unmatched: 0,
      duplicates: 0,
      missing: 0,
      comparable: 0,
      maxDelta: null,
    };
    if (!enums.normalisering.includes(mode))
      return { ...res, detail: ("Unknown normalisation.") };
    if (
      !Array.isArray(left) ||
      !Array.isArray(right) ||
      !left.length ||
      !right.length
    )
      return { ...res, detail: ("Both datasets must have rows.") };
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
              ("Each row needs a visible key without surrounding whitespace."),
          };
        if (
          !own(row, "value") ||
          (row.value !== null &&
            (typeof row.value !== "number" || !Number.isFinite(row.value)))
        )
          return {
            ...res,
            detail: ("Values must be finite numbers or an explicit null."),
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
        status: ("Key mismatch"),
        detail: ("Duplicates and differing key sets stop the check."),
      };
    let max = 0;
    for (const [id, x0] of a) {
      const y0 = b.get(id);
      if (x0 === null || y0 === null) {
        if (x0 !== y0)
          return {
            ...res,
            status: ("Missing value"),
            detail: ("A missing value and a stated value cannot be treated as equal."),
          };
        res.missing++;
        continue;
      }
      const x = mode === "float32" ? Math.fround(x0) : x0;
      const y = mode === "float32" ? Math.fround(y0) : y0;
      if (!Number.isFinite(x) || !Number.isFinite(y))
        return { ...res, detail: ("Normalisation gave a non-finite number.") };
      const delta = Math.abs(x - y);
      if (!Number.isFinite(delta))
        return { ...res, detail: ("The numerical difference is not finite.") };
      max = Math.max(max, delta);
      res.comparable++;
    }
    if (!res.comparable) return { ...res, detail: ("No numbers to compare.") };
    return {
      ...res,
      ok: max === 0,
      maxDelta: max,
      status: max === 0 ? ("The test pair matches") : ("Numerical difference"),
      detail:
        mode === "float32"
          ? ("Compared after float32 normalisation.")
          : ("Compared without normalisation."),
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
      title: ("Comparison of a test pair"),
      columns: [
        { label: ("Key"), term: "observasjonsnokkel" },
        { label: ("Reference (raw)"), precision: 8 },
        { label: ("Candidate (raw)"), precision: 8 },
        {
          label:
            p.normalisering === "float32"
              ? ("Difference after float32")
              : ("Difference"),
          precision: 8,
        },
      ],
      rows,
      summary: [cmp.status + ".", cmp.comparable + (" pairs compared.")],
      summaryTerm: "testpar-samsvar",
      detail: cmp.detail,
      status: cmp.status,
      comparison: cmp,
    };
  }
  function benefits(input, factors = DATA_factors) {
    const p = read("gevinst", input),
      cents = scaled(p.belop, 2, ("The amount"));
    const factor = (year) => {
      if (
        !factors ||
        typeof factors !== "object" ||
        !own(factors, year) ||
        factors[year] === null ||
        factors[year] === undefined
      )
        stop(("Cannot be calculated. The price factor for ") + year + (" is missing."));
      const v = scaled(factors[year], 6, ("The price factor for ") + year);
      if (!v) stop(("The price factor for ") + year + (" must be positive."));
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
        stop(("The amount in ") + year + (" is too large to calculate exactly."));
      const amount = Number(rounded) * sign;
      total += amount;
      if (!Number.isSafeInteger(total))
        stop(("The sum is too large to calculate exactly."));
      return [String(year), Number(base) / f, amount / 100];
    });
    return {
      title: ("Planned amount per year"),
      columns: [
        { label: ("Year") },
        { label: ("Relative price factor"), precision: 4 },
        { label: ("Planned amount"), precision: 2, unit: ("NOK") },
      ],
      rows,
      summary: [("Total planned amount: ") + fmt(total / 100, 2) + (" NOK.")],
      detail:
        ("The base amount is nominal per year. To convert to the chosen price year, the price year's factor is divided by the factor for the year of effect. The factors are fictitious. Annual amounts are rounded to the nearest øre, with half an øre rounded up in absolute value. An investment is negative."),
      status: ("Synthetic annual plan"),
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
      stop(("Cannot be calculated. A department key is duplicated."));
    if (source.some((r) => !r.id || !units.includes(r.clinic)))
      stop(("Cannot be calculated. A department has no valid clinic assignment."));
    const totals = [0, 1, 2].map((i) =>
      source.reduce((s, r) => s + r.signals[i], 0),
    );
    if (
      source.some((r) =>
        r.signals.some((v) => !Number.isFinite(v) || v <= 0),
      ) ||
      totals.some((v) => !Number.isFinite(v) || v <= 0)
    )
      stop(("All three signal bases must be positive."));
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
      title: ("Distribution between fictitious departments"),
      columns: [
        { label: ("Department") },
        { label: ("Clinic") },
        ...["Signal A", "Signal B", "Signal C", ("Share")].map((label) => ({
          label,
          precision: 2,
          unit: "%",
        })),
      ],
      rows,
      summary: clinics.map((r) => r.label + ": " + fmt(r.value, 2) + ("%.")),
      detail:
        ("Each signal is normalised separately. The weights give department shares, and each clinic sums its departments. The weights are fictitious."),
      status: ("Synthetic distribution"),
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
  return api;
}
if (typeof module !== "undefined" && module.exports) {
  module.exports = create(require("../runtime-copy.cjs").nb.calculations);
  module.exports.create = create;
} else root.R8Calc = create({});
})(typeof window !== "undefined" ? window : globalThis);
