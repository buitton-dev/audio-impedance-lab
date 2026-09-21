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
  // Deliberately nonphysical exploration ranges; cable constants retain their ranges.
  if (!def.key.startsWith("cable")) {
    const ranges = { "Ω": [1, 1e8], "H": [1e-6, 100], "F": [1e-12, 1e-3] };
    const range = ranges[def.unit];
    if (range) def = { ...def, min: def.min === 0 ? 0 : range[0], max: range[1], step: range[0] };
  }
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
  { key: "cableLength", label: "Cable length", unit: "m", min: 0.5, max: 100, step: 0.5 },
  preferredDef({ key: "cableCapPerM", label: "Cable capacitance", unit: "F/m", min: 50e-12, max: 200e-12, step: 5e-12 }, [70e-12, 100e-12, 160e-12]),
  preferredDef({ key: "ampInputR", label: "Amp input R", unit: "Ω", min: 50000, max: 2000000, step: 10000 }, [1e6]),
  preferredDef({ key: "ampSeriesR", label: "Grid stopper R", unit: "Ω", min: 0, max: 100000, step: 1000 }, [0, 22000, 34000, 68000]),
  preferredDef({ key: "ampInputC", label: "Effective input C", unit: "F", min: 10e-12, max: 500e-12, step: 5e-12 }, [100e-12])
];

const lineDefs = [
  preferredDef({ key: "sourceR", label: "Source Rout", unit: "Ω", min: 10, max: 200000, step: 10 }, [100, 10000, 100000]),
  preferredDef({ key: "loadR", label: "Load Rin", unit: "Ω", min: 100, max: 2000000, step: 100 }, [10000, 100000, 1e6]),
  { key: "cableLength", label: "Cable length", unit: "m", min: 0.5, max: 100, step: 0.5 },
  preferredDef({ key: "cableResPerM", label: "Cable R / m", unit: "Ω/m", min: 0, max: 1, step: 0.01 }, [0, 0.04, 0.043, 0.1]),
  preferredDef({ key: "cableIndPerM", label: "Cable L / m", unit: "H/m", min: 0, max: 2e-6, step: 0.05e-6 }, [0, 0.5e-6]),
  preferredDef({ key: "cableCapPerM", label: "Cable C / m", unit: "F/m", min: 50e-12, max: 200e-12, step: 5e-12 }, [70e-12, 100e-12, 160e-12])
];

const effectorDefs = [
  preferredDef({ key: "sourceR", label: "Output series Rout", unit: "Ω", min: 10, max: 100000, step: 10 }, [1000, 10000, 100000]),
  preferredDef({ key: "outputC", label: "Output coupling Cout", unit: "F", min: 10e-9, max: 10e-6, step: 10e-9 }, [100e-9, 1e-6]),
  preferredDef({ key: "pullDownR", label: "Output pull-down R", unit: "Ω", min: 10000, max: 2000000, step: 1000 }, [100000, 1e6]),
  preferredDef({ key: "loadR", label: "Next input Rin", unit: "Ω", min: 10000, max: 2000000, step: 1000 }, [10000, 1e6]),
  { key: "cableLength", label: "Cable length", unit: "m", min: 0.5, max: 100, step: 0.5 },
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
  buffered: "1 µFのCout後に低い直列Routを置き、100 kΩの出力対地抵抗から次段1 MΩを駆動する教材例です。",
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
  const couplingC = complex(0, -1 / (w * params.outputC));
  const outputSeriesR = complex(params.sourceR, 0);
  // Topology: source -> Cout -> (future volume-pot node) -> series Rout -> output.
  // With no shunt branch at the intermediate node, the two series impedances add commutatively.
  const sourcePath = add(couplingC, outputSeriesR);
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

// 60 SVG units = at least 45 CSS px at the minimum diagram width.
// Overlay only component bodies, leaving the surrounding diagram scrollable.
function symbolTargets(model, targets) {
  return targets.map(([key, x, y, vertical = false]) => {
    const config = modelConfigs[model];
    const def = config.defs.find(item => item.key === key);
    const width = vertical ? 60 : 90, height = vertical ? 90 : 60;
    return `<rect class="interactive-symbol" x="${x-width/2}" y="${y-height/2}" width="${width}" height="${height}" rx="8" data-model="${model}" data-key="${key}" role="button" tabindex="0" aria-label="${def.label} ${formatValue(config.state[key], def.unit)}。上下ドラッグで変更、タップで数値入力"/>`;
  }).join("");
}

// Circuit geometry and labels occupy separate lanes. All returns share the lower rail.
function circuitLayout(model, width) {
  const config = modelConfigs[model];
  $(config.circuit).setAttribute("viewBox", `0 -100 ${width} 620`);
  $(config.circuit).style.minWidth = `${width * 0.75}px`;
  $(config.circuit).parentElement.style.overflowX = "auto";
  const wire = (path) => `<path class="wire" d="${path}"/>`;
  const node = (x,y=140) => `<circle class="node" cx="${x}" cy="${y}" r="4"/>`;
  const text = (x,y,value) => `<text x="${x}" y="${y}" text-anchor="middle">${value}</text>`;
  const value = (key,x,y) => {
    const def = config.defs.find(d => d.key === key);
    return `<g text-anchor="middle">${interactiveValue(model,key,formatValue(config.state[key],def.unit),x,y,def.label)}</g>`;
  };
  const label = (x,name,key,y=65) => text(x,y,name)+value(key,x,y+28);
  const resistor = (x,y,vertical=false) => `<g class="component"><path transform="translate(${x} ${y})${vertical ? ' rotate(90)' : ''}" d="M-40 0h10l5 -10 10 20 10 -20 10 20 10 -20 5 10h10"/></g>`;
  const capacitor = (x,y,vertical=false) => `<g class="component"><path transform="translate(${x} ${y})${vertical ? ' rotate(90)' : ''}" d="M-40 0h33m0 -18v36m14 -36v36m0 -18h33"/></g>`;
  const source = wire("M75 140V203M75 247V320")+
    '<g class="component"><circle cx="75" cy="225" r="22"/><path d="M59 225q8 -15 16 0q8 15 16 0"/></g>'+
    text(75,365,model==="guitar"?"内部起電力":"信号源");
  const ground = wire(`M75 320H${width-60}M75 320v18m-16 0h32m-26 7h20m-14 7h8`);
  return {wire,node,text,value,label,resistor,capacitor,source,ground};
}

// Dashed outlines describe physical equipment, not additional electrical connections.
function equipmentFrame(x, width, title, icon, color, nested = false) {
  const y = nested ? -22 : -88;
  const height = nested ? 480 : 574;
  const paths = {
    guitar: "M18 3v19m-5-19h10M13 20c-12 1-12 20 5 20s17-19 5-20M18 26v9",
    pickup: "M8 5h22v34H8zM13 12h12M13 20h12M13 28h12",
    cable: "M5 8v17c0 18 28 18 28 0V8M1 4h8v8H1zM29 4h8v8h-8z",
    amp: "M3 4h34v36H3zM9 10h4m5 0h4M20 17a9 9 0 1 0 0 18a9 9 0 1 0 0-18",
    pedal: "M6 3h28v38H6zM20 9v7m-7 13h14m-10 7h6",
    source: "M3 5h34v34H3zM8 22q6-14 12 0t12 0"
  };
  return `<g class="equipment-frame" aria-label="${title}">
    <rect x="${x}" y="${y}" width="${width}" height="${height}" rx="12"
      fill="none" stroke="${color}" stroke-width="2" stroke-dasharray="${nested ? "4 5" : "10 7"}" pointer-events="none"/>
    <g transform="translate(${x+14} ${y+10}) scale(.7)" fill="none" stroke="${color}" stroke-width="2.5" aria-hidden="true"><path d="${paths[icon]}"/></g>
    <text x="${x+52}" y="${y+31}" style="font-size:20px;font-weight:700;fill:${color}">${title}</text>
  </g>`;
}

function guitarCircuitSvg() {
  const {wire,node,text,value,label,resistor,capacitor,source,ground} = circuitLayout("guitar",1800);
  let s = equipmentFrame(12,1160,"ギター本体","guitar","var(--warm)")+
    equipmentFrame(24,640,"ピックアップ","pickup","var(--accent)",true)+
    equipmentFrame(1186,178,"シールド","cable","var(--stage-cable)")+
    equipmentFrame(1378,408,"アンプ入力","amp","var(--stage-amp)")+
    source+ground;
  s += text(345,432,"コイルの性質を表す等価回路（個別の部品ではありません）");
  s += wire("M75 140H110M190 140H210M290 140H960M1040 220H1460M1540 220H1700");
  s += '<g class="component"><path d="'+horizontalInductorPath(110,190,140,4)+'"/></g>';
  s += resistor(250,140)+label(150,"Pickup L","pickupL")+label(250,"DCR","pickupR");
  // Pickup self capacitance and damping resistance.
  s += wire("M390 140V180M390 260V320M570 140V180M570 260V320");
  s += capacitor(390,220,true)+resistor(570,220,true)+node(390)+node(570);
  s += label(390,"Pickup C","pickupC",365)+label(570,"減衰抵抗（等価）","pickupLossR",365);
  // Tone resistor and capacitor form one series shunt branch.
  s += wire("M760 140V150M760 230V245M760 325V320");
  s += resistor(760,190,true)+capacitor(760,285,true)+node(760);
  s += label(760,"Tone pot","toneR",365)+text(760,420,"Tone knob")+value("tonePosition",760,446);
  s += label(930,"Tone C","toneC",365);
  // Three-terminal volume pot with a wiper, not a short through the pot.
  s += wire("M960 140H1000V180M1000 260V320M1040 220H1010");
  s += resistor(1000,220,true)+wire("M1010 220l12 -7m-12 7l12 7");
  s += label(1110,"Volume pot","volumeR",365)+text(1110,420,"Volume knob")+value("volumePosition",1110,446);
  s += wire("M1220 220V235M1220 315V320M1390 220V235M1390 315V320M1650 220V235M1650 315V320");
  s += capacitor(1220,275,true)+resistor(1390,275,true)+capacitor(1650,275,true);
  s += node(1220,220)+node(1390,220)+node(1650,220)+resistor(1500,220);
  s += label(1280,"Cable length","cableLength",365)+text(1280,425,"合計C "+formatValue(guitar.cableLength*guitar.cableCapPerM,"F"));
  s += label(1450,"Amp Rin","ampInputR",365)+label(1500,"Grid stopper","ampSeriesR",150);
  s += label(1650,"実効入力C","ampInputC",365)+text(1710,195,"Vgrid");
  s += symbolTargets("guitar", [
    ["pickupL",150,140], ["pickupR",250,140], ["pickupC",390,220,true],
    ["pickupLossR",570,220,true], ["toneR",760,190,true], ["toneC",760,285,true],
    ["volumeR",1000,220,true], ["cableCapPerM",1220,275,true],
    ["ampInputR",1390,275,true], ["ampSeriesR",1500,220], ["ampInputC",1650,275,true]
  ]);
  return s;
}

function connectionCircuitSvg(model) {
  const effect = model === "effector";
  const state = modelConfigs[model].state;
  const totals = lineTotals(state);
  const {wire,node,text,value,label,resistor,capacitor,source,ground} = circuitLayout(model,1400);
  const turns = totals.cableL <= 0 ? 0 : Math.round(3+6*Math.log10(1+totals.cableL/0.5e-6)/Math.log10(81));
  let s=equipmentFrame(12,570,effect ? "エフェクター本体" : "送り出す機器",effect ? "pedal" : "source","var(--warm)")+
    equipmentFrame(596,540,"ケーブル","cable","var(--stage-cable)")+
    equipmentFrame(1150,238,effect ? "次段機器" : "受ける機器","amp","var(--stage-amp)")+
    source+ground;
  if(effect) {
    s+=wire("M75 140H145M225 140H300M380 140H600M510 140V180M510 260V320");
    s+=capacitor(185,140)+resistor(340,140)+resistor(510,220,true)+node(510);
    s+=label(185,"Cout","outputC")+label(340,"直列 Rout","sourceR")+label(510,"Rpull-down","pullDownR",365);
  } else {
    s+=wire("M75 140H160M240 140H600")+resistor(200,140)+label(200,"Rout","sourceR");
  }
  s+=resistor(640,140)+wire("M680 140H780M880 140H1310");
  s+='<g class="component"><path d="'+horizontalInductorPath(780,880,140,turns)+'"/></g>';
  s+=text(640,65,"Cable R")+text(640,93,formatValue(totals.cableR,"Ω"));
  s+=text(830,65,"Cable L")+text(830,93,formatValue(totals.cableL,"H"));
  s+=wire("M1030 140V180M1030 260V320M1240 140V180M1240 260V320");
  s+=capacitor(1030,220,true)+resistor(1240,220,true)+node(1030)+node(1240);
  s+=text(1030,365,"Cable C")+text(1030,393,formatValue(totals.cableC,"F"));
  s+=label(1240,"Rin","loadR",365)+text(1310,110,"Vout");
  s+=label(760,"Cable length","cableLength",365)+text(760,440,"ケーブル合計値 = 長さ × 単位長定数");
  s+=symbolTargets(model, [
    ...(effect ? [["outputC",185,140],["sourceR",340,140],["pullDownR",510,220,true]] : [["sourceR",200,140]]),
    ["cableResPerM",640,140],["cableIndPerM",830,140],["cableCapPerM",1030,220,true],["loadR",1240,220,true]
  ]);
  return s;
}

function lineCircuitSvg() { return connectionCircuitSvg("line"); }
function effectorCircuitSvg() { return connectionCircuitSvg("effector"); }

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
  // Keep extreme-value experiments visible instead of pinning curves to the old floor.
  const values = [...current, ...baseline].filter(Number.isFinite);
  const ymin = Math.min(-36, Math.floor(Math.min(...values) / 12) * 12);
  const ymax = Math.max(8, Math.ceil(Math.max(...values) / 12) * 12);
  const x = (f) => margin.l + Math.log10(f / 20) / 3 * (W - margin.l - margin.r);
  const y = (dbv) => margin.t + (ymax - dbv) / (ymax - ymin) * (H - margin.t - margin.b);
  ctx.clearRect(0, 0, W, H);
  ctx.font = "12px system-ui";
  ctx.lineWidth = 1;
  ctx.strokeStyle = css("--grid");
  ctx.fillStyle = css("--muted");
  const tickStep = Math.max(10, Math.ceil((ymax - ymin) / 60) * 10);
  const yTicks = [];
  for (let tick = Math.ceil(ymin / tickStep) * tickStep; tick <= ymax; tick += tickStep) yTicks.push(tick);
  yTicks.forEach((tick) => {
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
  refreshMobileControls("guitar");
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
  refreshMobileControls("line");
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
  refreshMobileControls("effector");
  $("eCircuit").innerHTML = effectorCircuitSvg();
  const current = frequencies.map((f) => dB(magnitude(effectorTransfer(effector, f))));
  const base = frequencies.map((f) => dB(magnitude(effectorTransfer(effectorBaseline, f))));
  drawFrequencyPlot($("ePlot"), current, base);
  const totals = lineTotals(effector);
  const effectiveLoadR = 1 / (1 / effector.pullDownR + 1 / (effector.loadR + totals.cableR));
  const estimatedFc = 1 / (2 * Math.PI * effector.outputC * (effector.sourceR + effectiveLoadR));
  const midband = dB(magnitude(effectorTransfer(effector, 1000)));
  $("eSummary").textContent = `Cout低域fc概算 ${formatFrequency(estimatedFc)} / 1 kHz ${midband.toFixed(2)} dB`;
  $("eExplain").textContent = `CoutはDCを遮断し、その後に置く直列Rout＋（Rpull-down ∥ 次段Rin）との組み合わせで低域を減衰させます。概算fcは${formatFrequency(estimatedFc)}です。高域側は主にRoutとケーブル合計C ${formatValue(totals.cableC, "F")}の組み合わせで変化します。`;
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
  if (["cableResPerM", "cableIndPerM", "cableCapPerM"].includes(key)) {
    $(`${model === "guitar" ? "g" : model === "line" ? "l" : "e"}CablePreset`).value = "custom";
  }
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

function attachCircuitInteraction(model, host = null) {
  const svg = host || $(modelConfigs[model].circuit);
  svg.addEventListener("pointerdown", (event) => {
    const target = event.target.closest?.(".interactive-value, .interactive-symbol");
    if (!target || target.dataset.model !== model) return;
    if (dragSession || (event.button !== undefined && event.button !== 0)) return;
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
  svg.addEventListener("lostpointercapture", finishPointer);
  svg.addEventListener("keydown", (event) => {
    const target = event.target.closest?.(".interactive-value, .interactive-symbol");
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
    const targetClass = target.classList.contains("interactive-symbol") ? "interactive-symbol" : "interactive-value";
    requestAnimationFrame(() => svg.querySelector(`.${targetClass}[data-model="${model}"][data-key="${key}"]`)?.focus({ preventScroll: true }));
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

const mobileGroups = {
  guitar: [["Pickup", ["pickupR","pickupL","pickupC","pickupLossR"]], ["Volume / Tone", ["volumeR","volumePosition","toneR","tonePosition","toneC"]], ["ケーブル", ["cableLength","cableCapPerM"]], ["アンプ", ["ampInputR","ampSeriesR","ampInputC"]]],
  line: [["接続機器", ["sourceR","loadR"]], ["ケーブル", ["cableLength","cableResPerM","cableIndPerM","cableCapPerM"]]],
  effector: [["出力回路", ["outputC","sourceR","pullDownR","loadR"]], ["ケーブル", ["cableLength","cableResPerM","cableIndPerM","cableCapPerM"]]]
};

function mobileSymbol(def) {
  const path = def.unit === "Ω" || def.unit === "Ω/m" ? "M4 24h8l4 -9 7 18 7 -18 7 18 4 -9h11"
    : def.unit === "F" || def.unit === "F/m" ? "M4 24h18m0 -14v28m12 -28v28m0 -14h18"
    : def.unit === "H" || def.unit === "H/m" ? "M4 24h4q5 -20 10 0q5 -20 10 0q5 -20 10 0h14"
    : def.unit === "knob" ? "M28 6a18 18 0 1 0 0 36a18 18 0 1 0 0 -36M28 24l9 -12"
    : "M4 14h48M4 34h48M10 10v28M46 10v28";
  return `<svg viewBox="0 0 56 48" aria-hidden="true"><path d="${path}"/></svg>`;
}

function refreshMobileControls(model) {
  const host = $(`mobile-${model}`);
  if (!host) return;
  const config = modelConfigs[model];
  host.querySelectorAll("[data-mobile-value]").forEach(out => {
    const key = out.dataset.mobileValue, def = defFor(model,key);
    out.textContent = formatValue(config.state[key], def.unit);
    out.closest("button").setAttribute("aria-label", `${def.label}: ${out.textContent}。タップで入力、上下ドラッグで変更`);
  });
  host.querySelectorAll("[data-step]").forEach(button => {
    const def = defFor(model,button.dataset.key), value = config.state[def.key];
    button.disabled = Number(button.dataset.step) < 0 ? value <= def.min : value >= def.max;
  });
}

function buildMobileControls(model) {
  const config = modelConfigs[model], circuit = $(config.circuit);
  const panel = circuit.closest("article"), visuals = panel.parentElement;
  panel.classList.add("full-circuit-panel");
  panel.id = `full-circuit-${model}`;
  const toggle = document.createElement("button");
  toggle.type = "button"; toggle.className = "quiet-button mobile-only circuit-toggle";
  toggle.textContent = "全体回路図を開く";
  toggle.setAttribute("aria-expanded","false"); toggle.setAttribute("aria-controls",panel.id);
  toggle.addEventListener("click", () => {
    const open = panel.classList.toggle("mobile-circuit-open");
    toggle.setAttribute("aria-expanded",String(open)); toggle.textContent = open ? "全体回路図を閉じる" : "全体回路図を開く";
  });
  visuals.append(toggle);
  const host = document.createElement("section");
  host.id = `mobile-${model}`; host.className = "panel mobile-only mobile-editor";
  host.setAttribute("aria-label","スマホ用部品操作");
  host.innerHTML = `<h2>部品を操作</h2><p class="mobile-hint">±で1段階、中央をタップで入力。記号・値の上下ドラッグもできます。</p><label for="mobile-group-${model}">操作する場所</label><select id="mobile-group-${model}">${mobileGroups[model].map(([name],i)=>`<option value="${i}">${name}</option>`).join("")}</select>`;
  const rows = document.createElement("div"); rows.className = "mobile-rows"; host.append(rows);
  const render = () => {
    const keys = mobileGroups[model][Number(host.querySelector("select").value)][1];
    rows.innerHTML = keys.map(key => {
      const def = defFor(model,key);
      return `<div class="mobile-component"><div class="mobile-component-name">${def.label}</div><div class="mobile-component-actions"><button type="button" data-step="-1" data-key="${key}" aria-label="${def.label}を減らす">−</button><button type="button" class="interactive-symbol mobile-value" data-model="${model}" data-key="${key}">${mobileSymbol(def)}<span data-mobile-value="${key}"></span></button><button type="button" data-step="1" data-key="${key}" aria-label="${def.label}を増やす">＋</button></div></div>`;
    }).join("");
    refreshMobileControls(model);
  };
  host.querySelector("select").addEventListener("change",render);
  host.addEventListener("click", event => {
    const button = event.target.closest("[data-step]");
    if (!button) return;
    const def = defFor(model,button.dataset.key), direction = Number(button.dataset.step), current = config.state[def.key];
    const next = def.values ? def.values[clamp(nearestPreferredIndex(def,current)+direction,0,def.values.length-1)] : current+direction*def.step;
    setModelValue(model,def.key,next);
  });
  visuals.append(host); render(); attachCircuitInteraction(model,host);
}

["guitar", "line", "effector"].forEach(buildMobileControls);

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
["guitar", "line", "effector"].forEach(model => attachCircuitInteraction(model));
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
