// code.js を Figma 無しで実行して、初回実行で落ちないかを確かめる。
//   実行: node figma-plugin/smoke-test.mjs（npm run figma:check）
//
// Plugin API のうち code.js が使う分だけを模したモック。落とし穴は本物と同じように例外にする:
//   - フォント未ロードで characters を書く
//   - auto-layout の子でないノードに layoutSizing* = FILL / HUG
//   - 色を 0-255 で渡す / paint の color に a を混ぜる
//   - 知らない variable scope
// 値の正しさ（何色になるか）は検査しない。構造と呼び出し順だけを見る。

import fs from "node:fs";
import vm from "node:vm";

const AVAILABLE_FONTS = [
  ["Inter", ["Regular", "Medium", "Semi Bold", "Bold"]],
  ["Space Grotesk", ["Light", "Regular", "Medium", "SemiBold", "Bold"]],
  ["Noto Sans JP", ["Thin", "Light", "Regular", "Medium", "SemiBold", "Bold", "Black"]],
  ["Roboto Mono", ["Regular", "Medium", "Bold"]]
];

const VALID_SCOPES = new Set([
  "ALL_SCOPES", "TEXT_CONTENT", "CORNER_RADIUS", "WIDTH_HEIGHT", "GAP", "ALL_FILLS", "FRAME_FILL",
  "SHAPE_FILL", "TEXT_FILL", "STROKE_COLOR", "STROKE_FLOAT", "EFFECT_FLOAT", "EFFECT_COLOR",
  "OPACITY", "FONT_FAMILY", "FONT_STYLE", "FONT_WEIGHT", "FONT_SIZE", "LINE_HEIGHT",
  "LETTER_SPACING", "PARAGRAPH_SPACING", "PARAGRAPH_INDENT"
]);

const loadedFonts = new Set();
let idSeq = 0;
const warnings = [];

function checkColor(color, where) {
  if (!color) return;
  for (const channel of ["r", "g", "b"]) {
    const v = color[channel];
    if (typeof v !== "number" || v < 0 || v > 1) {
      throw new Error(`${where}: 色は0-1で渡す（${channel}=${v}）`);
    }
  }
}

function checkPaints(paints, where) {
  if (!Array.isArray(paints)) throw new Error(`${where}: fills/strokes は配列`);
  paints.forEach((p, i) => {
    if (!p || typeof p !== "object") throw new Error(`${where}[${i}]: paint がオブジェクトでない`);
    if (p.type === "SOLID") {
      if (p.color && "a" in p.color) throw new Error(`${where}[${i}]: paint の color に a は入れない（opacity を使う）`);
      checkColor(p.color, `${where}[${i}]`);
    }
    if (p.type && p.type.indexOf("GRADIENT") === 0) {
      if (!Array.isArray(p.gradientStops) || p.gradientStops.length < 2) {
        throw new Error(`${where}[${i}]: グラデーションには stop が2つ以上要る`);
      }
      if (!Array.isArray(p.gradientTransform)) {
        throw new Error(`${where}[${i}]: グラデーションには gradientTransform が要る（無いと向きが定まらない）`);
      }
      p.gradientStops.forEach((stop, j) => {
        checkColor(stop.color, `${where}[${i}].gradientStops[${j}]`);
        if (typeof stop.color.a !== "number") throw new Error(`${where}[${i}].gradientStops[${j}]: stop の色は {r,g,b,a}`);
        if (typeof stop.position !== "number") throw new Error(`${where}[${i}].gradientStops[${j}]: position が無い`);
      });
    }
  });
}

class Node {
  constructor(type, name) {
    this.id = `${++idSeq}:0`;
    this.type = type;
    this.name = name || type;
    this.parent = null;
    this.children = [];
    this.x = 0;
    this.y = 0;
    this.width = 100;
    this.height = 100;
    this._fills = [];
    this._strokes = [];
    this.strokeWeight = 1;
    this.effects = [];
    this.boundVariables = {};
    this.description = "";
  }

  get fills() { return this._fills; }
  set fills(v) { checkPaints(v, `${this.name}.fills`); this._fills = v; }
  get strokes() { return this._strokes; }
  set strokes(v) { checkPaints(v, `${this.name}.strokes`); this._strokes = v; }

  get _isAutoLayout() { return this.layoutMode === "HORIZONTAL" || this.layoutMode === "VERTICAL"; }

  // 幅を決めている軸の sizing。横並びなら primary、縦積みなら counter。
  // FIXED でなければ、宣言した幅は内容に合わせて潰れる。
  get _widthSizing() {
    if (!this._isAutoLayout) return "FIXED";
    return this.layoutMode === "HORIZONTAL" ? this.primaryAxisSizingMode : this.counterAxisSizingMode;
  }

  set layoutSizingHorizontal(value) {
    if (value === "FILL" && !(this.parent && this.parent._isAutoLayout)) {
      throw new Error(`${this.name}: FILL は auto-layout の子だけ（親=${this.parent ? this.parent.name + "/" + this.parent.layoutMode : "なし"}）`);
    }
    if (value === "HUG" && !this._isAutoLayout && this.type !== "TEXT") {
      throw new Error(`${this.name}: HUG は auto-layout フレーム自身か TEXT だけ`);
    }
    this._layoutSizingHorizontal = value;
  }
  get layoutSizingHorizontal() { return this._layoutSizingHorizontal; }

  set layoutSizingVertical(value) {
    if (value === "AUTO") throw new Error(`${this.name}: layoutSizingVertical に AUTO は無い（HUG）`);
    this._layoutSizingVertical = value;
  }
  get layoutSizingVertical() { return this._layoutSizingVertical; }

  appendChild(node) {
    if (!node) throw new Error(`${this.name}.appendChild(undefined)`);
    if (node.parent) node.parent.children = node.parent.children.filter((c) => c !== node);
    node.parent = this;
    this.children.push(node);
  }

  remove() {
    if (this.parent) this.parent.children = this.parent.children.filter((c) => c !== this);
    this.parent = null;
    this.removed = true;
  }

  resize(w, h) {
    if (!(w > 0) || !(h > 0)) throw new Error(`${this.name}.resize: 幅・高さは正の数（${w}x${h}）`);
    this.width = w;
    this.height = h;
    if (this._isAutoLayout) {
      // 本物と同じく、resize すると両軸が FIXED に戻る
      this.primaryAxisSizingMode = "FIXED";
      this.counterAxisSizingMode = "FIXED";
    }
  }

  setBoundVariable(field, variable) {
    if (!variable) throw new Error(`${this.name}.setBoundVariable(${field}): variable が undefined`);
    this.boundVariables[field] = { type: "VARIABLE_ALIAS", id: variable.id };
  }

  findAllWithCriteria(criteria) {
    const out = [];
    const walk = (node) => {
      node.children.forEach((child) => {
        if (criteria.types.indexOf(child.type) !== -1) out.push(child);
        walk(child);
      });
    };
    walk(this);
    return out;
  }

  createInstance() {
    if (this.type !== "COMPONENT") throw new Error(`${this.name}: createInstance は COMPONENT だけ`);
    const instance = new Node("INSTANCE", `${this.name} instance`);
    instance.mainComponent = this;
    return instance;
  }
}

class TextNode extends Node {
  constructor() {
    super("TEXT", "Text");
    this._characters = "";
    this._fontName = { family: "Inter", style: "Regular" };
  }
  get fontName() { return this._fontName; }
  set fontName(fn) {
    if (!fn || !fn.family || !fn.style) throw new Error("fontName は {family, style}");
    if (!loadedFonts.has(`${fn.family}/${fn.style}`)) {
      throw new Error(`フォント未ロード: ${fn.family} ${fn.style}（loadFontAsync が要る）`);
    }
    this._fontName = fn;
  }
  get characters() { return this._characters; }
  set characters(value) {
    if (!loadedFonts.has(`${this._fontName.family}/${this._fontName.style}`)) {
      throw new Error(`フォント未ロードのまま characters を書いた: ${this._fontName.family} ${this._fontName.style}`);
    }
    this._characters = value;
    this.height = 20;
    this.width = Math.max(10, value.length * 8);
  }
  set lineHeight(v) {
    if (!v || typeof v !== "object" || !("unit" in v)) throw new Error("lineHeight は {unit, value}");
    this._lineHeight = v;
  }
  get lineHeight() { return this._lineHeight; }
  set letterSpacing(v) {
    if (!v || typeof v !== "object" || !("unit" in v)) throw new Error("letterSpacing は {unit, value}");
    this._letterSpacing = v;
  }
  get letterSpacing() { return this._letterSpacing; }
}

class Variable {
  constructor(name, collection, resolvedType) {
    this.id = `VariableID:${++idSeq}`;
    this.name = name;
    this.resolvedType = resolvedType;
    this.collection = collection;
    this.valuesByMode = {};
    this.codeSyntax = {};
    this._scopes = ["ALL_SCOPES"];
  }
  get scopes() { return this._scopes; }
  set scopes(list) {
    if (!Array.isArray(list)) throw new Error(`${this.name}.scopes は配列`);
    list.forEach((s) => { if (!VALID_SCOPES.has(s)) throw new Error(`${this.name}: 不正な scope "${s}"`); });
    this._scopes = list;
  }
  setValueForMode(modeId, value) {
    if (!modeId) throw new Error(`${this.name}.setValueForMode: modeId が undefined`);
    if (value && value.type === "VARIABLE_ALIAS") {
      if (!value.id) throw new Error(`${this.name}: エイリアス先の id が無い`);
    } else if (this.resolvedType === "COLOR") {
      checkColor(value, `${this.name} の値`);
      if (typeof value.a !== "number") throw new Error(`${this.name}: COLOR 変数の値は {r,g,b,a}`);
    } else if (this.resolvedType === "FLOAT" && typeof value !== "number") {
      throw new Error(`${this.name}: FLOAT 変数に数値以外`);
    }
    this.valuesByMode[modeId] = value;
  }
  setVariableCodeSyntax(platform, syntax) {
    if (["WEB", "ANDROID", "iOS"].indexOf(platform) === -1) throw new Error(`不正な platform: ${platform}`);
    this.codeSyntax[platform] = syntax;
  }
}

class VariableCollection {
  constructor(name) {
    this.id = `VariableCollectionId:${++idSeq}`;
    this.name = name;
    this.modes = [{ modeId: `${idSeq}:0`, name: "Mode 1" }];
    this.variableIds = [];
  }
  renameMode(modeId, name) {
    const mode = this.modes.find((m) => m.modeId === modeId);
    if (!mode) throw new Error(`${this.name}: 知らない modeId`);
    mode.name = name;
  }
  addMode() {
    // 無料プランと同じ挙動にしておく（1モードまで）
    throw new Error("in addMode: Limited to 1 modes only");
  }
}

const page = new Node("PAGE", "Page 1");
const collections = [];
const variablesById = new Map();
const textStyles = [];
const effectStyles = [];

const figma = {
  editorType: "figma",
  currentPage: page,
  root: { name: "Document", children: [page] },
  viewport: { scrollAndZoomIntoView() {} },
  closePlugin(message) {
    figma._closed = message === undefined ? "(メッセージ無し)" : message;
    if (figma._onClose) figma._onClose();
  },
  listAvailableFontsAsync() {
    return Promise.resolve(AVAILABLE_FONTS.flatMap(([family, styles]) =>
      styles.map((style) => ({ fontName: { family, style } }))));
  },
  loadFontAsync(fontName) {
    const known = AVAILABLE_FONTS.find(([family, styles]) =>
      family === fontName.family && styles.indexOf(fontName.style) !== -1);
    if (!known) return Promise.reject(new Error(`存在しないフォント: ${fontName.family} ${fontName.style}`));
    // 登録は次のマクロタスクまで遅らせる。await し忘れたコードを「未ロード」として落とすため
    // （同期で登録すると、呼びさえすれば通ってしまい検査にならない）。
    return new Promise((resolve) => setTimeout(() => {
      loadedFonts.add(`${fontName.family}/${fontName.style}`);
      resolve();
    }, 0));
  },
  createFrame() { const n = new Node("FRAME", "Frame"); page.appendChild(n); return n; },
  createText() { const n = new TextNode(); page.appendChild(n); return n; },
  createComponent() { const n = new Node("COMPONENT", "Component"); page.appendChild(n); return n; },
  createEllipse() { const n = new Node("ELLIPSE", "Ellipse"); page.appendChild(n); return n; },
  combineAsVariants(components, parent) {
    if (!Array.isArray(components) || components.length < 2) throw new Error("combineAsVariants には2つ以上");
    const names = components.map((c) => c.name);
    names.forEach((n) => { if (n.indexOf("=") === -1) throw new Error(`バリアント名が prop=value でない: ${n}`); });
    const props = new Set(names.map((n) => n.split("=")[0]));
    if (props.size !== 1) throw new Error(`バリアントのプロパティ名が揃っていない: ${names.join(", ")}`);
    const set = new Node("COMPONENT_SET", "Component Set");
    parent.appendChild(set);
    components.forEach((c) => set.appendChild(c));
    return set;
  },
  createTextStyle() { const s = { name: "", type: "TEXT" , set fontName(v) { this._fn = v; }, get fontName() { return this._fn; } }; textStyles.push(s); return s; },
  createEffectStyle() { const s = { name: "", type: "EFFECT" }; effectStyles.push(s); return s; },
  getLocalTextStylesAsync() { return Promise.resolve(textStyles); },
  getLocalEffectStylesAsync() { return Promise.resolve(effectStyles); },
  variables: {
    getLocalVariableCollectionsAsync() { return Promise.resolve(collections); },
    createVariableCollection(name) { const c = new VariableCollection(name); collections.push(c); return c; },
    createVariable(name, collection, resolvedType) {
      if (!collection || !collection.variableIds) throw new Error(`createVariable: コレクションが不正（${name}）`);
      if (["COLOR", "FLOAT", "STRING", "BOOLEAN"].indexOf(resolvedType) === -1) throw new Error(`createVariable: 不正な型 ${resolvedType}`);
      const v = new Variable(name, collection, resolvedType);
      collection.variableIds.push(v.id);
      variablesById.set(v.id, v);
      return v;
    },
    getVariableByIdAsync(id) { return Promise.resolve(variablesById.get(id) || null); },
    setBoundVariableForPaint(paint, field, variable) {
      if (!variable) throw new Error("setBoundVariableForPaint: variable が undefined");
      if (paint.type !== "SOLID") throw new Error("setBoundVariableForPaint: SOLID 以外は不可");
      checkColor(paint.color, "setBoundVariableForPaint の paint");
      return Object.assign({}, paint, { boundVariables: { [field]: { type: "VARIABLE_ALIAS", id: variable.id } } });
    }
  }
};

// 前の版が作った汎用 Card を置いておく。掃除されることを確かめるため。
const staleCard = new Node("COMPONENT", "Card");
page.appendChild(staleCard);

const code = fs.readFileSync(new URL("./code.js", import.meta.url), "utf8");
const sandbox = { figma, console, Promise, Object, Array, Math, String, Number, parseInt, JSON, setTimeout };
vm.createContext(sandbox);
const script = new vm.Script(code, { filename: "code.js" });

// 1回の実行。closePlugin が呼ばれたら（成功・失敗どちらでも）終わりとみなす。
function runPass() {
  return new Promise((resolve, reject) => {
    figma._closed = undefined;
    figma._onClose = resolve;
    const guard = setTimeout(() => reject(new Error("closePlugin が呼ばれないまま3秒経った")), 3000);
    const done = () => { clearTimeout(guard); resolve(); };
    figma._onClose = done;
    try {
      script.runInContext(sandbox);
    } catch (error) {
      clearTimeout(guard);
      reject(new Error("同期実行で例外: " + error.message));
    }
  });
}

function inspect() {
  const report = [];
  if (figma._closed === undefined) {
    report.push("closePlugin が呼ばれていない（Figmaではプラグインが閉じない）");
  } else if (figma._closed.indexOf("失敗") === 0) {
    report.push(`プラグインが失敗で終了: ${figma._closed}`);
  }

  const collectionNames = collections.map((c) => c.name).sort();
  const expectCollections = ["Palette", "Semantic (Dark)", "Semantic (Light)", "Shape & Size"].sort();
  if (collectionNames.join(",") !== expectCollections.join(",")) {
    report.push(`コレクションが期待と違う: ${collectionNames.join(", ")}`);
  }

  const varCount = collections.reduce((n, c) => n + c.variableIds.length, 0);
  if (varCount !== 34) report.push(`変数の数が34でない: ${varCount}`);

  const noSyntax = [...variablesById.values()].filter((v) => !v.codeSyntax.WEB);
  if (noSyntax.length) report.push(`WEB code syntax が無い変数: ${noSyntax.map((v) => v.name).join(", ")}`);

  const allScopes = [...variablesById.values()].filter((v) => v.scopes.indexOf("ALL_SCOPES") !== -1);
  if (allScopes.length) report.push(`scopes が既定のまま: ${allScopes.map((v) => v.name).join(", ")}`);

  if (textStyles.length !== 11) report.push(`テキストスタイルが11種でない: ${textStyles.length}`);
  if (effectStyles.length !== 2) report.push(`エフェクトスタイルが2種でない: ${effectStyles.length}`);

  const componentNames = page.children.filter((n) => n.type === "COMPONENT" || n.type === "COMPONENT_SET").map((n) => n.name).sort();
  const expectComponents = ["ArticleCard", "Badge", "Button", "Chip", "Hero", "SiteHeader"];
  expectComponents.forEach((name) => {
    if (componentNames.indexOf(name) === -1) report.push(`コンポーネントが無い: ${name}`);
  });

  // 実寸で置くコンポーネントは、宣言した幅が生きていなければ内容の幅まで縮む
  const fixedWidths = { ArticleCard: 546, SiteHeader: 1440, Hero: 1440 };
  Object.keys(fixedWidths).forEach((name) => {
    const node = page.children.find((n) => n.name === name);
    if (!node) return;
    if (node.width !== fixedWidths[name]) {
      report.push(`${name} の幅が ${fixedWidths[name]} でない: ${node.width}`);
    }
    if (node._widthSizing !== "FIXED") {
      report.push(`${name} の幅が固定されていない（${node.layoutMode} レイアウトで ${node._widthSizing}）。宣言した幅まで広がらない`);
    }
  });

  if (page.children.some((n) => n.name === "Card" && (n.type === "COMPONENT" || n.type === "COMPONENT_SET"))) {
    report.push("作るのをやめた Card が残っている（インスタンスが無ければ消すはず）");
  }

  const sheets = page.children.filter((n) => n.name === "Design Tokens");
  if (sheets.length !== 1) report.push(`早見表フレーム Design Tokens が ${sheets.length} 枚ある（1枚であるべき）`);
  else if (sheets[0].children.length < 6) report.push(`早見表のセクションが少ない: ${sheets[0].children.length}`);

  const strayText = page.children.filter((n) => n.type === "TEXT");
  if (strayText.length) report.push(`ページ直下に迷子のテキストが ${strayText.length} 個ある`);

  warnings.forEach((w) => report.push(w));

  return {
    report: report,
    summary: {
      collections: collectionNames,
      variables: varCount,
      textStyles: textStyles.length,
      effectStyles: effectStyles.length,
      components: componentNames,
      sheetSections: sheets.length === 1 ? sheets[0].children.length : 0,
      closed: figma._closed
    }
  };
}

function fail(label, report) {
  console.error(`\n失敗（${label}）:`);
  report.forEach((r) => console.error(" - " + r));
  process.exit(1);
}

// 1回目 → 検査 → 2回目（冪等性の確認）→ 検査
runPass()
  .then(() => {
    const first = inspect();
    if (first.report.length) fail("1回目", first.report);
    console.log("OK（1回目）");
    console.log(`  終了メッセージ: ${first.summary.closed}`);
    console.log(`  コレクション: ${first.summary.collections.join(" / ")}`);
    console.log(`  変数 ${first.summary.variables} / テキストスタイル ${first.summary.textStyles} / エフェクト ${first.summary.effectStyles}`);
    console.log(`  コンポーネント: ${first.summary.components.join(" / ")}`);
    console.log(`  早見表のセクション数: ${first.summary.sheetSections}`);
    return runPass().then(() => first);
  })
  .then((first) => {
    const second = inspect();
    if (second.report.length) fail("2回目", second.report);
    const keys = ["variables", "textStyles", "effectStyles", "sheetSections"];
    const drift = keys.filter((k) => first.summary[k] !== second.summary[k]);
    if (drift.length) {
      fail("2回目", drift.map((k) => `${k} が1回目と違う: ${first.summary[k]} → ${second.summary[k]}`));
    }
    if (first.summary.components.join(",") !== second.summary.components.join(",")) {
      fail("2回目", [`コンポーネントが増減した: ${second.summary.components.join(" / ")}`]);
    }
    console.log("OK（2回目・冪等）");
  })
  .catch((error) => fail("実行", [error.message]));
