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

const E24 = [1, 1.1, 1.2, 1.3, 1.5, 1.6, 1.8, 2, 2.2, 2.4, 2.7, 3, 3.3, 3.6, 3.9, 4.3, 4.7, 5.1, 5.6, 6.2, 6.8, 7.5, 8.2, 9.1];

function preferredValues(min, max, step, extras = []) {
  const smallest = min > 0 ? min : step;
  const values = min === 0 ? [0] : [];
  const firstDecade = Math.floor(Math.log10(smallest));
  const lastDecade = Math.ceil(Math.log10(max));
  for (let decade = firstDecade; decade <= lastDecade; decade += 1) {
    const multiplier = Math.pow(10, decade);
    E24.forEach((base) => {
      const value = Number((base * multiplier).toPrecision(12));
      if (value >= min && value <= max) values.push(value);
    });
  }
  extras.forEach((value) => {
    if (value >= min && value <= max) values.push(Number(value.toPrecision(12)));
  });
  return [...new Set(values)].sort((a, b) => a - b);
}

function preferredDef(def, extras = []) {
  return { ...def, values: preferredValues(def.min, def.max, def.step, extras) };
}

const guitarDefs = [
  preferredDef({ key: "pickupR", label: "Pickup DCR", unit: "Ω", min: 2000, max: 15000, step: 100 }, [5400, 6000, 7500]),
  preferredDef({ key: "pickupL", label: "Pickup inductance", unit: "H", min: 0.5, max: 8, step: 0.1 }, [2.1, 2.5, 5]),
  preferredDef({ key: "pickupC", label: "Pickup self C", unit: "F", min: 15e-12, max: 300e-12, step: 5e-12 }, [100e-12]),
  preferredDef({ key: "pickupLossR", label: "Resonance damping R", unit: "Ω", min: 300000, max: 3000000, step: 50000 }, [1e6]),
  preferredDef({ key: "volumeR", label: "Volume pot value", unit: "Ω", min: 100000, max: 1000000, step: 10000 }, [250000, 500000]),
  { key: "volumePosition", label: "Volume knob", unit: "knob", min: 0, max: 10, step: 0.1 },
  preferredDef({ key: "toneR", label: "Tone pot value", unit: "Ω", min: 100000, max: 1000000, step: 10000 }, [250000, 500000]),
  { key: "tonePosition", label: "Tone knob", unit: "knob", min: 0, max: 10, step: 0.1 },
  preferredDef({ key: "toneC", label: "Tone capacitor", unit: "F", min: 10e-9, max: 100e-9, step: 1e-9 }, [22e-9, 47e-9]),
  { key: "cableLength", label: "Cable length", unit: "m", min: 0.5, max: 20, step: 0.5 },
  preferredDef({ key: "cableCapPerM", label: "Cable capacitance", unit: "F/m", min: 50e-12, max: 200e-12, step: 5e-12 }, [70e-12, 100e-12, 160e-12]),
  preferredDef({ key: "ampInputR", label: "Amp input R", unit: "Ω", min: 50000, max: 2000000, step: 10000 }, [1e6]),
  preferredDef({ key: "ampSeriesR", label: "Grid stopper R", unit: "Ω", min: 0, max: 100000, step: 1000 }, [0, 22000, 34000, 68000]),
  preferredDef({ key: "ampInputC", label: "Effective input C", unit: "F", min: 10e-12, max: 500e-12, step: 5e-12 }, [100e-12])
];

const lineDefs = [
  preferredDef({ key: "sourceR", label: "Source Rout", unit: "Ω", min: 10, max: 200000, step: 10 }, [100, 10000, 100000]),
  preferredDef({ key: "loadR", label: "Load Rin", unit: "Ω", min: 100, max: 2000000, step: 100 }, [10000, 100000, 1e6]),
  { key: "cableLength", label: "Cable length", unit: "m", min: 0.5, max: 20, step: 0.5 },
  preferredDef({ key: "cableResPerM", label: "Cable R / m", unit: "Ω/m", min: 0, max: 1, step: 0.01 }, [0, 0.04, 0.043, 0.1]),
  preferredDef({ key: "cableIndPerM", label: "Cable L / m", unit: "H/m", min: 0, max: 2e-6, step: 0.05e-6 }, [0, 0.5e-6]),
  preferredDef({ key: "cableCapPerM", label: "Cable C / m", unit: "F/m", min: 50e-12, max: 200e-12, step: 5e-12 }, [70e-12, 100e-12, 160e-12])
];

const effectorDefs = [
  preferredDef({ key: "sourceR", label: "Output Rout", unit: "Ω", min: 10, max: 100000, step: 10 }, [1000, 10000, 100000]),
  preferredDef({ key: "outputC", label: "Output coupling Cout", unit: "F", min: 10e-9, max: 10e-6, step: 10e-9 }, [100e-9, 1e-6]),
  preferredDef({ key: "pullDownR", label: "Output pull-down R", unit: "Ω", min: 10000, max: 2000000, step: 1000 }, [100000, 1e6]),
  preferredDef({ key: "loadR", label: "Next input Rin", unit: "Ω", min: 10000, max: 2000000, step: 1000 }, [10000, 1e6]),
  { key: "cableLength", label: "Cable length", unit: "m", min: 0.5, max: 20, step: 0.5 },
  preferredDef({ key: "cableResPerM", label: "Cable R / m", unit: "Ω/m", min: 0, max: 1, step: 0.01 }, [0, 0.04, 0.043, 0.1]),
  preferredDef({ key: "cableIndPerM", label: "Cable L / m", unit: "H/m", min: 0, max: 2e-6, step: 0.05e-6 }, [0, 0.5e-6]),
  preferredDef({ key: "cableCapPerM", label: "Cable C / m", unit: "F/m", min: 50e-12, max: 200e-12, step: 5e-12 }, [70e-12, 100e-12, 160e-12])
];

const guitarPresets = {
  "strat-general": { pickupR: 6000, pickupL: 2.5, pickupC: 100e-12, pickupLossR: 1e6, volumeR: 250000, volumePosition: 10, toneR: 250000, tonePosition: 10, toneC: 47e-9, cableLength: 3, cableCapPerM: 100e-12, ampSeriesR: 34000, ampInputR: 1e6, ampInputC: 100e-12 },
  "fender-57-62": { pickupR: 5400, pickupL: 2.1, pickupC: 100e-12, pickupLossR: 1e6, volumeR: 250000, volumePosition: 10, toneR: 250000, tonePosition: 10, toneC: 47e-9, cableLength: 3, cableCapPerM: 100e-12, ampSeriesR: 34000, ampInputR: 1e6, ampInputC: 100e-12 },
  "paf-general": { pickupR: 7500, pickupL: 5, pickupC: 100e-12, pickupLossR: 1e6, volumeR: 500000, volumePosition: 10, toneR: 500000, tonePosition: 10, toneC: 22e-9, cableLength: 3, cableCapPerM: 100e-12, ampSeriesR: 68000, ampInputR: 1e6, ampInputC: 100e-12 }
};

const guitarPresetNotes = {
  "strat-general": "Stratocaster系のシングルコイルPickupを1個選んだ状態の例示値です。",
  "fender-57-62": "Pickup 1個を選んだ状態。DCR 5.4 kΩ・L 2.1 HのみFender公称値です。",
  "paf-general": "ハムバッカーPickupを1個選んだ状態の例示値です。特定製品の完全な再現ではありません。"
};

const guitarCablePresets = {
  "low-cap": { cableCapPerM: 70e-12 },
  standard: { cableCapPerM: 100e-12 },
  gs6: { cableCapPerM: 160e-12 }
};

const lineCablePresets = {
  "low-cap": { cableResPerM: 0.04, cableIndPerM: 0.5e-6, cableCapPerM: 70e-12 },
  standard: { cableResPerM: 0.1, cableIndPerM: 0.5e-6, cableCapPerM: 100e-12 },
  gs6: { cableResPerM: 0.043, cableIndPerM: 0.5e-6, cableCapPerM: 160e-12 }
};

const linePresets = {
  "low-high": { sourceR: 100, loadR: 100000, cableLength: 3, cableResPerM: 0.1, cableIndPerM: 0.5e-6, cableCapPerM: 100e-12 },
  "high-low": { sourceR: 100000, loadR: 10000, cableLength: 3, cableResPerM: 0.1, cableIndPerM: 0.5e-6, cableCapPerM: 100e-12 },
  guitar: { sourceR: 10000, loadR: 1e6, cableLength: 3, cableResPerM: 0.1, cableIndPerM: 0.5e-6, cableCapPerM: 100e-12 }
};

const effectorPresets = {
  buffered: { sourceR: 1000, outputC: 1e-6, pullDownR: 100000, loadR: 1e6, cableLength: 3, cableResPerM: 0.1, cableIndPerM: 0.5e-6, cableCapPerM: 100e-12 },
  "small-cout": { sourceR: 1000, outputC: 100e-9, pullDownR: 100000, loadR: 1e6, cableLength: 3, cableResPerM: 0.1, cableIndPerM: 0.5e-6, cableCapPerM: 100e-12 },
  "high-low": { sourceR: 10000, outputC: 100e-9, pullDownR: 100000, loadR: 10000, cableLength: 3, cableResPerM: 0.1, cableIndPerM: 0.5e-6, cableCapPerM: 100e-12 }
};

const effectorPresetNotes = {
  buffered: "低いRout、1 µFのCout、100 kΩの出力対地抵抗から次段1 MΩを駆動する教材例です。",
  "small-cout": "Coutを100 nFにして、対地抵抗・次段入力抵抗との低域ハイパスを見やすくした例です。",
  "high-low": "高めのRoutと低いRinが同時に効く、負荷条件の厳しい比較例です。"
};

let guitar = { ...guitarPresets["strat-general"] };
let line = { ...linePresets["low-high"] };
let effector = { ...effectorPresets.buffered };
let guitarBaseline = { ...guitar };
let lineBaseline = { ...line };
let effectorBaseline = { ...effector };

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

function nearestPreferredIndex(def, value) {
  if (!def.values?.length) return -1;
  let best = 0;
  let bestDistance = Math.abs(def.values[0] - value);
  for (let i = 1; i < def.values.length; i += 1) {
    const distance = Math.abs(def.values[i] - value);
    if (distance < bestDistance) {
      best = i;
      bestDistance = distance;
    }
  }
  return best;
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
    if (def.values) {
      input.min = 0;
      input.max = def.values.length - 1;
      input.step = 1;
      input.value = nearestPreferredIndex(def, state[def.key]);
    } else if (def.scale === "log") {
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
      state[def.key] = def.values ? def.values[Number(input.value)] : def.scale === "log" ? Math.pow(10, Number(input.value)) : Number(input.value);
      out.textContent = formatValue(state[def.key], def.unit);
      onChange(def.key);
    });
    label.append(top, input);
    host.append(label);
  });
}

function refreshControls(host, defs, state) {
  defs.forEach((def) => {
    const input = $(`${host.id}-${def.key}`);
    input.value = def.values ? nearestPreferredIndex(def, state[def.key]) : def.scale === "log" ? Math.log10(state[def.key]) : state[def.key];
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

function effectorTransfer(params, f) {
  const w = 2 * Math.PI * f;
  const cable = lineTotals(params);
  const load = parallel(complex(params.loadR, 0), complex(0, -1 / (w * cable.cableC)));
  const cablePath = add(complex(cable.cableR, w * cable.cableL), load);
  const outputNodeLoad = parallel(complex(params.pullDownR, 0), cablePath);
  const sourcePath = add(complex(params.sourceR, 0), complex(0, -1 / (w * params.outputC)));
  const outputNodeV = div(outputNodeLoad, add(sourcePath, outputNodeLoad));
  return mul(outputNodeV, div(load, cablePath));
}

function horizontalInductorPath(x1, x2, y, turns) {
  if (turns < 1) return `M${x1} ${y}H${x2}`;
  const turnWidth = (x2 - x1) / turns;
  let path = `M${x1} ${y}`;
  for (let i = 0; i < turns; i += 1) {
    path += `q${turnWidth / 4} -28 ${turnWidth / 2} 0q${turnWidth / 4} 28 ${turnWidth / 2} 0`;
  }
  return path;
}

function interactiveValue(model, key, text, x, y, label) {
  return `<text class="value interactive-value" x="${x}" y="${y}" data-model="${model}" data-key="${key}" role="button" tabindex="0" aria-label="${label} ${text}。上下ドラッグまたは矢印キーで変更。クリックで数値入力">${text} ↕</text>`;
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
  <g><text x="52" y="335">internal EMF</text><text x="115" y="66">L<tspan font-size="11" dy="3">p</tspan></text>${interactiveValue("guitar", "pickupL", v("pickupL", "H"), 105, 90, "Pickup inductance")}<text x="230" y="66">DCR</text>${interactiveValue("guitar", "pickupR", v("pickupR", "Ω"), 220, 89, "Pickup DCR")}<text x="315" y="202">C<tspan font-size="11" dy="3">p</tspan></text>${interactiveValue("guitar", "pickupC", v("pickupC", "F"), 315, 226, "Pickup self capacitance")}<text x="382" y="235">R<tspan font-size="11" dy="3">damp(eq)</tspan></text>${interactiveValue("guitar", "pickupLossR", v("pickupLossR", "Ω"), 392, 261, "Resonance damping resistance")}<text x="477" y="218">Tone pot</text>${interactiveValue("guitar", "toneR", v("toneR", "Ω"), 477, 240, "Tone pot value")}${interactiveValue("guitar", "tonePosition", v("tonePosition", "knob"), 477, 263, "Tone knob")}${interactiveValue("guitar", "toneC", v("toneC", "F"), 557, 286, "Tone capacitor")}<text x="595" y="225">Volume pot</text>${interactiveValue("guitar", "volumeR", v("volumeR", "Ω"), 602, 248, "Volume pot value")}${interactiveValue("guitar", "volumePosition", v("volumePosition", "knob"), 602, 272, "Volume knob")}<text x="730" y="212">Cable</text>${interactiveValue("guitar", "cableLength", v("cableLength", "m"), 730, 238, "Cable length")}<text class="derived-value" x="730" y="264">Total C ${formatValue(cableC, "F")}</text><text x="845" y="238">R<tspan font-size="11" dy="3">in</tspan></text>${interactiveValue("guitar", "ampInputR", v("ampInputR", "Ω"), 838, 264, "Amplifier input resistance")}<text x="944" y="143">Grid stopper</text>${interactiveValue("guitar", "ampSeriesR", v("ampSeriesR", "Ω"), 945, 166, "Grid stopper resistance")}<text x="1085" y="224">C<tspan font-size="11" dy="3">in</tspan></text>${interactiveValue("guitar", "ampInputC", v("ampInputC", "F"), 1085, 250, "Effective input capacitance")}<text x="1080" y="166">V<tspan font-size="11" dy="3">grid</tspan></text></g>`;
}

function lineCircuitSvg() {
  const v = (key, unit) => formatValue(line[key], unit);
  const totals = lineTotals(line);
  const maxCableL = 20 * 2e-6;
  const coilTurns = totals.cableL <= 0 ? 0 : Math.round(3 + 6 * Math.log10(1 + totals.cableL / 0.5e-6) / Math.log10(1 + maxCableL / 0.5e-6));
  const coilPath = horizontalInductorPath(415, 515, 120, coilTurns);
  return `
  <g class="group-label"><text x="55" y="30">SOURCE</text><text x="310" y="30">CABLE</text><text x="760" y="30">LOAD</text></g>
  <g class="wire"><line x1="55" y1="120" x2="100" y2="120"/><line x1="100" y1="222" x2="900" y2="222"/><line x1="55" y1="120" x2="55" y2="222"/><line x1="100" y1="120" x2="135" y2="120"/><line x1="225" y1="120" x2="280" y2="120"/><line x1="370" y1="120" x2="415" y2="120"/><line x1="515" y1="120" x2="850" y2="120"/></g>
  <g class="component pickup-component"><circle cx="100" cy="171" r="22"/><path d="M84 171 q8 -15 16 0 q8 15 16 0"/><path d="M135 120 l11 -15 13 30 13 -30 13 30 13 -30 27 15"/></g>
  <g class="wire"><line x1="100" y1="120" x2="100" y2="149"/><line x1="100" y1="193" x2="100" y2="222"/></g>
  <g class="component cable-component"><path d="M280 120 l11 -15 13 30 13 -30 13 30 13 -30 27 15"/><path d="${coilPath}"/><path d="M650 120 v35 m-17 0 h34 m-34 13 h34 m-17 0 v54"/></g><g class="component amp-component"><path d="M850 120 v24 l-13 9 26 13 -26 13 26 13 -13 9 v21"/></g>
  <g class="node"><circle cx="650" cy="120" r="5"/><circle cx="850" cy="120" r="5"/></g>
  <g><text x="65" y="260">V<tspan font-size="11" dy="3">source</tspan></text><text x="156" y="78">R<tspan font-size="11" dy="3">out</tspan></text>${interactiveValue("line", "sourceR", v("sourceR", "Ω"), 150, 103, "Source output resistance")}<text x="300" y="78">R<tspan font-size="11" dy="3">cable</tspan></text><text class="derived-value" x="298" y="103">${formatValue(totals.cableR, "Ω")}</text><text x="448" y="71">L<tspan font-size="11" dy="3">cable</tspan></text><text class="derived-value" x="438" y="96">${formatValue(totals.cableL, "H")}</text><text class="derived-value" x="438" y="160">表示 ${coilTurns} loops</text><text x="675" y="157">C<tspan font-size="11" dy="3">cable</tspan></text><text class="derived-value" x="675" y="183">${formatValue(totals.cableC, "F")}</text><text x="870" y="154">R<tspan font-size="11" dy="3">in</tspan></text>${interactiveValue("line", "loadR", v("loadR", "Ω"), 870, 180, "Load input resistance")}<text x="875" y="104">V<tspan font-size="11" dy="3">out</tspan></text><text x="330" y="245">Cable length</text>${interactiveValue("line", "cableLength", v("cableLength", "m"), 435, 245, "Cable length")}<text class="derived-value" x="330" y="270">合計値は長さ × 単位長定数</text></g>`;
}

function effectorCircuitSvg() {
  const v = (key, unit) => formatValue(effector[key], unit);
  const totals = lineTotals(effector);
  const maxCableL = 20 * 2e-6;
  const coilTurns = totals.cableL <= 0 ? 0 : Math.round(3 + 6 * Math.log10(1 + totals.cableL / 0.5e-6) / Math.log10(1 + maxCableL / 0.5e-6));
  const coilPath = horizontalInductorPath(650, 760, 105, coilTurns);
  return `
  <g class="group-label"><text x="45" y="28">EFFECTOR OUTPUT</text><text x="465" y="28">OUTPUT JACK</text><text x="620" y="28">CABLE</text><text x="970" y="28">NEXT INPUT</text></g>
  <g class="wire"><line x1="45" y1="105" x2="92" y2="105"/><line x1="45" y1="105" x2="45" y2="260"/><line x1="45" y1="260" x2="1125" y2="260"/><line x1="92" y1="105" x2="135" y2="105"/><line x1="225" y1="105" x2="285" y2="105"/><line x1="300" y1="105" x2="510" y2="105"/><line x1="760" y1="105" x2="1070" y2="105"/></g>
  <g class="component pickup-component"><circle cx="92" cy="182" r="22"/><path d="M76 182 q8 -15 16 0 q8 15 16 0"/><path d="M135 105 l11 -15 13 30 13 -30 13 30 13 -30 27 15"/></g>
  <g class="wire"><line x1="92" y1="105" x2="92" y2="160"/><line x1="92" y1="204" x2="92" y2="260"/><line x1="510" y1="105" x2="510" y2="135"/><line x1="510" y1="220" x2="510" y2="260"/></g>
  <g class="component control-component"><path d="M285 78v54M300 78v54"/><path d="M510 135 l-12 10 24 13 -24 13 24 13 -24 13 12 23"/></g>
  <g class="component cable-component"><path d="M510 105 h35 l11 -15 13 30 13 -30 13 30 13 -30 25 15 h17"/><path d="${coilPath}"/><path d="M855 105 v42 m-17 0 h34 m-34 14 h34 m-17 0 v99"/></g>
  <g class="component amp-component"><path d="M1020 105 v30 l-13 10 26 14 -26 14 26 14 -13 10 v63"/></g>
  <g class="node"><circle cx="510" cy="105" r="5"/><circle cx="855" cy="105" r="5"/><circle cx="1020" cy="105" r="5"/></g>
  <g><text x="50" y="292">internal signal</text><text x="155" y="63">R<tspan font-size="11" dy="3">out</tspan></text>${interactiveValue("effector", "sourceR", v("sourceR", "Ω"), 150, 87, "Effector output resistance")}<text x="270" y="51">C<tspan font-size="11" dy="3">out</tspan></text>${interactiveValue("effector", "outputC", v("outputC", "F"), 270, 87, "Output coupling capacitance")}<text x="445" y="163">R<tspan font-size="11" dy="3">pull-down</tspan></text>${interactiveValue("effector", "pullDownR", v("pullDownR", "Ω"), 437, 196, "Output pull-down resistance")}<text x="548" y="62">R<tspan font-size="11" dy="3">cable</tspan></text><text class="derived-value" x="542" y="143">${formatValue(totals.cableR, "Ω")}</text><text x="684" y="56">L<tspan font-size="11" dy="3">cable</tspan></text><text class="derived-value" x="675" y="82">${formatValue(totals.cableL, "H")} / ${coilTurns} loops</text><text x="878" y="146">C<tspan font-size="11" dy="3">cable</tspan></text><text class="derived-value" x="878" y="180">${formatValue(totals.cableC, "F")}</text><text x="1040" y="146">R<tspan font-size="11" dy="3">in</tspan></text>${interactiveValue("effector", "loadR", v("loadR", "Ω"), 1040, 180, "Next input resistance")}<text x="1040" y="89">V<tspan font-size="11" dy="3">out</tspan></text><text x="650" y="292">Cable length</text>${interactiveValue("effector", "cableLength", v("cableLength", "m"), 755, 292, "Cable length")}</g>`;
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

function updateEffector() {
  $("eCircuit").innerHTML = effectorCircuitSvg();
  const current = frequencies.map((f) => dB(magnitude(effectorTransfer(effector, f))));
  const base = frequencies.map((f) => dB(magnitude(effectorTransfer(effectorBaseline, f))));
  drawFrequencyPlot($("ePlot"), current, base);
  const totals = lineTotals(effector);
  const effectiveLoadR = 1 / (1 / effector.pullDownR + 1 / (effector.loadR + totals.cableR));
  const estimatedFc = 1 / (2 * Math.PI * effector.outputC * (effector.sourceR + effectiveLoadR));
  const midband = dB(magnitude(effectorTransfer(effector, 1000)));
  $("eSummary").textContent = `Cout低域fc概算 ${formatFrequency(estimatedFc)} / 1 kHz ${midband.toFixed(2)} dB`;
  $("eExplain").textContent = `CoutはDCを遮断し、Rout＋（Rpull-down ∥ 次段Rin）との組み合わせで低域を減衰させます。概算fcは${formatFrequency(estimatedFc)}です。高域側は主にRoutとケーブル合計C ${formatValue(totals.cableC, "F")}の組み合わせで変化します。`;
}

function formatFrequency(value) {
  if (value >= 1000) return `${trim(value / 1000)} kHz`;
  return `${trim(value)} Hz`;
}

function applyGuitarPreset(name) {
  Object.assign(guitar, guitarPresets[name]);
  guitarBaseline = { ...guitar };
  refreshControls($("gControls"), guitarDefs, guitar);
  $("gPresetNote").textContent = guitarPresetNotes[name];
  $("gCablePreset").value = "standard";
  updateGuitar();
}

function applyLinePreset(name) {
  Object.assign(line, linePresets[name]);
  lineBaseline = { ...line };
  refreshControls($("lControls"), lineDefs, line);
  $("lCablePreset").value = "standard";
  updateLine();
}

function applyEffectorPreset(name) {
  Object.assign(effector, effectorPresets[name]);
  effectorBaseline = { ...effector };
  refreshControls($("eControls"), effectorDefs, effector);
  $("ePresetNote").textContent = effectorPresetNotes[name];
  $("eCablePreset").value = "standard";
  updateEffector();
}

function applyGuitarCablePreset(name) {
  if (name === "custom") return;
  Object.assign(guitar, guitarCablePresets[name]);
  refreshControls($("gControls"), guitarDefs, guitar);
  updateGuitar();
}

function applyLineCablePreset(name) {
  if (name === "custom") return;
  Object.assign(line, lineCablePresets[name]);
  refreshControls($("lControls"), lineDefs, line);
  updateLine();
}

function applyEffectorCablePreset(name) {
  if (name === "custom") return;
  Object.assign(effector, lineCablePresets[name]);
  refreshControls($("eControls"), effectorDefs, effector);
  updateEffector();
}

const modelConfigs = {
  guitar: { state: guitar, defs: guitarDefs, controls: "gControls", circuit: "gCircuit", update: updateGuitar },
  line: { state: line, defs: lineDefs, controls: "lControls", circuit: "lCircuit", update: updateLine },
  effector: { state: effector, defs: effectorDefs, controls: "eControls", circuit: "eCircuit", update: updateEffector }
};

function defFor(model, key) {
  return modelConfigs[model].defs.find((def) => def.key === key);
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function roundedToStep(value, def) {
  if (def.values?.length) return def.values[nearestPreferredIndex(def, value)];
  if (!def.step) return clamp(value, def.min, def.max);
  const steps = Math.round((value - def.min) / def.step);
  const rounded = def.min + steps * def.step;
  return clamp(Number(rounded.toPrecision(12)), def.min, def.max);
}

function setModelValue(model, key, value, round = true) {
  const config = modelConfigs[model];
  const def = defFor(model, key);
  if (!config || !def || !Number.isFinite(value)) return;
  config.state[key] = def.values ? roundedToStep(value, def) : round ? roundedToStep(value, def) : clamp(value, def.min, def.max);
  refreshControls($(config.controls), config.defs, config.state);
  config.update();
}

function usesLogDrag(def) {
  return ["Ω", "F", "H", "Ω/m", "F/m", "H/m"].includes(def.unit);
}

function draggedValue(def, startValue, deltaY, fine) {
  if (def.values?.length) {
    const startIndex = nearestPreferredIndex(def, startValue);
    const pixelsPerStep = fine ? 45 : 15;
    const index = clamp(startIndex - Math.round(deltaY / pixelsPerStep), 0, def.values.length - 1);
    return def.values[index];
  }
  const sensitivity = fine ? 5 : 1;
  if (usesLogDrag(def)) return startValue * Math.pow(10, -deltaY / (120 * sensitivity));
  return startValue - deltaY * (def.max - def.min) / (240 * sensitivity);
}

let dragSession = null;
let dialogTarget = null;

function attachCircuitInteraction(model) {
  const svg = $(modelConfigs[model].circuit);
  svg.addEventListener("pointerdown", (event) => {
    const target = event.target.closest?.(".interactive-value");
    if (!target || target.dataset.model !== model) return;
    event.preventDefault();
    const key = target.dataset.key;
    dragSession = { model, key, pointerId: event.pointerId, startY: event.clientY, startValue: modelConfigs[model].state[key], moved: false };
    svg.setPointerCapture(event.pointerId);
  });
  svg.addEventListener("pointermove", (event) => {
    if (!dragSession || dragSession.pointerId !== event.pointerId || dragSession.model !== model) return;
    const deltaY = event.clientY - dragSession.startY;
    if (Math.abs(deltaY) >= 4) dragSession.moved = true;
    if (!dragSession.moved) return;
    event.preventDefault();
    const def = defFor(model, dragSession.key);
    setModelValue(model, dragSession.key, draggedValue(def, dragSession.startValue, deltaY, event.shiftKey));
  });
  const finishPointer = (event) => {
    if (!dragSession || dragSession.pointerId !== event.pointerId || dragSession.model !== model) return;
    const session = dragSession;
    dragSession = null;
    if (svg.hasPointerCapture(event.pointerId)) svg.releasePointerCapture(event.pointerId);
    if (!session.moved && event.type === "pointerup") openValueDialog(session.model, session.key);
  };
  svg.addEventListener("pointerup", finishPointer);
  svg.addEventListener("pointercancel", finishPointer);
  svg.addEventListener("keydown", (event) => {
    const target = event.target.closest?.(".interactive-value");
    if (!target || target.dataset.model !== model) return;
    const key = target.dataset.key;
    const def = defFor(model, key);
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openValueDialog(model, key);
      return;
    }
    if (!["ArrowUp", "ArrowDown"].includes(event.key)) return;
    event.preventDefault();
    const direction = event.key === "ArrowUp" ? 1 : -1;
    const current = modelConfigs[model].state[key];
    const value = def.values?.length
      ? def.values[clamp(nearestPreferredIndex(def, current) + direction, 0, def.values.length - 1)]
      : usesLogDrag(def) ? current * Math.pow(10, direction / (event.shiftKey ? 60 : 12)) : current + direction * def.step * (event.shiftKey ? 0.2 : 1);
    setModelValue(model, key, value, !event.shiftKey);
    requestAnimationFrame(() => document.querySelector(`.interactive-value[data-model="${model}"][data-key="${key}"]`)?.focus());
  });
}

function engineeringInput(value, unit) {
  if (unit === "F") {
    if (value >= 1e-6) return { value: value * 1e6, unit: "µF", multiplier: 1e-6 };
    if (value >= 1e-9) return { value: value * 1e9, unit: "nF", multiplier: 1e-9 };
    return { value: value * 1e12, unit: "pF", multiplier: 1e-12 };
  }
  if (unit === "H") {
    if (value < 1e-3) return { value: value * 1e6, unit: "µH", multiplier: 1e-6 };
    if (value < 1) return { value: value * 1e3, unit: "mH", multiplier: 1e-3 };
    return { value, unit: "H", multiplier: 1 };
  }
  if (unit === "Ω") {
    if (value >= 1e6) return { value: value / 1e6, unit: "MΩ", multiplier: 1e6 };
    if (value >= 1e3) return { value: value / 1e3, unit: "kΩ", multiplier: 1e3 };
    return { value, unit: "Ω", multiplier: 1 };
  }
  if (unit === "m") return { value, unit: "m", multiplier: 1 };
  if (unit === "knob") return { value, unit: "/ 10", multiplier: 1 };
  return { value, unit, multiplier: 1 };
}

function openValueDialog(model, key) {
  const def = defFor(model, key);
  const converted = engineeringInput(modelConfigs[model].state[key], def.unit);
  dialogTarget = { model, key, multiplier: converted.multiplier };
  $("valueDialogTitle").textContent = def.label;
  $("valueInput").value = Number(converted.value.toPrecision(8));
  $("valueInput").step = "any";
  $("valueUnit").textContent = converted.unit;
  const min = engineeringInput(def.min, def.unit);
  const max = engineeringInput(def.max, def.unit);
  $("valueRange").textContent = def.values
    ? `設定範囲：${formatValue(def.min, def.unit)} ～ ${formatValue(def.max, def.unit)}（入力値は最も近いE24系列・用途固有値へ丸めます）`
    : `設定範囲：${formatValue(def.min, def.unit)} ～ ${formatValue(def.max, def.unit)}`;
  $("valueInput").min = min.multiplier === converted.multiplier ? min.value : def.min / converted.multiplier;
  $("valueInput").max = max.multiplier === converted.multiplier ? max.value : def.max / converted.multiplier;
  $("valueDialog").showModal();
  $("valueInput").focus();
  $("valueInput").select();
}

$("valueForm").addEventListener("submit", (event) => {
  event.preventDefault();
  if (!dialogTarget || !$("valueInput").reportValidity()) return;
  setModelValue(dialogTarget.model, dialogTarget.key, Number($("valueInput").value) * dialogTarget.multiplier, false);
  $("valueDialog").close();
  dialogTarget = null;
});
$("valueCancel").addEventListener("click", () => { $("valueDialog").close(); dialogTarget = null; });

function switchTab(tab) {
  ["guitar", "line", "effector"].forEach((name) => {
    const active = name === tab;
    $(`tab-${name}`).classList.toggle("is-active", active);
    $(`tab-${name}`).setAttribute("aria-selected", String(active));
    $(`panel-${name}`).hidden = !active;
  });
  requestAnimationFrame(() => { if (tab === "guitar") updateGuitar(); if (tab === "line") updateLine(); if (tab === "effector") updateEffector(); });
}

createControls($("gControls"), guitarDefs, guitar, (key) => {
  if (key === "cableCapPerM") $("gCablePreset").value = "custom";
  updateGuitar();
});
createControls($("lControls"), lineDefs, line, (key) => {
  if (["cableResPerM", "cableIndPerM", "cableCapPerM"].includes(key)) $("lCablePreset").value = "custom";
  updateLine();
});
createControls($("eControls"), effectorDefs, effector, (key) => {
  if (["cableResPerM", "cableIndPerM", "cableCapPerM"].includes(key)) $("eCablePreset").value = "custom";
  updateEffector();
});
["guitar", "line", "effector"].forEach(attachCircuitInteraction);
$("gPreset").addEventListener("change", (e) => applyGuitarPreset(e.target.value));
$("lPreset").addEventListener("change", (e) => applyLinePreset(e.target.value));
$("ePreset").addEventListener("change", (e) => applyEffectorPreset(e.target.value));
$("gCablePreset").addEventListener("change", (e) => applyGuitarCablePreset(e.target.value));
$("lCablePreset").addEventListener("change", (e) => applyLineCablePreset(e.target.value));
$("eCablePreset").addEventListener("change", (e) => applyEffectorCablePreset(e.target.value));
$("gReset").addEventListener("click", () => applyGuitarPreset($("gPreset").value));
$("lReset").addEventListener("click", () => applyLinePreset($("lPreset").value));
$("eReset").addEventListener("click", () => applyEffectorPreset($("ePreset").value));
["guitar", "line", "effector"].forEach((name) => $(`tab-${name}`).addEventListener("click", () => switchTab(name)));
$("themeButton").addEventListener("click", () => {
  const dark = document.documentElement.dataset.theme === "dark";
  document.documentElement.dataset.theme = dark ? "light" : "dark";
  updateGuitar(); updateLine(); updateEffector();
});

const observer = new ResizeObserver(() => {
  clearTimeout(observer.timer);
  observer.timer = setTimeout(() => { updateGuitar(); updateLine(); updateEffector(); }, 80);
});
observer.observe(document.body);
updateGuitar();
updateLine();
updateEffector();
$("gPresetNote").textContent = guitarPresetNotes[$("gPreset").value];
$("ePresetNote").textContent = effectorPresetNotes[$("ePreset").value];
