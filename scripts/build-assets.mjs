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
        'building Tadbir, an ERP for Algerian SMEs',
        'training NLP & computer-vision models',
        'shipping Laravel · Vue · Python · Rust',
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

${mono(64, 422, 'AI · NLP · COMPUTER VISION · DATA MINING · ERP SYSTEMS', 12.5, t.subtle, 'letter-spacing="1"')}

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
        [[I, '  shipping: '], [S, '"Tadbir, the ERP for Algerian SMEs"'], [P, ',']],
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
    return svg(W, H, 'whoami: AI Engineer and Software Engineering Lead, full-stack products from model to interface; focus NLP, computer vision, data mining, information retrieval; shipping Tadbir, the ERP for Algerian SMEs; speaks Arabic, French and English', body, css);
}

// ---------------------------------------------------------------- Tadbir
function tadbir(t) {
    const W = 1200, H = 664;
    const features = [
        'SCF accounting, closing and statements',
        'G50 and annual tax returns',
        'Payroll with CNAS and IRG',
        'Sales, purchases, stock, point of sale',
        'Multi-tenant, row-level security',
        'French and Arabic, right-to-left ready',
    ];
    const feat = features.map((f, i) => {
        const y = 318 + i * 42;
        return `<rect x="64" y="${y - 16}" width="20" height="20" rx="6" fill="${t.accent}"/><path d="M69 ${y - 6} l3.6 3.6 l6.4 -7" fill="none" stroke="${t.onAccent}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/><text x="100" y="${y}" class="sans" font-size="18" fill="${t.ink}">${esc(f)}</text>`;
    }).join('');

    // Maquette de l'application (données de démonstration).
    const X = 556, Y = 52, MW = 600, MH = 548;
    const nav = ['Tableau de bord', 'Ventes', 'Achats', 'Stock', 'Comptabilité', 'Paie', 'Fiscalité', 'Trésorerie'];
    const navSvg = nav.map((label, i) => {
        const y = Y + 112 + i * 34;
        const active = i === 0;
        return (active ? `<rect x="${X + 12}" y="${y - 21}" width="132" height="30" rx="8" fill="${t.raised}"/><rect x="${X + 12}" y="${y - 14}" width="3" height="16" rx="1.5" fill="${t.accent}"/>` : '')
            + `<rect x="${X + 26}" y="${y - 11}" width="10" height="10" rx="3" fill="none" stroke="${active ? t.stroke : t.subtle}" stroke-width="1.4"/>`
            + `<text x="${X + 46}" y="${y - 1}" class="sans" font-size="12.5" fill="${active ? t.ink : t.muted}"${active ? ' font-weight="600"' : ''}>${esc(label)}</text>`;
    }).join('');

    const MX = X + 172, MWIDTH = MW - 172 - 22;
    const kpis = [['Chiffre d\'affaires', '48,2 M', '+12,4 %'], ['Marge brute', '13,9 M', '+4,1 %'], ['Trésorerie', '9,7 M', '13 sem.']];
    const kw = (MWIDTH - 20) / 3;
    const kpiSvg = kpis.map(([label, value, delta], i) => {
        const x = MX + i * (kw + 10), y = Y + 110;
        return `<rect x="${n(x)}" y="${y}" width="${n(kw)}" height="86" rx="12" fill="${t.surface}" stroke="${t.line}"/>
<text x="${n(x + 14)}" y="${y + 24}" class="sans" font-size="11.5" fill="${t.muted}">${esc(label)}</text>
<text x="${n(x + 14)}" y="${y + 56}" class="sans" font-size="23" font-weight="700" fill="${t.ink}">${esc(value)}<tspan font-size="12" font-weight="500" fill="${t.subtle}"> DA</tspan></text>
${mono(x + 14, y + 74, delta, 10.5, i < 2 ? t.accentText : t.subtle)}`;
    }).join('');

    const cy = Y + 212, ch = 178;
    const data = [28, 31, 29.5, 34, 36, 33.5, 38, 41, 39.5, 44, 46, 48.2];
    const px = MX + 18, pw = MWIDTH - 36, pt = cy + 46, ph = 98;
    const pts = data.map((v, i) => [px + (i * pw) / (data.length - 1), pt + ph - ((v - 24) / 26) * ph]);
    let d = `M${n(pts[0][0])} ${n(pts[0][1])}`;
    for (let i = 0; i < pts.length - 1; i++) {
        const p0 = pts[i - 1] ?? pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] ?? p2;
        const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
        const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
        d += ` C${n(c1[0])} ${n(c1[1])} ${n(c2[0])} ${n(c2[1])} ${n(p2[0])} ${n(p2[1])}`;
    }
    const last = pts[pts.length - 1];
    const area = `${d} L${n(last[0])} ${pt + ph} L${n(pts[0][0])} ${pt + ph} Z`;
    const grid = [0, 1, 2].map((k) => `<path d="M${px} ${n(pt + (k * ph) / 2)} H${px + pw}" stroke="${t.line}" stroke-dasharray="3 4"/>`).join('');
    const months = 'JFMAMJJASOND'.split('').map((m, i) => mono(pts[i][0] - 3, pt + ph + 22, m, 10, t.subtle)).join('');

    const ty = cy + ch + 12;
    const invoices = [['FA-2026-0412', '1 240 000,00', 'Payée'], ['FA-2026-0411', '865 300,00', 'Envoyée'], ['FA-2026-0410', '2 104 750,00', 'Échue']];
    const rows = invoices.map(([num, amount, status], i) => {
        const y = ty + 54 + i * 26;
        const c = chip(MX + MWIDTH - 96, y - 17, status.toUpperCase(), t, { size: 9.5, padX: 9, h: 22, color: i === 0 ? t.accentText : t.muted, stroke: i === 0 ? t.stroke : t.line });
        return (i ? `<path d="M${MX + 14} ${y - 18} H${MX + MWIDTH - 14}" stroke="${t.line}"/>` : '')
            + mono(MX + 16, y, num, 11.5, t.ink) + mono(MX + 160, y, `${amount} DA`, 11.5, t.muted) + c.svg;
    }).join('');

    const css = `
.draw{stroke-dasharray:1;stroke-dashoffset:1;animation:draw 11s cubic-bezier(.3,.7,.2,1) infinite}
@keyframes draw{0%{stroke-dashoffset:1;opacity:1}24%{stroke-dashoffset:0}92%{stroke-dashoffset:0;opacity:1}100%{stroke-dashoffset:0;opacity:0}}
.fill{animation:fill 11s ease-out infinite}
@keyframes fill{0%,10%{opacity:0}30%,92%{opacity:1}100%{opacity:0}}
.ping{transform-box:fill-box;transform-origin:center;animation:ping 2.2s ease-out infinite}
@keyframes ping{0%{transform:scale(1);opacity:.6}100%{transform:scale(3.2);opacity:0}}
@media (prefers-reduced-motion: reduce){.draw{stroke-dashoffset:0}.fill{opacity:1}}`;

    const body = `
<defs>
<clipPath id="card"><rect width="${W}" height="${H}" rx="24"/></clipPath>
<linearGradient id="area" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${t.stroke}" stop-opacity=".28"/><stop offset="1" stop-color="${t.stroke}" stop-opacity="0"/></linearGradient>
<filter id="shadow" x="-10%" y="-10%" width="120%" height="130%"><feDropShadow dx="0" dy="18" stdDeviation="22" flood-color="#000" flood-opacity="${t === THEMES.dark ? 0.5 : 0.1}"/></filter>
</defs>
<rect width="${W}" height="${H}" rx="24" fill="${t.surface}"/>
<g clip-path="url(#card)">${dotGrid('tdots', t, W, H, 0.74, 0.42)}</g>
<rect x=".5" y=".5" width="${W - 1}" height="${H - 1}" rx="23.5" fill="none" stroke="${t.line}"/>

${mono(64, 92, 'ERP SAAS · MADE FOR ALGERIA', 13, t.accentText, 'letter-spacing="1"')}
<text x="60" y="170" class="sans" font-size="78" font-weight="700" letter-spacing="-2.5" fill="${t.ink}">Tadbir</text>
<text x="314" y="166" class="sans" font-size="40" font-weight="600" fill="${t.subtle}">تدبير</text>
<text x="64" y="218" class="sans" font-size="23" fill="${t.ink}">The ERP built for Algerian SMEs:</text>
<text x="64" y="250" class="sans" font-size="23" fill="${t.muted}">one workspace, from the ledger to the payslip.</text>
${feat}
${chips(64, 586, ['LARAVEL 13', 'VUE 3', 'POSTGRESQL 17', 'TAILWIND 4'], t, { size: 11.5, padX: 11, h: 28 })}

<g filter="url(#shadow)"><rect x="${X}" y="${Y}" width="${MW}" height="${MH}" rx="16" fill="${t.window}"/></g>
<rect x="${X + 0.5}" y="${Y + 0.5}" width="${MW - 1}" height="${MH - 1}" rx="15.5" fill="none" stroke="${t.line}"/>
<path d="M${X} ${Y + 44.5} H${X + MW}" stroke="${t.line}"/>
<circle cx="${X + 22}" cy="${Y + 22}" r="5" fill="${t.line}"/><circle cx="${X + 39}" cy="${Y + 22}" r="5" fill="${t.line}"/><circle cx="${X + 56}" cy="${Y + 22}" r="5" fill="${t.line}"/>
${mono(X + 84, Y + 27, 'tadbir — tableau de bord', 11, t.subtle)}
<rect x="${X + MW - 78}" y="${Y + 11}" width="62" height="23" rx="11.5" fill="${t.raised}"/>
${mono(X + MW - 68, Y + 27, 'FR', 10.5, t.ink)}<text x="${X + MW - 46}" y="${Y + 27}" class="mono" font-size="10.5" fill="${t.subtle}">|</text><text x="${X + MW - 34}" y="${Y + 27.5}" class="sans" font-size="12" fill="${t.muted}">ع</text>
<path d="M${X + 156.5} ${Y + 45} V${Y + MH}" stroke="${t.line}"/>
<rect x="${X + 18}" y="${Y + 60}" width="26" height="26" rx="7" fill="${t.accent}"/>
<text x="${X + 25.5}" y="${Y + 79}" class="sans" font-size="16" font-weight="800" fill="${t.onAccent}">T</text>
<text x="${X + 54}" y="${Y + 79}" class="sans" font-size="15" font-weight="700" fill="${t.ink}">Tadbir</text>
${navSvg}

<text x="${MX}" y="${Y + 82}" class="sans" font-size="20" font-weight="700" fill="${t.ink}">Tableau de bord</text>
${mono(MX, Y + 100, 'novembre 2026 · données de démonstration', 10, t.subtle)}
${kpiSvg}

<rect x="${MX}" y="${cy}" width="${MWIDTH}" height="${ch}" rx="12" fill="${t.surface}" stroke="${t.line}"/>
<text x="${MX + 16}" y="${cy + 26}" class="sans" font-size="12.5" font-weight="600" fill="${t.ink}">Chiffre d'affaires · 12 mois</text>
${mono(MX + MWIDTH - 16 - monoWidth('M DA', 10), cy + 26, 'M DA', 10, t.subtle)}
${grid}
<path class="fill" d="${area}" fill="url(#area)"/>
<path class="draw" d="${d}" pathLength="1" fill="none" stroke="${t.stroke}" stroke-width="2.4" stroke-linecap="round"/>
<circle cx="${n(last[0])}" cy="${n(last[1])}" r="4.5" fill="${t.stroke}"/><circle class="ping" cx="${n(last[0])}" cy="${n(last[1])}" r="4.5" fill="${t.stroke}"/>
${months}

<rect x="${MX}" y="${ty}" width="${MWIDTH}" height="${MH - (ty - Y) - 18}" rx="12" fill="${t.surface}" stroke="${t.line}"/>
<text x="${MX + 16}" y="${ty + 26}" class="sans" font-size="12.5" font-weight="600" fill="${t.ink}">Dernières factures</text>
${rows}

${mono(X + MW - monoWidth('interface preview · demo data', 10.5), H - 26, 'interface preview · demo data', 10.5, t.subtle)}
`;
    return svg(W, H, 'Tadbir, the ERP built for Algerian SMEs: SCF accounting, G50 and annual tax returns, CNAS and IRG payroll, sales, purchases, stock and point of sale, multi-tenant with row-level security, in French and Arabic', body, css);
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
<text x="60" y="152" class="sans" font-size="54" font-weight="700" letter-spacing="-1.6" fill="${t.ink}">Got a product to build,</text>
<text x="60" y="214" class="sans" font-size="54" font-weight="700" letter-spacing="-1.6" fill="${t.ink}">or an ERP to pilot<tspan fill="${t.stroke}">?</tspan></text>
${mono(64, 258, 'saadasamir449@gmail.com', 15, t.muted)}
${mono(W - 64 - monoWidth('À BIENTÔT · SEE YOU SOON ·', 12) - 52, 258, 'À BIENTÔT · SEE YOU SOON ·', 12, t.subtle)}
<text x="${W - 64}" y="258" class="sans" font-size="14" text-anchor="end" fill="${t.subtle}">إلى اللقاء</text>
`;
    return svg(W, H, "What's next: got a product to build, or an ERP to pilot? Write to saadasamir449@gmail.com", body);
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
    write(`tadbir-${name}.svg`, tadbir(t));
    write(`footer-${name}.svg`, footer(t));
    PROJECTS.forEach((p, i) => write(`cards/${p.slug}-${name}.svg`, card(p, i, t)));
    write(`buttons/linkedin-${name}.svg`, button('LINKEDIN', t));
    write(`buttons/email-${name}.svg`, button('EMAIL', t));
    write(`buttons/demo-${name}.svg`, button('TADBIR DEMO', t, true));
}
console.log('assets generated');
