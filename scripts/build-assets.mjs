// Génère les visuels SVG du profil (thèmes clair et sombre) dans assets/.
// Usage : node scripts/build-assets.mjs
// Les SVG n'utilisent que des polices système : GitHub les affiche en <img>, sans police externe.
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

const THEMES = {
    dark: {
        page: '#0a0a0b', surface: '#111113', raised: '#18181b', window: '#0c0c0e', line: '#27272a', grid: '#2e2e33', edge: '#38383e',
        ink: '#fafafa', muted: '#a1a1aa', subtle: '#71717a', string: '#d4d4d8',
        accent: '#c6f135', accentText: '#c6f135', stroke: '#c6f135', onAccent: '#0a0a0b', glow: 0.17,
    },
    light: {
        page: '#fafafa', surface: '#ffffff', raised: '#f4f4f5', window: '#fafafa', line: '#e4e4e7', grid: '#d4d4d8', edge: '#dcdce0',
        ink: '#0a0a0b', muted: '#52525b', subtle: '#71717a', string: '#3f3f46',
        accent: '#c6f135', accentText: '#3f6212', stroke: '#65a30d', onAccent: '#0a0a0b', glow: 0.32,
    },
};

const SANS = "'Segoe UI Variable Display','Segoe UI',-apple-system,BlinkMacSystemFont,'Helvetica Neue',Helvetica,Arial,'Noto Sans Arabic',sans-serif";
const MONO = "ui-monospace,SFMono-Regular,'Cascadia Code','JetBrains Mono',Menlo,Consolas,'Liberation Mono',monospace";

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const n = (v) => Number(v.toFixed(2));
const monoWidth = (s, size) => [...s].length * size * 0.6;

/** Texte à chasse fixe calé sur une largeur connue, quelle que soit la police système. */
function mono(x, y, text, size, fill, extra = '') {
    return `<text x="${n(x)}" y="${n(y)}" class="mono" font-size="${size}" fill="${fill}" textLength="${n(monoWidth(text, size))}" lengthAdjust="spacing" ${extra}>${esc(text)}</text>`;
}

function chip(x, y, label, t, { size = 12, padX = 12, h = 28, fill = 'none', stroke = t.line, color = t.muted } = {}) {
    const w = monoWidth(label, size) + padX * 2;
    return {
        w,
        svg: `<rect x="${n(x)}" y="${n(y)}" width="${n(w)}" height="${h}" rx="${h / 2}" fill="${fill}" stroke="${stroke}"/>`
            + mono(x + padX, y + h / 2 + size * 0.36, label, size, color),
    };
}

function chips(x, y, labels, t, opts = {}, gap = 8) {
    let cx = x;
    return labels.map((l) => {
        const c = chip(cx, y, l, t, opts);
        cx += c.w + gap;
        return c.svg;
    }).join('');
}

function svg(w, h, title, body, css = '') {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img" aria-labelledby="title">
<title id="title">${esc(title)}</title>
<style>
.sans{font-family:${SANS}}
.mono{font-family:${MONO}}
${css}
@media (prefers-reduced-motion: reduce){*{animation:none!important}}
</style>
${body}
</svg>
`;
}

function dotGrid(id, t, w, h, cx, cy) {
    return `<defs>
<pattern id="${id}" width="24" height="24" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="1.2" fill="${t.grid}"/></pattern>
<radialGradient id="${id}-fade" cx="${cx}" cy="${cy}" r="0.75"><stop offset="0" stop-color="#fff" stop-opacity="1"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>
<mask id="${id}-mask"><rect width="${w}" height="${h}" fill="url(#${id}-fade)"/></mask>
<radialGradient id="${id}-glow" cx="${cx}" cy="${cy}" r="0.55"><stop offset="0" stop-color="${t.accent}" stop-opacity="${t.glow}"/><stop offset="1" stop-color="${t.accent}" stop-opacity="0"/></radialGradient>
</defs>
<rect width="${w}" height="${h}" fill="url(#${id})" mask="url(#${id}-mask)"/>
<rect width="${w}" height="${h}" fill="url(#${id}-glow)"/>`;
}

// ---------------------------------------------------------------- Bannière
function hero(t) {
    const W = 1200, H = 460;
    const lines = [
        'building full-stack SaaS platforms',
        'training NLP & computer-vision models',
        'writing fast, concurrent code in Rust',
    ];
    const size = 19, slot = 100 / lines.length;
    let css = `
.caret{animation:blink 1.05s steps(1) infinite}
@keyframes blink{50%{opacity:0}}
.ping{transform-box:fill-box;transform-origin:center;animation:ping 2.4s ease-out infinite}
@keyframes ping{0%{transform:scale(1);opacity:.7}100%{transform:scale(3);opacity:0}}
.pulse,.glow,.trail{opacity:0}
@keyframes g{0%{opacity:0}3%{opacity:1}16%{opacity:0}100%{opacity:0}}
@keyframes tr{0%{opacity:0}6%{opacity:.85}20%{opacity:0}100%{opacity:0}}
@media (prefers-reduced-motion: reduce){.line{opacity:0}.l0{opacity:1}.l0 .cover{transform:translateX(600px)}}
`;
    const term = lines.map((text, i) => {
        const o = i * slot, w = n(monoWidth(text, size)), count = [...text].length;
        const at = (f) => `${n(o + f * slot)}%`;
        css += `.l${i}{animation:v${i} 13.5s infinite step-end}
@keyframes v${i}{0%{opacity:${i === 0 ? 1 : 0}}${i > 0 ? `${n(o)}%{opacity:1}` : ''}${n(o + slot)}%{opacity:0}100%{opacity:0}}
.l${i} .cover{animation:c${i} 13.5s infinite}
@keyframes c${i}{0%,${at(0)}{transform:translateX(0);animation-timing-function:steps(${count},end)}${at(0.4)}{transform:translateX(${w}px);animation-timing-function:linear}${at(0.84)}{transform:translateX(${w}px);animation-timing-function:steps(${count},end)}${at(0.96)},100%{transform:translateX(0)}}
`;
        return `<g class="line l${i}">${mono(46, 36, text, size, t.ink)}<g class="cover"><rect x="46" y="6" width="640" height="46" fill="${t.surface}"/><rect class="caret" x="47" y="17" width="10" height="24" rx="2" fill="${t.accent}"/></g></g>`;
    }).join('');

    // Réseau de neurones : 4 couches, impulsions qui traversent le graphe.
    const layers = [4, 6, 6, 3].map((count, li) => {
        const x = 850 + li * 92, gap = count === 6 ? 50 : count === 4 ? 66 : 84;
        return Array.from({ length: count }, (_, k) => ({ x, y: 226 + (k - (count - 1) / 2) * gap }));
    });
    let edges = '';
    for (let li = 0; li < layers.length - 1; li++) {
        for (const a of layers[li]) for (const b of layers[li + 1]) {
            edges += `<line x1="${a.x}" y1="${n(a.y)}" x2="${b.x}" y2="${n(b.y)}" stroke="${t.edge}" stroke-width="1"/>`;
        }
    }
    const routes = [[0, 1, 2, 0], [1, 3, 1, 1], [2, 0, 4, 2], [3, 5, 3, 1], [0, 2, 5, 2], [1, 4, 0, 0], [2, 2, 2, 1], [3, 1, 4, 2]];
    let pulses = '', glows = '', trails = '';
    routes.forEach((route, k) => {
        const pts = route.map((idx, li) => layers[li][idx]);
        const delay = -k * 0.75;
        const tr = (p) => `transform:translate(${p.x}px,${n(p.y)}px)`;
        css += `@keyframes p${k}{0%{${tr(pts[0])};opacity:0}4%{opacity:1}16.667%{${tr(pts[1])}}33.333%{${tr(pts[2])}}46%{opacity:1}50%{${tr(pts[3])};opacity:0}100%{${tr(pts[3])};opacity:0}}\n`;
        pulses += `<g class="pulse" style="animation:p${k} 6s linear ${delay}s infinite"><circle r="10" fill="${t.stroke}" opacity=".22" filter="url(#soft)"/><circle r="3.6" fill="${t.stroke}"/></g>`;
        pts.forEach((p, li) => {
            glows += `<circle class="glow" cx="${p.x}" cy="${n(p.y)}" r="6.5" fill="${t.stroke}" style="animation:g 6s linear ${n(delay + li)}s infinite"/>`;
            if (li < 3) {
                const q = pts[li + 1];
                trails += `<line class="trail" x1="${p.x}" y1="${n(p.y)}" x2="${q.x}" y2="${n(q.y)}" stroke="${t.stroke}" stroke-width="1.4" style="animation:tr 6s linear ${n(delay + li)}s infinite"/>`;
            }
        });
    });
    const nodes = layers.flat().map((p) => `<circle cx="${p.x}" cy="${n(p.y)}" r="6.5" fill="${t.surface}" stroke="${t.subtle}" stroke-width="1.4"/>`).join('');

    const hello = mono(98, 92, 'HELLO · BONJOUR ·', 13, t.muted);
    const helloW = monoWidth('HELLO · BONJOUR ·', 13);

    const body = `
<rect width="${W}" height="${H}" rx="24" fill="${t.page}"/>
<defs><clipPath id="frame"><rect width="${W}" height="${H}" rx="24"/></clipPath><filter id="soft" x="-1" y="-1" width="3" height="3"><feGaussianBlur stdDeviation="3"/></filter></defs>
<g clip-path="url(#frame)">${dotGrid('dots', t, W, H, 0.78, 0.5)}</g>
<rect x=".5" y=".5" width="${W - 1}" height="${H - 1}" rx="23.5" fill="none" stroke="${t.line}"/>

<rect x="64" y="70" width="${n(helloW + 112)}" height="32" rx="16" fill="${t.surface}" stroke="${t.line}"/>
<circle cx="83" cy="86" r="4" fill="${t.stroke}"/><circle class="ping" cx="83" cy="86" r="4" fill="${t.stroke}"/>
${hello}
<text x="${n(104 + helloW)}" y="91" class="sans" font-size="15" fill="${t.muted}">مرحبا</text>

<text x="60" y="196" class="sans" font-size="92" font-weight="700" letter-spacing="-3" fill="${t.ink}">Saada Samir<tspan fill="${t.stroke}">.</tspan></text>
<text x="64" y="244" class="sans" font-size="25" font-weight="600" fill="${t.ink}">AI Engineer · Software Engineering Lead</text>
<text x="64" y="279" class="sans" font-size="19" fill="${t.muted}">Full-stack developer · machine learning, NLP &amp; scalable systems</text>

<rect x="64.5" y="314.5" width="643" height="57" rx="14" fill="${t.surface}" stroke="${t.line}"/>
${mono(86, 350, '$', size, t.accentText, 'font-weight="700"')}
<svg x="65" y="315" width="600" height="56" viewBox="0 0 600 56">${term}</svg>

${mono(64, 422, 'AI · NLP · COMPUTER VISION · DATA MINING · FULL-STACK · SYSTEMS', 12.5, t.subtle, 'letter-spacing="1"')}

<g>${edges}${trails}${nodes}${glows}${pulses}</g>
${mono(850, 422, 'input', 11, t.subtle)}${mono(1080, 422, 'output', 11, t.subtle)}
`;
    return svg(W, H, 'Saada Samir — AI Engineer, Software Engineering Lead and full-stack developer', body, css);
}

// ---------------------------------------------------------------- Carte « whoami »
function whoami(t) {
    const K = 'kw', S = 'str', P = 'pun', I = 'id', C = 'com';
    const code = [
        [[C, '// whoami']],
        [[K, 'const '], [I, 'samir'], [P, ' = {']],
        [[I, '  role:     '], [S, '"AI Engineer & Software Engineering Lead"'], [P, ',']],
        [[I, '  craft:    '], [S, '"full-stack products, from model to interface"'], [P, ',']],
        [[I, '  focus:    '], [P, '['], [S, '"NLP"'], [P, ', '], [S, '"computer vision"'], [P, ', '], [S, '"data mining"'], [P, ', '], [S, '"IR"'], [P, '],']],
        [[I, '  building: '], [S, '"AI-powered products & scalable platforms"'], [P, ',']],
        [[I, '  stack:    '], [P, '['], [S, '"Python"'], [P, ', '], [S, '"Rust"'], [P, ', '], [S, '"Laravel"'], [P, ', '], [S, '"Vue"'], [P, ', '], [S, '"PostgreSQL"'], [P, '],']],
        [[I, '  speaks:   '], [P, '['], [S, '"العربية"'], [P, ', '], [S, '"Français"'], [P, ', '], [S, '"English"'], [P, '],']],
        [[P, '};']],
    ];
    const size = 17, lh = 32, top = 96, W = 960, H = top + code.length * lh + 40;
    const colors = { kw: t.accentText, str: t.string, pun: t.subtle, id: t.ink, com: t.subtle };
    let css = `.ln{opacity:0;animation:in .5s ease-out forwards}
@keyframes in{from{opacity:0;transform:translateX(-8px)}to{opacity:1;transform:none}}
.caret{animation:blink 1.05s steps(1) infinite}
@keyframes blink{50%{opacity:0}}
@media (prefers-reduced-motion: reduce){.ln{opacity:1}}`;
    const rows = code.map((tokens, i) => {
        const y = top + i * lh;
        const spans = tokens.map(([c, s]) => `<tspan fill="${colors[c]}"${c === C ? ' font-style="italic"' : ''}>${esc(s)}</tspan>`).join('');
        return `<g class="ln" style="animation-delay:${n(0.25 + i * 0.12)}s"><text x="40" y="${y}" class="mono" font-size="13" fill="${t.subtle}" opacity=".7">${String(i + 1).padStart(2, ' ')}</text><text x="84" y="${y}" class="mono" font-size="${size}" xml:space="preserve">${spans}</text></g>`;
    }).join('');
    const lastY = top + (code.length - 1) * lh;
    const body = `
<rect x=".5" y=".5" width="${W - 1}" height="${H - 1}" rx="20" fill="${t.surface}" stroke="${t.line}"/>
<path d="M.5 52.5 H${W - 0.5}" stroke="${t.line}"/>
<circle cx="30" cy="27" r="6" fill="${t.line}"/><circle cx="50" cy="27" r="6" fill="${t.line}"/><circle cx="70" cy="27" r="6" fill="${t.line}"/>
<rect x="96" y="12" width="${n(monoWidth('whoami.ts', 13) + 28)}" height="30" rx="8" fill="${t.raised}"/>
${mono(110, 32, 'whoami.ts', 13, t.muted)}
${mono(W - 32 - monoWidth('TypeScript · UTF-8', 12), 32, 'TypeScript · UTF-8', 12, t.subtle)}
<rect x="0" y="53" width="3" height="${H - 73}" fill="${t.accent}" opacity=".9"/>
${rows}
<rect class="caret" x="${n(84 + monoWidth('};', size) + 4)}" y="${lastY - 15}" width="9" height="20" rx="2" fill="${t.accent}"/>
`;
    return svg(W, H, 'whoami: AI Engineer and Software Engineering Lead, full-stack products from model to interface; focus NLP, computer vision, data mining, information retrieval; building AI-powered products and scalable platforms; speaks Arabic, French and English', body, css);
}

// ---------------------------------------------------------------- Ce que je fais
function chipRows(x, y, labels, maxW, t, opts) {
    const rows = [[]];
    let width = 0;
    for (const l of labels) {
        const w = monoWidth(l, opts.size) + opts.padX * 2 + 8;
        if (width + w > maxW && rows[rows.length - 1].length) { rows.push([]); width = 0; }
        rows[rows.length - 1].push(l);
        width += w;
    }
    return rows.map((r, i) => chips(x, y + i * (opts.h + 8), r, t, opts)).join('');
}

function smooth(pts) {
    let d = `M${n(pts[0][0])} ${n(pts[0][1])}`;
    for (let i = 0; i < pts.length - 1; i++) {
        const p0 = pts[i - 1] ?? pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] ?? p2;
        const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
        const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
        d += ` C${n(c1[0])} ${n(c1[1])} ${n(c2[0])} ${n(c2[1])} ${n(p2[0])} ${n(p2[1])}`;
    }
    return d;
}

function pillars(t) {
    const W = 1200, H = 430, PW = 384, GAP = 24;
    const items = [
        { title: 'AI & Machine Learning', text: 'NLP, computer vision, data mining and information retrieval: from raw data to evaluated models.', tags: ['PYTORCH', 'TENSORFLOW', 'SCIKIT-LEARN', 'OPENCV'] },
        { title: 'Full-stack products', text: 'SaaS platforms, dashboards and APIs, designed end to end, from the database to the interface.', tags: ['LARAVEL', 'VUE', 'REACT', 'NODE.JS', 'POSTGRESQL'] },
        { title: 'Systems & performance', text: 'Concurrency, compilers and low-level code, where speed and correctness both matter.', tags: ['RUST', 'C', 'JAVA', 'FLEX/BISON'] },
    ];
    let css = `
.draw{stroke-dasharray:1;animation:draw 9s cubic-bezier(.3,.7,.2,1) infinite}
@keyframes draw{0%{stroke-dashoffset:1;opacity:1}28%{stroke-dashoffset:0}90%{stroke-dashoffset:0;opacity:1}100%{stroke-dashoffset:0;opacity:0}}
.scan{animation:scan 6s steps(1) infinite}
@keyframes scan{0%{transform:translate(0,0)}16.66%{transform:translate(22px,22px)}33.33%{transform:translate(44px,44px)}50%{transform:translate(66px,66px)}66.66%{transform:translate(88px,88px)}83.33%{transform:translate(110px,110px)}}
.nav{animation:nav 8s cubic-bezier(.6,0,.2,1) infinite}
@keyframes nav{0%,22%{transform:translateY(0)}25%,47%{transform:translateY(22px)}50%,72%{transform:translateY(44px)}75%,97%{transform:translateY(66px)}100%{transform:translateY(0)}}
.bar{transform-box:fill-box;transform-origin:left;animation:bar 9s linear infinite}
@keyframes bar{0%,46%{transform:scaleX(0)}68%,100%{transform:scaleX(1)}}
.caret{animation:blink 1.05s steps(1) infinite}
@keyframes blink{50%{opacity:0}}
`;
    const panels = items.map((it, i) => {
        const x = i * (PW + GAP), vx = x + 16, vy = 16, vw = PW - 32, vh = 172;
        let visual = '';
        if (i === 0) {
            // Matrice de confusion et courbe d'apprentissage.
            let seed = 7;
            const rnd = () => ((seed = (seed * 9301 + 49297) % 233280) / 233280);
            let cells = '';
            for (let r = 0; r < 6; r++) for (let c = 0; c < 6; c++) {
                const v = r === c ? 0.75 + rnd() * 0.25 : rnd() * 0.22;
                cells += `<rect x="${vx + 20 + c * 22}" y="${vy + 22 + r * 22}" width="18" height="18" rx="4" fill="${r === c ? t.stroke : t.subtle}" opacity="${n(r === c ? v : 0.08 + v)}"/>`;
            }
            const scan = `<rect class="scan" x="${vx + 18}" y="${vy + 20}" width="22" height="22" rx="6" fill="none" stroke="${t.ink}" stroke-width="1.5" opacity=".8"/>`;
            const cx0 = vx + 182, cw = 150, cy0 = vy + 30, ch = 110;
            const loss = [0.95, 0.62, 0.45, 0.36, 0.3, 0.255, 0.22, 0.2, 0.185, 0.175, 0.168];
            const pts = loss.map((v, k) => [cx0 + (k * cw) / (loss.length - 1), cy0 + (1 - v) * ch]);
            const axes = `<path d="M${cx0} ${cy0} V${cy0 + ch} H${cx0 + cw}" fill="none" stroke="${t.line}"/>`;
            visual = cells + scan + axes
                + `<path class="draw" d="${smooth(pts)}" pathLength="1" fill="none" stroke="${t.stroke}" stroke-width="2.2" stroke-linecap="round"/>`
                + mono(cx0, cy0 + ch + 20, 'loss / epoch', 10, t.subtle);
        } else if (i === 1) {
            // Maquette d'application : barre latérale, tuiles, graphique.
            const sx = vx + 14, sy = vy + 14;
            let side = `<rect x="${sx}" y="${sy}" width="70" height="${vh - 28}" rx="8" fill="${t.raised}"/>`
                + `<rect x="${sx + 10}" y="${sy + 12}" width="16" height="16" rx="5" fill="${t.accent}"/>`;
            for (let k = 0; k < 4; k++) side += `<rect x="${sx + 12}" y="${sy + 44 + k * 22}" width="${[40, 32, 44, 28][k]}" height="6" rx="3" fill="${t.subtle}" opacity=".45"/>`;
            side += `<rect class="nav" x="${sx + 4}" y="${sy + 39}" width="3" height="16" rx="1.5" fill="${t.stroke}"/>`;
            const mx = sx + 84, mw = vw - 112;
            let tiles = '';
            for (let k = 0; k < 3; k++) {
                const tx = mx + k * ((mw - 16) / 3 + 8), tw = (mw - 16) / 3;
                tiles += `<rect x="${n(tx)}" y="${sy}" width="${n(tw)}" height="44" rx="7" fill="none" stroke="${t.line}"/><rect x="${n(tx + 8)}" y="${sy + 10}" width="${n(tw * 0.45)}" height="5" rx="2.5" fill="${t.subtle}" opacity=".5"/><rect x="${n(tx + 8)}" y="${sy + 24}" width="${n(tw * 0.65)}" height="9" rx="3" fill="${t.ink}" opacity=".85"/>`;
            }
            const gy = sy + 56, gh = vh - 28 - 56;
            const series = [30, 38, 34, 46, 44, 55, 52, 63, 70, 68, 80];
            const pts = series.map((v, k) => [mx + 10 + (k * (mw - 20)) / (series.length - 1), gy + gh - 10 - (v / 90) * (gh - 20)]);
            visual = side + tiles + `<rect x="${mx}" y="${gy}" width="${mw}" height="${gh}" rx="7" fill="none" stroke="${t.line}"/>`
                + `<path class="draw" d="${smooth(pts)}" pathLength="1" fill="none" stroke="${t.stroke}" stroke-width="2.2" stroke-linecap="round"/>`;
        } else {
            // Terminal : compilation, exécution parallèle, compilateur.
            const lines = [
                [t.accentText, '$ cargo build --release'],
                [t.subtle, '  Finished `release` profile [optimized]'],
                [t.accentText, '$ cargo run --release -- input.txt'],
                null,
                [t.accentText, '$ bison -d syntaxique.y && flex lexicale.l'],
            ];
                        visual = lines.map((l, k) => {
                const y = vy + 34 + k * 26, delay = `style="animation:tl${k} 9s steps(1) infinite"`;
                css += `@keyframes tl${k}{0%{opacity:0}${n(4 + k * 14)}%{opacity:1}96%{opacity:1}100%{opacity:0}}\n`;
                if (!l) {
                    return `<g ${delay}><rect x="${vx + 18}" y="${y - 10}" width="200" height="10" rx="3" fill="${t.raised}"/><rect class="bar" x="${vx + 18}" y="${y - 10}" width="200" height="10" rx="3" fill="${t.stroke}"/>${mono(vx + 228, y, '100%', 11, t.muted)}</g>`;
                }
                const size = 11.5, text = l[1];
                return `<g ${delay}>${mono(vx + 18, y, text, size, l[0])}</g>`;
            }).join('') + `<rect class="caret" x="${vx + 18}" y="${vy + 34 + 5 * 26 - 12}" width="8" height="15" rx="2" fill="${t.accent}"/>`;
        }
        const desc = wrap(it.text, 40).map((line, k) => `<text x="${x + 24}" y="${296 + k * 24}" class="sans" font-size="16" fill="${t.muted}">${esc(line)}</text>`).join('');
        return `<g>
<rect x="${x + 0.5}" y=".5" width="${PW - 1}" height="${H - 1}" rx="20" fill="${t.surface}" stroke="${t.line}"/>
<rect x="${vx}" y="${vy}" width="${vw}" height="${vh}" rx="12" fill="${t.window}" stroke="${t.line}"/>
${visual}
${mono(x + 24, 226, String(i + 1).padStart(2, '0'), 12, t.accentText, 'letter-spacing="1"')}
<text x="${x + 23}" y="262" class="sans" font-size="24" font-weight="700" letter-spacing="-.5" fill="${t.ink}">${esc(it.title)}</text>
${desc}
${chipRows(x + 24, 378, it.tags, PW - 40, t, { size: 10.5, padX: 9, h: 26 })}
</g>`;
    }).join('\n');
    return svg(W, H, 'What I do: AI and machine learning (NLP, computer vision, data mining, information retrieval); full-stack products (SaaS platforms, dashboards and APIs); systems and performance (concurrency, compilers, low-level code in Rust, C and Java)', panels, css);
}

// ---------------------------------------------------------------- Cartes projets
const LANG = { Rust: '#dea584', C: '#8e8e93', Python: '#3572a5', Java: '#b07219', Jupyter: '#da5b0b' };
const PROJECTS = [
    { slug: 'word-frequency', lang: 'Rust', title: 'Parallel Word Counter', text: 'Multi-threaded word frequency engine for large text files, with rayon, safe shared state and a live progress bar.', tags: ['rayon', 'concurrency', 'cli'] },
    { slug: 'mini-py-compiler', lang: 'C', title: 'MiniPy Compiler', text: 'A compiler for the MiniPy language: Flex lexer, Bison parser, semantic checks, symbol table and quadruple code.', tags: ['flex', 'bison', 'compilers'] },
    { slug: 'tweet-classifier', lang: 'Jupyter', title: 'Tweet Sentiment Classifier', text: 'Sentiment analysis on 1.6 million tweets: text cleaning, then classical models benchmarked against a Keras network.', tags: ['nlp', 'scikit-learn', 'tensorflow'] },
    { slug: 'tech-agent', lang: 'Java', title: 'Multi-Agent Auctions', text: 'Buyer and seller agents negotiating on JADE, with agent migration across containers and platforms.', tags: ['jade', 'multi-agent', 'mobility'] },
    { slug: 'nlp-labs', lang: 'Jupyter', title: 'NLP Labs', text: 'Eight labs, from text preprocessing to LDA topic models, clustering and Word2Vec / Doc2Vec embeddings.', tags: ['nlp', 'lda', 'word2vec'] },
    { slug: 'qr-vision', lang: 'Python', title: 'Real-time QR Vision', text: 'QR detection and decoding on a live camera stream, with CLAHE contrast enhancement and Gaussian denoising.', tags: ['opencv', 'pyzbar', 'vision'] },
];

function wrap(text, max) {
    const out = [''];
    for (const word of text.split(' ')) {
        const cur = out[out.length - 1];
        if ((cur + ' ' + word).trim().length > max) out.push(word);
        else out[out.length - 1] = (cur + ' ' + word).trim();
    }
    return out;
}

function card(p, i, t) {
    const W = 600, H = 236;
    const lines = wrap(p.text, 58).map((l, k) => `<text x="30" y="${134 + k * 25}" class="sans" font-size="16.5" fill="${t.muted}">${esc(l)}</text>`).join('');
    const lang = p.lang.toUpperCase();
    const index = String(i + 1).padStart(2, '0');
    const body = `
<rect x=".5" y=".5" width="${W - 1}" height="${H - 1}" rx="18" fill="${t.surface}" stroke="${t.line}"/>
<rect x="30" y="0" width="44" height="3" rx="1.5" fill="${t.accent}"/>
<circle cx="36" cy="42" r="6" fill="${LANG[p.lang]}"/>
${mono(50, 46.5, lang, 12, t.muted, 'letter-spacing="1"')}
${mono(W - 64 - monoWidth(index, 12), 46.5, index, 12, t.subtle)}
<path d="M${W - 44} 48 L${W - 32} 36 M${W - 41} 36 H${W - 32} V45" fill="none" stroke="${t.muted}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
<text x="29" y="96" class="sans" font-size="27" font-weight="700" letter-spacing="-.6" fill="${t.ink}">${esc(p.title)}</text>
${lines}
${chips(30, 190, p.tags, t, { size: 11.5, padX: 10, h: 26 })}
`;
    return svg(W, H, `${p.title} (${p.lang}): ${p.text}`, body);
}

// ---------------------------------------------------------------- Boutons et pied de page
function button(label, t, primary = false) {
    const size = 14, padX = 22, arrow = 22;
    const W = Math.round(monoWidth(label, size) + padX * 2 + arrow), H = 52;
    const fill = primary ? t.accent : t.surface, color = primary ? t.onAccent : t.ink;
    const ax = W - padX - 10;
    const body = `
<rect x=".5" y=".5" width="${W - 1}" height="${H - 1}" rx="${(H - 1) / 2}" fill="${fill}" stroke="${primary ? t.accent : t.line}"/>
${mono(padX, 31, label, size, color, 'font-weight="600" letter-spacing="1"')}
<path d="M${ax} 31 L${ax + 9} 22 M${ax + 2} 22 H${ax + 9} V29" fill="none" stroke="${color}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>`;
    return svg(W, H, label, body);
}

function footer(t) {
    const W = 1200, H = 300;
    const body = `
<rect width="${W}" height="${H}" rx="24" fill="${t.page}"/>
<defs><clipPath id="frame"><rect width="${W}" height="${H}" rx="24"/></clipPath></defs>
<g clip-path="url(#frame)">${dotGrid('fdots', t, W, H, 0.85, 0.3)}</g>
<rect x=".5" y=".5" width="${W - 1}" height="${H - 1}" rx="23.5" fill="none" stroke="${t.line}"/>
${mono(64, 84, "WHAT'S NEXT", 13, t.accentText, 'letter-spacing="1"')}
<text x="60" y="152" class="sans" font-size="54" font-weight="700" letter-spacing="-1.6" fill="${t.ink}">Have an idea worth building?</text>
<text x="60" y="214" class="sans" font-size="54" font-weight="700" letter-spacing="-1.6" fill="${t.ink}">Let's make it real<tspan fill="${t.stroke}">.</tspan></text>
${mono(64, 258, 'saadasamir449@gmail.com', 15, t.muted)}
${mono(W - 64 - monoWidth('À BIENTÔT · SEE YOU SOON ·', 12) - 52, 258, 'À BIENTÔT · SEE YOU SOON ·', 12, t.subtle)}
<text x="${W - 64}" y="258" class="sans" font-size="14" text-anchor="end" fill="${t.subtle}">إلى اللقاء</text>
`;
    return svg(W, H, "What's next: have an idea worth building? Let's make it real. Write to saadasamir449@gmail.com", body);
}

// ---------------------------------------------------------------- Écriture
const write = (path, content) => {
    const file = join(ROOT, 'assets', path);
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(file, content);
};

for (const [name, t] of Object.entries(THEMES)) {
    write(`hero-${name}.svg`, hero(t));
    write(`whoami-${name}.svg`, whoami(t));
    write(`pillars-${name}.svg`, pillars(t));
    write(`footer-${name}.svg`, footer(t));
    PROJECTS.forEach((p, i) => write(`cards/${p.slug}-${name}.svg`, card(p, i, t)));
    write(`buttons/talk-${name}.svg`, button("LET'S TALK", t, true));
    write(`buttons/linkedin-${name}.svg`, button('LINKEDIN', t));
    write(`buttons/repos-${name}.svg`, button('REPOSITORIES', t));
}
console.log('assets generated');
