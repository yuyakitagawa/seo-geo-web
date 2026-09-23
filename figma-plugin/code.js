// SEO GEO Lab のデザインシステムをFigmaに流し込むプラグイン。
//
// トークンの値は src/app/globals.css の @theme と1対1で対応する（このファイルが二次情報）。
// CSSを変えたらここも変えて再実行する。実行は何度でも安全（名前で引いて更新する）。
//
// 作るもの:
//   - 変数コレクション4つ / 変数34個（Palette 7・Semantic (Light) 10・Semantic (Dark) 10・Shape & Size 7）
//   - テキストスタイル11種（src/lib/ui.ts の HEADING / EYEBROW / BADGE と本文の実測値）
//   - エフェクトスタイル2種（--shadow-lift / --shadow-panel）
//   - コンポーネント: Button（4バリアント）/ Chip / Badge（3バリアント）/ Card
//   - 早見表フレーム「Design Tokens」
//
// 無料プランは1コレクション1モードまでなので、ライトとダークは別コレクションに分ける
// （Professional以上なら1コレクション2モードに統合できる。統合する場合は upsertSemantic を書き換える）。

// ---------------------------------------------------------------- トークン表
// tokens:start —— ここから tokens:end までは src/lib/figmaTokens.test.ts が読んで globals.css と突き合わせる。

// 1. パレット（生の色。配色モードで変わらない）
var PALETTE = [
  { name: "ink", hex: "#0a0a0a" },
  { name: "paper", hex: "#f5f5f2" },
  { name: "accent", hex: "#2994b9" },
  { name: "accent-ink", hex: "#041c24" },
  { name: "seo", hex: "#4f7cff" },
  { name: "geo", hex: "#a855f7" },
  { name: "news", hex: "#ff6b35" }
];

// 2. セマンティック（役割の色）。alias はパレットの変数名、hex+alpha は直接値。
var FILL_SCOPES = ["FRAME_FILL", "SHAPE_FILL"];
var TEXT_SCOPES = ["TEXT_FILL"];
var STROKE_SCOPES = ["STROKE_COLOR"];

var SEMANTIC = [
  { name: "canvas", light: { alias: "paper" }, dark: { alias: "ink" }, scopes: FILL_SCOPES },
  { name: "fg", light: { alias: "ink" }, dark: { alias: "paper" }, scopes: TEXT_SCOPES },
  { name: "mute", light: { hex: "#6b6b66" }, dark: { hex: "#9c9c95" }, scopes: TEXT_SCOPES },
  { name: "surface", light: { hex: "#ffffff" }, dark: { hex: "#ffffff", alpha: 0.05 }, scopes: FILL_SCOPES },
  { name: "line", light: { hex: "#0a0a0a", alpha: 0.1 }, dark: { hex: "#f5f5f2", alpha: 0.1 }, scopes: STROKE_SCOPES },
  { name: "line-strong", light: { hex: "#0a0a0a", alpha: 0.18 }, dark: { hex: "#f5f5f2", alpha: 0.18 }, scopes: STROKE_SCOPES },
  { name: "fill", light: { hex: "#0a0a0a", alpha: 0.05 }, dark: { hex: "#f5f5f2", alpha: 0.06 }, scopes: FILL_SCOPES },
  { name: "fill-strong", light: { hex: "#0a0a0a", alpha: 0.1 }, dark: { hex: "#f5f5f2", alpha: 0.15 }, scopes: FILL_SCOPES },
  { name: "invert", light: { alias: "ink" }, dark: { alias: "paper" }, scopes: FILL_SCOPES },
  { name: "invert-fg", light: { alias: "paper" }, dark: { alias: "ink" }, scopes: TEXT_SCOPES }
];

// 3. 形と幅（rem → px。1rem = 16px）
var SHAPE = [
  { name: "radius-card", value: 24, scopes: ["CORNER_RADIUS"], css: "var(--radius-card)" },
  { name: "radius-panel", value: 16, scopes: ["CORNER_RADIUS"], css: "var(--radius-panel)" },
  { name: "container-page", value: 1152, scopes: ["WIDTH_HEIGHT"], css: "var(--container-page)" },
  { name: "container-wide", value: 896, scopes: ["WIDTH_HEIGHT"], css: "var(--container-wide)" },
  { name: "container-text", value: 768, scopes: ["WIDTH_HEIGHT"], css: "var(--container-text)" },
  { name: "text-2xs", value: 11, scopes: ["FONT_SIZE"], css: "var(--text-2xs)" },
  { name: "text-3xs", value: 10, scopes: ["FONT_SIZE"], css: "var(--text-3xs)" }
];

// 4. 影。Figmaは影を変数にできないのでエフェクトスタイルにする。
var ELEVATIONS = [
  { name: "shadow-lift", css: "var(--shadow-lift)", y: 30, radius: 60, spread: -30, alpha: 0.35 },
  { name: "shadow-panel", css: "var(--shadow-panel)", y: 30, radius: 60, spread: -40, alpha: 0.4 }
];

// 5. 文字。role は下で解決するフォント（jp=和文見出し・本文 / display=欧文ラベル / mono=コード）。
var TEXT_STYLES = [
  { name: "display/lg", role: "jp", weight: "bold", size: 36, lineHeight: 40, tracking: -2.5 },
  { name: "heading/xl", role: "jp", weight: "bold", size: 30, lineHeight: 36, tracking: -2.5 },
  { name: "heading/lg", role: "jp", weight: "bold", size: 24, lineHeight: 32, tracking: -2.5 },
  { name: "heading/md", role: "jp", weight: "bold", size: 20, lineHeight: 28, tracking: -2.5 },
  { name: "heading/sm", role: "jp", weight: "bold", size: 18, lineHeight: 28, tracking: -2.5 },
  { name: "body/lg", role: "jp", weight: "regular", size: 16, lineHeight: 26 },
  { name: "body/md", role: "jp", weight: "regular", size: 14, lineHeight: 24 },
  { name: "label/md", role: "display", weight: "semibold", size: 14, lineHeight: 20, tracking: 5, upper: true },
  { name: "eyebrow/sm", role: "display", weight: "bold", size: 12, lineHeight: 16, tracking: 5, upper: true },
  { name: "badge/xs", role: "display", weight: "bold", size: 11, lineHeight: 16, tracking: 5, upper: true },
  { name: "mono/xs", role: "mono", weight: "regular", size: 12, lineHeight: 20 }
];

// tokens:end

// フォントの候補。左から順に、Figmaで使えるものを採る（無い環境で落ちないように）。
var FONT_CANDIDATES = {
  jp: ["Noto Sans JP", "Hiragino Sans", "Hiragino Kaku Gothic ProN", "Inter"],
  display: ["Space Grotesk", "Inter", "Roboto"],
  mono: ["Geist Mono", "Roboto Mono", "JetBrains Mono", "Source Code Pro", "Inter"]
};
// 太さごとのスタイル名の候補（フォントによって "SemiBold" / "Semi Bold" / 無しが混ざる）。
var WEIGHT_CANDIDATES = {
  regular: ["Regular", "Book", "Medium"],
  medium: ["Medium", "Regular"],
  semibold: ["SemiBold", "Semi Bold", "DemiBold", "Demi Bold", "Medium", "Bold"],
  bold: ["Bold", "W6", "SemiBold", "Semi Bold", "Medium"]
};

// ---------------------------------------------------------------- 小道具

function hexToRgb(hex) {
  var h = hex.replace("#", "");
  return {
    r: parseInt(h.slice(0, 2), 16) / 255,
    g: parseInt(h.slice(2, 4), 16) / 255,
    b: parseInt(h.slice(4, 6), 16) / 255
  };
}

function toRgba(spec) {
  var rgb = hexToRgb(spec.hex);
  return { r: rgb.r, g: rgb.g, b: rgb.b, a: typeof spec.alpha === "number" ? spec.alpha : 1 };
}

function solid(hex) {
  return { type: "SOLID", color: hexToRgb(hex) };
}

// 変数を束ねた塗り。variable が無いときは hex のベタ塗りに落とす。
function boundFill(variable, fallbackHex) {
  var paint = { type: "SOLID", color: hexToRgb(fallbackHex || "#000000") };
  if (!variable) return paint;
  return figma.variables.setBoundVariableForPaint(paint, "color", variable);
}

var fonts = {}; // role -> { regular: FontName, bold: FontName, ... }

// 使えるフォントの一覧から role ごとの family と weight を決め、必要な組み合わせを読み込む。
function resolveFonts() {
  return figma.listAvailableFontsAsync().then(function (available) {
    var byFamily = {};
    available.forEach(function (f) {
      var fam = f.fontName.family;
      if (!byFamily[fam]) byFamily[fam] = {};
      byFamily[fam][f.fontName.style] = true;
    });

    var needed = [];
    Object.keys(FONT_CANDIDATES).forEach(function (role) {
      var family = null;
      for (var i = 0; i < FONT_CANDIDATES[role].length; i++) {
        if (byFamily[FONT_CANDIDATES[role][i]]) { family = FONT_CANDIDATES[role][i]; break; }
      }
      if (!family) family = Object.keys(byFamily)[0]; // 最後の砦
      fonts[role] = { family: family, styles: {} };

      Object.keys(WEIGHT_CANDIDATES).forEach(function (weight) {
        var style = null;
        for (var j = 0; j < WEIGHT_CANDIDATES[weight].length; j++) {
          if (byFamily[family][WEIGHT_CANDIDATES[weight][j]]) { style = WEIGHT_CANDIDATES[weight][j]; break; }
        }
        if (!style) style = Object.keys(byFamily[family])[0];
        fonts[role].styles[weight] = style;
        needed.push({ family: family, style: style });
      });
    });

    var seen = {};
    var loads = [];
    needed.forEach(function (fn) {
      var key = fn.family + "/" + fn.style;
      if (seen[key]) return;
      seen[key] = true;
      loads.push(figma.loadFontAsync(fn));
    });
    return Promise.all(loads);
  });
}

function fontOf(role, weight) {
  var f = fonts[role] || fonts.jp;
  return { family: f.family, style: f.styles[weight] || f.styles.regular };
}

// 文字ノード。スタイル名を渡せばテキストスタイルを当てる。
function text(chars, opts) {
  var o = opts || {};
  var node = figma.createText();
  node.fontName = fontOf(o.role || "jp", o.weight || "regular");
  node.characters = chars;
  if (o.size) node.fontSize = o.size;
  if (o.lineHeight) node.lineHeight = { unit: "PIXELS", value: o.lineHeight };
  if (typeof o.tracking === "number") node.letterSpacing = { unit: "PERCENT", value: o.tracking };
  if (o.upper) node.textCase = "UPPER";
  if (o.fill) node.fills = [o.fill];
  node.textAutoResize = "HEIGHT";
  return node;
}

// 縦積み/横並びのフレーム。Plugin API には createAutoLayout が無いので手で組む。
function stack(name, direction, opts) {
  var o = opts || {};
  var frame = figma.createFrame();
  frame.name = name;
  frame.layoutMode = direction;
  frame.primaryAxisSizingMode = "AUTO";
  frame.counterAxisSizingMode = "AUTO";
  frame.itemSpacing = typeof o.gap === "number" ? o.gap : 0;
  var p = typeof o.padding === "number" ? o.padding : 0;
  frame.paddingTop = typeof o.paddingTop === "number" ? o.paddingTop : p;
  frame.paddingBottom = typeof o.paddingBottom === "number" ? o.paddingBottom : p;
  frame.paddingLeft = typeof o.paddingLeft === "number" ? o.paddingLeft : p;
  frame.paddingRight = typeof o.paddingRight === "number" ? o.paddingRight : p;
  frame.counterAxisAlignItems = o.align || "MIN";
  frame.primaryAxisAlignItems = o.justify || "MIN";
  frame.fills = o.fills || [];
  if (typeof o.radius === "number") frame.cornerRadius = o.radius;
  if (o.clip) frame.clipsContent = true;
  return frame;
}

// ---------------------------------------------------------------- 変数

function upsertCollection(name, modeName) {
  return figma.variables.getLocalVariableCollectionsAsync().then(function (collections) {
    var found = null;
    collections.forEach(function (c) { if (c.name === name) found = c; });
    var collection = found || figma.variables.createVariableCollection(name);
    if (collection.modes[0].name !== modeName) collection.renameMode(collection.modes[0].modeId, modeName);
    return collection;
  });
}

function upsertVariable(collection, name, type) {
  var ids = collection.variableIds;
  return Promise.all(ids.map(function (id) { return figma.variables.getVariableByIdAsync(id); }))
    .then(function (existing) {
      var found = null;
      existing.forEach(function (v) { if (v && v.name === name) found = v; });
      return found || figma.variables.createVariable(name, collection, type);
    });
}

function applyMeta(variable, scopes, css) {
  variable.scopes = scopes;
  variable.setVariableCodeSyntax("WEB", css);
}

var paletteVars = {}; // name -> Variable
var semanticLightVars = {};
var shapeVars = {};

function buildPalette() {
  return upsertCollection("Palette", "Value").then(function (collection) {
    var modeId = collection.modes[0].modeId;
    return PALETTE.reduce(function (chain, token) {
      return chain.then(function () {
        return upsertVariable(collection, token.name, "COLOR").then(function (v) {
          v.setValueForMode(modeId, toRgba({ hex: token.hex }));
          applyMeta(v, ["ALL_FILLS", "STROKE_COLOR"], "var(--color-" + token.name + ")");
          paletteVars[token.name] = v;
        });
      });
    }, Promise.resolve());
  });
}

function buildSemantic(collectionName, modeName, key) {
  return upsertCollection(collectionName, modeName).then(function (collection) {
    var modeId = collection.modes[0].modeId;
    return SEMANTIC.reduce(function (chain, token) {
      return chain.then(function () {
        return upsertVariable(collection, token.name, "COLOR").then(function (v) {
          var spec = token[key];
          if (spec.alias) {
            var target = paletteVars[spec.alias];
            v.setValueForMode(modeId, { type: "VARIABLE_ALIAS", id: target.id });
          } else {
            v.setValueForMode(modeId, toRgba(spec));
          }
          applyMeta(v, token.scopes, "var(--color-" + token.name + ")");
          if (key === "light") semanticLightVars[token.name] = v;
        });
      });
    }, Promise.resolve());
  });
}

function buildShape() {
  return upsertCollection("Shape & Size", "Value").then(function (collection) {
    var modeId = collection.modes[0].modeId;
    return SHAPE.reduce(function (chain, token) {
      return chain.then(function () {
        return upsertVariable(collection, token.name, "FLOAT").then(function (v) {
          v.setValueForMode(modeId, token.value);
          applyMeta(v, token.scopes, token.css);
          shapeVars[token.name] = v;
        });
      });
    }, Promise.resolve());
  });
}

// ---------------------------------------------------------------- スタイル

function buildEffectStyles() {
  return figma.getLocalEffectStylesAsync().then(function (existing) {
    ELEVATIONS.forEach(function (e) {
      var style = null;
      existing.forEach(function (s) { if (s.name === e.name) style = s; });
      if (!style) style = figma.createEffectStyle();
      style.name = e.name;
      style.description = e.css;
      style.effects = [{
        type: "DROP_SHADOW",
        color: { r: 0, g: 0, b: 0, a: e.alpha },
        offset: { x: 0, y: e.y },
        radius: e.radius,
        spread: e.spread,
        visible: true,
        blendMode: "NORMAL"
      }];
    });
  });
}

function buildTextStyles() {
  return figma.getLocalTextStylesAsync().then(function (existing) {
    TEXT_STYLES.forEach(function (t) {
      var style = null;
      existing.forEach(function (s) { if (s.name === t.name) style = s; });
      if (!style) style = figma.createTextStyle();
      style.name = t.name;
      style.fontName = fontOf(t.role, t.weight);
      style.fontSize = t.size;
      style.lineHeight = { unit: "PIXELS", value: t.lineHeight };
      style.letterSpacing = { unit: "PERCENT", value: typeof t.tracking === "number" ? t.tracking : 0 };
      style.textCase = t.upper ? "UPPER" : "ORIGINAL";
    });
  });
}

// ---------------------------------------------------------------- コンポーネント

// 既にある同名のコンポーネントは触らない（インスタンスの参照が壊れるため）。
function findComponent(name) {
  var match = null;
  figma.currentPage.findAllWithCriteria({ types: ["COMPONENT", "COMPONENT_SET"] }).forEach(function (n) {
    if (n.name === name) match = n;
  });
  return match;
}

// ボタン1つ。fill と text は変数名で指定する。
function buttonVariant(variantName, spec) {
  var frame = stack("variant=" + variantName, "HORIZONTAL", {
    gap: 8,
    paddingLeft: 20, paddingRight: 20, paddingTop: 10, paddingBottom: 10,
    align: "CENTER", justify: "CENTER"
  });
  frame.cornerRadius = 999;
  if (spec.fillVar) frame.fills = [boundFill(spec.fillVar, spec.fillHex)];
  if (spec.strokeVar) {
    frame.strokes = [boundFill(spec.strokeVar, spec.strokeHex)];
    frame.strokeWeight = 1;
  }
  var label = text(spec.label, { role: "jp", weight: "semibold", size: 14, lineHeight: 20, fill: boundFill(spec.textVar, spec.textHex) });
  frame.appendChild(label);
  var component = figma.createComponent();
  component.name = frame.name;
  component.layoutMode = "HORIZONTAL";
  component.primaryAxisSizingMode = "AUTO";
  component.counterAxisSizingMode = "AUTO";
  component.cornerRadius = 999;
  component.paddingLeft = 20; component.paddingRight = 20;
  component.paddingTop = 10; component.paddingBottom = 10;
  component.itemSpacing = 8;
  component.counterAxisAlignItems = "CENTER";
  component.fills = frame.fills;
  component.strokes = frame.strokes;
  component.strokeWeight = 1;
  component.appendChild(label);
  frame.remove();
  return component;
}

function buildButton() {
  if (findComponent("Button")) return null;
  var variants = [
    buttonVariant("accent", { label: "ボタン", fillVar: paletteVars["accent"], fillHex: "#2994b9", textVar: paletteVars["accent-ink"], textHex: "#041c24" }),
    buttonVariant("invert", { label: "ボタン", fillVar: semanticLightVars["invert"], fillHex: "#0a0a0a", textVar: semanticLightVars["invert-fg"], textHex: "#f5f5f2" }),
    buttonVariant("onAccent", { label: "ボタン", fillVar: paletteVars["accent-ink"], fillHex: "#041c24", textVar: paletteVars["accent"], textHex: "#2994b9" }),
    buttonVariant("outline", { label: "ボタン", strokeVar: semanticLightVars["line-strong"], strokeHex: "#0a0a0a", textVar: semanticLightVars["fg"], textHex: "#0a0a0a" })
  ];
  var set = figma.combineAsVariants(variants, figma.currentPage);
  set.name = "Button";
  set.description = "src/lib/ui.ts の button()。variant=accent が既定、size は md のみ。";
  set.layoutMode = "VERTICAL";
  set.itemSpacing = 16;
  set.paddingTop = 24; set.paddingBottom = 24; set.paddingLeft = 24; set.paddingRight = 24;
  set.primaryAxisSizingMode = "AUTO";
  set.counterAxisSizingMode = "AUTO";
  return set;
}

function buildChip() {
  if (findComponent("Chip")) return null;
  var component = figma.createComponent();
  component.name = "Chip";
  component.description = "src/lib/ui.ts の CHIP。タグ・カテゴリ・ページ内ジャンプ。";
  component.layoutMode = "HORIZONTAL";
  component.primaryAxisSizingMode = "AUTO";
  component.counterAxisSizingMode = "AUTO";
  component.itemSpacing = 8;
  component.paddingLeft = 12; component.paddingRight = 12;
  component.paddingTop = 6; component.paddingBottom = 6;
  component.counterAxisAlignItems = "CENTER";
  component.cornerRadius = 999;
  component.fills = [];
  component.strokes = [boundFill(semanticLightVars["line-strong"], "#0a0a0a")];
  component.strokeWeight = 1;
  component.appendChild(text("チップ", { role: "jp", weight: "regular", size: 14, lineHeight: 20, fill: boundFill(semanticLightVars["fg"], "#0a0a0a") }));
  return component;
}

function badgeVariant(label, varName, hex) {
  var component = figma.createComponent();
  component.name = "category=" + label;
  component.layoutMode = "HORIZONTAL";
  component.primaryAxisSizingMode = "AUTO";
  component.counterAxisSizingMode = "AUTO";
  component.paddingLeft = 10; component.paddingRight = 10;
  component.paddingTop = 4; component.paddingBottom = 4;
  component.counterAxisAlignItems = "CENTER";
  component.cornerRadius = 999;
  component.fills = [boundFill(paletteVars[varName], hex)];
  component.appendChild(text(label, { role: "display", weight: "bold", size: 11, lineHeight: 16, tracking: 5, upper: true, fill: solid("#ffffff") }));
  return component;
}

function buildBadge() {
  if (findComponent("Badge")) return null;
  var set = figma.combineAsVariants([
    badgeVariant("SEO", "seo", "#4f7cff"),
    badgeVariant("GEO", "geo", "#a855f7"),
    badgeVariant("ニュース", "news", "#ff6b35")
  ], figma.currentPage);
  set.name = "Badge";
  set.description = "src/lib/categoryStyle.ts のカテゴリバッジ。文字は常に白。";
  set.layoutMode = "VERTICAL";
  set.itemSpacing = 12;
  set.paddingTop = 24; set.paddingBottom = 24; set.paddingLeft = 24; set.paddingRight = 24;
  set.primaryAxisSizingMode = "AUTO";
  set.counterAxisSizingMode = "AUTO";
  return set;
}

function buildCard() {
  if (findComponent("Card")) return null;
  var component = figma.createComponent();
  component.name = "Card";
  component.description = "src/lib/ui.ts の SURFACE.card + PADDING.card。角丸は radius-card。";
  component.layoutMode = "VERTICAL";
  component.primaryAxisSizingMode = "AUTO";
  component.counterAxisSizingMode = "FIXED";
  component.resize(546, 160);
  component.primaryAxisSizingMode = "AUTO"; // resize で FIXED に戻るので、縦は内容に合わせ直す
  component.itemSpacing = 12;
  component.paddingTop = 32; component.paddingBottom = 32;
  component.paddingLeft = 32; component.paddingRight = 32;
  component.fills = [boundFill(semanticLightVars["surface"], "#ffffff")];
  component.strokes = [boundFill(semanticLightVars["line"], "#0a0a0a")];
  component.strokeWeight = 1;
  component.cornerRadius = 24;
  if (shapeVars["radius-card"]) {
    ["topLeftRadius", "topRightRadius", "bottomLeftRadius", "bottomRightRadius"].forEach(function (corner) {
      component.setBoundVariable(corner, shapeVars["radius-card"]);
    });
  }
  var title = text("カードの見出し", { role: "jp", weight: "bold", size: 18, lineHeight: 28, tracking: -2.5, fill: boundFill(semanticLightVars["fg"], "#0a0a0a") });
  component.appendChild(title);
  title.layoutSizingHorizontal = "FILL";
  var body = text("説明文。トークンは globals.css を正とする。", { role: "jp", weight: "regular", size: 14, lineHeight: 24, fill: boundFill(semanticLightVars["mute"], "#6b6b66") });
  component.appendChild(body);
  body.layoutSizingHorizontal = "FILL";
  return component;
}

// ---------------------------------------------------------------- 早見表

function swatch(label, value, fillPaint, onDark) {
  var cell = stack(label, "VERTICAL", { gap: 0, radius: 16, clip: true });
  cell.counterAxisSizingMode = "FIXED";
  cell.resize(152, 112);
  cell.fills = [solid(onDark ? "#141414" : "#ffffff")];
  cell.strokes = [{ type: "SOLID", color: hexToRgb(onDark ? "#f5f5f2" : "#0a0a0a"), opacity: 0.12 }];
  cell.strokeWeight = 1;

  var plate = stack("plate", "VERTICAL", { gap: 0 });
  plate.counterAxisSizingMode = "FIXED";
  plate.primaryAxisSizingMode = "FIXED";
  plate.resize(152, 56);
  plate.fills = [fillPaint];
  cell.appendChild(plate);
  plate.layoutSizingHorizontal = "FILL";

  var meta = stack("meta", "VERTICAL", { gap: 2, paddingLeft: 12, paddingRight: 12, paddingTop: 8, paddingBottom: 8 });
  var nameText = text(label, { role: "display", weight: "semibold", size: 12, lineHeight: 16, fill: solid(onDark ? "#f5f5f2" : "#0a0a0a") });
  meta.appendChild(nameText);
  var valueText = text(value, { role: "mono", weight: "regular", size: 10, lineHeight: 14, fill: solid(onDark ? "#9c9c95" : "#6b6b66") });
  meta.appendChild(valueText);
  cell.appendChild(meta);
  meta.layoutSizingHorizontal = "FILL";
  nameText.layoutSizingHorizontal = "FILL";
  valueText.layoutSizingHorizontal = "FILL";
  return cell;
}

function sectionTitle(label) {
  return text(label, { role: "display", weight: "bold", size: 12, lineHeight: 16, tracking: 5, upper: true, fill: solid("#6b6b66") });
}

function buildCheatSheet(components) {
  // 早見表は毎回作り直す（値を変えたときに古い表が残らないように）。
  figma.currentPage.children.slice().forEach(function (n) { if (n.name === "Design Tokens") n.remove(); });

  var sheet = stack("Design Tokens", "VERTICAL", { gap: 40, padding: 64, fills: [solid("#f5f5f2")], radius: 24 });
  sheet.counterAxisSizingMode = "FIXED";
  sheet.resize(1240, 800);
  sheet.primaryAxisSizingMode = "AUTO"; // resize で FIXED に戻るので、縦は内容に合わせ直す

  var head = stack("head", "VERTICAL", { gap: 8 });
  head.appendChild(text("SEO GEO Lab Design Tokens", { role: "jp", weight: "bold", size: 30, lineHeight: 36, tracking: -2.5, fill: solid("#0a0a0a") }));
  head.appendChild(text("値の正は src/app/globals.css の @theme。このフレームは figma-plugin を実行するたび作り直される。", { role: "jp", weight: "regular", size: 14, lineHeight: 24, fill: solid("#6b6b66") }));
  sheet.appendChild(head);

  // パレット
  var paletteBlock = stack("palette", "VERTICAL", { gap: 12 });
  paletteBlock.appendChild(sectionTitle("Palette"));
  var paletteRow = stack("row", "HORIZONTAL", { gap: 12 });
  PALETTE.forEach(function (t) {
    paletteRow.appendChild(swatch(t.name, t.hex, boundFill(paletteVars[t.name], t.hex), false));
  });
  paletteBlock.appendChild(paletteRow);
  sheet.appendChild(paletteBlock);

  // セマンティック（ライト / ダーク）
  [
    { key: "light", label: "Semantic (Light)", onDark: false },
    { key: "dark", label: "Semantic (Dark)", onDark: true }
  ].forEach(function (mode) {
    var block = stack(mode.label, "VERTICAL", { gap: 12, padding: mode.onDark ? 24 : 0, radius: 16 });
    if (mode.onDark) block.fills = [solid("#0a0a0a")];
    block.appendChild(sectionTitle(mode.label));
    var rows = [stack("row-1", "HORIZONTAL", { gap: 12 }), stack("row-2", "HORIZONTAL", { gap: 12 })];
    SEMANTIC.forEach(function (t, i) {
      var spec = t[mode.key];
      var label = spec.alias ? "→ " + spec.alias : spec.hex + (typeof spec.alpha === "number" ? " / " + spec.alpha : "");
      var paint = spec.alias
        ? boundFill(paletteVars[spec.alias], PALETTE.filter(function (p) { return p.name === spec.alias; })[0].hex)
        : { type: "SOLID", color: hexToRgb(spec.hex), opacity: typeof spec.alpha === "number" ? spec.alpha : 1 };
      rows[i < 5 ? 0 : 1].appendChild(swatch(t.name, label, paint, mode.onDark));
    });
    rows.forEach(function (r) { block.appendChild(r); });
    sheet.appendChild(block);
  });

  // 形・幅・影
  var shapeBlock = stack("shape", "VERTICAL", { gap: 12 });
  shapeBlock.appendChild(sectionTitle("Shape & Size / Elevation"));
  var shapeRow = stack("row", "HORIZONTAL", { gap: 16, align: "CENTER" });
  [{ name: "radius-card", size: 24 }, { name: "radius-panel", size: 16 }].forEach(function (r) {
    var box = stack(r.name, "VERTICAL", { gap: 0, fills: [solid("#ffffff")], radius: r.size });
    box.counterAxisSizingMode = "FIXED";
    box.primaryAxisSizingMode = "FIXED";
    box.resize(120, 80);
    box.strokes = [{ type: "SOLID", color: hexToRgb("#0a0a0a"), opacity: 0.12 }];
    box.strokeWeight = 1;
    var cell = stack(r.name + "-cell", "VERTICAL", { gap: 8 });
    cell.appendChild(box);
    cell.appendChild(text(r.name + " / " + r.size + "px", { role: "mono", weight: "regular", size: 10, lineHeight: 14, fill: solid("#6b6b66") }));
    shapeRow.appendChild(cell);
  });
  ELEVATIONS.forEach(function (e) {
    var box = stack(e.name, "VERTICAL", { gap: 0, fills: [solid("#ffffff")], radius: 24 });
    box.counterAxisSizingMode = "FIXED";
    box.primaryAxisSizingMode = "FIXED";
    box.resize(160, 80);
    box.effects = [{ type: "DROP_SHADOW", color: { r: 0, g: 0, b: 0, a: e.alpha }, offset: { x: 0, y: e.y }, radius: e.radius, spread: e.spread, visible: true, blendMode: "NORMAL" }];
    var cell = stack(e.name + "-cell", "VERTICAL", { gap: 8 });
    cell.appendChild(box);
    cell.appendChild(text(e.name, { role: "mono", weight: "regular", size: 10, lineHeight: 14, fill: solid("#6b6b66") }));
    shapeRow.appendChild(cell);
  });
  SHAPE.filter(function (s) { return s.name.indexOf("container") === 0; }).forEach(function (s) {
    var cell = stack(s.name + "-cell", "VERTICAL", { gap: 4 });
    cell.appendChild(text(s.name, { role: "display", weight: "semibold", size: 12, lineHeight: 16, fill: solid("#0a0a0a") }));
    cell.appendChild(text(s.value + "px", { role: "mono", weight: "regular", size: 10, lineHeight: 14, fill: solid("#6b6b66") }));
    shapeRow.appendChild(cell);
  });
  shapeBlock.appendChild(shapeRow);
  sheet.appendChild(shapeBlock);

  // 文字
  var typeBlock = stack("type", "VERTICAL", { gap: 12 });
  typeBlock.appendChild(sectionTitle("Text styles"));
  TEXT_STYLES.forEach(function (t) {
    var row = stack(t.name, "HORIZONTAL", { gap: 24, align: "CENTER" });
    var meta = text(t.name + "  " + t.size + "/" + t.lineHeight, { role: "mono", weight: "regular", size: 10, lineHeight: 14, fill: solid("#6b6b66") });
    row.appendChild(meta);
    meta.resize(150, meta.height);
    var sample = text(t.role === "jp" ? "検索とAI検索の実務" : "SEO GEO Lab", {
      role: t.role, weight: t.weight, size: t.size, lineHeight: t.lineHeight, tracking: t.tracking, upper: t.upper, fill: solid("#0a0a0a")
    });
    row.appendChild(sample);
    typeBlock.appendChild(row);
  });
  sheet.appendChild(typeBlock);

  // コンポーネント
  var compBlock = stack("components", "VERTICAL", { gap: 12 });
  compBlock.appendChild(sectionTitle("Components"));
  var compRow = stack("row", "HORIZONTAL", { gap: 16, align: "CENTER" });
  components.forEach(function (node) {
    if (!node) return;
    if (node.type === "COMPONENT_SET") {
      node.children.forEach(function (variant) { compRow.appendChild(variant.createInstance()); });
    } else {
      compRow.appendChild(node.createInstance());
    }
  });
  compBlock.appendChild(compRow);
  sheet.appendChild(compBlock);

  // 既にあるノードの右隣に置く
  var maxX = 0;
  figma.currentPage.children.forEach(function (n) {
    if (n === sheet) return;
    maxX = Math.max(maxX, n.x + n.width);
  });
  sheet.x = maxX > 0 ? maxX + 120 : 0;
  sheet.y = 0;
  return sheet;
}

// ---------------------------------------------------------------- 実行

function main() {
  return resolveFonts()
    .then(buildPalette)
    .then(function () { return buildSemantic("Semantic (Light)", "Light", "light"); })
    .then(function () { return buildSemantic("Semantic (Dark)", "Dark", "dark"); })
    .then(buildShape)
    .then(buildEffectStyles)
    .then(buildTextStyles)
    .then(function () {
      var created = [buildButton(), buildChip(), buildBadge(), buildCard()];
      // 既にあったものは早見表でもそのまま使う
      var all = ["Button", "Chip", "Badge", "Card"].map(function (name) { return findComponent(name); });
      // 新規作成したコンポーネントは早見表の左側に整列させる
      var y = 0;
      created.forEach(function (node) {
        if (!node) return;
        node.x = 0;
        node.y = y;
        y += node.height + 48;
      });
      return buildCheatSheet(all);
    })
    .then(function (sheet) {
      figma.currentPage.selection = [sheet];
      figma.viewport.scrollAndZoomIntoView([sheet]);
      var counts = PALETTE.length + SEMANTIC.length * 2 + SHAPE.length;
      figma.closePlugin("変数" + counts + "個 / テキストスタイル" + TEXT_STYLES.length + "種 / 影" + ELEVATIONS.length + "種を反映しました");
    });
}

main().catch(function (error) {
  figma.closePlugin("失敗: " + (error && error.message ? error.message : String(error)));
});
