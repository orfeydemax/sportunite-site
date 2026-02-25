// ============================================
// SPORT UNITE — Основной JavaScript
// ============================================

document.addEventListener('DOMContentLoaded', () => {

    // ---- Атмосфера ринга: Искры на холсте (Canvas) ----
    const heroCanvas = document.getElementById('hero-canvas');
    if (heroCanvas && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        const ctx = heroCanvas.getContext('2d');
        let w, h;

        function resizeCanvas() {
            const hero = heroCanvas.parentElement;
            w = heroCanvas.width = hero.offsetWidth;
            h = heroCanvas.height = hero.offsetHeight;
        }
        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);

        // Частицы искр
        const sparks = [];
        const SPARK_COUNT = 50;

        for (let i = 0; i < SPARK_COUNT; i++) {
            sparks.push({
                x: Math.random() * w,
                y: Math.random() * h,
                vx: (Math.random() - 0.5) * 0.4,
                vy: (Math.random() - 0.5) * 0.3 - 0.15,
                size: Math.random() * 2.5 + 0.5,
                alpha: Math.random() * 0.5 + 0.1,
                pulse: Math.random() * Math.PI * 2,
                pulseSpeed: Math.random() * 0.02 + 0.005,
                hue: Math.random() > 0.7 ? 30 : 0, // оранжевый или красный
                sat: 80 + Math.random() * 20
            });
        }

        function animateSparks() {
            ctx.clearRect(0, 0, w, h);

            sparks.forEach(s => {
                s.x += s.vx;
                s.y += s.vy;
                s.pulse += s.pulseSpeed;

                const flickerAlpha = s.alpha * (0.5 + 0.5 * Math.sin(s.pulse));

                // Зацикливание движения
                if (s.x < -10) s.x = w + 10;
                if (s.x > w + 10) s.x = -10;
                if (s.y < -10) s.y = h + 10;
                if (s.y > h + 10) s.y = -10;

                // Отрисовка искры со свечением
                ctx.save();
                ctx.globalAlpha = flickerAlpha;
                ctx.shadowBlur = s.size * 6;
                ctx.shadowColor = `hsla(${s.hue}, ${s.sat}%, 60%, 0.6)`;
                ctx.fillStyle = `hsla(${s.hue}, ${s.sat}%, 70%, 1)`;
                ctx.beginPath();
                ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            });

            requestAnimationFrame(animateSparks);
        }
        animateSparks();
    }

    // ---- Атмосфера ринга: Частицы пыли (CSS) ----
    const dustContainer = document.getElementById('hero-dust');
    if (dustContainer) {
        const DUST_COUNT = 25;
        for (let i = 0; i < DUST_COUNT; i++) {
            const p = document.createElement('div');
            p.classList.add('dust-particle');
            const size = Math.random() * 5 + 2;
            p.style.setProperty('--size', `${size}px`);
            p.style.setProperty('--alpha', (Math.random() * 0.3 + 0.1).toFixed(2));
            p.style.setProperty('--dur', `${Math.random() * 10 + 6}s`);
            p.style.setProperty('--delay', `${Math.random() * -15}s`);
            p.style.setProperty('--dx', `${(Math.random() - 0.5) * 80}px`);
            p.style.setProperty('--dy', `${(Math.random() - 0.5) * 100 - 30}px`);
            p.style.left = `${Math.random() * 100}%`;
            p.style.top = `${Math.random() * 100}%`;
            dustContainer.appendChild(p);
        }
    }

    // ---- Анимации при прокрутке (IntersectionObserver) ----
    const animatedElements = document.querySelectorAll('[data-animate]');

    const observerOptions = {
        root: null,
        rootMargin: '0px 0px -60px 0px',
        threshold: 0.1
    };

    const animObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry, index) => {
            if (entry.isIntersecting) {
                // Ступенчатая анимация для соседних элементов
                const siblings = entry.target.parentElement.querySelectorAll('[data-animate]');
                let delay = 0;
                siblings.forEach((sibling, i) => {
                    if (sibling === entry.target) {
                        delay = i * 80;
                    }
                });

                setTimeout(() => {
                    entry.target.classList.add('is-visible');
                }, delay);

                animObserver.unobserve(entry.target);
            }
        });
    }, observerOptions);

    animatedElements.forEach(el => animObserver.observe(el));

    // ---- Эффект шапки при прокрутке ----
    const header = document.getElementById('header');
    let lastScroll = 0;

    window.addEventListener('scroll', () => {
        const currentScroll = window.pageYOffset;

        if (currentScroll > 80) {
            header.classList.add('header--scrolled');
        } else {
            header.classList.remove('header--scrolled');
        }

        lastScroll = currentScroll;
    }, { passive: true });

    // ---- Бургер-меню ----
    const burger = document.getElementById('burger');
    const nav = document.getElementById('nav');

    // Создание мобильного оверлея
    const overlay = document.createElement('div');
    overlay.className = 'nav-overlay';
    overlay.innerHTML = nav.innerHTML;
    document.body.appendChild(overlay);

    // Закрытие при клике на ссылку
    overlay.querySelectorAll('.nav__link').forEach(link => {
        link.addEventListener('click', () => {
            closeMobileMenu();
        });
    });

    burger.addEventListener('click', () => {
        if (burger.classList.contains('is-active')) {
            closeMobileMenu();
        } else {
            openMobileMenu();
        }
    });

    function openMobileMenu() {
        burger.classList.add('is-active');
        overlay.classList.add('is-active');
        document.body.style.overflow = 'hidden';
    }

    function closeMobileMenu() {
        burger.classList.remove('is-active');
        overlay.classList.remove('is-active');
        document.body.style.overflow = '';
    }

    // ---- Анимация счетчиков статистики ----
    const statNumbers = document.querySelectorAll('.stat__number[data-count]');

    const counterObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                animateCounter(entry.target);
                counterObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.5 });

    statNumbers.forEach(el => counterObserver.observe(el));

    function animateCounter(el) {
        const target = parseInt(el.getAttribute('data-count'));
        const suffix = el.getAttribute('data-suffix') || '';
        const duration = 1800;
        const steps = 60;
        const stepTime = duration / steps;
        let current = 0;
        const increment = target / steps;

        const timer = setInterval(() => {
            current += increment;
            if (current >= target) {
                el.textContent = target + suffix;
                clearInterval(timer);
            } else {
                el.textContent = Math.floor(current) + suffix;
            }
        }, stepTime);
    }

    // ---- Плавная прокрутка для якорных ссылок ----
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;

            const target = document.querySelector(targetId);
            if (target) {
                const headerHeight = header.offsetHeight;
                const targetPosition = target.getBoundingClientRect().top + window.pageYOffset - headerHeight - 20;

                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });

                // Закрыть мобильное меню, если открыто
                closeMobileMenu();
            }
        });
    });

    // ---- Эффект частиц в секции Hero ----
    const particlesContainer = document.getElementById('particles');
    if (particlesContainer) {
        createParticles(particlesContainer, 30);
    }

    function createParticles(container, count) {
        for (let i = 0; i < count; i++) {
            const particle = document.createElement('div');
            particle.style.cssText = `
                position: absolute;
                width: ${Math.random() * 3 + 1}px;
                height: ${Math.random() * 3 + 1}px;
                background: rgba(230, 32, 32, ${Math.random() * 0.3 + 0.05});
                border-radius: 50%;
                left: ${Math.random() * 100}%;
                top: ${Math.random() * 100}%;
                animation: particle-float ${Math.random() * 15 + 10}s linear infinite;
                animation-delay: ${Math.random() * -20}s;
            `;
            container.appendChild(particle);
        }

        // Добавление стилей для анимации частиц
        if (!document.getElementById('particle-style')) {
            const style = document.createElement('style');
            style.id = 'particle-style';
            style.textContent = `
                @keyframes particle-float {
                    0% { transform: translateY(0) translateX(0); opacity: 0; }
                    10% { opacity: 1; }
                    90% { opacity: 1; }
                    100% { transform: translateY(-100vh) translateX(${Math.random() * 100 - 50}px); opacity: 0; }
                }
            `;
            document.head.appendChild(style);
        }
    }

    // ---- Подсветка активной ссылки в меню при прокрутке ----
    const sections = document.querySelectorAll('section[id]');

    function highlightNav() {
        const scrollPos = window.pageYOffset + 200;

        sections.forEach(section => {
            const top = section.offsetTop;
            const height = section.offsetHeight;
            const id = section.getAttribute('id');

            if (scrollPos >= top && scrollPos < top + height) {
                document.querySelectorAll('.nav__link').forEach(link => {
                    link.classList.remove('nav__link--active');
                    if (link.getAttribute('href') === `#${id}`) {
                        link.classList.add('nav__link--active');
                    }
                });
            }
        });
    }

    window.addEventListener('scroll', highlightNav, { passive: true });

    // ---- Эффект наклона при наведении на карточки (легкий) ----
    document.querySelectorAll('.direction-card, .price-card, .review-card').forEach(card => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            const rotateX = (y - centerY) / centerY * -2;
            const rotateY = (x - centerX) / centerX * 2;

            card.style.transform = `translateY(-4px) perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
        });

        card.addEventListener('mouseleave', () => {
            card.style.transform = '';
        });
    });

    // ---- Кастомный курсор (Боксерская перчатка) ----
    const glove = document.getElementById('cursor-glove');
    if (glove && window.matchMedia('(hover: hover)').matches) {
        let mouseX = 0, mouseY = 0;
        let gloveX = 0, gloveY = 0;
        const ease = 0.15;

        document.addEventListener('mousemove', (e) => {
            mouseX = e.clientX;
            mouseY = e.clientY;
            if (!glove.classList.contains('is-visible')) {
                glove.classList.add('is-visible');
            }
        });

        document.addEventListener('mousedown', () => {
            glove.classList.add('is-clicking');
        });

        document.addEventListener('mouseup', () => {
            glove.classList.remove('is-clicking');
        });

        document.addEventListener('mouseleave', () => {
            glove.classList.remove('is-visible');
        });

        document.addEventListener('mouseenter', () => {
            glove.classList.add('is-visible');
        });

        function animateGlove() {
            gloveX += (mouseX - gloveX) * ease;
            gloveY += (mouseY - gloveY) * ease;
            glove.style.transform = `translate(${gloveX - 10}px, ${gloveY - 10}px)`;
            requestAnimationFrame(animateGlove);
        }
        animateGlove();
    }

    // ---- Переключатель галереи ----
    const galleryGrid = document.querySelector('.gallery__grid');
    const galleryToggle = document.getElementById('gallery-toggle');

    if (galleryToggle && galleryGrid) {
        galleryToggle.addEventListener('click', () => {
            const isExpanded = galleryGrid.classList.toggle('is-expanded');
            galleryToggle.textContent = isExpanded ? 'Свернуть ▲' : 'Показать все фото ▼';
        });
    }

    // ---- Лайтбокс галереи ----
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightbox-img');
    const lightboxClose = document.getElementById('lightbox-close');
    const lightboxPrev = document.getElementById('lightbox-prev');
    const lightboxNext = document.getElementById('lightbox-next');
    const lightboxCounter = document.getElementById('lightbox-counter');
    const galleryItems = document.querySelectorAll('.gallery__item[data-gallery]');
    let currentIndex = 0;

    // Сбор всех URL изображений галереи
    const galleryImages = [];
    galleryItems.forEach(item => {
        const img = item.querySelector('img');
        if (img) {
            galleryImages.push(img.src);
        }
    });

    // Открытие лайтбокса
    galleryItems.forEach((item, index) => {
        item.addEventListener('click', () => {
            currentIndex = index;
            showLightboxImage();
            lightbox.classList.add('is-active');
            document.body.style.overflow = 'hidden';
        });
    });

    function showLightboxImage() {
        if (galleryImages[currentIndex]) {
            lightboxImg.src = galleryImages[currentIndex];
            lightboxCounter.textContent = `${currentIndex + 1} / ${galleryImages.length}`;
        }
    }

    // Закрытие лайтбокса
    function closeLightbox() {
        lightbox.classList.remove('is-active');
        document.body.style.overflow = '';
    }

    if (lightboxClose) {
        lightboxClose.addEventListener('click', closeLightbox);
    }

    // Навигация в лайтбоксе
    if (lightboxPrev) {
        lightboxPrev.addEventListener('click', (e) => {
            e.stopPropagation();
            currentIndex = (currentIndex - 1 + galleryImages.length) % galleryImages.length;
            showLightboxImage();
        });
    }

    if (lightboxNext) {
        lightboxNext.addEventListener('click', (e) => {
            e.stopPropagation();
            currentIndex = (currentIndex + 1) % galleryImages.length;
            showLightboxImage();
        });
    }

    // Управление с клавиатуры
    document.addEventListener('keydown', (e) => {
        if (!lightbox || !lightbox.classList.contains('is-active')) return;

        if (e.key === 'Escape') {
            closeLightbox();
        } else if (e.key === 'ArrowLeft') {
            currentIndex = (currentIndex - 1 + galleryImages.length) % galleryImages.length;
            showLightboxImage();
        } else if (e.key === 'ArrowRight') {
            currentIndex = (currentIndex + 1) % galleryImages.length;
            showLightboxImage();
        }
    });

    // Закрытие при клике на фон
    if (lightbox) {
        lightbox.addEventListener('click', (e) => {
            if (e.target === lightbox || e.target.classList.contains('lightbox__content')) {
                closeLightbox();
            }
        });
    }

    // ---- Видео-карточки: Воспроизведение при наведении ----
    document.querySelectorAll('.video-card').forEach(card => {
        const video = card.querySelector('video');
        if (!video) return;

        card.addEventListener('mouseenter', () => {
            video.play().catch(() => { });
        });

        card.addEventListener('mouseleave', () => {
            video.pause();
        });
    });

    // ---- Интерактивная карта клубов (Leaflet) ----
    const mapCanvas = document.getElementById('map-canvas');
    if (mapCanvas && typeof L !== 'undefined') {
        const mapCards = document.querySelectorAll('.map-card');

        // Инициализация карты (отключаем интерактивность, чтобы работало как фон)
        const map = L.map('map-canvas', {
            zoomControl: false,
            scrollWheelZoom: false,
            dragging: false,
            doubleClickZoom: false,
            boxZoom: false,
            keyboard: false,
            attributionControl: false
        }).setView([12.240, 109.185], 13); // Центр Нячанга, зум чтоб влезли все 3

        // Тёмный минималистичный слой карты (CartoDB Dark Matter)
        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
            maxZoom: 19
        }).addTo(map);

        // Координаты клубов (на основе реальной географии)
        const coords = {
            north: [12.2710042, 109.201132], // Hòn Chồng (Север)
            center: [12.2385, 109.1900],     // Phước Hải (Центр, вправо от реки)
            anvien: [12.2030, 109.2150]      // An Viên (Юг)
        };

        const leafMarkers = {};

        // Создание HTML-иконки
        const createCustomIcon = (clubId) => {
            return L.divIcon({
                className: 'custom-leaflet-marker',
                html: `<div class="map-marker-dot" id="marker-dot-${clubId}"></div>`,
                iconSize: [20, 20],
                iconAnchor: [10, 10]
            });
        };

        // Добавляем маркеры на карту
        Object.keys(coords).forEach(clubId => {
            leafMarkers[clubId] = L.marker(coords[clubId], {
                icon: createCustomIcon(clubId),
                interactive: true
            }).addTo(map);

            // Клик по маркеру на карте
            leafMarkers[clubId].on('click', () => {
                const card = document.querySelector(`.map-card[data-club="${clubId}"]`);
                if (card) card.click();
            });

            // Ховер на маркере
            leafMarkers[clubId].on('mouseover', () => {
                const dot = document.getElementById(`marker-dot-${clubId}`);
                if (dot) dot.classList.add('is-active');
                const card = document.querySelector(`.map-card[data-club="${clubId}"]`);
                if (card) card.classList.add('is-active');
            });

            leafMarkers[clubId].on('mouseout', () => {
                const dot = document.getElementById(`marker-dot-${clubId}`);
                if (dot) dot.classList.remove('is-active');
                const card = document.querySelector(`.map-card[data-club="${clubId}"]`);
                if (card) card.classList.remove('is-active');
            });
        });

        // Связь: hover карточка → подсветка маркера на карте
        mapCards.forEach(card => {
            const clubId = card.getAttribute('data-club');
            const dot = document.getElementById(`marker-dot-${clubId}`);

            card.addEventListener('mouseenter', () => {
                if (dot) dot.classList.add('is-active');
                card.classList.add('is-active');
            });

            card.addEventListener('mouseleave', () => {
                if (dot) dot.classList.remove('is-active');
                card.classList.remove('is-active');
            });
        });

        // Фикс для мобильных: принудительно пересчитываем размер контейнера после рендера, 
        // чтобы тайлы не загружались обрезанными в CSS-grid
        setTimeout(() => {
            map.invalidateSize();
        }, 300);
    }

});
