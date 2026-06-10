(function () {
  'use strict';

  var CFG = window.IQ_CONFIG || {};
  var SUPABASE_URL = 'https://ffyrpjwqtxharjgqqisn.supabase.co';
  var SUPABASE_KEY = 'sb_publishable_qrjV8MbkBjLaU27rjKzdDQ_VP0WFKi1';

  var modal, backdrop;

  function el(tag, cls, html) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html) e.innerHTML = html;
    return e;
  }

  function buildModal() {
    backdrop = el('div', 'iq-backdrop');
    backdrop.addEventListener('click', closeModal);

    modal = el('div', 'iq-modal');
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-label', CFG.title || 'Send us a message');

    modal.innerHTML = '<div class="iq-head">'
      + '<div>'
        + '<div class="iq-title">' + (CFG.title || 'Send us a message') + '</div>'
        + (CFG.subtitle ? '<div class="iq-subtitle">' + CFG.subtitle + '</div>' : '')
      + '</div>'
      + '<button class="iq-close" aria-label="Close">&times;</button>'
      + '</div>'
      + '<form class="iq-form" novalidate>'
        + '<div class="iq-field">'
          + '<label for="iq-message">Message *</label>'
          + '<textarea id="iq-message" name="message" rows="4" placeholder="' + (CFG.placeholder || '') + '" required></textarea>'
        + '</div>'
        + '<div class="iq-row">'
          + '<div class="iq-field"><label for="iq-name">Your name *</label><input id="iq-name" name="name" type="text" placeholder="First name is fine" required /></div>'
          + '<div class="iq-field"><label for="iq-phone">Phone</label><input id="iq-phone" name="phone" type="tel" placeholder="868-XXX-XXXX" /></div>'
        + '</div>'
        + '<div class="iq-field">'
          + '<label for="iq-email">Email *</label>'
          + '<input id="iq-email" name="email" type="email" placeholder="We\'ll reply here" required />'
        + '</div>'
        + '<button type="submit" class="iq-submit">' + (CFG.submitLabel || 'Send message') + '</button>'
      + '</form>'
      + '<div class="iq-confirm" style="display:none">'
        + '<div class="iq-confirm-icon">✓</div>'
        + '<div class="iq-confirm-title">' + (CFG.confirmTitle || 'Message received!') + '</div>'
        + '<div class="iq-confirm-body">' + (CFG.confirmBody || 'We\'ll be in touch shortly.') + '</div>'
      + '</div>';

    modal.querySelector('.iq-close').addEventListener('click', closeModal);
    modal.querySelector('.iq-form').addEventListener('submit', function (e) {
      e.preventDefault();
      handleSubmit(modal.querySelector('.iq-form'));
    });

    document.body.appendChild(backdrop);
    document.body.appendChild(modal);

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeModal();
    });
  }

  function openModal() {
    if (!modal) buildModal();
    backdrop.classList.add('iq-open');
    modal.classList.add('iq-open');
    document.body.style.overflow = 'hidden';
    var first = modal.querySelector('textarea, input');
    if (first) setTimeout(function () { first.focus(); }, 80);
  }

  function closeModal() {
    if (!modal) return;
    backdrop.classList.remove('iq-open');
    modal.classList.remove('iq-open');
    document.body.style.overflow = '';
  }

  function handleSubmit(form) {
    var btn = form.querySelector('.iq-submit');
    btn.disabled = true;
    btn.textContent = 'Sending…';

    var data = {};
    new FormData(form).forEach(function (v, k) { data[k] = v; });

    var payload = {
      site_id: CFG.site_id || (window.location.hostname + window.location.pathname),
      service_type: 'inquiry',
      name: data.name || '',
      phone: data.phone || '',
      email: data.email || '',
      message: data.message || '',
      details: {},
      status: 'new'
    };

    fetch(SUPABASE_URL + '/rest/v1/submissions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_KEY,
        'Authorization': 'Bearer ' + SUPABASE_KEY,
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify(payload)
    })
    .then(function (res) {
      if (!res.ok) return res.text().then(function (t) { throw new Error(t); });
    })
    .then(function () {
      return fetch('/api/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'inquiry', site_id: payload.site_id, name: payload.name })
      }).catch(function () {});
    })
    .then(function () {
      form.style.display = 'none';
      modal.querySelector('.iq-confirm').style.display = '';
      setTimeout(closeModal, 3200);
    })
    .catch(function (err) {
      console.error('Inquiry error:', err);
      btn.disabled = false;
      btn.textContent = CFG.submitLabel || 'Send message';
      var existing = form.querySelector('.iq-error');
      if (!existing) {
        var errEl = document.createElement('div');
        errEl.className = 'iq-error';
        errEl.textContent = 'Something went wrong. Please try again.';
        form.insertBefore(errEl, btn);
        setTimeout(function () { if (errEl.parentNode) errEl.parentNode.removeChild(errEl); }, 4000);
      }
    });
  }

  function init() {
    document.addEventListener('click', function (e) {
      var t = e.target.closest('[data-inquiry-open]');
      if (t) { e.preventDefault(); openModal(); }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
