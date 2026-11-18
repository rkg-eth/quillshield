/* QuillShield motion: one small script for every page, loaded with defer.
   It changes presentation only. Every word and every number is in the HTML before it runs,
   and a page without it reads complete. Timing comes from the motion tokens in site.css.
   Under reduced motion each state changes instantly and nothing moves. */
(function () {
  'use strict';
  var d = document, H = d.documentElement, W = window;
  W.qsm = 1;
  var mq = W.matchMedia ? W.matchMedia('(prefers-reduced-motion: reduce)') : null;
  function calm() { return !mq || mq.matches || !('animate' in H); }
  var cs = getComputedStyle(H);
  function tok(n) { return cs.getPropertyValue(n).trim(); }
  function ms(n) { var v = tok(n); return parseFloat(v) * (/ms$/.test(v) ? 1 : 1000) || 0; }
  var D1 = ms('--dur-1'), D2 = ms('--dur-2'), D3 = ms('--dur-3'), D4 = ms('--dur-4');
  var EO = tok('--ease-out') || 'ease-out', EM = tok('--ease-move') || 'ease-in-out';
  function $$(s, c) { return [].slice.call((c || d).querySelectorAll(s)); }

  function smooth(det) {
    var sum = det.querySelector('summary');
    if (!sum) return;
    sum.addEventListener('click', function (e) {
      if (calm() || e.defaultPrevented) return;
      e.preventDefault();
      var h = det.getBoundingClientRect().height, opening = det._a ? !det._o : !det.open;
      if (det._a) { det._a.cancel(); if (det._f) det._f.cancel(); }
      det.open = true;
      var full = det.getBoundingClientRect().height;
      det.open = false;
      var shut = det.getBoundingClientRect().height;
      det.open = true;
      det._o = opening;
      det.classList.toggle('is-shut', !opening);
      det.style.overflow = 'hidden';
      var a = det._a = det.animate({ height: [h + 'px', (opening ? full : shut) + 'px'] }, { duration: D2, easing: EM });
      var body = sum.nextElementSibling;
      det._f = body ? body.animate({ opacity: opening ? [0, 1] : [1, 0] }, { duration: D2, fill: 'forwards' }) : null;
      a.onfinish = function () {
        det._a = null;
        if (det._f) { det._f.cancel(); det._f = null; }
        det.style.overflow = '';
        if (!opening) det.open = false;
        det.classList.remove('is-shut');
      };
    });
  }
  $$('.faq details').forEach(smooth);

  var jobs = [], queued = false, resized = false;
  function frame() { queued = false; var r = resized; resized = false; jobs.forEach(function (f) { f(r); }); }
  function kick(e) { if (e && e.type === 'resize') resized = true; if (!queued) { queued = true; requestAnimationFrame(frame); } }
  function watch(f) { jobs.push(f); f(true); }
  W.addEventListener('scroll', kick, { passive: true });
  W.addEventListener('resize', kick);
  if (d.fonts && d.fonts.ready) d.fonts.ready.then(function () { asc = 0; kick({ type: 'resize' }); });

  var asc = 0;
  function base(el, r) {
    if (!asc) {
      var s = d.createElement('span'), i = d.createElement('i');
      s.style.cssText = 'position:absolute;visibility:hidden;white-space:nowrap';
      i.style.cssText = 'display:inline-block;width:0;height:0';
      s.appendChild(d.createTextNode('x')); s.appendChild(i); el.appendChild(s);
      var g = d.createRange(); g.selectNodeContents(s.firstChild);
      asc = (i.getBoundingClientRect().top - g.getBoundingClientRect().top) / parseFloat(getComputedStyle(s).fontSize);
      el.removeChild(s);
    }
    return r.top + asc * parseFloat(getComputedStyle(el).fontSize);
  }
  function lineBoxes(el) {
    var g = d.createRange(), out = [];
    g.selectNodeContents(el);
    [].slice.call(g.getClientRects()).forEach(function (b) {
      if (b.width < 1) return;
      var o = out[out.length - 1];
      if (o && Math.abs(o.top - b.top) < 2) { o.left = Math.min(o.left, b.left); o.right = Math.max(o.right, b.right); o.width = o.right - o.left; }
      else out.push({ left: b.left, right: b.right, top: b.top, width: b.width, height: b.height });
    });
    return out;
  }

  function Marker(host, n, off) {
    this.host = host; this.off = off; this.bars = []; this.el = null;
    for (var k = 0; k < n; k++) { var b = d.createElement('i'); b.className = 'mark'; host.appendChild(b); this.bars.push(b); }
  }
  Marker.prototype.to = function (el) {
    var h = this.host.getBoundingClientRect(), ls = el ? lineBoxes(el) : [], off = this.off, was = this.el;
    this.el = el;
    this.bars.forEach(function (b, k) {
      var l = ls[Math.min(k, ls.length - 1)], on = !!l && k < ls.length;
      var t = l ? 'translate(' + (l.left - h.left + (on ? 0 : l.width)) + 'px,' + (base(el, l) + off - h.top) + 'px) scaleX(' + (on ? l.width : 0) + ')' : null;
      if (t && !was) { b.style.transition = 'none'; b.style.transform = t; b.getBoundingClientRect(); b.style.transition = ''; }
      else if (t) b.style.transform = t;
      b.style.opacity = on ? '1' : '0';
    });
  };

  var navLinks = d.querySelector('.nav__links'), navA = navLinks ? $$('a[href^="#"]', navLinks) : [];
  if (navA.length) {
    var secs = navA.map(function (a) { return d.getElementById(a.getAttribute('href').slice(1)); });
    var menuA = $$('.menu__panel a[href^="#"]'), navMk = null, cur = -2;
    if (!calm()) { navMk = new Marker(navLinks, 1, 8); navLinks.classList.add('has-mark'); }
    watch(function (re) {
      var y = innerHeight / 3, c = -1;
      secs.forEach(function (s, i) { if (s) { var r = s.getBoundingClientRect(); if (r.top <= y && r.bottom > y) c = i; } });
      if (c !== cur) {
        cur = c;
        var href = c < 0 ? null : navA[c].getAttribute('href');
        navA.concat(menuA).forEach(function (a) { if (a.getAttribute('href') === href) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current'); });
        re = true;
      }
      if (navMk && re) navMk.to(c < 0 ? null : navA[c]);
    });
  }

  var prose = d.querySelector('.doc .prose'), nav = d.querySelector('.nav');
  if (prose && nav) {
    var rb = d.createElement('i'); rb.className = 'readbar'; rb.setAttribute('aria-hidden', 'true'); nav.appendChild(rb);
    watch(function () {
      var y = W.pageYOffset, top = prose.getBoundingClientRect().top + y - nav.offsetHeight,
        end = prose.getBoundingClientRect().bottom + y - innerHeight;
      var p = end > top ? (y - top) / (end - top) : (y >= end ? 1 : 0);
      rb.style.transform = 'scaleX(' + Math.min(1, Math.max(0, p)) + ')';
    });
  }

  var toc = d.querySelector('.toc');
  if (toc && !calm() && 'MutationObserver' in W) {
    var tl = toc.querySelector('ul'), li = d.createElement('li');
    li.className = 'toc__mk'; li.setAttribute('aria-hidden', 'true'); tl.appendChild(li);
    var tocMk = new Marker(li, 3, 4);
    toc.classList.add('has-mark');
    var tocTo = function () { tocMk.to(toc.querySelector('a[aria-current]')); };
    new MutationObserver(tocTo).observe(toc, { subtree: true, attributes: true, attributeFilter: ['aria-current'] });
    watch(function (re) { if (re) tocTo(); });
  }

  var audit = d.getElementById('audit');
  if (audit) {
    $$('.frow', audit).forEach(smooth);
    if (calm()) { H.classList.remove('anim'); audit.classList.add('is-done'); }
    else {
      var rows = $$('[data-row]', audit), ahead = audit.querySelector('.audit__head'), okEl = audit.querySelector('.s-ok'),
        nums = $$('.audit__n', audit), timers = [], bar = d.createElement('i'), btn = d.createElement('button');
      bar.className = 'audit__bar'; bar.setAttribute('aria-hidden', 'true'); audit.appendChild(bar);
      btn.type = 'button'; btn.className = 'audit__replay'; btn.textContent = 'Replay'; btn.hidden = true; ahead.appendChild(btn);
      var placeBtn = function () {
        if (btn.hidden) return;
        var hr = ahead.getBoundingClientRect(), sr = okEl.getBoundingClientRect(), bw = btn.offsetWidth, bh = btn.offsetHeight,
          tl = lineBoxes(audit.querySelector('.audit__title'))[0], room = hr.bottom - 1 - sr.bottom;
        if ((tl && sr.left - 8 - bw >= tl.right + 16) || room < bh) {
          btn.style.top = (sr.top + sr.height / 2 - bh / 2 - hr.top) + 'px'; btn.style.right = (hr.right - sr.left + 8) + 'px';
        } else {
          btn.style.top = (sr.bottom - hr.top) + 'px'; btn.style.right = (hr.right - sr.right - 8) + 'px';
        }
      };
      var tickTo = function (k, v) { var e = nums[k]; if (v == null) e.removeAttribute('data-tick'); else e.setAttribute('data-tick', v); };
      var done = function () {
        audit.classList.remove('is-run'); audit.classList.add('is-done');
        nums.forEach(function (e, k) { tickTo(k, null); });
        nums[3].animate({ opacity: [0, 1] }, { duration: D2, easing: EO });
        if (btn.hidden) { btn.hidden = false; placeBtn(); btn.animate({ opacity: [0, 1] }, { duration: D2, easing: EO }); }
      };
      var run = function (first) {
        timers.forEach(clearTimeout); timers = [];
        H.classList.remove('anim');
        audit.classList.remove('is-done'); audit.classList.add('is-run');
        rows.forEach(function (r) { r.classList.remove('is-in', 'is-proved'); });
        var n = [0, 0, 0], of = nums[2].textContent.replace(/^\d+/, ''), t0 = first ? 250 : D2 + 160, step = 380, proof = 520,
          end = t0 + (rows.length - 1) * step + proof + 300;
        [0, 0, 0 + of, ''].forEach(function (v, k) { tickTo(k, v); });
        bar.animate([{ transform: 'scaleX(0)', opacity: 1 }, { transform: 'scaleX(1)', opacity: 1, offset: end / (end + D2) }, { transform: 'scaleX(1)', opacity: 0 }], { duration: end + D2, easing: 'linear' });
        rows.forEach(function (r, i) {
          timers.push(setTimeout(function () {
            r.classList.add('is-in'); n[0]++; if (r.getAttribute('data-sev') === 'critical') n[1]++;
            tickTo(0, n[0]); tickTo(1, n[1]);
          }, t0 + i * step));
          timers.push(setTimeout(function () { r.classList.add('is-proved'); n[2]++; tickTo(2, n[2] + of); }, t0 + i * step + proof));
        });
        timers.push(setTimeout(done, end));
      };
      btn.addEventListener('click', function () { run(false); });
      watch(function (re) { if (re) placeBtn(); });
      if (H.classList.contains('anim')) run(true); else done();
    }
  }

  function seen(el) { var r = el.getBoundingClientRect(); return r.top < innerHeight && r.bottom > 0; }
  function onView(el, f, th) {
    if (calm() || seen(el) || !('IntersectionObserver' in W)) return false;
    var io = new IntersectionObserver(function (es) { if (es[0].isIntersecting) { io.disconnect(); f(); } }, { threshold: th || 0.4 });
    io.observe(el);
    return true;
  }

  var FILL = 800;
  $$('.bench__bars, .benchfig__img').forEach(function (box) {
    var bars = $$('.track i', box);
    if (bars.length && onView(box, function () {
      box.classList.remove('is-pre');
      bars.forEach(function (b, i) { b.animate([{ transform: 'scaleX(0)' }, { transform: 'scaleX(1)' }], { duration: D3, delay: i * D1, easing: EO, fill: 'backwards' }); });
    })) box.classList.add('is-pre');
  });
  $$('.waffle').forEach(function (wf) {
    var sq = $$('i', wf), hit = sq.filter(function (i) { return !i.classList.contains('miss'); }), miss = sq.filter(function (i) { return i.classList.contains('miss'); });
    if (onView(wf, function () {
      wf.classList.remove('is-pre');
      var step = (FILL - D1) / Math.max(1, hit.length - 1);
      hit.forEach(function (q, k) { q.animate([{ opacity: 0, transform: 'scale(.5)' }, { opacity: 1, transform: 'none' }], { duration: D1, delay: k * step, easing: EO, fill: 'backwards' }); });
      miss.forEach(function (q, k) { q.animate({ opacity: [0, 1] }, { duration: D2, delay: FILL + k * D1 / 8, fill: 'backwards' }); });
    }, 0.3)) wf.classList.add('is-pre');
    var cap = wf.parentNode.querySelector('.waffle__cap') || (wf.closest('.benchfig') || d).querySelector('.waffle__cap');
    var tn = cap && [].slice.call(cap.childNodes).filter(function (n) { return n.nodeType === 3 && /\d+ found, \d+ missed/.test(n.nodeValue); })[0];
    if (!tn) return;
    var m = tn.nodeValue.match(/^([\s\S]*?)(\d+ found)(, )(\d+ missed)([\s\S]*)$/);
    if (!wf.id) wf.id = 'waffle-' + $$('.waffle').indexOf(wf);
    var tg = [m[2], m[4]].map(function (t) {
      var b = d.createElement('button'); b.type = 'button'; b.className = 'wf-tg'; b.textContent = t;
      b.setAttribute('aria-pressed', 'false'); b.setAttribute('aria-controls', wf.id); return b;
    });
    var f = d.createDocumentFragment();
    [m[1], tg[0], m[3], tg[1], m[5]].forEach(function (x) { f.appendChild(typeof x === 'string' ? d.createTextNode(x) : x); });
    cap.replaceChild(f, tn);
    tg.forEach(function (b, k) {
      b.addEventListener('click', function () {
        var on = b.getAttribute('aria-pressed') !== 'true';
        tg.forEach(function (x) { x.setAttribute('aria-pressed', x === b && on ? 'true' : 'false'); });
        wf.classList.toggle('show-found', on && k === 0); wf.classList.toggle('show-missed', on && k === 1);
        cap.classList.toggle('has-on', on);
      });
    });
  });
  var v2 = d.getElementById('bench-v2'), t2 = d.querySelector('.bench__bars .brow:nth-child(2) .track');
  if (v2 && t2) { t2.tabIndex = 0; t2.setAttribute('aria-describedby', 'bench-v2'); }

  var trail = d.querySelector('.case__trail');
  if (trail) {
    var tsteps = $$('.tstep', trail), troot = trail.querySelector('.trail__root');
    tsteps.forEach(function (s) { s.tabIndex = 0; });
    var pe = W.KeyframeEffect && 'pseudoElement' in KeyframeEffect.prototype;
    if (pe && troot && onView(trail, function () {
      trail.classList.remove('is-pre');
      var px = function (el, ps, k) { return parseFloat(getComputedStyle(el, ps)[k]) || 0; },
        grow = [{ transform: 'scaleY(0)' }, { transform: 'scaleY(1)' }], pop = [{ opacity: 0, transform: 'scale(.5)' }, { opacity: 1, transform: 'none' }],
        segs = [], L = 0, t0 = D1;
      [troot].concat(tsteps).forEach(function (e) { var h = px(e, '::before', 'height'); segs.push([e, L, h]); L += h; });
      var v = L / (D4 - D1 / 2), at = function (p) { return t0 + p / v; };
      troot.querySelector('.mk').animate(pop, { duration: D1, easing: EO, fill: 'backwards' });
      segs.forEach(function (g) { g[0].animate(grow, { pseudoElement: '::before', duration: g[2] / v, delay: at(g[1]), easing: 'linear', fill: 'backwards' }); });
      tsteps.forEach(function (s, i) {
        var m = s.querySelector('.mk:not(.mk--stop)');
        if (m) m.animate(pop, { duration: D1, delay: at(segs[i + 1][1] + m.getBoundingClientRect().top - s.getBoundingClientRect().top), easing: EO, fill: 'backwards' });
      });
      var a0 = at(px(troot, '::after', 'top') - px(troot, '::before', 'top')), cw = px(troot, '::after', 'width'),
        ch = px(troot, '::after', 'height'), a1 = tsteps[0], ah = px(a1, '::after', 'height');
      troot.animate([{ clipPath: 'inset(0 0 calc(100% - 2px) 100%)' }, { clipPath: 'inset(0 0 calc(100% - 2px) 0)', offset: cw / (cw + ch) }, { clipPath: 'inset(0 0 0 0)' }],
        { pseudoElement: '::after', duration: (cw + ch) / v, delay: a0, easing: 'linear', fill: 'backwards' });
      a1.animate(grow, { pseudoElement: '::after', duration: ah / v, delay: a0 + (cw + ch) / v, easing: 'linear', fill: 'backwards' });
      var stop = a1.querySelector('.mk--stop');
      if (stop) stop.animate([{ opacity: 0, transform: 'scaleX(0)' }, { opacity: 1, transform: 'none' }], { duration: D1, delay: a0 + (cw + ch + ah) / v, easing: EO, fill: 'backwards' });
    }, 0.25)) trail.classList.add('is-pre');
  }

  function splitLines(box) {
    var f = d.createDocumentFragment(), out = [], cur;
    var open = function () { cur = d.createElement('span'); cur.className = 'ln'; out.push(cur); f.appendChild(cur); };
    open();
    [].slice.call(box.childNodes).forEach(function (n) {
      if (n.nodeType !== 3) { cur.appendChild(n); return; }
      n.nodeValue.split('\n').forEach(function (t, i) { if (i) { f.appendChild(d.createTextNode('\n')); open(); } if (t) cur.appendChild(d.createTextNode(t)); });
    });
    box.textContent = ''; box.appendChild(f);
    return out.filter(function (l) { return l.textContent.trim(); });
  }
  function inBox(box, r) { var b = box.getBoundingClientRect(); return { x: r.left - b.left - box.clientLeft + box.scrollLeft, r: r.right - b.left - box.clientLeft + box.scrollLeft, y: r.top - b.top - box.clientTop + box.scrollTop, h: r.height }; }
  function wipe(l, at) { l.animate([{ clipPath: 'inset(0 100% 0 0)' }, { clipPath: 'inset(0 0 0 0)' }], { duration: D2, delay: at, easing: 'linear', fill: 'backwards' }); }
  var stack = d.querySelector('.stack');
  if (stack) {
    var gh = stack.querySelector('.term--ui'), mcp = stack.querySelector('div.term:not(.term--ui)'), pres = $$('pre.term', stack);
    if (gh) {
      var cks = $$('div.ck', gh).sort(function (a, b) { return !!a.querySelector('b.no') - !!b.querySelector('b.no'); });
      if (onView(gh, function () { cks.forEach(function (c, k) { setTimeout(function () { c.classList.remove('is-run'); }, D2 + k * (D3 - D1)); }); }, 0.6))
        cks.forEach(function (c) { c.classList.add('is-run'); });
    }
    if (mcp) {
      var ml = splitLines(mcp);
      if (onView(mcp, function () { mcp.classList.remove('is-pre'); ml.forEach(function (l, k) { wipe(l, k * (D2 + D1)); }); }, 0.6)) mcp.classList.add('is-pre');
    }
    pres.forEach(function (pre, n) {
      var code = pre.querySelector('code') || pre, ls = splitLines(code), card = pre.parentNode, h3 = card.querySelector('.h3');
      if (h3) {
        h3.id = h3.id || 'h-copy-' + n;
        var cb = d.createElement('button');
        cb.type = 'button'; cb.className = 'copy'; cb.setAttribute('aria-labelledby', 'copy-' + n + ' ' + h3.id);
        cb.innerHTML = '<span class="copy__l" id="copy-' + n + '">Copy</span><span class="copy__l copy__l--done" aria-hidden="true">Copied</span>';
        card.appendChild(cb);
        var live = stack.querySelector('.copy-live');
        if (!live) { live = d.createElement('p'); live.className = 'sr-only copy-live'; live.setAttribute('aria-live', 'polite'); stack.appendChild(live); }
        var text = ls.map(function (l) { return l.textContent.replace(/^\$\s+/, ''); }).join('\n'), tm;
        var said = function () {
          cb.classList.add('is-done'); live.textContent = cb.lastChild.textContent;
          clearTimeout(tm); tm = setTimeout(function () { cb.classList.remove('is-done'); live.textContent = ''; }, 1500);
        };
        cb.addEventListener('click', function () {
          var old = function () {
            var ta = d.createElement('textarea'); ta.value = text; ta.setAttribute('readonly', ''); ta.style.cssText = 'position:fixed;top:0;left:0;opacity:0';
            d.body.appendChild(ta); ta.select(); var ok = false; try { ok = d.execCommand('copy'); } catch (e) {}
            d.body.removeChild(ta); cb.focus(); if (ok) said();
          };
          if (navigator.clipboard && W.isSecureContext) navigator.clipboard.writeText(text).then(said, old); else old();
        });
        watch(function (re) { if (re) cb.style.top = (h3.offsetTop + (h3.offsetHeight - cb.offsetHeight) / 2) + 'px'; });
      }
      if (n === 0) {
        var cur = d.createElement('i'); cur.className = 'term__cur'; cur.setAttribute('aria-hidden', 'true'); pre.appendChild(cur);
        var endOf = function (l) { var b = lineBoxes(l), r = b[b.length - 1]; return r ? inBox(pre, r) : null; };
        var rest = function () { var e = endOf(ls[ls.length - 1]); if (e) { cur.style.height = e.h + 'px'; cur.style.transform = 'translate(' + e.r + 'px,' + e.y + 'px)'; } };
        watch(function (re) { if (re) rest(); });
        if (onView(pre, function () {
          pre.classList.remove('is-pre');
          var T = (ls.length - 1) * (D2 + D1) + D2, kf = [], last = null;
          ls.forEach(function (l, k) {
            var b = lineBoxes(l), s = inBox(pre, b[0]), e = inBox(pre, b[b.length - 1]), t = k * (D2 + D1),
              at = function (x) { return 'translate(' + x + 'px,' + e.y + 'px)'; };
            if (last) kf.push({ transform: last, offset: t / T });
            kf.push({ transform: at(b.length > 1 ? e.r : s.x), offset: t / T }, { transform: last = at(e.r), offset: (t + D2) / T });
            wipe(l, t);
          });
          cur.animate(kf, { duration: T, easing: 'linear' });
        }, 0.6)) pre.classList.add('is-pre');
      } else if (!calm()) {
        var hl = d.createElement('i'); hl.className = 'term__hl'; hl.setAttribute('aria-hidden', 'true'); pre.appendChild(hl);
        onView(pre, function () {
          var lh = parseFloat(getComputedStyle(code).lineHeight), T = ls.length * D3 + D2, kf = [];
          hl.style.height = lh + 'px';
          ls.forEach(function (l, k) {
            var r = inBox(pre, lineBoxes(l)[0]), y = 'translateY(' + (r.y - (lh - r.h) / 2) + 'px)';
            if (!k) kf.push({ opacity: 0, transform: y, offset: 0 }, { opacity: 1, transform: y, offset: D1 / T });
            else kf.push({ opacity: 1, transform: y, offset: (k * D3 + D2) / T });
            kf.push({ opacity: 1, transform: y, offset: (k + 1) * D3 / T, easing: EM });
          });
          kf[kf.length - 1].easing = 'linear';
          kf.push({ opacity: 0, transform: kf[kf.length - 1].transform, offset: 1 });
          hl.animate(kf, { duration: T });
        }, 0.6);
      }
    });
  }

  var GLYPH = 400;
  $$('.fact').forEach(function (f) {
    var k = f.querySelector('.fact__i .k'), busy = false;
    f.tabIndex = 0;
    if (!k) return;
    var draw = function () {
      if (calm() || busy) return;
      busy = true;
      var parts = k.getAttribute('d').match(/M[^M]+/g) || [], n = +k.getAttribute('data-k'), made = [], t = 0, last = null,
        fill = k.classList.contains('f');
      var copy = function (dd) { var c = k.cloneNode(); c.classList.remove('k'); c.removeAttribute('data-k'); c.setAttribute('d', dd); k.parentNode.insertBefore(c, k); made.push(c); return c; };
      if (n) copy(parts.filter(function (x, j) { return j !== n - 1; }).join(''));
      var keys = (n ? [parts[n - 1]] : parts).map(function (dd) { var c = copy(dd); return [c, c.getTotalLength()]; }),
        len = keys.reduce(function (a, x) { return a + x[1]; }, 0) || 1;
      k.style.visibility = 'hidden';
      keys.forEach(function (x) {
        var dur = GLYPH * x[1] / len, on = { strokeDasharray: '1 1', strokeDashoffset: 0 }, kf = [{ strokeDasharray: '1 1', strokeDashoffset: 1 }, on];
        if (fill) { kf[0].fillOpacity = 0; on.fillOpacity = 0; on.offset = 0.6; kf.push({ strokeDasharray: '1 1', strokeDashoffset: 0, fillOpacity: 1 }); }
        x[0].setAttribute('pathLength', '1');
        last = x[0].animate(kf, { duration: dur, delay: t, easing: 'linear', fill: 'backwards' });
        t += dur;
      });
      last.onfinish = last.oncancel = function () { made.forEach(function (c) { c.remove(); }); k.style.visibility = ''; busy = false; };
    };
    f.addEventListener('mouseenter', draw);
    f.addEventListener('focus', draw);
  });

  var how = d.getElementById('how');
  if (how) {
    var hs = $$('.step', how), ol = how.querySelector('.steps'), pl = hs.map(function (s) { return s.querySelector('.plate'); }),
      fg = pl.map(function (p) { return p.querySelector('.fig'); }), px2 = function (n) { return parseFloat(tok(n)) || 0; };
    var drawFig = function (f, quick) {
      if (calm() || !f.classList.contains('fig--draw')) return;
      f.classList.remove('is-in', 'is-done'); f.getBoundingClientRect(); f.classList.add('is-in');
      clearTimeout(f._t); f._t = setTimeout(function () { f.classList.add('is-done'); }, quick ? D3 : D1 + D4 + D2 + D1);
    };
    if (!calm()) {
      H.classList.add('motion');
      fg.forEach(function (f) {
        if (!f.classList.contains('fig--draw')) return;
        if (!onView(f, function () { if (!how.classList.contains('is-a')) drawFig(f); }, 0.5)) f.classList.add('is-in', 'is-done');
      });
    }
    var mqA = W.matchMedia ? W.matchMedia('(min-width: 1101px)') : null, canA = !!(W.CSS && CSS.supports('grid-template-rows', 'subgrid')),
      aOn = false, on = 0, nav2 = d.querySelector('.nav');
    var setStep = function (n) {
      on = n;
      hs.forEach(function (s, i) { s.classList.toggle('is-on', i === n - 1); });
      drawFig(fg[n - 1], true);
      hl();
    };
    var fitA = function () {
      var want = canA && mqA && mqA.matches;
      if (want) {
        how.classList.add('is-a'); ol.style.setProperty('--plate-h', '0px'); ol.style.setProperty('--tail', '0px');
        var ph = Math.max.apply(0, pl.map(function (p) { return p.offsetHeight; })), top = (nav2 ? nav2.offsetHeight : 0) + px2('--sp-5');
        want = ph + top + px2('--sp-7') <= innerHeight;
        if (want) {
          var last = hs[hs.length - 1], blk = last.querySelector('.step__t').getBoundingClientRect().bottom - last.querySelector('.step__n').getBoundingClientRect().top;
          ol.style.setProperty('--plate-h', ph + 'px');
          ol.style.setProperty('--tail', Math.max(0, top + ph - innerHeight / 2 - blk + 2 * px2('--sp-9')) + 'px');
          placeNodes();
        }
      }
      if (!want) { how.classList.remove('is-a'); ol.style.removeProperty('--plate-h'); ol.style.removeProperty('--tail'); }
      if (want !== aOn) {
        aOn = want; on = 0;
        if (!aOn) { hs.forEach(function (s) { s.classList.remove('is-on'); }); fg.forEach(function (f) { if (f.classList.contains('fig--draw') && !calm()) f.classList.add('is-in', 'is-done'); }); }
      }
    };
    var NODES = [['r1', 48, 40, 'Role', 'M48 33l7 7-7 7-7-7z'], ['r2', 48, 136, 'Role', 'M48 129l7 7-7 7-7-7z'], ['c1', 124, 88, 'Contract', 'M116 80h16v16h-16z'],
      ['c2', 200, 40, 'Contract', 'M192 32h16v16h-16z'], ['i1', 200, 88, 'Invariant', 'M178.5 18.5h43v139h-43z'], ['c3', 200, 136, 'Contract', 'M192 128h16v16h-16z'],
      ['c4', 276, 88, 'Contract', 'M268 80h16v16h-16z'], ['c5', 352, 40, 'Contract', 'M344 32h16v16h-16z'], ['r3', 352, 136, 'Role', 'M352 129l7 7-7 7-7-7z']];
    var CALLS = [['r1 c1', 'M55 40H124V80M120 75l4 5 4-5'], ['r2 c1', 'M55 136H124V96M120 101l4-5 4 5'], ['c1 c2', 'M132 88H162V40H192M187 36l5 4-5 4'],
      ['c1 c3', 'M132 88H162V136H192M187 132l5 4-5 4'], ['c2 c4', 'M208 40H238V88H268M263 84l5 4-5 4'], ['c3 c4', 'M208 136H238V88H268M263 84l5 4-5 4'],
      ['c4 c5', 'M284 88H314V40H344M339 36l5 4-5 4'], ['r3 c5', 'M352 129V48M348 53l4-5 4 5']];
    var ui = d.createElement('div'), nodes = [], lit = null, SVGNS = 'http://www.w3.org/2000/svg';
    ui.className = 'sg-ui'; ui.setAttribute('role', 'group');
    NODES.forEach(function (n, i) {
      var e = d.createElement('span'), lab = d.createElement('span');
      e.className = 'sg-n'; e.setAttribute('role', 'img'); e.setAttribute('aria-label', n[3]); e.tabIndex = i ? -1 : 0;
      lab.className = 'sg-lab'; lab.setAttribute('aria-hidden', 'true'); lab.textContent = n[3]; e.appendChild(lab);
      e.addEventListener('mouseenter', function () { lit = n; hl(); });
      e.addEventListener('mouseleave', function () { lit = d.activeElement && d.activeElement._n || null; hl(); });
      e.addEventListener('focus', function () { nodes.forEach(function (x) { x.tabIndex = -1; }); e.tabIndex = 0; lit = n; hl(); });
      e.addEventListener('blur', function () { lit = null; hl(); });
      e.addEventListener('keydown', function (ev) {
        var k = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[ev.key], j = ev.key === 'Home' ? 0 : ev.key === 'End' ? nodes.length - 1 : k ? (i + k + nodes.length) % nodes.length : -1;
        if (j >= 0) { ev.preventDefault(); nodes[j].focus(); }
      });
      e._n = n; nodes.push(e); ui.appendChild(e);
    });
    hs[0].appendChild(ui);
    var placeNodes = function () {
      var sv = fg[0].querySelector('svg'), b = sv.getBoundingClientRect(), p = pl[0].getBoundingClientRect(), k = b.width / 400;
      nodes.forEach(function (e) { var n = e._n; e.style.transform = 'translate(' + (b.left - p.left + n[1] * k) + 'px,' + (b.top - p.top + n[2] * k) + 'px)'; });
    };
    function hl() {
      $$('.sg-hl', how).forEach(function (g) { g.remove(); });
      if (!lit || !aOn || !on) return;
      var sv = fg[on - 1].querySelector('svg'), g = d.createElementNS(SVGNS, 'g'), id = lit[0];
      var add = function (dd, c) { var q = d.createElementNS(SVGNS, 'path'); q.setAttribute('d', dd); if (c) q.setAttribute('class', c); g.appendChild(q); };
      g.setAttribute('class', 'sg-hl');
      CALLS.forEach(function (c) { if (c[0].split(' ').indexOf(id) >= 0) add(c[1]); });
      if (id === 'i1') { add(NODES[3][4], 'hn'); add(NODES[5][4], 'hn'); }
      add(lit[4], id[0] === 'c' ? 'hn' : id[0] === 'r' ? 'hr' : 'hi');
      sv.appendChild(g);
    }
    watch(function (re) {
      if (re) fitA();
      if (!aOn) return;
      var m = innerHeight / 2, n = 1;
      hs.forEach(function (s, i) { if (s.querySelector('.step__n').getBoundingClientRect().top < m) n = i + 1; });
      if (n !== on) setStep(n);
    });
  }

  var h1 = d.querySelector('h1');
  if (h1 && H.classList.contains('h1in')) {
    try { sessionStorage.setItem('qs-h1', '1'); } catch (e) {}
    var rise = function () {
      if (!H.classList.contains('h1in')) return;
      if (calm()) { H.classList.remove('h1in'); return; }
      var units = [], wrapped = false, h0 = h1.offsetHeight, g = d.createRange();
      [].slice.call(h1.childNodes).forEach(function (n) {
        if (n.nodeType === 3) {
          var re = /[^ ]+ *| +/g, mm;
          while ((mm = re.exec(n.nodeValue))) {
            g.setStart(n, mm.index); g.setEnd(n, mm.index + mm[0].replace(/ +$/, '').length || mm.index + mm[0].length);
            var rs = g.getClientRects(); if (rs.length > 1 && rs[0].top !== rs[rs.length - 1].top) wrapped = true;
            units.push([d.createTextNode(mm[0]), rs.length ? rs[0].top : null]);
          }
        } else if (n.nodeType === 1) units.push([n.cloneNode(true), n.getClientRects().length ? n.getClientRects()[0].top : null]);
      });
      var lines = [];
      units.forEach(function (u) {
        var l = lines[lines.length - 1];
        if (!l || (u[1] != null && Math.abs(u[1] - l.top) > 2)) { l = { top: u[1] == null ? (l ? l.top : 0) : u[1], el: d.createElement('span') }; l.el.style.display = 'block'; lines.push(l); }
        l.el.appendChild(u[0]);
      });
      var own = d.createDocumentFragment(), parts = [];
      while (h1.firstChild) own.appendChild(h1.firstChild);
      lines.forEach(function (l) { h1.appendChild(l.el); parts.push(l.el); });
      if (wrapped || !lines.length || h1.offsetHeight !== h0) { h1.textContent = ''; h1.appendChild(own); parts = [h1]; }
      H.classList.remove('h1in');
      var gap = 40, last;
      parts.forEach(function (el, i) {
        last = el.animate([{ opacity: 0, transform: 'translateY(' + px2b('--sp-2') + 'px)' }, { opacity: 1, transform: 'none' }],
          { duration: D3 - gap * (parts.length - 1), delay: gap * i, easing: EO, fill: 'backwards' });
      });
      if (parts[0] !== h1) last.onfinish = last.oncancel = function () { h1.textContent = ''; h1.appendChild(own); };
    };
    var px2b = function (n) { return parseFloat(tok(n)) || 0; };
    var wait = setTimeout(rise, 800);
    if (d.fonts && d.fonts.ready) d.fonts.ready.then(function () { clearTimeout(wait); rise(); }); else rise();
  }
})();
