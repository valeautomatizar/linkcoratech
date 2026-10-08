/* =========================================================================
   CORATECH — scripts do site

   >>> EDITE AQUI os dados de contato. Eles são aplicados automaticamente
   >>> em todas as páginas (botões de WhatsApp, e-mail, Instagram, rodapé…).
   ========================================================================= */
const CONFIG = {
  whatsapp: '5555992141406',              // 55 (Brasil) + DDD + número, só dígitos
  telefone: '(55) 99214-1406',            // como o número aparece no site
  email: 'atendimento@coratechbr.com',
  instagram: '',                          // ex.: 'https://instagram.com/coratech' (vazio = esconde o ícone)
  endereco: 'Rua Bento Gonçalves, 366, Sala 4 — Centro, Ijuí/RS', // vazio = esconde a linha no contato
  mensagemWhatsApp: 'Olá! Vim pelo site da Coratech e gostaria de saber mais sobre automação residencial.',
};

/* Cenas do painel do topo do site (iluminação %, persianas %, clima °C, áudio %) */
const SCENES = {
  receber: { nome: 'Receber',   luz: 80, persiana: 60,  clima: 23, audio: 35, musica: 'Bossa nova',   cor: '#0096d6' },
  cinema:  { nome: 'Cinema',    luz: 6,  persiana: 0,   clima: 22, audio: 70, musica: 'Modo cinema',  cor: '#007ba8' },
  jantar:  { nome: 'Jantar',    luz: 45, persiana: 30,  clima: 23, audio: 20, musica: 'Jazz suave',   cor: '#e8833a' },
  noite:   { nome: 'Boa noite', luz: 0,  persiana: 0,   clima: 21, audio: 0,  musica: 'Silêncio',     cor: '#035457' },
};

/* ------------------------------------------------------------------------ */

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* Aplica os dados do CONFIG nos links e textos */
function applyConfig() {
  const links = {
    whatsapp: `https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent(CONFIG.mensagemWhatsApp)}`,
    email: `mailto:${CONFIG.email}`,
    instagram: CONFIG.instagram,
    mapa: CONFIG.endereco && `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(CONFIG.endereco)}`,
  };
  $$('[data-link]').forEach((a) => {
    if (a.dataset.link === 'whatsapp' && a.dataset.msg) a.href = `https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent(a.dataset.msg)}`;
    else if (links[a.dataset.link]) a.href = links[a.dataset.link];
    else a.remove(); // sem dado no CONFIG: esconde o link
  });
  $$('[data-text]').forEach((el) => {
    if (CONFIG[el.dataset.text]) el.textContent = CONFIG[el.dataset.text];
    else el.closest('li')?.remove();
  });
  $$('[data-year]').forEach((el) => { el.textContent = new Date().getFullYear(); });
  $$('[data-quero]').forEach((a) => { a.href = queroLink(a.dataset.quero); });
}

/* Botões "Quero isso para mim!": abrem o WhatsApp contando o que a pessoa viu */
function queroLink(tema) {
  const texto = tema
    ? `Olá! Vi no site da Coratech ${tema} e quero isso para mim! Podemos conversar?`
    : 'Olá! Vi o site da Coratech e quero isso para mim! Podemos conversar?';
  return `https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent(texto)}`;
}

/* Cabeçalho: fundo ao rolar, esconde ao descer e mostra ao subir */
function header() {
  const h = $('.header');
  const bar = $('.progress');
  const wa = $('.wa-float');
  if (!h) return;
  let last = 0;
  const onScroll = () => {
    const y = window.scrollY;
    h.classList.toggle('is-scrolled', y > 30);
    h.classList.toggle('is-hidden', y > 600 && y > last && !document.body.classList.contains('menu-open'));
    last = y;
    const max = document.documentElement.scrollHeight - innerHeight;
    if (bar) bar.style.transform = `scaleX(${max > 0 ? y / max : 0})`;
    if (wa) wa.classList.toggle('is-visible', y > 500);
  };
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // Menu mobile
  const btn = $('.menu-toggle');
  if (!btn) return;
  const toggle = (open) => {
    document.body.classList.toggle('menu-open', open);
    btn.setAttribute('aria-expanded', open);
    btn.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
  };
  btn.addEventListener('click', () => toggle(!document.body.classList.contains('menu-open')));
  $$('.nav a').forEach((a) => a.addEventListener('click', () => toggle(false)));
  addEventListener('keydown', (e) => { if (e.key === 'Escape') toggle(false); });

  // Destaca no menu a seção visível
  const map = new Map($$('.nav a[href^="#"]').map((a) => [a.getAttribute('href').slice(1), a]));
  const spy = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      const a = map.get(en.target.id);
      if (a && en.isIntersecting) { map.forEach((x) => x.classList.remove('is-active')); a.classList.add('is-active'); }
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  map.forEach((_, id) => { const s = document.getElementById(id); if (s) spy.observe(s); });
}

/* Animações de entrada ao rolar */
function reveals() {
  const els = $$('.reveal, .reveal-scale, [data-observe]');
  if (!('IntersectionObserver' in window)) { els.forEach((e) => e.classList.add('in-view')); return; }
  const io = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (en.isIntersecting) { en.target.classList.add('in-view'); io.unobserve(en.target); }
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
  els.forEach((e) => io.observe(e));
}

/* Painel de cenas do hero */
function scenes() {
  const hero = $('.hero');
  const name = $('[data-scene-name]');
  if (!hero || !name) return;
  const current = { luz: 0, persiana: 0, clima: 18, audio: 0 };

  const tween = (key, to, fmt) => {
    const el = $(`[data-val="${key}"]`);
    const from = current[key];
    const start = performance.now();
    const dur = reduceMotion ? 0 : 1100;
    const step = (t) => {
      const p = dur ? Math.min(1, (t - start) / dur) : 1;
      const e = 1 - Math.pow(1 - p, 3);
      el.textContent = fmt(Math.round(from + (to - from) * e));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
    current[key] = to;
  };

  const set = (id, first = false) => {
    const s = SCENES[id];
    hero.style.setProperty('--glow', s.cor);
    $$('.scene-btn').forEach((b) => b.setAttribute('aria-pressed', b.dataset.scene === id));
    if (!first) {
      name.classList.add('is-swapping');
      setTimeout(() => { name.textContent = s.nome; name.classList.remove('is-swapping'); }, 250);
    }
    tween('luz', s.luz, (v) => `${v}%`);
    tween('persiana', s.persiana, (v) => `${v}%`);
    tween('clima', s.clima, (v) => `${v}°C`);
    tween('audio', s.audio, (v) => `${v}%`);
    $('[data-val="musica"]').textContent = s.musica;
    $('[data-bar="luz"]').style.width = `${s.luz}%`;
    $('[data-bar="persiana"]').style.width = `${s.persiana}%`;
    $('[data-bar="clima"]').style.width = `${((s.clima - 16) / 14) * 100}%`;
    $('[data-bar="audio"]').style.width = `${s.audio}%`;
    $$('.panel__eq i').forEach((i) => { i.style.animationPlayState = s.audio ? 'running' : 'paused'; });
  };

  let auto;
  const ids = Object.keys(SCENES);
  $$('.scene-btn').forEach((b) => b.addEventListener('click', () => { clearInterval(auto); set(b.dataset.scene); }));
  setTimeout(() => set('receber', true), 500);

  // Troca de cena automática até o visitante interagir
  if (!reduceMotion) {
    let i = 0;
    auto = setInterval(() => { i = (i + 1) % ids.length; set(ids[i]); }, 5000);
  }
}

/* Brilho que acompanha o cursor nos cartões */
function cardGlow() {
  $$('.card').forEach((c) => {
    c.addEventListener('pointermove', (e) => {
      const r = c.getBoundingClientRect();
      c.style.setProperty('--mx', `${e.clientX - r.left}px`);
      c.style.setProperty('--my', `${e.clientY - r.top}px`);
    });
  });
}

/* Manifesto: acende palavra por palavra conforme a rolagem */
function manifesto() {
  const p = $('[data-words]');
  if (!p) return;
  p.innerHTML = p.textContent.trim().split(/\s+/).map((w) => {
    const hl = w.includes('*');
    return `<span class="w${hl ? ' hl' : ''}">${w.replace(/\*/g, '')}</span>`;
  }).join(' ');
  const words = $$('.w', p);
  const update = () => {
    const r = p.getBoundingClientRect();
    const start = innerHeight * 0.85;
    const end = innerHeight * 0.35;
    const prog = Math.min(1, Math.max(0, (start - r.top) / (start - end + r.height * 0.5)));
    const n = Math.round(prog * words.length);
    words.forEach((w, i) => w.classList.toggle('on', i < n));
  };
  addEventListener('scroll', update, { passive: true });
  update();
}

/* Barras do equalizador da seção Sonorização */
function soundBars() {
  $$('[data-bars]').forEach((box) => {
    const n = +box.dataset.bars;
    box.innerHTML = Array.from({ length: n }, (_, i) => {
      const d = (Math.sin(i * 1.7) * 0.5 + 0.5) * -1.1;
      const dur = 0.7 + ((i * 37) % 10) / 14;
      return `<i style="animation-delay:${d.toFixed(2)}s;animation-duration:${dur.toFixed(2)}s"></i>`;
    }).join('');
  });
}

/* Parallax suave do símbolo no hero */
function parallax() {
  const sym = $('.hero__symbol');
  if (!sym || reduceMotion) return;
  addEventListener('scroll', () => {
    const y = scrollY;
    if (y < innerHeight) sym.style.transform = `translateY(calc(-50% + ${y * 0.25}px)) rotate(${y * 0.02}deg)`;
  }, { passive: true });
}

/* Formulário: monta a mensagem e abre o WhatsApp */
function form() {
  const f = $('#form-contato');
  if (!f) return;
  const msg = $('[data-form-msg]');
  f.addEventListener('submit', (e) => {
    e.preventDefault();
    const d = new FormData(f);
    const nome = (d.get('nome') || '').trim();
    const tel = (d.get('telefone') || '').trim();
    if (!nome || !tel) {
      msg.textContent = 'Preencha seu nome e telefone, por favor.';
      msg.style.color = '#ffb47e';
      (!nome ? f.nome : f.telefone).focus();
      return;
    }
    if (!d.get('consentimento')) {
      msg.textContent = 'Para continuar, marque a concordância com a Política de Privacidade.';
      msg.style.color = '#ffb47e';
      return;
    }
    const interesses = d.getAll('interesse').join(', ') || '—';
    const texto = [
      'Olá, Coratech! Vim pelo site.',
      '',
      `*Nome:* ${nome}`,
      `*Telefone:* ${tel}`,
      `*Imóvel:* ${d.get('imovel')}`,
      `*Interesse:* ${interesses}`,
      d.get('mensagem') ? `*Mensagem:* ${d.get('mensagem').trim()}` : null,
    ].filter((l) => l !== null).join('\n');
    window.open(`https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent(texto)}`, '_blank', 'noopener');
    msg.textContent = 'Pronto! Finalize o envio na janela do WhatsApp.';
    msg.style.color = '#3ddc97';
  });
}

/* Galeria: clique em um projeto para ampliar a foto */
function lightbox() {
  const box = $('.lightbox');
  const items = $$('[data-full]');
  if (!box || !items.length) return;
  const img = $('img', box);
  let i = 0;
  let lastFocus = null;

  const show = (n) => {
    i = (n + items.length) % items.length;
    const it = items[i];
    img.classList.remove('is-loaded');
    img.onload = () => img.classList.add('is-loaded');
    img.src = it.dataset.full;
    img.alt = $('h3', it).textContent;
    $('.lightbox__cap small', box).textContent = $('small', it).textContent;
    $('.lightbox__cap h3', box).textContent = $('h3', it).textContent;
    $('.lightbox__cap span', box).textContent = `${i + 1} / ${items.length}`;
    const quero = $('.lightbox__cap [data-quero]', box);
    if (quero) quero.href = queroLink(`a foto "${$('h3', it).textContent}"`);
  };
  const open = (n) => {
    lastFocus = document.activeElement;
    box.hidden = false;
    void box.offsetWidth; // força o navegador a aplicar o estado inicial antes da animação
    box.classList.add('is-open');
    document.body.style.overflow = 'hidden';
    show(n);
    $('.lightbox__close', box).focus();
  };
  const close = () => {
    box.classList.remove('is-open');
    document.body.style.overflow = '';
    setTimeout(() => { box.hidden = true; }, 500);
    lastFocus?.focus();
  };

  items.forEach((it, n) => {
    it.addEventListener('click', () => open(n));
    it.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(n); } });
  });
  $('.lightbox__close', box).addEventListener('click', close);
  $('.lightbox__prev', box).addEventListener('click', () => show(i - 1));
  $('.lightbox__next', box).addEventListener('click', () => show(i + 1));
  box.addEventListener('click', (e) => { if (e.target === box) close(); });
  addEventListener('keydown', (e) => {
    if (box.hidden) return;
    if (e.key === 'Escape') close();
    if (e.key === 'ArrowLeft') show(i - 1);
    if (e.key === 'ArrowRight') show(i + 1);
  });

  // deslizar no celular
  let x0 = null;
  box.addEventListener('touchstart', (e) => { x0 = e.touches[0].clientX; }, { passive: true });
  box.addEventListener('touchend', (e) => {
    if (x0 === null) return;
    const dx = e.changedTouches[0].clientX - x0;
    if (Math.abs(dx) > 50) show(dx < 0 ? i + 1 : i - 1);
    x0 = null;
  });
}

/* Aviso de cookies (lembra a escolha neste navegador) */
function cookies() {
  const box = $('.cookie');
  if (!box) return;
  let ok = false;
  try { ok = localStorage.getItem('coratech-cookies') === 'ok'; } catch (e) { /* navegação privada */ }
  if (!ok) setTimeout(() => box.classList.add('is-visible'), 1800);
  $('[data-cookie-ok]', box).addEventListener('click', () => {
    box.classList.remove('is-visible');
    try { localStorage.setItem('coratech-cookies', 'ok'); } catch (e) { /* ignora */ }
  });
}

/* Páginas legais: destaca o item do índice da seção atual */
function legalToc() {
  const links = $$('.legal__toc a');
  if (!links.length) return;
  const io = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (en.isIntersecting) {
        links.forEach((a) => a.classList.toggle('is-active', a.getAttribute('href') === `#${en.target.id}`));
      }
    });
  }, { rootMargin: '-20% 0px -70% 0px' });
  $$('.legal__body h2[id]').forEach((h) => io.observe(h));
}

applyConfig();
header();
reveals();
scenes();
cardGlow();
manifesto();
soundBars();
parallax();
form();
lightbox();
cookies();
legalToc();
