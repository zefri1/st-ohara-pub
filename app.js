/* ==================================================
   GOOGLE SHEETS EVENTS LOADER
   ====================================================
   Вставьте сюда ссылку из Google Таблиц:
   Файл → Поделиться → Опубликовать в интернете
   → Лист 1 → CSV → Опубликовать → Скопировать ссылку
   ================================================== */
const SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vR0VuUwAAbHUMnRH9jXeqaHhTMYGbdchMFvOzDfcSk65xP-ymBxAKkClql-bCy2m4sZ0QYhx0SfsJeU/pub?gid=0&single=true&output=csv';

/* Ссылка на таблицу меню (1 колонка: image_url) */
const MENU_CSV_URL = '';

/* Резервные события — показываются пока таблица не подключена */
const FALLBACK_EVENTS = [
    { day: '10', month: 'Июля, Пт', time: '21:00',
      title: 'Рок-акустика: Группа «Волга-Бэнд»',
      desc: 'Лучшие хиты классического зарубежного и русского рока в мощном акустическом звучании. Вход свободный.',
      btn: 'Занять столик' },
    { day: '11', month: 'Июля, Сб', time: '19:30',
      title: 'Спортивный вечер: Финал Лиги',
      desc: 'Трансляция решающего матча на всех экранах паба. Специальные пивные сеты и бургеры от шефа.',
      btn: 'Занять столик' },
    { day: '16', month: 'Июля, Чт', time: '20:00',
      title: 'Ирландский Квиз: Битва Умов',
      desc: 'Интеллектуальная паб-игра для команд до 6 человек. Вопросы о пиве, истории и музыке. Победителям — пинта за наш счёт.',
      btn: 'Зарегистрировать команду' }
];

/* Резервные фото меню (используются по умолчанию, пока не загружены из Google Таблиц) */
const FALLBACK_MENU_IMAGES = [
    { image_url: 'assets/menu/hot_dishes.jpg', category: 'food' },
    { image_url: 'assets/menu/tea.jpg', category: 'non_alcoholic' },
    { image_url: 'assets/menu/grill_menu.jpg', category: 'food' },
    { image_url: 'assets/menu/signature_cocktails.jpg', category: 'bar' },
    { image_url: 'assets/menu/draft_beer_1.jpg', category: 'bar' },
    { image_url: 'assets/menu/classic_cocktails.jpg', category: 'bar' },
    { image_url: 'assets/menu/hot_drinks.jpg', category: 'non_alcoholic' },
    { image_url: 'assets/menu/cold_snacks.jpg', category: 'food' },
    { image_url: 'assets/menu/whiskey_wales_japan_islay.jpg', category: 'bar' },
    { image_url: 'assets/menu/desserts.jpg', category: 'food' },
    { image_url: 'assets/menu/port_wine_rum.jpg', category: 'bar' },
    { image_url: 'assets/menu/red_wines.jpg', category: 'bar' },
    { image_url: 'assets/menu/tinctures_1.jpg', category: 'bar' },
    { image_url: 'assets/menu/sparkling_wines_vermouth.jpg', category: 'bar' },
    { image_url: 'assets/menu/shots_sets.jpg', category: 'bar' },
    { image_url: 'assets/menu/cognac_liqueurs_tequila.jpg', category: 'bar' },
    { image_url: 'assets/menu/soups_burgers.jpg', category: 'food' },
    { image_url: 'assets/menu/draft_beer_2.jpg', category: 'bar' },
    { image_url: 'assets/menu/bourbon_menu.jpg', category: 'bar' },
    { image_url: 'assets/menu/hot_snacks.jpg', category: 'food' },
    { image_url: 'assets/menu/tinctures_2_drinks.jpg', category: 'non_alcoholic' },
    { image_url: 'assets/menu/side_dishes_sauces_bread.jpg', category: 'food' },
    { image_url: 'assets/menu/salads.jpg', category: 'food' },
    { image_url: 'assets/menu/irish_whiskey.jpg', category: 'bar' },
    { image_url: 'assets/menu/white_wines.jpg', category: 'bar' }
];

function parseCSV(text) {
    const lines = text.trim().split('\n');
    if (lines.length < 2) return [];
    const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
    return lines.slice(1).map(line => {
        // Handle commas inside quoted fields
        const cols = [];
        let inQuote = false, cur = '';
        for (let i = 0; i < line.length; i++) {
            const ch = line[i];
            if (ch === '"') { inQuote = !inQuote; }
            else if (ch === ',' && !inQuote) { cols.push(cur.trim()); cur = ''; }
            else { cur += ch; }
        }
        cols.push(cur.trim());
        const obj = {};
        headers.forEach((h, i) => { obj[h] = (cols[i] || '').replace(/^"|"$/g, ''); });
        return obj;
    }).filter(e => e.day && e.title);
}

function renderEvents(events) {
    const timeline = document.getElementById('events-timeline');
    const loading  = document.getElementById('events-loading');
    const error    = document.getElementById('events-error');
    if (!timeline) return;

    loading && (loading.style.display = 'none');
    error   && (error.style.display   = 'none');

    timeline.innerHTML = events.map(ev => `
        <div class="event-card">
            <div class="event-date">
                <span class="event-day">${ev.day}</span>
                <span class="event-month">${ev.month}</span>
            </div>
            <div class="event-details">
                <span class="event-time">${ev.time}</span>
                <h3 class="event-title">${ev.title}</h3>
                <p class="event-desc">${ev.desc}</p>
            </div>
            <div class="event-action">
                <a href="#book" class="btn btn-secondary btn-sm event-book-trigger"
                   data-event="${ev.title} ${ev.day} ${ev.month}">${ev.btn || 'Занять столик'}</a>
            </div>
        </div>
    `).join('');

    // Re-attach booking triggers for dynamically created cards
    timeline.querySelectorAll('.event-book-trigger').forEach(btn => {
        btn.addEventListener('click', () => {
            const eventName = btn.dataset.event;
            const commentField = document.getElementById('book-comment');
            if (commentField) commentField.value = `Бронирование на событие: ${eventName}`;
        });
    });
}

async function loadEventsFromSheet() {
    const timeline = document.getElementById('events-timeline');
    const loading  = document.getElementById('events-loading');
    const errorEl  = document.getElementById('events-error');
    const errorMsg = document.getElementById('events-error-msg');

    if (!SHEET_CSV_URL) {
        // No URL set → show fallback events silently
        renderEvents(FALLBACK_EVENTS);
        return;
    }

    // Show spinner
    if (loading) loading.style.display = 'flex';
    if (timeline) timeline.innerHTML = '';

    try {
        const res = await fetch(SHEET_CSV_URL);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const text = await res.text();
        const events = parseCSV(text);
        if (events.length === 0) throw new Error('Таблица пуста');
        renderEvents(events);
    } catch (err) {
        if (loading) loading.style.display = 'none';
        console.warn('Sheets load failed, using fallback:', err);
        // Fallback to static events so page is never empty
        renderEvents(FALLBACK_EVENTS);
        if (errorMsg) errorMsg.textContent = '⚠ Афиша загружается из резервных данных. Проверьте ссылку на таблицу в app.js.';
        if (errorEl)  errorEl.style.display = 'block';
    }
}

let currentMenuImages = [];

function renderMenu(images, category = 'all') {
    const gallery = document.getElementById('menu-gallery');
    const loading = document.getElementById('menu-loading');
    const error   = document.getElementById('menu-error');
    if (!gallery) return;

    loading && (loading.style.display = 'none');
    error   && (error.style.display   = 'none');

    const filteredImages = category === 'all' 
        ? images 
        : images.filter(img => img.category && img.category.trim().toLowerCase() === category.toLowerCase());

    gallery.innerHTML = filteredImages.map(img => `
        <div class="menu-gallery-item">
            <img src="${img.image_url}" alt="Меню St. O'Hara" loading="lazy">
        </div>
    `).join('');
}

async function loadMenuFromSheet() {
    const gallery = document.getElementById('menu-gallery');
    const loading = document.getElementById('menu-loading');
    const errorEl = document.getElementById('menu-error');
    const errorMsg= document.getElementById('menu-error-msg');

    if (!MENU_CSV_URL) {
        currentMenuImages = FALLBACK_MENU_IMAGES;
        renderMenu(currentMenuImages, 'all');
        return;
    }

    if (loading) loading.style.display = 'flex';
    if (gallery) gallery.innerHTML = '';

    try {
        const res = await fetch(MENU_CSV_URL);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const text = await res.text();
        const images = parseCSV(text).filter(e => e.image_url);
        if (images.length === 0) throw new Error('Таблица меню пуста');
        currentMenuImages = images;
        renderMenu(currentMenuImages, 'all');
    } catch (err) {
        if (loading) loading.style.display = 'none';
        console.warn('Menu load failed, using fallback:', err);
        currentMenuImages = FALLBACK_MENU_IMAGES;
        renderMenu(currentMenuImages, 'all');
        if (errorMsg) errorMsg.textContent = '⚠ Меню загружено локально.';
        if (errorEl) errorEl.style.display = 'block';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    loadEventsFromSheet();
    loadMenuFromSheet();

    // Menu category tabs
    const menuTabs = document.querySelectorAll('.menu-tab-btn');
    menuTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            menuTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            const category = tab.dataset.category;
            renderMenu(currentMenuImages, category);
        });
    });


    /* ==================================================
       1. NAVBAR SCROLL EFFECT
    ================================================== */
    const navbar = document.getElementById('navbar');
    
    const handleNavbarScroll = () => {
        if (window.scrollY > 50) {
            navbar.classList.add('navbar-scrolled');
        } else {
            navbar.classList.remove('navbar-scrolled');
        }
    };
    
    window.addEventListener('scroll', handleNavbarScroll);
    // Initial check
    handleNavbarScroll();


    /* ==================================================
       2. MOBILE MENU TOGGLE
    ================================================== */
    const mobileToggle = document.getElementById('mobile-toggle');
    const navMenu = document.getElementById('nav-menu');
    const navLinks = document.querySelectorAll('.nav-link');

    const toggleMenu = () => {
        mobileToggle.classList.toggle('open');
        navMenu.classList.toggle('open');
        document.body.classList.toggle('overflow-hidden'); // Prevent background scroll
    };

    mobileToggle.addEventListener('click', toggleMenu);

    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            if (navMenu.classList.contains('open')) {
                toggleMenu();
            }
        });
    });



    /* ==================================================
       4. SCROLL REVEAL (INTERSECTION OBSERVER)
    ================================================== */
    const revealElements = document.querySelectorAll('.scroll-reveal');

    const revealObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('revealed');
                observer.unobserve(entry.target); // Stop observing once revealed
            }
        });
    }, {
        threshold: 0.1, // Trigger when 10% of the element is visible
        rootMargin: '0px 0px -50px 0px' // Slightly delay reveal for better effect
    });

    revealElements.forEach(el => revealObserver.observe(el));


    /* ==================================================
       5. EVENT BOOKING TRIGGER
    ================================================== */
    const eventTriggers = document.querySelectorAll('.event-book-trigger');
    eventTriggers.forEach(trigger => {
        trigger.addEventListener('click', (e) => {
            // Can be repurposed or removed if needed, for now just scrolls to book section
        });
    });
});

/* ==================================================
   7. YANDEX MAPS JS API INTEGRATION
================================================== */
if (typeof ymaps !== 'undefined') {
    ymaps.ready(initMap);
}

function initMap() {
    // Coordinates of St. O'Hara [latitude, longitude]
    const coords = [57.766373, 40.923485];
    
    // Create the map
    const myMap = new ymaps.Map("map", {
        center: coords,
        zoom: 17,
        controls: ['zoomControl', 'fullscreenControl']
    });

    // Create custom balloon layout with "Get Directions" and "Order Taxi" buttons
    const balloonHeader = '<b style="color: #1F3C2F; font-family: \'Cormorant Garamond\', serif; font-size: 20px; font-weight: 700;">St. O\'Hara</b>';
    const balloonBody = `
        <div style="font-family: 'Inter', sans-serif; font-size: 13px; color: #6E6C66; line-height: 1.5; margin-top: 5px; max-width: 250px;">
            <p style="margin-bottom: 4px; font-weight: 500; color: #1F2120;">г. Кострома, ул. Молочная гора, д. 4А</p>
            <p style="margin-bottom: 12px; font-size: 12px; color: #9B9890;">Ирландский паб в центре города</p>
            <div style="display: flex; gap: 8px;">
                <a href="https://yandex.ru/maps/?rtext=~57.766373%2C40.923485&amp;rtt=pd" target="_blank" style="background-color: #0077FF; color: #FFFFFF; padding: 8px 12px; border-radius: 4px; text-decoration: none; font-size: 11px; font-weight: 600; display: inline-block; text-align: center; flex: 1;">Как добраться</a>
                <a href="https://taxi.yandex.ru/?action=introducing&amp;utm_source=map&amp;lat_to=57.766373&amp;lon_to=40.923485" target="_blank" style="background-color: #FFC000; color: #1F2120; padding: 8px 12px; border-radius: 4px; text-decoration: none; font-size: 11px; font-weight: 600; display: inline-block; text-align: center; flex: 1; white-space: nowrap;">Вызвать такси</a>
            </div>
        </div>
    `;

    // Create a placemark with custom balloon content
    const myPlacemark = new ymaps.Placemark(coords, {
        balloonContentHeader: balloonHeader,
        balloonContentBody: balloonBody,
        hintContent: 'Ирландский паб St. O\'Hara'
    }, {
        preset: 'islands#violetFoodIcon', // Violet circular icon with fork/knife symbol
        iconColor: '#1F3C2F' // Matches the brand green theme color of the website
    });

    // Add placemark to map
    myMap.geoObjects.add(myPlacemark);
    
    // Disable scroll zoom (so scrolling the page doesn't zoom the map accidentally)
    myMap.behaviors.disable('scrollZoom');
    
    // Auto-open balloon after map loads
    setTimeout(() => {
        myPlacemark.balloon.open();
    }, 600);
}

