(function () {
  'use strict';

  var CFG = window.RS_CONFIG || {};
  var SUPABASE_URL = 'https://ffyrpjwqtxharjgqqisn.supabase.co';
  var SUPABASE_KEY = 'sb_publishable_qrjV8MbkBjLaU27rjKzdDQ_VP0WFKi1';

  var cart = [];
  var drawer, overlay, badge;

  /* ── helpers ── */

  function el(tag, cls, html) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html) e.innerHTML = html;
    return e;
  }

  function money(str) {
    var n = parseFloat(String(str).replace(/[^0-9.]/g, ''));
    return isNaN(n) ? 0 : n;
  }

  function cartTotal() {
    return cart.reduce(function (s, i) { return s + i.price; }, 0);
  }

  function serviceNames() {
    return cart.map(function (i) { return i.name; }).join(', ');
  }

  /* ── cart badge ── */

  function updateBadge() {
    if (!badge) return;
    badge.textContent = cart.length;
    badge.style.display = cart.length ? 'flex' : 'none';
  }

  /* ── service buttons ── */

  function attachServiceButtons() {
    var ic = CFG.itemize || {};
    var rows = document.querySelectorAll(ic.row || '.svc');
    rows.forEach(function (row) {
      var btn = row.querySelector(ic.action || '.add-svc');
      if (!btn) return;
      var nameEl = row.querySelector(ic.name || '.nm');
      var priceEl = row.querySelector(ic.price || '.svc-price');
      var name = nameEl ? nameEl.textContent.trim() : '';
      var price = priceEl ? money(priceEl.textContent) : 0;
      var catEl = ic.categoryScope ? row.closest(ic.categoryScope) : null;
      var cat = catEl ? (catEl.dataset.cat || '') : '';

      btn.addEventListener('click', function () {
        var idx = cart.findIndex(function (c) { return c.name === name; });
        if (idx > -1) {
          cart.splice(idx, 1);
          btn.classList.remove('rs-added');
          btn.setAttribute('aria-label', 'Add ' + name);
        } else {
          cart.push({ name: name, price: price, cat: cat });
          btn.classList.add('rs-added');
          btn.setAttribute('aria-label', 'Remove ' + name);
        }
        updateBadge();
        refreshCart();
      });
    });
  }

  /* ── drawer ── */

  function buildDrawer() {
    overlay = el('div', 'rs-overlay');
    overlay.addEventListener('click', closeDrawer);

    drawer = el('div', 'rs-drawer');
    drawer.setAttribute('role', 'dialog');
    drawer.setAttribute('aria-modal', 'true');
    drawer.setAttribute('aria-label', CFG.drawerTitle || 'Book');

    var html = '<div class="rs-drawer-inner">'
      + '<div class="rs-head">'
      + '<div class="rs-title">' + (CFG.drawerTitle || 'Build your appointment') + '</div>'
      + '<button class="rs-close" aria-label="Close">&times;</button>'
      + '</div>'
      + '<div class="rs-body">'
      + '<div class="rs-cart-section"><div class="rs-cart-label">Selected services</div><div class="rs-cart-list"></div><div class="rs-cart-empty">No services selected yet.<br>Add them from the menu above.</div></div>'
      + '<div class="rs-detail-section"><div class="rs-detail-label">' + (CFG.detailLabel || 'Your details') + '</div><form class="rs-form" novalidate></form></div>'
      + '</div>'
      + '<div class="rs-confirm" style="display:none">'
      + '<div class="rs-confirm-icon">✓</div>'
      + '<div class="rs-confirm-title">' + (CFG.confirmTitle || 'Request received!') + '</div>'
      + '<div class="rs-confirm-body">' + (CFG.confirmBody || 'We\'ll be in touch shortly.') + '</div>'
      + '</div>'
      + '</div>';

    drawer.innerHTML = html;
    drawer.querySelector('.rs-close').addEventListener('click', closeDrawer);

    buildForm(drawer.querySelector('.rs-form'));

    document.body.appendChild(overlay);
    document.body.appendChild(drawer);

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeDrawer();
    });
  }

  function buildForm(form) {
    var fields = CFG.detailFields || [
      { id: 'name', label: 'Your name', type: 'text', placeholder: 'First name is fine' },
      { id: 'phone', label: 'Phone number', type: 'tel', placeholder: 'e.g. 868-XXX-XXXX' },
      { id: 'email', label: 'Email address', type: 'email', placeholder: 'For your confirmation' }
    ];

    fields.forEach(function (f) {
      var wrap = el('div', 'rs-field');
      var lbl = el('label');
      lbl.setAttribute('for', 'rs-' + f.id);
      lbl.textContent = f.label + (f.optional ? '' : ' *');

      var input;
      if (f.type === 'textarea') {
        input = el('textarea');
        input.rows = 3;
      } else if (f.type === 'select') {
        input = el('select');
        (f.options || []).forEach(function (opt) {
          var o = el('option');
          o.value = opt;
          o.textContent = opt;
          input.appendChild(o);
        });
      } else {
        input = el('input');
        input.type = f.type || 'text';
        if (f.placeholder) input.placeholder = f.placeholder;
      }

      input.id = 'rs-' + f.id;
      input.name = f.id;
      if (!f.optional) input.required = true;

      wrap.appendChild(lbl);
      wrap.appendChild(input);
      form.appendChild(wrap);
    });

    var submit = el('button', 'rs-submit');
    submit.type = 'submit';
    submit.textContent = CFG.submitLabel || 'Send booking request';
    form.appendChild(submit);

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      handleSubmit(form);
    });
  }

  function refreshCart() {
    if (!drawer) return;
    var list = drawer.querySelector('.rs-cart-list');
    var empty = drawer.querySelector('.rs-cart-empty');
    list.innerHTML = '';

    if (cart.length === 0) {
      empty.style.display = '';
      list.style.display = 'none';
    } else {
      empty.style.display = 'none';
      list.style.display = '';
      cart.forEach(function (item) {
        var row = el('div', 'rs-cart-row');
        row.innerHTML = '<span class="rs-cart-name">' + item.name + '</span>'
          + '<span class="rs-cart-price">' + (CFG.currency || '$') + item.price.toFixed(2) + '</span>';
        list.appendChild(row);
      });
      var total = el('div', 'rs-cart-total');
      total.innerHTML = '<span>Total</span><span>' + (CFG.currency || '$') + cartTotal().toFixed(2) + '</span>';
      list.appendChild(total);
    }
  }

  function openDrawer() {
    if (!drawer) buildDrawer();
    // Reset confirm state so drawer is reusable
    var body = drawer.querySelector('.rs-body');
    var confirm = drawer.querySelector('.rs-confirm');
    var submitBtn = drawer.querySelector('.rs-submit');
    if (body) body.style.display = '';
    if (confirm) confirm.style.display = 'none';
    if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = CFG.submitLabel || 'Send booking request'; }
    refreshCart();
    overlay.classList.add('rs-open');
    drawer.classList.add('rs-open');
    document.body.style.overflow = 'hidden';
    var firstInput = drawer.querySelector('input, textarea, select');
    if (firstInput) setTimeout(function () { firstInput.focus(); }, 120);
  }

  function closeDrawer() {
    if (!drawer) return;
    overlay.classList.remove('rs-open');
    drawer.classList.remove('rs-open');
    document.body.style.overflow = '';
  }

  /* ── submit ── */

  function handleSubmit(form) {
    var btn = form.querySelector('.rs-submit');
    btn.disabled = true;
    btn.textContent = 'Sending…';

    var data = {};
    new FormData(form).forEach(function (v, k) { data[k] = v; });

    var fields = CFG.detailFields || [];
    var extras = {};
    fields.forEach(function (f) {
      if (!['name', 'phone', 'email', 'message'].includes(f.id)) {
        extras[f.id] = data[f.id] || '';
      }
    });

    var payload = {
      site_id: CFG.site_id || (window.location.hostname + window.location.pathname),
      service_type: serviceNames() || 'booking',
      name: data.name || '',
      phone: data.phone || '',
      email: data.email || '',
      message: data.notes || data.message || '',
      details: Object.assign({ items: cart, total: cartTotal() }, extras),
      status: 'new'
    };

    insertSubmission(payload)
      .then(function () {
        return notifyOwner({ type: 'booking', site_id: payload.site_id, name: payload.name, service_type: payload.service_type });
      })
      .then(function () {
        showConfirm();
      })
      .catch(function (err) {
        console.error('Submission error:', err);
        btn.disabled = false;
        btn.textContent = CFG.submitLabel || 'Send booking request';
        showError(form);
      });
  }

  function insertSubmission(payload) {
    return fetch(SUPABASE_URL + '/rest/v1/submissions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_KEY,
        'Authorization': 'Bearer ' + SUPABASE_KEY,
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify(payload)
    }).then(function (res) {
      if (!res.ok) return res.text().then(function (t) { throw new Error(t); });
    });
  }

  function notifyOwner(meta) {
    return fetch('/api/notify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(meta)
    }).catch(function () { /* non-fatal */ });
  }

  function showConfirm() {
    var body = drawer.querySelector('.rs-body');
    var confirm = drawer.querySelector('.rs-confirm');
    body.style.display = 'none';
    confirm.style.display = '';
    cart = [];
    updateBadge();
    document.querySelectorAll('.add-svc.rs-added').forEach(function (b) {
      b.classList.remove('rs-added');
    });
    setTimeout(closeDrawer, 3200);
  }

  function showError(form) {
    var existing = form.querySelector('.rs-error');
    if (existing) return;
    var err = el('div', 'rs-error', 'Something went wrong. Please try again.');
    form.insertBefore(err, form.querySelector('.rs-submit'));
    setTimeout(function () { if (err.parentNode) err.parentNode.removeChild(err); }, 4000);
  }

  /* ── floating cart button ── */

  function buildCartBtn() {
    var btn = el('button', 'rs-cart-btn');
    btn.setAttribute('aria-label', 'View booking cart');
    btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>';
    badge = el('span', 'rs-cart-badge', '0');
    badge.style.display = 'none';
    btn.appendChild(badge);
    btn.addEventListener('click', openDrawer);
    document.body.appendChild(btn);
  }

  /* ── open triggers ── */

  function attachOpenTriggers() {
    document.addEventListener('click', function (e) {
      var t = e.target.closest('[data-booking-open]');
      if (t) { e.preventDefault(); openDrawer(); }
    });
  }

  /* ── init ── */

  function init() {
    buildCartBtn();
    attachServiceButtons();
    attachOpenTriggers();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
