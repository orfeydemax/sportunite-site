/* SPORT UNITE — страница события «Интерклуб №8».
   Без зависимостей. Страница читается и без этого файла:
   скрипт только уточняет состояние регистрации по дате. */
(function () {
    'use strict';

    var COUNTER_ID = 107040995;
    var DAY = 86400000;

    // Все даты — по времени Вьетнама (UTC+7).
    var LATE_FROM = Date.parse('2026-11-22T00:00:00+07:00'); // взнос для взрослых 1 000 000
    var CLOSE_AT = Date.parse('2026-11-26T00:00:00+07:00');  // регистрация закрыта (25.11 включительно)
    var EVENT_END = Date.parse('2026-11-29T00:00:00+07:00'); // турнир прошёл

    var ORGANIZER = 'https://t.me/harian17';
    var CLUB = 'https://sportunitevn.com/';

    // ?now=2026-11-23 — проверка состояний без ожидания даты
    function now() {
        var m = /[?&]now=(\d{4}-\d{2}-\d{2})(?:T(\d{2}:\d{2}))?/.exec(location.search);
        if (m) return Date.parse(m[1] + 'T' + (m[2] || '12:00') + ':00+07:00');
        return Date.now();
    }

    function state(t) {
        if (t >= EVENT_END) return 'passed';
        if (t >= CLOSE_AT) return 'closed';
        if (t >= LATE_FROM) return 'open-late';
        return 'open-early';
    }

    function plural(n, one, few, many) {
        var a = n % 10, b = n % 100;
        if (a === 1 && b !== 11) return one;
        if (a >= 2 && a <= 4 && (b < 12 || b > 14)) return few;
        return many;
    }

    function $(sel, root) { return (root || document).querySelector(sel); }
    function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }

    function track(goal, fbEvent) {
        try {
            if (typeof ym !== 'undefined') ym(COUNTER_ID, 'reachGoal', goal);
            if (fbEvent && typeof fbq !== 'undefined') fbq('track', fbEvent);
        } catch (e) { /* аналитика не должна ломать страницу */ }
    }

    document.addEventListener('DOMContentLoaded', function () {
        var t = now();
        var st = state(t);
        var open = st === 'open-early' || st === 'open-late';

        /* ---------- состояние регистрации ---------- */
        var ticket = $('#ticket');
        var fee = $('[data-fee]');
        var feeHint = $('[data-fee-hint]');
        var statusEl = $('[data-reg-status]');
        var cta = $('[data-reg-cta]');
        var closedText = $('[data-closed-text]');

        function renderFee() {
            if (!open || !fee) return;
            var who = ($('input[name="who"]:checked') || {}).value || 'adult';
            if (who === 'kid') {
                fee.textContent = '350 000 VND';
                feeHint.textContent = 'Взнос для детей не меняется до конца регистрации. Ребёнку 6 лет нужен отдельный допуск организатора.';
            } else if (st === 'open-late') {
                fee.textContent = '1 000 000 VND';
                feeHint.textContent = 'Взнос для взрослых с 22 ноября и до конца регистрации.';
            } else {
                fee.textContent = '500 000 VND';
                feeHint.textContent = 'До 21 ноября включительно. С 22 ноября взнос 1 000 000 VND.';
            }
        }

        if (ticket) {
            ticket.setAttribute('data-state', st);

            if (open) {
                var days = Math.ceil((CLOSE_AT - t) / DAY);
                statusEl.textContent = days <= 1
                    ? 'Последний день'
                    : 'Ещё ' + days + ' ' + plural(days, 'день', 'дня', 'дней');
                $$('input[name="who"]').forEach(function (r) { r.addEventListener('change', renderFee); });
                renderFee();
            } else {
                $$('[data-open-only]').forEach(function (el) { el.hidden = true; });
                closedText.hidden = false;
                cta.removeAttribute('data-fb');

                if (st === 'closed') {
                    statusEl.textContent = 'Закрыта';
                    closedText.textContent = 'Регистрация закрылась 25 ноября. Приходи 28 ноября зрителем: вход бесплатный, детские бои с 09:00.';
                    cta.textContent = 'Написать организатору';
                    cta.href = ORGANIZER;
                    cta.setAttribute('data-goal', 'event_closed_write');
                } else {
                    statusEl.textContent = 'Турнир прошёл';
                    closedText.textContent = '«Интерклуб №8» прошёл 28 ноября. О следующем турнире расскажем в Instagram и на сайте клуба.';
                    cta.textContent = 'На сайт клуба';
                    cta.href = CLUB;
                    cta.setAttribute('data-goal', 'event_passed_club');
                }
            }
        }

        // подписи кнопок и тексты вокруг, когда регистрация закрыта
        if (!open) {
            var label = st === 'closed' ? 'Как прийти зрителем' : 'Итоги и контакты';
            $$('[data-reg-label]').forEach(function (el) { el.textContent = label; });
            $$('a[href="#register"]').forEach(function (a) {
                if (st === 'closed') a.setAttribute('href', '#place');
            });
            var note = $('[data-reg-note]');
            var barNote = $('[data-bar-note]');
            var fTitle = $('[data-final-title]');
            var fText = $('[data-final-text]');
            if (st === 'closed') {
                if (note) note.textContent = 'Регистрация участников закрыта. Зрителям вход бесплатный, запись не нужна.';
                if (barNote) barNote.textContent = 'Вход бесплатный';
                if (fTitle) fTitle.innerHTML = 'Приходи <span class="accent">28 ноября</span>';
                if (fText) fText.textContent = 'Регистрация участников закрыта. Зрителям вход бесплатный: детские бои с 09:00, взрослые с 16:00.';
            } else {
                if (note) note.textContent = 'Турнир прошёл 28 ноября. Спасибо участникам и зрителям.';
                if (barNote) barNote.textContent = 'Турнир прошёл';
                if (fTitle) fTitle.innerHTML = 'Турнир <span class="accent">прошёл</span>';
                if (fText) fText.textContent = 'Спасибо участникам и зрителям. О следующем турнире расскажем в Instagram клуба.';
            }
        } else if (st === 'open-late') {
            var fText2 = $('[data-final-text]');
            if (fText2) fText2.textContent = 'Регистрация закрывается 25 ноября. В день турнира записаться нельзя.';
        }

        /* ---------- календарь: прошедшие дни и сегодня ---------- */
        $$('.ev-day[data-date]').forEach(function (li) {
            var start = Date.parse(li.getAttribute('data-date') + 'T00:00:00+07:00');
            if (t >= start + DAY) li.classList.add('is-past');
            else if (t >= start) li.classList.add('is-today');
        });

        /* ---------- шапка и меню ---------- */
        var header = $('#header');
        var burger = $('#burger');
        var overlay = $('#mobile-nav');

        function onScroll() {
            if (header) header.classList.toggle('header--scrolled', window.scrollY > 8);
        }
        window.addEventListener('scroll', onScroll, { passive: true });
        onScroll();

        function setMenu(on) {
            burger.classList.toggle('is-active', on);
            overlay.classList.toggle('is-active', on);
            burger.setAttribute('aria-expanded', on ? 'true' : 'false');
            burger.setAttribute('aria-label', on ? 'Закрыть меню' : 'Открыть меню');
            document.body.style.overflow = on ? 'hidden' : '';
        }
        if (burger && overlay) {
            burger.addEventListener('click', function () { setMenu(!overlay.classList.contains('is-active')); });
            $$('a', overlay).forEach(function (a) { a.addEventListener('click', function () { setMenu(false); }); });
            document.addEventListener('keydown', function (e) {
                if (e.key === 'Escape' && overlay.classList.contains('is-active')) { setMenu(false); burger.focus(); }
            });
        }

        // активный пункт меню
        var links = $$('#nav .nav__link');
        if ('IntersectionObserver' in window && links.length) {
            var spy = new IntersectionObserver(function (entries) {
                entries.forEach(function (en) {
                    if (!en.isIntersecting) return;
                    links.forEach(function (l) {
                        l.classList.toggle('nav__link--active', l.getAttribute('href') === '#' + en.target.id);
                    });
                });
            }, { rootMargin: '-45% 0px -50% 0px' });
            links.forEach(function (l) {
                var sec = $(l.getAttribute('href'));
                if (sec) spy.observe(sec);
            });
        }

        /* ---------- панель записи на телефоне ---------- */
        var bar = $('#reg-bar');
        var heroCta = $('.hero__cta-group');
        var regSection = $('#register');
        var finalSection = $('#final');
        if (bar && heroCta && 'IntersectionObserver' in window && st !== 'passed') {
            var seen = { hero: true, reg: false, fin: false };
            var update = function () {
                var show = !seen.hero && !seen.reg && !seen.fin;
                bar.hidden = !show;
                document.body.classList.toggle('has-bar', show);
            };
            var io = new IntersectionObserver(function (entries) {
                entries.forEach(function (en) {
                    if (en.target === heroCta) seen.hero = en.isIntersecting;
                    if (en.target === regSection) seen.reg = en.isIntersecting;
                    if (en.target === finalSection) seen.fin = en.isIntersecting;
                });
                update();
            });
            io.observe(heroCta);
            if (regSection) io.observe(regSection);
            if (finalSection) io.observe(finalSection);
        }

        /* ---------- галерея и лайтбокс ---------- */
        var grid = $('#gallery-grid');
        var toggle = $('#gallery-toggle');
        if (grid && toggle) {
            toggle.addEventListener('click', function () {
                var on = !grid.classList.contains('is-expanded');
                grid.classList.toggle('is-expanded', on);
                toggle.setAttribute('aria-expanded', on ? 'true' : 'false');
                toggle.textContent = on ? 'Свернуть фото' : 'Показать все фото';
            });
        }

        var box = $('#lightbox');
        var boxImg = $('#lightbox-img');
        var counter = $('#lightbox-counter');
        var items = $$('.gallery__item[data-full]');
        var index = 0;
        var lastFocus = null;

        function show(i) {
            index = (i + items.length) % items.length;
            var it = items[index];
            boxImg.src = it.getAttribute('data-full');
            boxImg.alt = ($('img', it) || {}).alt || '';
            counter.textContent = (index + 1) + ' / ' + items.length;
        }
        function openBox(i) {
            lastFocus = document.activeElement;
            show(i);
            box.classList.add('is-active');
            document.body.style.overflow = 'hidden';
            $('#lightbox-close').focus();
        }
        function closeBox() {
            box.classList.remove('is-active');
            document.body.style.overflow = '';
            if (lastFocus) lastFocus.focus();
        }
        if (box && items.length) {
            items.forEach(function (it, i) { it.addEventListener('click', function () { openBox(i); }); });
            $('#lightbox-close').addEventListener('click', closeBox);
            $('#lightbox-prev').addEventListener('click', function () { show(index - 1); });
            $('#lightbox-next').addEventListener('click', function () { show(index + 1); });
            box.addEventListener('click', function (e) {
                if (e.target === box || e.target.classList.contains('lightbox__content')) closeBox();
            });
            document.addEventListener('keydown', function (e) {
                if (!box.classList.contains('is-active')) return;
                if (e.key === 'Escape') closeBox();
                else if (e.key === 'ArrowLeft') show(index - 1);
                else if (e.key === 'ArrowRight') show(index + 1);
                else if (e.key === 'Tab') {
                    // фокус остаётся внутри лайтбокса
                    var f = $$('button', box);
                    var first = f[0], last = f[f.length - 1];
                    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
                    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
                }
            });
            var x0 = null;
            box.addEventListener('touchstart', function (e) { x0 = e.touches[0].clientX; }, { passive: true });
            box.addEventListener('touchend', function (e) {
                if (x0 === null) return;
                var dx = e.changedTouches[0].clientX - x0;
                if (Math.abs(dx) > 50) show(index + (dx < 0 ? 1 : -1));
                x0 = null;
            });
        }

        /* ---------- аналитика ---------- */
        document.addEventListener('click', function (e) {
            var el = e.target.closest ? e.target.closest('[data-goal]') : null;
            if (el) track(el.getAttribute('data-goal'), el.getAttribute('data-fb'));
        });
    });
})();
