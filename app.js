"use strict";

const $ = (id) => document.getElementById(id);
const complex = (re = 0, im = 0) => ({ re, im });
const add = (a, b) => complex(a.re + b.re, a.im + b.im);
const mul = (a, b) => complex(a.re * b.re - a.im * b.im, a.re * b.im + a.im * b.re);
const div = (a, b) => {
  const d = b.re * b.re + b.im * b.im || Number.EPSILON;
  return complex((a.re * b.re + a.im * b.im) / d, (a.im * b.re - a.re * b.im) / d);
};
const inv = (a) => div(complex(1, 0), a);
const parallel = (...items) => inv(items.reduce((sum, z) => add(sum, inv(z)), complex()));
const magnitude = (z) => Math.hypot(z.re, z.im);
const dB = (v) => 20 * Math.log10(Math.max(v, 1e-12));
const logspace = (start, end, count) => Array.from({ length: count }, (_, i) => start * Math.pow(end / start, i / (count - 1)));
const frequencies = logspace(20, 20000, 401);

const guitarDefs = [
  { key: "pickupR", label: "Pickup DCR", unit: "Ω", min: 2000, max: 15000, step: 100, scale: "linear" },
  { key: "pickupL", label: "Pickup L", unit: "H", min: 0.5, max: 8, step: 0.1, scale: "linear" },
  { key: "volumeR", label: "Volume pot", unit: "Ω", min: 100000, max: 1000000, step: 10000, scale: "linear" },
  { key: "toneR", label: "Tone pot", unit: "Ω", min: 0, max: 500000, step: 5000, scale: "linear" },
  { key: "toneC", label: "Tone capacitor", unit: "F", min: 10e-9, max: 100e-9, step: 1e-9, scale: "linear" },
  { key: "cableC", label: "Cable capacitance", unit: "F", min: 50e-12, max: 2000e-12, step: 10e-12, scale: "linear" },
  { key: "ampSeriesR", label: "Amp series R", unit: "Ω", min: 0, max: 100000, step: 1000, scale: "linear" },
  { key: "ampInputR", label: "Amp input R", unit: "Ω", min: 50000, max: 2000000, step: 10000, scale: "linear" },
  { key: "ampInputC", label: "Amp input C", unit: "F", min: 0, max: 1000e-12, step: 5e-12, scale: "linear" }
];

const lineDefs = [
  { key: "sourceR", label: "Source Rout", unit: "Ω", min: 10, max: 200000, step: 10, scale: "log" },
  { key: "loadR", label: "Load Rin", unit: "Ω", min: 100, max: 2000000, step: 100, scale: "log" },
  { key: "cableR", label: "Cable series R", unit: "Ω", min: 0, max: 100, step: 0.1, scale: "linear" },
  { key: "cableL", label: "Cable series L", unit: "H", min: 0, max: 100e-6, step: 0.5e-6, scale: "linear" },
  { key: "cableC", label: "Cable shunt C", unit: "F", min: 10e-12, max: 3000e-12, step: 10e-12, scale: "linear" }
];

const guitarPresets = {
  strat: { pickupR: 5000, pickupL: 3, volumeR: 250000, toneR: 250000, toneC: 47e-9, cableC: 500e-12, ampSeriesR: 34000, ampInputR: 1e6, ampInputC: 100e-12 },
  paf: { pickupR: 7500, pickupL: 5, volumeR: 500000, toneR: 500000, toneC: 22e-9, cableC: 500e-12, ampSeriesR: 68000, ampInputR: 1e6, ampInputC: 100e-12 }
};

const linePresets = {
  "low-high": { sourceR: 100, loadR: 100000, cableR: 1, cableL: 5e-6, cableC: 500e-12 },
  "high-low": { sourceR: 100000, loadR: 10000, cableR: 1, cableL: 5e-6, cableC: 500e-12 },
  guitar: { sourceR: 10000, loadR: 1e6, cableR: 1, cableL: 5e-6, cableC: 500e-12 }
};

let guitar = { ...guitarPresets.strat };
let line = { ...linePresets["low-high"] };
let guitarBaseline = { ...guitar };
let lineBaseline = { ...line };

function formatValue(value, unit) {
  if (unit === "F") {
    if (value >= 1e-6) return `${trim(value * 1e6)} µF`;
    if (value >= 1e-9) return `${trim(value * 1e9)} nF`;
    return `${trim(value * 1e12)} pF`;
  }
  if (unit === "H") {
    if (value < 1e-3) return `${trim(value * 1e6)} µH`;
    if (value < 1) return `${trim(value * 1e3)} mH`;
    return `${trim(value)} H`;
  }
  if (unit === "Ω") {
    if (value >= 1e6) return `${trim(value / 1e6)} MΩ`;
    if (value >= 1e3) return `${trim(value / 1e3)} kΩ`;
    return `${trim(value)} Ω`;
  }
  return trim(value);
}

function trim(v) {
  if (Math.abs(v) >= 100) return Math.round(v).toString();
  if (Math.abs(v) >= 10) return v.toFixed(1).replace(/\.0$/, "");
  return v.toFixed(2).replace(/0+$/, "").replace(/\.$/, "");
}

function createControls(host, defs, state, onChange) {
  host.innerHTML = "";
  defs.forEach((def) => {
    const label = document.createElement("label");
    label.className = "control-row";
    const top = document.createElement("span");
    const name = document.createElement("b");
    name.textContent = def.label;
    const out = document.createElement("output");
    out.id = `${host.id}-${def.key}-out`;
    out.textContent = formatValue(state[def.key], def.unit);
    top.append(name, out);
    const input = document.createElement("input");
    input.type = "range";
    input.id = `${host.id}-${def.key}`;
    if (def.scale === "log") {
      input.min = Math.log10(def.min);
      input.max = Math.log10(def.max);
      input.step = 0.001;
      input.value = Math.log10(state[def.key]);
    } else {
      input.min = def.min;
      input.max = def.max;
      input.step = def.step;
      input.value = state[def.key];
    }
    input.setAttribute("aria-label", def.label);
    input.addEventListener("input", () => {
      state[def.key] = def.scale === "log" ? Math.pow(10, Number(input.value)) : Number(input.value);
      out.textContent = formatValue(state[def.key], def.unit);
      onChange();
    });
    label.append(top, input);
    host.append(label);
  });
}

function refreshControls(host, defs, state) {
  defs.forEach((def) => {
    const input = $(`${host.id}-${def.key}`);
    input.value = def.scale === "log" ? Math.log10(state[def.key]) : state[def.key];
    $(`${host.id}-${def.key}-out`).textContent = formatValue(state[def.key], def.unit);
  });
}

function guitarTransfer(params, f) {
  const w = 2 * Math.PI * f;
  const source = complex(params.pickupR, w * params.pickupL);
  const tone = add(complex(params.toneR, 0), complex(0, -1 / (w * params.toneC)));
  const cable = complex(0, -1 / (w * params.cableC));
  const ampZ = params.ampInputC > 0
    ? parallel(complex(params.ampInputR, 0), complex(0, -1 / (w * params.ampInputC)))
    : complex(params.ampInputR, 0);
  const ampBranch = add(complex(params.ampSeriesR, 0), ampZ);
  const nodeLoad = parallel(complex(params.volumeR, 0), tone, cable, ampBranch);
  const nodeV = div(nodeLoad, add(source, nodeLoad));
  return mul(nodeV, div(ampZ, ampBranch));
}

function lineTransfer(params, f) {
  const w = 2 * Math.PI * f;
  const load = parallel(complex(params.loadR, 0), complex(0, -1 / (w * params.cableC)));
  const series = complex(params.sourceR + params.cableR, w * params.cableL);
  return div(load, add(series, load));
}

function guitarCircuitSvg() {
  const v = (key, unit) => formatValue(guitar[key], unit);
  return `
  <g class="group-label"><text x="55" y="28">PICKUP</text><text x="335" y="28">GUITAR CONTROLS</text><text x="610" y="28">CABLE</text><text x="790" y="28">AMPLIFIER INPUT</text></g>
  <g class="wire"><line x1="40" y1="118" x2="78" y2="118"/><line x1="78" y1="225" x2="930" y2="225"/><line x1="40" y1="118" x2="40" y2="225"/><line x1="78" y1="118" x2="108" y2="118"/><line x1="183" y1="118" x2="210" y2="118"/><line x1="287" y1="118" x2="850" y2="118"/></g>
  <g class="component pickup-component"><circle cx="78" cy="171" r="21"/><path d="M63 171 q7 -15 15 0 q8 15 15 0"/><path d="M108 118 q8 -25 16 0 q8 25 16 0 q8 -25 16 0 q8 25 16 0 q8 -25 16 0"/><path d="M210 118 l10 -14 12 28 12 -28 12 28 12 -28 19 14"/></g>
  <g class="wire"><line x1="78" y1="118" x2="78" y2="150"/><line x1="78" y1="192" x2="78" y2="225"/></g>
  <g class="component control-component"><path d="M430 118 v20 l-12 8 24 12 -24 12 24 12 -12 8 v8"/><path d="M430 198 v5 m-15 0 h30 m-30 12 h30 m-15 0 v10"/></g><g class="component cable-component"><path d="M645 118 v35 m-15 0 h30 m-30 12 h30 m-15 0 v60"/></g><g class="component amp-component"><path d="M760 118 l10 -14 12 28 12 -28 12 28 12 -28 12 14"/><path d="M850 118 v28 l-12 8 24 12 -24 12 24 12 -12 8 v27"/></g>
  <g class="wire"><line x1="287" y1="118" x2="287" y2="225"/><line x1="850" y1="118" x2="930" y2="118"/></g>
  <g class="component control-component"><path d="M287 142 l-12 8 24 12 -24 12 24 12 -12 8"/></g><g class="component amp-component"><path d="M930 118 v28 l-12 8 24 12 -24 12 24 12 -12 8 v27"/></g>
  <g class="node"><circle cx="287" cy="118" r="5"/><circle cx="645" cy="118" r="5"/><circle cx="850" cy="118" r="5"/></g>
  <g><text x="45" y="260">V<tspan baseline-shift="sub">pickup</tspan></text><text x="122" y="82">L<tspan baseline-shift="sub">p</tspan></text><text class="value" x="115" y="101">${v("pickupL", "H")}</text><text x="220" y="82">DCR</text><text class="value" x="214" y="101">${v("pickupR", "Ω")}</text><text x="302" y="160">Volume</text><text class="value" x="302" y="181">${v("volumeR", "Ω")}</text><text x="452" y="148">Tone</text><text class="value" x="452" y="171">${v("toneR", "Ω")}</text><text class="value" x="452" y="214">${v("toneC", "F")}</text><text x="602" y="144">Cable C</text><text class="value" x="598" y="207">${v("cableC", "F")}</text><text x="760" y="80">R<tspan baseline-shift="sub">series</tspan></text><text class="value" x="755" y="100">${v("ampSeriesR", "Ω")}</text><text x="868" y="156">C<tspan baseline-shift="sub">in</tspan></text><text class="value" x="865" y="178">${v("ampInputC", "F")}</text><text x="890" y="244">R<tspan baseline-shift="sub">in</tspan> ${v("ampInputR", "Ω")}</text><text x="920" y="102">V<tspan baseline-shift="sub">out</tspan></text></g>`;
}

function lineCircuitSvg() {
  const v = (key, unit) => formatValue(line[key], unit);
  return `
  <g class="group-label"><text x="55" y="30">SOURCE</text><text x="310" y="30">CABLE</text><text x="760" y="30">LOAD</text></g>
  <g class="wire"><line x1="55" y1="120" x2="100" y2="120"/><line x1="100" y1="222" x2="900" y2="222"/><line x1="55" y1="120" x2="55" y2="222"/><line x1="100" y1="120" x2="135" y2="120"/><line x1="225" y1="120" x2="280" y2="120"/><line x1="370" y1="120" x2="415" y2="120"/><line x1="515" y1="120" x2="850" y2="120"/></g>
  <g class="component pickup-component"><circle cx="100" cy="171" r="22"/><path d="M84 171 q8 -15 16 0 q8 15 16 0"/><path d="M135 120 l11 -15 13 30 13 -30 13 30 13 -30 27 15"/></g>
  <g class="wire"><line x1="100" y1="120" x2="100" y2="149"/><line x1="100" y1="193" x2="100" y2="222"/></g>
  <g class="component cable-component"><path d="M280 120 l11 -15 13 30 13 -30 13 30 13 -30 27 15"/><path d="M415 120 q10 -28 20 0 q10 28 20 0 q10 -28 20 0 q10 28 20 0 q10 -28 20 0"/><path d="M650 120 v35 m-17 0 h34 m-34 13 h34 m-17 0 v54"/></g><g class="component amp-component"><path d="M850 120 v24 l-13 9 26 13 -26 13 26 13 -13 9 v21"/></g>
  <g class="node"><circle cx="650" cy="120" r="5"/><circle cx="850" cy="120" r="5"/></g>
  <g><text x="65" y="260">V<tspan baseline-shift="sub">source</tspan></text><text x="156" y="82">R<tspan baseline-shift="sub">out</tspan></text><text class="value" x="150" y="102">${v("sourceR", "Ω")}</text><text x="300" y="82">R<tspan baseline-shift="sub">cable</tspan></text><text class="value" x="298" y="102">${v("cableR", "Ω")}</text><text x="448" y="82">L<tspan baseline-shift="sub">cable</tspan></text><text class="value" x="438" y="102">${v("cableL", "H")}</text><text x="675" y="161">C<tspan baseline-shift="sub">cable</tspan></text><text class="value" x="675" y="185">${v("cableC", "F")}</text><text x="870" y="158">R<tspan baseline-shift="sub">in</tspan></text><text class="value" x="870" y="182">${v("loadR", "Ω")}</text><text x="875" y="104">V<tspan baseline-shift="sub">out</tspan></text></g>`;
}

function canvasSetup(canvas) {
  const rect = canvas.getBoundingClientRect();
  const dpr = Math.max(1, window.devicePixelRatio || 1);
  const width = Math.max(300, rect.width);
  const height = Math.max(240, rect.height);
  canvas.width = Math.round(width * dpr);
  canvas.height = Math.round(height * dpr);
  const ctx = canvas.getContext("2d");
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return { ctx, width, height };
}

function css(name) { return getComputedStyle(document.documentElement).getPropertyValue(name).trim(); }

function drawFrequencyPlot(canvas, current, baseline) {
  const { ctx, width: W, height: H } = canvasSetup(canvas);
  const margin = { l: W < 500 ? 52 : 62, r: 18, t: 16, b: 48 };
  const ymin = -36, ymax = 8;
  const x = (f) => margin.l + Math.log10(f / 20) / 3 * (W - margin.l - margin.r);
  const y = (dbv) => margin.t + (ymax - dbv) / (ymax - ymin) * (H - margin.t - margin.b);
  ctx.clearRect(0, 0, W, H);
  ctx.font = "12px system-ui";
  ctx.lineWidth = 1;
  ctx.strokeStyle = css("--grid");
  ctx.fillStyle = css("--muted");
  [-30, -20, -10, 0].forEach((tick) => {
    const yy = y(tick); ctx.beginPath(); ctx.moveTo(margin.l, yy); ctx.lineTo(W - margin.r, yy); ctx.stroke();
    ctx.textAlign = "right"; ctx.textBaseline = "middle"; ctx.fillText(`${tick}`, margin.l - 8, yy);
  });
  const xTicks = W < 500 ? [20, 100, 1000, 10000] : [20, 50, 100, 200, 500, 1000, 2000, 5000, 10000, 20000];
  xTicks.forEach((tick, index) => {
    const xx = x(tick); ctx.beginPath(); ctx.moveTo(xx, margin.t); ctx.lineTo(xx, H - margin.b); ctx.stroke();
    ctx.textAlign = index === 0 ? "left" : index === xTicks.length - 1 ? "right" : "center";
    ctx.textBaseline = "top"; ctx.fillText(tick >= 1000 ? `${tick / 1000}k` : tick, xx, H - margin.b + 9);
  });
  ctx.fillStyle = css("--muted");
  ctx.textAlign = "left"; ctx.fillText("Gain [dB]", 4, 2);
  ctx.textAlign = "center"; ctx.fillText("Frequency [Hz]", (margin.l + W - margin.r) / 2, H - 17);
  function curve(values, color, dashed, width) {
    ctx.beginPath();
    values.forEach((value, i) => { const px = x(frequencies[i]), py = y(Math.max(ymin, Math.min(ymax, value))); i ? ctx.lineTo(px, py) : ctx.moveTo(px, py); });
    ctx.strokeStyle = color; ctx.lineWidth = width; ctx.setLineDash(dashed ? [7, 6] : []); ctx.stroke(); ctx.setLineDash([]);
  }
  curve(baseline, css("--reference"), true, 2);
  curve(current, css("--accent"), false, 3);
}

function peakInfo(values) {
  let peakIndex = 0;
  values.forEach((v, i) => { if (v > values[peakIndex]) peakIndex = i; });
  const low = values[0];
  let cutoff = null;
  for (let i = peakIndex + 1; i < values.length; i++) {
    if (values[i] <= values[peakIndex] - 3) { cutoff = frequencies[i]; break; }
  }
  return { peakFrequency: frequencies[peakIndex], peakDb: values[peakIndex], lowDb: low, cutoff };
}

function updateGuitar() {
  $("gCircuit").innerHTML = guitarCircuitSvg();
  const current = frequencies.map((f) => dB(magnitude(guitarTransfer(guitar, f))));
  const base = frequencies.map((f) => dB(magnitude(guitarTransfer(guitarBaseline, f))));
  drawFrequencyPlot($("gPlot"), current, base);
  const info = peakInfo(current);
  $("gSummary").textContent = `Peak ${Math.round(info.peakFrequency).toLocaleString()} Hz / ${info.peakDb.toFixed(1)} dB`;
  const ideal = 1 / (2 * Math.PI * Math.sqrt(guitar.pickupL * (guitar.cableC + guitar.ampInputC)));
  $("gExplain").textContent = `Lと対地容量だけから見積もる無損失共振は約${Math.round(ideal).toLocaleString()} Hz。実際のピークは、DCR・Volume・Tone・アンプ入力がQと周波数を変えるため一致しません。`;
}

function updateLine() {
  $("lCircuit").innerHTML = lineCircuitSvg();
  const current = frequencies.map((f) => dB(magnitude(lineTransfer(line, f))));
  const base = frequencies.map((f) => dB(magnitude(lineTransfer(lineBaseline, f))));
  drawFrequencyPlot($("lPlot"), current, base);
  const info = peakInfo(current);
  const dcGain = line.loadR / (line.sourceR + line.cableR + line.loadR);
  const divisionDb = dB(dcGain);
  $("lSummary").textContent = info.cutoff ? `−3 dB帯域 ≈ ${Math.round(info.cutoff).toLocaleString()} Hz` : "20 kHz内に追加の−3 dB点なし";
  $("lExplain").textContent = `低周波でも抵抗分圧により ${divisionDb.toFixed(2)} dB。出力抵抗とケーブル容量が作る極が可聴帯域へ入ると、高域減衰が加わります。`;
}

function applyGuitarPreset(name) {
  Object.assign(guitar, guitarPresets[name]);
  guitarBaseline = { ...guitar };
  refreshControls($("gControls"), guitarDefs, guitar);
  updateGuitar();
}

function applyLinePreset(name) {
  Object.assign(line, linePresets[name]);
  lineBaseline = { ...line };
  refreshControls($("lControls"), lineDefs, line);
  updateLine();
}

function switchTab(tab) {
  ["guitar", "line"].forEach((name) => {
    const active = name === tab;
    $(`tab-${name}`).classList.toggle("is-active", active);
    $(`tab-${name}`).setAttribute("aria-selected", String(active));
    $(`panel-${name}`).hidden = !active;
  });
  requestAnimationFrame(() => { if (tab === "guitar") updateGuitar(); if (tab === "line") updateLine(); });
}

createControls($("gControls"), guitarDefs, guitar, updateGuitar);
createControls($("lControls"), lineDefs, line, updateLine);
$("gPreset").addEventListener("change", (e) => applyGuitarPreset(e.target.value));
$("lPreset").addEventListener("change", (e) => applyLinePreset(e.target.value));
$("gReset").addEventListener("click", () => applyGuitarPreset($("gPreset").value));
$("lReset").addEventListener("click", () => applyLinePreset($("lPreset").value));
["guitar", "line"].forEach((name) => $(`tab-${name}`).addEventListener("click", () => switchTab(name)));
$("themeButton").addEventListener("click", () => {
  const dark = document.documentElement.dataset.theme === "dark";
  document.documentElement.dataset.theme = dark ? "light" : "dark";
  updateGuitar(); updateLine();
});

const observer = new ResizeObserver(() => {
  clearTimeout(observer.timer);
  observer.timer = setTimeout(() => { updateGuitar(); updateLine(); }, 80);
});
observer.observe(document.body);
updateGuitar();
updateLine();
