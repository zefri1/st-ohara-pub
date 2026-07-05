/* ==================================================
   GOOGLE SHEETS EVENTS LOADER
   ====================================================
   Вставьте сюда ссылку из Google Таблиц:
   Файл → Поделиться → Опубликовать в интернете
   → Лист 1 → CSV → Опубликовать → Скопировать ссылку
   ================================================== */
const SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vR0VuUwAAbHUMnRH9jXeqaHhTMYGbdchMFvOzDfcSk65xP-ymBxAKkClql-bCy2m4sZ0QYhx0SfsJeU/pub?gid=0&single=true&output=csv';

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

document.addEventListener('DOMContentLoaded', () => {
    loadEventsFromSheet();


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
       3. INTERACTIVE MENU TABS
    ================================================== */
    const tabBtns = document.querySelectorAll('.menu-tab-btn');
    const tabContents = document.querySelectorAll('.menu-tab-content');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetTab = btn.getAttribute('data-tab');

            // Set active button
            tabBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            // Switch content with animations
            tabContents.forEach(content => {
                content.classList.remove('active');
                
                // We use a small timeout to let the transition trigger smoothly
                if (content.id === `tab-${targetTab}`) {
                    setTimeout(() => {
                        content.classList.add('active');
                    }, 50);
                }
            });
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
    const commentField = document.getElementById('guest-comment');

    eventTriggers.forEach(trigger => {
        trigger.addEventListener('click', (e) => {
            const eventName = trigger.getAttribute('data-event');
            if (eventName && commentField) {
                commentField.value = `Бронь на событие: "${eventName}"`;
            }
        });
    });


    /* ==================================================
       6. RESERVATION FORM HANDLING & VALIDATION
    ================================================== */
    const reservationForm = document.getElementById('reservation-form');
    const bookingSuccess = document.getElementById('booking-success');
    const dateInput = document.getElementById('book-date');
    const resetBookingBtn = document.getElementById('btn-reset-booking');

    // Pre-fill date input with today's date and set minimum to today
    const today = new Date();
    const yyyy = today.getFullYear();
    let mm = today.getMonth() + 1; // Months start at 0
    let dd = today.getDate();

    if (dd < 10) dd = '0' + dd;
    if (mm < 10) mm = '0' + mm;

    const formattedToday = `${yyyy}-${mm}-${dd}`;
    if (dateInput) {
        dateInput.value = formattedToday;
        dateInput.min = formattedToday;
    }

    // Submit handler
    if (reservationForm) {
        reservationForm.addEventListener('submit', (e) => {
            e.preventDefault();

            // Extract values
            const name = document.getElementById('guest-name').value;
            const phone = document.getElementById('guest-phone').value;
            const dateVal = dateInput.value;
            const timeVal = document.getElementById('book-time').value;

            // Format date for success screen (e.g. 2026-07-06 to readable Russian style)
            const dateParts = dateVal.split('-');
            const monthsRu = [
                'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
                'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'
            ];
            let dateFormattedText = dateVal;
            if (dateParts.length === 3) {
                const dayNum = parseInt(dateParts[2], 10);
                const monthNum = parseInt(dateParts[1], 10) - 1;
                dateFormattedText = `${dayNum} ${monthsRu[monthNum]}`;
            }

            // Populate summary fields
            document.getElementById('summary-name').textContent = name;
            document.getElementById('summary-date').textContent = dateFormattedText;
            document.getElementById('summary-time').textContent = timeVal;
            document.getElementById('summary-phone').textContent = phone;

            // Show submit loading feedback
            const submitBtn = reservationForm.querySelector('button[type="submit"]');
            const originalText = submitBtn.textContent;
            submitBtn.textContent = 'Отправка брони...';
            submitBtn.disabled = true;

            // Simulate server request delay
            setTimeout(() => {
                // Hide form, show success
                reservationForm.style.display = 'none';
                bookingSuccess.style.display = 'flex';
                
                // Scroll slightly to make sure the success state is fully in view
                document.getElementById('booking-box').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                
                // Restore button state
                submitBtn.textContent = originalText;
                submitBtn.disabled = false;
            }, 1200);
        });
    }

    // Reset booking form handler
    if (resetBookingBtn) {
        resetBookingBtn.addEventListener('click', () => {
            if (reservationForm) {
                reservationForm.reset();
                if (dateInput) dateInput.value = formattedToday;
                reservationForm.style.display = 'flex';
            }
            if (bookingSuccess) {
                bookingSuccess.style.display = 'none';
            }
        });
    }
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

