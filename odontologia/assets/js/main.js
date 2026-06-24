/* Clínica Dental Arco — main.js */
(function () {
  'use strict';

  /* ── Mobile nav ── */
  var toggle = document.getElementById('menu-toggle');
  var mobileMenu = document.getElementById('mobile-menu');
  if (toggle && mobileMenu) {
    toggle.addEventListener('click', function () {
      var isOpen = mobileMenu.classList.toggle('hidden');
      toggle.setAttribute('aria-expanded', String(!isOpen));
      if (!isOpen) { /* close */ } else { mobileMenu.querySelector('a') && mobileMenu.querySelector('a').focus(); }
    });
    mobileMenu.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        mobileMenu.classList.add('hidden');
        toggle.setAttribute('aria-expanded', 'false');
      });
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !mobileMenu.classList.contains('hidden')) {
        mobileMenu.classList.add('hidden');
        toggle.setAttribute('aria-expanded', 'false');
        toggle.focus();
      }
    });
  }

  /* ── Sticky header ── */
  var header = document.getElementById('header');
  if (header) {
    window.addEventListener('scroll', function () {
      header.classList.toggle('header--scrolled', window.scrollY > 60);
    }, { passive: true });
  }

  /* ── Active nav link (IntersectionObserver) ── */
  var sections = document.querySelectorAll('section[id]');
  var navLinks = document.querySelectorAll('.nav-link');
  if ('IntersectionObserver' in window && navLinks.length) {
    var sectionObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          navLinks.forEach(function (l) { l.classList.remove('active'); });
          var active = document.querySelector('.nav-link[href="#' + entry.target.id + '"]');
          if (active) active.classList.add('active');
        }
      });
    }, { threshold: 0.4 });
    sections.forEach(function (s) { sectionObs.observe(s); });
  }

  /* ── Scroll reveal ── */
  var reveals = document.querySelectorAll('.reveal-up, .reveal-left, .reveal-right');
  if ('IntersectionObserver' in window) {
    var revealObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          revealObs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
    reveals.forEach(function (el) { revealObs.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add('is-visible'); });
  }

  /* ── Count-up animation ── */
  var counters = document.querySelectorAll('.count-up');
  if ('IntersectionObserver' in window && counters.length) {
    var countObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          var el = entry.target;
          var target = parseInt(el.dataset.target, 10);
          var duration = 1400;
          var start = performance.now();
          function update(now) {
            var elapsed = Math.min((now - start) / duration, 1);
            var ease = 1 - Math.pow(1 - elapsed, 3);
            el.textContent = Math.round(ease * target).toLocaleString('es-CO');
            if (elapsed < 1) requestAnimationFrame(update);
          }
          requestAnimationFrame(update);
          countObs.unobserve(el);
        }
      });
    }, { threshold: 0.5 });
    counters.forEach(function (c) { countObs.observe(c); });
  }

  /* ── AGENDA MOCK ── */
  (function agendaModule() {

    /* Horario por día de semana (getDay): null = cerrado */
    var schedule = {
      0: null,        // Domingo — cerrado
      1: [8, 18],     // Lunes
      2: [8, 18],     // Martes
      3: [8, 18],     // Miércoles
      4: [8, 18],     // Jueves
      5: [8, 18],     // Viernes
      6: [9, 14]      // Sábado
    };

    /* Slots "ocupados" deterministas por día (evita aleatoriedad en demo) */
    var occupied = { 1:[1,3,6], 2:[0,4,7], 3:[2,5,8], 4:[1,4], 5:[0,3,6], 6:[1,3] };

    var state = { durMin: null, svcLabel: null, fecha: null, slotTime: null };

    var selSvc    = document.getElementById('sel-servicio');
    var stepFecha = document.getElementById('step-fecha');
    var selFecha  = document.getElementById('sel-fecha');
    var stepSlots = document.getElementById('step-slots');
    var slotsGrid = document.getElementById('slots-grid');
    var slotsEmpty= document.getElementById('slots-empty');
    var stepDatos = document.getElementById('step-datos');
    var btnConf   = document.getElementById('btn-confirmar');
    var stepConf  = document.getElementById('step-confirm');
    var confirmRes= document.getElementById('confirm-resumen');
    var btnReset  = document.getElementById('btn-reset');
    var formError = document.getElementById('form-error');
    var resumenBar= document.getElementById('agenda-resumen');
    var rsmSvc    = document.getElementById('rsm-svc');
    var rsmFecha  = document.getElementById('rsm-fecha');
    var rsmHora   = document.getElementById('rsm-hora');

    if (!selSvc) return;

    /* Min date = tomorrow */
    var tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    selFecha.min = tomorrow.toISOString().slice(0, 10);

    function show(el) { el && el.classList.remove('hidden'); }
    function hide(el) { el && el.classList.add('hidden'); }

    function genSlots(dow, durMin) {
      var hours = schedule[dow];
      if (!hours) return [];
      var slots = [];
      var cur = hours[0] * 60;
      var end = hours[1] * 60;
      var occ = occupied[dow] || [];
      var i = 0;
      while (cur + durMin <= end) {
        var h = Math.floor(cur / 60);
        var m = cur % 60;
        slots.push({
          label: (h < 10 ? '0' : '') + h + ':' + (m === 0 ? '00' : m),
          available: occ.indexOf(i) === -1
        });
        cur += durMin;
        i++;
      }
      return slots;
    }

    function renderSlots(slots) {
      slotsGrid.innerHTML = '';
      if (!slots.length) { show(slotsEmpty); return; }
      hide(slotsEmpty);
      slots.forEach(function (s) {
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'slot-btn';
        btn.textContent = s.label;
        if (!s.available) {
          btn.disabled = true;
          btn.setAttribute('aria-label', s.label + ' — ocupado');
        } else {
          btn.setAttribute('aria-label', s.label + ' — disponible');
          btn.addEventListener('click', function () {
            slotsGrid.querySelectorAll('.slot-btn').forEach(function (b) { b.classList.remove('selected'); b.setAttribute('aria-pressed', 'false'); });
            btn.classList.add('selected');
            btn.setAttribute('aria-pressed', 'true');
            state.slotTime = s.label;
            updateResumen();
            show(stepDatos);
            stepDatos.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          });
        }
        slotsGrid.appendChild(btn);
      });
    }

    function updateResumen() {
      if (state.svcLabel) { rsmSvc.textContent = state.svcLabel; show(resumenBar); }
      if (state.fecha)    { rsmFecha.textContent = formatFecha(state.fecha); }
      if (state.slotTime) { rsmHora.textContent = state.slotTime; }
    }

    function formatFecha(iso) {
      var d = new Date(iso + 'T00:00:00');
      return d.toLocaleDateString('es-CO', { weekday: 'short', day: 'numeric', month: 'short' });
    }

    /* Paso 1: selección de servicio */
    selSvc.addEventListener('change', function () {
      var val = selSvc.value;
      if (!val) { hide(stepFecha); hide(stepSlots); hide(stepDatos); hide(resumenBar); return; }
      var parts = val.split('|');
      state.durMin   = parseInt(parts[0], 10);
      state.svcLabel = parts[1];
      state.fecha    = null;
      state.slotTime = null;
      selFecha.value = '';
      slotsGrid.innerHTML = '';
      hide(slotsEmpty);
      hide(stepSlots);
      hide(stepDatos);
      hide(stepConf);
      show(stepFecha);
      updateResumen();
      stepFecha.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });

    /* Paso 2: selección de fecha */
    selFecha.addEventListener('change', function () {
      var val = selFecha.value;
      if (!val) return;
      var d = new Date(val + 'T00:00:00');
      var dow = d.getDay();
      if (!schedule[dow]) {
        slotsGrid.innerHTML = '';
        slotsEmpty.textContent = 'Los domingos estamos cerrados. Por favor elige otro día.';
        show(slotsEmpty);
        show(stepSlots);
        hide(stepDatos);
        return;
      }
      state.fecha    = val;
      state.slotTime = null;
      hide(stepDatos);
      var slots = genSlots(dow, state.durMin);
      renderSlots(slots);
      show(stepSlots);
      updateResumen();
      stepSlots.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });

    /* Paso 4: envío del formulario */
    btnConf && btnConf.addEventListener('click', function () {
      var nombre = document.getElementById('ag-nombre').value.trim();
      var email  = document.getElementById('ag-email').value.trim();
      var tel    = document.getElementById('ag-tel').value.trim();
      if (!nombre || !email || !tel) {
        formError.textContent = 'Por favor completa tu nombre, correo y teléfono para continuar.';
        show(formError);
        return;
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        formError.textContent = 'El correo electrónico no parece válido. Revísalo.';
        show(formError);
        return;
      }
      hide(formError);
      /* PRODUCCIÓN: aquí iría fetch('/api/citas', { method:'POST', body: JSON.stringify({...}) }) */
      confirmRes.textContent =
        nombre + ', tu solicitud para ' + state.svcLabel +
        ' el ' + formatFecha(state.fecha) + ' a las ' + state.slotTime +
        ' fue recibida. Nos contactaremos contigo en menos de 2 horas para confirmar.';
      hide(stepSlots);
      hide(stepDatos);
      hide(resumenBar);
      show(stepConf);
      stepConf.scrollIntoView({ behavior: 'smooth', block: 'center' });
      /* Analytics hook */
      // window.dataLayer = window.dataLayer || [];
      // window.dataLayer.push({ event: 'agenda_submit', servicio: state.svcLabel });
    });

    /* Reset */
    btnReset && btnReset.addEventListener('click', function () {
      selSvc.value = '';
      ['ag-nombre','ag-email','ag-tel','ag-notas'].forEach(function (id) {
        var el = document.getElementById(id); if (el) el.value = '';
      });
      state = { durMin: null, svcLabel: null, fecha: null, slotTime: null };
      hide(stepFecha); hide(stepSlots); hide(stepDatos); hide(stepConf); hide(resumenBar);
      show(document.getElementById('step-servicio'));
      selSvc.focus();
    });

  })();

  /* ── Analytics hooks ── */
  document.querySelectorAll('[id^="cta-"]').forEach(function (el) {
    el.addEventListener('click', function () {
      // window.dataLayer = window.dataLayer || [];
      // window.dataLayer.push({ event: 'cta_click', cta_id: el.id });
    });
  });

})();
