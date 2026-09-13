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
  { key: "pickupR", label: "Pickup DCR", unit: "Ω", min: 2000, max: 15000, step: 100 },
  { key: "pickupL", label: "Pickup inductance", unit: "H", min: 0.5, max: 8, step: 0.1 },
  { key: "pickupC", label: "Pickup self C", unit: "F", min: 15e-12, max: 300e-12, step: 5e-12 },
  { key: "pickupLossR", label: "Pickup loss R", unit: "Ω", min: 300000, max: 3000000, step: 50000 },
  { key: "volumeR", label: "Volume pot value", unit: "Ω", min: 100000, max: 1000000, step: 10000 },
  { key: "volumePosition", label: "Volume knob", unit: "knob", min: 0, max: 10, step: 0.1 },
  { key: "toneR", label: "Tone pot value", unit: "Ω", min: 100000, max: 1000000, step: 10000 },
  { key: "tonePosition", label: "Tone knob", unit: "knob", min: 0, max: 10, step: 0.1 },
  { key: "toneC", label: "Tone capacitor", unit: "F", min: 10e-9, max: 100e-9, step: 1e-9 },
  { key: "cableLength", label: "Cable length", unit: "m", min: 0.5, max: 20, step: 0.5 },
  { key: "cableCapPerM", label: "Cable capacitance", unit: "F/m", min: 50e-12, max: 200e-12, step: 5e-12 },
  { key: "ampInputR", label: "Amp input R", unit: "Ω", min: 50000, max: 2000000, step: 10000 },
  { key: "ampSeriesR", label: "Grid stopper R", unit: "Ω", min: 0, max: 100000, step: 1000 },
  { key: "ampInputC", label: "Effective input C", unit: "F", min: 10e-12, max: 500e-12, step: 5e-12 }
];

const lineDefs = [
  { key: "sourceR", label: "Source Rout", unit: "Ω", min: 10, max: 200000, step: 10, scale: "log" },
  { key: "loadR", label: "Load Rin", unit: "Ω", min: 100, max: 2000000, step: 100, scale: "log" },
  { key: "cableLength", label: "Cable length", unit: "m", min: 0.5, max: 20, step: 0.5 },
  { key: "cableResPerM", label: "Cable R / m", unit: "Ω/m", min: 0, max: 1, step: 0.01 },
  { key: "cableIndPerM", label: "Cable L / m", unit: "H/m", min: 0, max: 2e-6, step: 0.05e-6 },
  { key: "cableCapPerM", label: "Cable C / m", unit: "F/m", min: 50e-12, max: 200e-12, step: 5e-12 }
];

const guitarPresets = {
  "strat-general": { pickupR: 6000, pickupL: 2.5, pickupC: 100e-12, pickupLossR: 1e6, volumeR: 250000, volumePosition: 10, toneR: 250000, tonePosition: 10, toneC: 47e-9, cableLength: 3, cableCapPerM: 100e-12, ampSeriesR: 34000, ampInputR: 1e6, ampInputC: 100e-12 },
  "fender-57-62": { pickupR: 5400, pickupL: 2.1, pickupC: 100e-12, pickupLossR: 1e6, volumeR: 250000, volumePosition: 10, toneR: 250000, tonePosition: 10, toneC: 47e-9, cableLength: 3, cableCapPerM: 100e-12, ampSeriesR: 34000, ampInputR: 1e6, ampInputC: 100e-12 },
  "paf-general": { pickupR: 7500, pickupL: 5, pickupC: 100e-12, pickupLossR: 1e6, volumeR: 500000, volumePosition: 10, toneR: 500000, tonePosition: 10, toneC: 22e-9, cableLength: 3, cableCapPerM: 100e-12, ampSeriesR: 68000, ampInputR: 1e6, ampInputC: 100e-12 }
};

const guitarPresetNotes = {
  "strat-general": "一般的なStratタイプの例示値です。特定製品の完全な再現ではありません。",
  "fender-57-62": "DCR 5.4 kΩ・L 2.1 HのみFender公称値。その他は例示値です。",
  "paf-general": "一般的なPAFタイプの例示値です。特定製品の完全な再現ではありません。"
};

const linePresets = {
  "low-high": { sourceR: 100, loadR: 100000, cableLength: 3, cableResPerM: 0.1, cableIndPerM: 0.5e-6, cableCapPerM: 100e-12 },
  "high-low": { sourceR: 100000, loadR: 10000, cableLength: 3, cableResPerM: 0.1, cableIndPerM: 0.5e-6, cableCapPerM: 100e-12 },
  guitar: { sourceR: 10000, loadR: 1e6, cableLength: 3, cableResPerM: 0.1, cableIndPerM: 0.5e-6, cableCapPerM: 100e-12 }
};

let guitar = { ...guitarPresets["strat-general"] };
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
  if (unit === "F/m") return `${formatValue(value, "F")}/m`;
  if (unit === "H/m") return `${formatValue(value, "H")}/m`;
  if (unit === "Ω/m") return `${formatValue(value, "Ω")}/m`;
  if (unit === "m") return `${trim(value)} m`;
  if (unit === "knob") return `${Number(value).toFixed(1)} / 10`;
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
  const audioTaper = (position) => position <= 0 ? 0 : Math.pow(10, (position - 10) / 5);
  const volumeFraction = audioTaper(params.volumePosition);
  if (volumeFraction === 0) return complex(0, 0);
  const volumeBottom = params.volumeR * volumeFraction;
  const volumeTop = params.volumeR - volumeBottom;
  const toneResistance = params.toneR * audioTaper(params.tonePosition);
  const tone = add(complex(toneResistance, 0), complex(0, -1 / (w * params.toneC)));
  const pickupSelfC = complex(0, -1 / (w * params.pickupC));
  const cableC = params.cableLength * params.cableCapPerM;
  const cable = complex(0, -1 / (w * cableC));
  const inputC = complex(0, -1 / (w * params.ampInputC));
  const gridBranch = add(complex(params.ampSeriesR, 0), inputC);
  const wiperLoad = parallel(complex(volumeBottom, 0), cable, complex(params.ampInputR, 0), gridBranch);
  const pickupLoad = parallel(pickupSelfC, complex(params.pickupLossR, 0), tone, add(complex(volumeTop, 0), wiperLoad));
  const pickupHotV = div(pickupLoad, add(source, pickupLoad));
  const wiperV = mul(pickupHotV, div(wiperLoad, add(complex(volumeTop, 0), wiperLoad)));
  return mul(wiperV, div(inputC, gridBranch));
}

function lineTotals(params) {
  return {
    cableR: params.cableLength * params.cableResPerM,
    cableL: params.cableLength * params.cableIndPerM,
    cableC: params.cableLength * params.cableCapPerM
  };
}

function lineTransfer(params, f) {
  const w = 2 * Math.PI * f;
  const cable = lineTotals(params);
  const load = parallel(complex(params.loadR, 0), complex(0, -1 / (w * cable.cableC)));
  const series = complex(params.sourceR + cable.cableR, w * cable.cableL);
  return div(load, add(series, load));
}

function guitarCircuitSvg() {
  const v = (key, unit) => formatValue(guitar[key], unit);
  const cableC = guitar.cableLength * guitar.cableCapPerM;
  return `
  <g class="group-label"><text x="55" y="28">PICKUP</text><text x="515" y="28">GUITAR CONTROLS</text><text x="755" y="28">CABLE</text><text x="900" y="28">AMPLIFIER INPUT</text></g>
  <g class="wire"><line x1="45" y1="105" x2="90" y2="105"/><line x1="45" y1="105" x2="45" y2="300"/><line x1="45" y1="300" x2="1130" y2="300"/><line x1="180" y1="105" x2="215" y2="105"/><line x1="300" y1="105" x2="665" y2="105"/><line x1="665" y1="105" x2="665" y2="180"/><line x1="690" y1="180" x2="930" y2="180"/></g>
  <g class="component pickup-component"><circle cx="90" cy="202" r="23"/><path d="M73 202 q8 -16 17 0 q8 16 17 0"/><path d="M90 105 q9 -26 18 0 q9 26 18 0 q9 -26 18 0 q9 26 18 0 q9 -26 18 0"/><path d="M215 105 l11 -15 13 30 13 -30 13 30 13 -30 22 15"/></g>
  <g class="wire"><line x1="90" y1="105" x2="90" y2="179"/><line x1="90" y1="225" x2="90" y2="300"/><line x1="355" y1="105" x2="355" y2="150"/><line x1="355" y1="165" x2="355" y2="300"/><line x1="435" y1="105" x2="435" y2="133"/><line x1="435" y1="210" x2="435" y2="300"/><line x1="535" y1="105" x2="535" y2="132"/><line x1="535" y1="210" x2="535" y2="232"/><line x1="535" y1="247" x2="535" y2="300"/></g>
  <g class="component pickup-component"><path d="M338 150 h34 m-34 15 h34"/><path d="M435 133 l-12 10 24 13 -24 13 24 13 -24 13 12 15"/></g>
  <g class="component control-component"><path d="M535 132 l-12 10 24 13 -24 13 24 13 -24 13 12 16"/><path d="M518 232 h34 m-34 15 h34"/><path d="M665 105 l-12 12 24 16 -24 16 24 16 -12 15"/><path d="M690 180 l-27 18 m0 0 8 -17 m-8 17 18 -2"/></g>
  <g class="wire"><line x1="665" y1="210" x2="665" y2="300"/><line x1="790" y1="180" x2="790" y2="220"/><line x1="790" y1="235" x2="790" y2="300"/><line x1="885" y1="180" x2="885" y2="205"/><line x1="885" y1="280" x2="885" y2="300"/><line x1="1030" y1="180" x2="1065" y2="180"/><line x1="1065" y1="180" x2="1065" y2="220"/><line x1="1065" y1="235" x2="1065" y2="300"/></g>
  <g class="component control-component"><path d="M665 180 l-12 10 24 10 -12 10"/></g><g class="component cable-component"><path d="M773 220 h34 m-34 15 h34"/></g><g class="component amp-component"><path d="M885 205 l-12 10 24 13 -24 13 24 13 -12 16"/><path d="M930 180 l10 -14 13 28 13 -28 13 28 13 -28 38 14"/><path d="M1048 220 h34 m-34 15 h34"/></g>
  <g class="node"><circle cx="300" cy="105" r="5"/><circle cx="690" cy="180" r="5"/><circle cx="885" cy="180" r="5"/><circle cx="1065" cy="180" r="5"/></g>
  <g><text x="52" y="335">internal EMF</text><text x="115" y="66">L<tspan baseline-shift="sub">p</tspan></text><text class="value" x="105" y="87">${v("pickupL", "H")}</text><text x="230" y="66">DCR</text><text class="value" x="220" y="87">${v("pickupR", "Ω")}</text><text x="315" y="202">C<tspan baseline-shift="sub">p</tspan> ${v("pickupC", "F")}</text><text x="392" y="235">R<tspan baseline-shift="sub">loss</tspan></text><text class="value" x="392" y="257">${v("pickupLossR", "Ω")}</text><text x="480" y="218">Tone ${v("toneR", "Ω")}</text><text class="value" x="477" y="272">${v("tonePosition", "knob")} / ${v("toneC", "F")}</text><text x="595" y="225">Volume ${v("volumeR", "Ω")}</text><text class="value" x="602" y="247">${v("volumePosition", "knob")}</text><text x="735" y="212">Cable C</text><text class="value" x="730" y="260">${formatValue(cableC, "F")}</text><text x="845" y="238">R<tspan baseline-shift="sub">in</tspan></text><text class="value" x="838" y="261">${v("ampInputR", "Ω")}</text><text x="944" y="143">Grid stopper</text><text class="value" x="945" y="162">${v("ampSeriesR", "Ω")}</text><text x="1085" y="224">C<tspan baseline-shift="sub">in</tspan></text><text class="value" x="1085" y="247">${v("ampInputC", "F")}</text><text x="1080" y="166">V<tspan baseline-shift="sub">grid</tspan></text></g>`;
}

function lineCircuitSvg() {
  const v = (key, unit) => formatValue(line[key], unit);
  const totals = lineTotals(line);
  return `
  <g class="group-label"><text x="55" y="30">SOURCE</text><text x="310" y="30">CABLE</text><text x="760" y="30">LOAD</text></g>
  <g class="wire"><line x1="55" y1="120" x2="100" y2="120"/><line x1="100" y1="222" x2="900" y2="222"/><line x1="55" y1="120" x2="55" y2="222"/><line x1="100" y1="120" x2="135" y2="120"/><line x1="225" y1="120" x2="280" y2="120"/><line x1="370" y1="120" x2="415" y2="120"/><line x1="515" y1="120" x2="850" y2="120"/></g>
  <g class="component pickup-component"><circle cx="100" cy="171" r="22"/><path d="M84 171 q8 -15 16 0 q8 15 16 0"/><path d="M135 120 l11 -15 13 30 13 -30 13 30 13 -30 27 15"/></g>
  <g class="wire"><line x1="100" y1="120" x2="100" y2="149"/><line x1="100" y1="193" x2="100" y2="222"/></g>
  <g class="component cable-component"><path d="M280 120 l11 -15 13 30 13 -30 13 30 13 -30 27 15"/><path d="M415 120 q10 -28 20 0 q10 28 20 0 q10 -28 20 0 q10 28 20 0 q10 -28 20 0"/><path d="M650 120 v35 m-17 0 h34 m-34 13 h34 m-17 0 v54"/></g><g class="component amp-component"><path d="M850 120 v24 l-13 9 26 13 -26 13 26 13 -13 9 v21"/></g>
  <g class="node"><circle cx="650" cy="120" r="5"/><circle cx="850" cy="120" r="5"/></g>
  <g><text x="65" y="260">V<tspan baseline-shift="sub">source</tspan></text><text x="156" y="82">R<tspan baseline-shift="sub">out</tspan></text><text class="value" x="150" y="102">${v("sourceR", "Ω")}</text><text x="300" y="82">R<tspan baseline-shift="sub">cable</tspan></text><text class="value" x="298" y="102">${formatValue(totals.cableR, "Ω")}</text><text x="448" y="82">L<tspan baseline-shift="sub">cable</tspan></text><text class="value" x="438" y="102">${formatValue(totals.cableL, "H")}</text><text x="675" y="161">C<tspan baseline-shift="sub">cable</tspan></text><text class="value" x="675" y="185">${formatValue(totals.cableC, "F")}</text><text x="870" y="158">R<tspan baseline-shift="sub">in</tspan></text><text class="value" x="870" y="182">${v("loadR", "Ω")}</text><text x="875" y="104">V<tspan baseline-shift="sub">out</tspan></text><text x="330" y="260">長さ ${v("cableLength", "m")} × 単位長定数</text></g>`;
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
  const totalCap = guitar.pickupC + guitar.cableLength * guitar.cableCapPerM + guitar.ampInputC;
  const ideal = 1 / (2 * Math.PI * Math.sqrt(guitar.pickupL * totalCap));
  $("gExplain").textContent = `これは弦・ボディ・スピーカーを含まない電気的伝達特性 Vgrid / 内部EMF です。Lと対地容量から見積もる無損失共振は約${Math.round(ideal).toLocaleString()} Hz。DCR・損失抵抗・ポット位置・アンプ入力が実際のピークを変えます。`;
}

function updateLine() {
  $("lCircuit").innerHTML = lineCircuitSvg();
  const current = frequencies.map((f) => dB(magnitude(lineTransfer(line, f))));
  const base = frequencies.map((f) => dB(magnitude(lineTransfer(lineBaseline, f))));
  drawFrequencyPlot($("lPlot"), current, base);
  const info = peakInfo(current);
  const totals = lineTotals(line);
  const dcGain = line.loadR / (line.sourceR + totals.cableR + line.loadR);
  const divisionDb = dB(dcGain);
  $("lSummary").textContent = info.cutoff ? `−3 dB帯域 ≈ ${Math.round(info.cutoff).toLocaleString()} Hz` : "20 kHz内に追加の−3 dB点なし";
  $("lExplain").textContent = `${formatValue(line.cableLength, "m")}の合計は R ${formatValue(totals.cableR, "Ω")} / L ${formatValue(totals.cableL, "H")} / C ${formatValue(totals.cableC, "F")}。低周波の抵抗分圧は ${divisionDb.toFixed(2)} dBです。`;
}

function applyGuitarPreset(name) {
  Object.assign(guitar, guitarPresets[name]);
  guitarBaseline = { ...guitar };
  refreshControls($("gControls"), guitarDefs, guitar);
  $("gPresetNote").textContent = guitarPresetNotes[name];
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
$("gPresetNote").textContent = guitarPresetNotes[$("gPreset").value];
