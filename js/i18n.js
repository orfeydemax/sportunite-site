// ============================================
// SPORT UNITE — Система интернационализации (i18n)
// ============================================

(function () {
    'use strict';

    const STORAGE_KEY = 'su_lang';
    const DEFAULT_LANG = 'ru';
    const SUPPORTED_LANGS = ['ru', 'en'];

    let translations = {};
    let currentLang = DEFAULT_LANG;

    // Определение языка: localStorage → браузер → дефолт
    function detectLang() {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored && SUPPORTED_LANGS.includes(stored)) return stored;

        const browserLang = (navigator.language || navigator.userLanguage || '').slice(0, 2);
        if (SUPPORTED_LANGS.includes(browserLang) && browserLang !== DEFAULT_LANG) return browserLang;

        return DEFAULT_LANG;
    }

    // Загрузка JSON-файла переводов
    async function loadTranslations(lang) {
        if (translations[lang]) return translations[lang];

        try {
            const resp = await fetch(`i18n/${lang}.json?v=${Date.now()}`);
            if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
            translations[lang] = await resp.json();
            return translations[lang];
        } catch (err) {
            console.warn(`[i18n] Не удалось загрузить i18n/${lang}.json:`, err);
            return null;
        }
    }

    // Применение переводов ко всем элементам с data-i18n
    function applyTranslations(dict) {
        if (!dict) return;

        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            if (dict[key] !== undefined) {
                el.innerHTML = dict[key];
            }
        });

        // 2. Перевод атрибутов alt для изображений
        document.querySelectorAll('[data-i18n-alt]').forEach(el => {
            const key = el.getAttribute('data-i18n-alt');
            if (dict[key] !== undefined) {
                el.setAttribute('alt', dict[key]);
            }
        });

        // 3. Перевод атрибутов placeholder для инпутов
        document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
            const key = el.getAttribute('data-i18n-placeholder');
            if (dict[key] !== undefined) {
                el.setAttribute('placeholder', dict[key]);
            }
        });

        // --- SEO: Динамические мета-теги ---
        if (dict['seo_title']) {
            document.title = dict['seo_title'];
        }
        if (dict['seo_description']) {
            const metaDesc = document.querySelector('meta[name="description"]');
            if (metaDesc) metaDesc.setAttribute('content', dict['seo_description']);
        }
        // ----------------------------------

        // Обновляем атрибут lang на <html>
        document.documentElement.lang = currentLang;

        // Обновляем UI переключателя
        updateToggleUI();

        // Обновляем мобильное меню (overlay), если есть
        updateMobileOverlay();
    }

    // Обновление кнопки переключателя
    function updateToggleUI() {
        const toggle = document.getElementById('lang-toggle');
        if (!toggle) return;

        const ruSpan = toggle.querySelector('.lang-toggle__ru');
        const enSpan = toggle.querySelector('.lang-toggle__en');

        if (ruSpan && enSpan) {
            ruSpan.classList.toggle('is-active', currentLang === 'ru');
            enSpan.classList.toggle('is-active', currentLang === 'en');
        }
    }

    // Обновление мобильного меню-оверлея
    function updateMobileOverlay() {
        const overlay = document.querySelector('.nav-overlay');
        if (!overlay) return;

        const nav = document.getElementById('nav');
        if (!nav) return;

        // Копируем обновлённый HTML навигации в оверлей
        overlay.innerHTML = nav.innerHTML;

        // Заново навешиваем обработчик закрытия
        overlay.querySelectorAll('.nav__link').forEach(link => {
            link.addEventListener('click', () => {
                const burger = document.getElementById('burger');
                if (burger) burger.classList.remove('is-active');
                overlay.classList.remove('is-active');
                document.body.style.overflow = '';
            });
        });
    }

    // Переключение языка
    async function switchLang(lang) {
        if (!SUPPORTED_LANGS.includes(lang)) return;
        if (lang === currentLang) return;

        currentLang = lang;
        localStorage.setItem(STORAGE_KEY, lang);

        const dict = await loadTranslations(lang);
        applyTranslations(dict);
    }

    // Инициализация
    async function init() {
        currentLang = detectLang();

        // Предзагрузка обоих языков
        await Promise.all([
            loadTranslations('ru'),
            loadTranslations('en')
        ]);

        // Применяем, только если текущий язык != русский (HTML по умолчанию русский)
        if (currentLang !== DEFAULT_LANG) {
            const dict = await loadTranslations(currentLang);
            applyTranslations(dict);
        } else {
            updateToggleUI();
        }

        // Обработчик клика на переключатель
        const toggle = document.getElementById('lang-toggle');
        if (toggle) {
            toggle.addEventListener('click', () => {
                const newLang = currentLang === 'ru' ? 'en' : 'ru';
                switchLang(newLang);
            });
        }
    }

    // Запуск после загрузки DOM
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // Экспорт для глобального доступа
    window.i18n = { switchLang, getCurrentLang: () => currentLang };

})();
