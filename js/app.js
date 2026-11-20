// ============================================================================
// LÓGICA DE NAVEGACIÓN DE 2 VISTAS (PÚBLICO Y ADMIN), APIS EN VIVO,
// COMENTARIOS CON VOTACIÓN DE 5 ESTRELLAS Y COMUNIDAD DE TELEGRAM
// ============================================================================

const APP_STATE = {
  currentView: 'public', // 'public' | 'admin'
  adminTab: 'publico',   // 'publico' | 'comentarios' | 'configuracion'
  adminPublicSubTab: 'apk', // 'apk' | 'notificaciones' | 'blog'
  settings: null,
  posts: [],
  comments: [],
  notifications: [],
  isAdminAuthenticated: false,
  isMobileMenuOpen: false,
  isNotifDrawerOpen: false,
  isFetchingRates: false,
  simRateMode: 'USD', // 'USD' | 'EUR' | 'USDT'
  simRates: {
    USD: { label: 'Dólar BCV Oficial', code: 'USD', rate: 46.85, sourceLabel: 'BCV Oficial' },
    EUR: { label: 'Euro BCV Oficial', code: 'EUR', rate: 50.60, sourceLabel: 'BCV Euro' },
    USDT: { label: 'Promedio USDT P2P', code: 'USDT', rate: 53.40, sourceLabel: 'Binance P2P / Cripto' }
  },
  ratesLastUpdated: 'Sincronizando...',
  ratesIsLive: false
};

// --- DETECCIÓN INTELIGENTE DE LA VISTA SEGÚN LA URL / LINK COMPARTIDO ---
function resolveViewFromURL() {
  const path = window.location.pathname.toLowerCase();
  const params = new URLSearchParams(window.location.search);
  const vistaParam = (params.get('vista') || params.get('mode') || '').toLowerCase();
  const hash = window.location.hash.toLowerCase();

  if (path.includes('/admin') || vistaParam === 'admin' || params.has('admin') || hash === '#admin') {
    return 'admin';
  }

  return 'public';
}

// --- NAVEGACIÓN SEGURA ENTRE SECCIONES DE LA VISTA PÚBLICA ---
function scrollToSection(sectionId, targetView = 'public') {
  closeMobileMenu();

  if (APP_STATE.currentView !== targetView) {
    switchView(targetView, true);
    setTimeout(() => {
      executeScroll(sectionId);
    }, 180);
    return;
  }

  executeScroll(sectionId);
}

function executeScroll(sectionId) {
  const el = document.getElementById(sectionId);
  if (!el) return;

  const navOffset = 75;
  const bodyRect = document.body.getBoundingClientRect().top;
  const elementRect = el.getBoundingClientRect().top;
  const elementPosition = elementRect - bodyRect;
  const offsetPosition = elementPosition - navOffset;

  window.scrollTo({
    top: offsetPosition,
    behavior: 'smooth'
  });
}

// --- CAMBIO DE PESTAÑAS MINIMALISTAS DENTRO DEL MODO ADMIN ---
function switchAdminTab(tabName, subTab = null) {
  APP_STATE.adminTab = tabName;
  if (subTab && tabName === 'publico') {
    APP_STATE.adminPublicSubTab = subTab;
  }
  closeMobileMenu();

  if (APP_STATE.currentView !== 'admin') {
    switchView('admin', true);
    return;
  }

  renderNavbarForView('admin');
  updateAdminTabsUI();
}

function switchAdminSubTab(subTabName) {
  APP_STATE.adminPublicSubTab = subTabName;
  updateAdminTabsUI();
}

function updateAdminTabsUI() {
  ['publico', 'comentarios', 'configuracion'].forEach(t => {
    const panel = document.getElementById(`admin-panel-${t}`);
    if (panel) {
      if (APP_STATE.adminTab === t) {
        panel.classList.remove('hidden');
      } else {
        panel.classList.add('hidden');
      }
    }
  });

  ['apk', 'notificaciones', 'blog'].forEach(st => {
    const subPanel = document.getElementById(`admin-subpanel-publico-${st}`);
    const subBtn = document.getElementById(`admin-subbtn-publico-${st}`);
    const isActive = APP_STATE.adminPublicSubTab === st;
    if (subPanel) {
      if (isActive) subPanel.classList.remove('hidden');
      else subPanel.classList.add('hidden');
    }
    if (subBtn) {
      subBtn.className = isActive
        ? 'px-4 py-2 rounded-xl text-xs font-bold bg-sky-500 text-white shadow-sm transition flex items-center gap-1.5 whitespace-nowrap'
        : 'px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800/80 transition flex items-center gap-1.5 whitespace-nowrap';
    }
  });

  if (window.lucide) window.lucide.createIcons();
}

// --- INICIALIZACIÓN DEL PORTAL ---
async function initPortal() {
  APP_STATE.isAdminAuthenticated = sessionStorage.getItem(STORAGE_KEYS.ADMIN_AUTH) === 'true';
  APP_STATE.settings = await window.portalDB.getSettings();
  APP_STATE.posts = await window.portalDB.getPosts();
  APP_STATE.comments = await window.portalDB.getComments();
  APP_STATE.notifications = await window.portalDB.getNotifications();

  const cached = window.astroRatesAPI.cachedRates;
  if (cached) {
    APP_STATE.simRates.USD.rate = Number(cached.usd) || 46.85;
    APP_STATE.simRates.EUR.rate = Number(cached.eur) || 50.60;
    APP_STATE.simRates.USDT.rate = Number(cached.usdt) || 53.40;
  }

  const initialView = resolveViewFromURL();
  switchView(initialView, false);
  setupEventListeners();
  updateSimulatorCalc();

  await syncLiveRatesFromAPIs(false);
}

// --- SINCRONIZACIÓN EN VIVO CON LAS APIS GRATUITAS DE ASTRO TASAS ---
async function syncLiveRatesFromAPIs(showUserToast = true) {
  if (APP_STATE.isFetchingRates) return;
  APP_STATE.isFetchingRates = true;

  const refreshIcon = document.getElementById('sim-refresh-icon');
  if (refreshIcon) refreshIcon.classList.add('animate-spin');

  const statusTextEl = document.getElementById('sim-api-status-text');
  if (statusTextEl) statusTextEl.textContent = 'Consultando APIs...';

  try {
    const live = await window.astroRatesAPI.fetchLiveRates();
    APP_STATE.simRates.USD.rate = live.usd;
    APP_STATE.simRates.EUR.rate = live.eur;
    APP_STATE.simRates.USDT.rate = live.usdt;
    APP_STATE.ratesIsLive = live.isLive;
    APP_STATE.ratesLastUpdated = formatTimeAgo(live.updatedAt);

    const pillUsd = document.getElementById('live-pill-usd');
    const pillEur = document.getElementById('live-pill-eur');
    const pillUsdt = document.getElementById('live-pill-usdt');
    if (pillUsd) pillUsd.textContent = `Bs. ${live.usd.toFixed(2)}`;
    if (pillEur) pillEur.textContent = `Bs. ${live.eur.toFixed(2)}`;
    if (pillUsdt) pillUsdt.textContent = `Bs. ${live.usdt.toFixed(2)}`;

    if (statusTextEl) {
      statusTextEl.textContent = live.isLive ? 'API en vivo' : 'Modo Caché';
    }

    const footerSourceEl = document.getElementById('sim-api-footer-source');
    if (footerSourceEl) {
      footerSourceEl.textContent = `Fuente: ${live.source} • Actualizado: ${APP_STATE.ratesLastUpdated}`;
    }

    updateSimulatorCalc();
    if (showUserToast) {
      showToast(`Tasas actualizadas en vivo: USD Bs. ${live.usd.toFixed(2)} | EUR Bs. ${live.eur.toFixed(2)} | USDT Bs. ${live.usdt.toFixed(2)}`, 'success');
    }
  } catch (err) {
    console.warn('Error sincronizando tasas en vivo:', err);
    if (showUserToast) {
      showToast('Usando última tasa guardada en caché local', 'info');
    }
  } finally {
    APP_STATE.isFetchingRates = false;
    if (refreshIcon) refreshIcon.classList.remove('animate-spin');
  }
}

// --- CAMBIO ENTRE LAS 2 VISTAS (PÚBLICO Y ADMIN) ---
function switchView(viewName, updateUrl = true) {
  const validView = viewName === 'admin' ? 'admin' : 'public';
  APP_STATE.currentView = validView;
  closeMobileMenu();

  if (updateUrl) {
    const url = new URL(window.location.href);
    if (validView === 'public') {
      url.searchParams.delete('vista');
      window.history.pushState({}, '', url.pathname.includes('index.html') ? url.pathname : '/');
    } else if (validView === 'admin') {
      url.searchParams.set('vista', 'admin');
      window.history.pushState({}, '', url.toString());
    }
  }

  document.getElementById('view-public').classList.add('hidden');
  document.getElementById('view-admin').classList.add('hidden');

  renderNavbarForView(validView);
  renderNotificationsUI();

  if (validView === 'public') {
    document.getElementById('view-public').classList.remove('hidden');
    renderPublicView();
  } else if (validView === 'admin') {
    document.getElementById('view-admin').classList.remove('hidden');
    renderAdminView();
  }

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// --- NAVBAR 100% FUNCIONAL Y RESPONSIVO ---
function renderNavbarForView(viewName) {
  const navLinksContainer = document.getElementById('navbar-links');
  const mobileLinksContainer = document.getElementById('mobile-menu-links');
  const navBadge = document.getElementById('navbar-mode-badge');
  const navCta = document.getElementById('navbar-cta-container');
  const s = APP_STATE.settings;
  const tgUrl = s.telegram_url || 'https://t.me/+A6xwBk-NT_Y1NGRh';

  let linksHtml = '';
  let mobileLinksHtml = '';
  let ctaHtml = '';

  if (viewName === 'public') {
    navBadge.innerHTML = `<span class="whitespace-nowrap px-2.5 py-1 text-xs font-semibold rounded-full bg-sky-500/15 text-sky-400 border border-sky-500/30">v${escapeHtml(s.app_version)} Android</span>`;
    
    linksHtml = `
      <button onclick="scrollToSection('inicio', 'public')" class="whitespace-nowrap text-sm font-medium text-slate-300 hover:text-white transition">Inicio</button>
      <button onclick="scrollToSection('funciones', 'public')" class="whitespace-nowrap text-sm font-medium text-slate-300 hover:text-white transition">Funciones</button>
      <button onclick="scrollToSection('notificaciones-publicas', 'public')" class="whitespace-nowrap text-sm font-medium text-slate-300 hover:text-white transition">Notificaciones</button>
      <button onclick="scrollToSection('descarga-apk', 'public')" class="whitespace-nowrap text-sm font-medium text-slate-300 hover:text-white transition">Descargar APK</button>
      <button onclick="scrollToSection('blog-publico', 'public')" class="whitespace-nowrap text-sm font-medium text-slate-300 hover:text-white transition">Blog y Guías</button>
      <button onclick="scrollToSection('comentarios-comunidad', 'public')" class="whitespace-nowrap text-sm font-semibold text-amber-300 hover:text-amber-200 transition flex items-center gap-1">
        <i data-lucide="message-square-heart" class="w-3.5 h-3.5"></i>
        <span>Comentarios</span>
      </button>
      <button onclick="scrollToSection('instalacion', 'public')" class="whitespace-nowrap text-sm font-medium text-sky-400 hover:text-sky-300 font-semibold transition">Cómo Instalar</button>
    `;

    mobileLinksHtml = `
      <button onclick="scrollToSection('inicio', 'public')" class="w-full text-left px-4 py-2.5 rounded-xl text-sm font-medium text-slate-200 hover:bg-slate-800/80">Inicio</button>
      <button onclick="scrollToSection('funciones', 'public')" class="w-full text-left px-4 py-2.5 rounded-xl text-sm font-medium text-slate-200 hover:bg-slate-800/80">Funciones de la App</button>
      <button onclick="scrollToSection('notificaciones-publicas', 'public')" class="w-full text-left px-4 py-2.5 rounded-xl text-sm font-medium text-slate-200 hover:bg-slate-800/80">Notificaciones y Avisos</button>
      <button onclick="scrollToSection('descarga-apk', 'public')" class="w-full text-left px-4 py-2.5 rounded-xl text-sm font-medium text-slate-200 hover:bg-slate-800/80">Descargar APK</button>
      <button onclick="scrollToSection('blog-publico', 'public')" class="w-full text-left px-4 py-2.5 rounded-xl text-sm font-medium text-slate-200 hover:bg-slate-800/80">Blog y Guías</button>
      <button onclick="scrollToSection('comentarios-comunidad', 'public')" class="w-full text-left px-4 py-2.5 rounded-xl text-sm font-bold text-amber-300 bg-amber-500/10">Comentarios y Sugerencias ★</button>
      <button onclick="scrollToSection('instalacion', 'public')" class="w-full text-left px-4 py-2.5 rounded-xl text-sm font-bold text-sky-300 bg-sky-500/10">Cómo Instalar y Soporte</button>
      <a href="${escapeHtml(tgUrl)}" target="_blank" rel="noopener" class="w-full mt-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white bg-[#0088cc] hover:bg-[#0077b5] flex items-center justify-center gap-2">
        <i data-lucide="send" class="w-4 h-4"></i>
        <span>Unirse al Telegram Oficial</span>
      </a>
    `;

    ctaHtml = `
      <div class="hidden sm:flex items-center gap-2">
        <a href="${escapeHtml(tgUrl)}" target="_blank" rel="noopener" title="Unirse a la Comunidad de Telegram" class="whitespace-nowrap inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-[#0088cc] hover:bg-[#0077b5] shadow-lg shadow-sky-500/20 transition">
          <i data-lucide="send" class="w-3.5 h-3.5 shrink-0"></i>
          <span>Telegram</span>
        </a>
        <button onclick="scrollToSection('descarga-apk', 'public')" class="whitespace-nowrap inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-astro-gradient shadow-lg shadow-sky-600/25 hover:opacity-95 transition">
          <i data-lucide="download" class="w-3.5 h-3.5 shrink-0"></i>
          <span>Descargar APK</span>
        </button>
      </div>
    `;
  } else if (viewName === 'admin') {
    navBadge.innerHTML = `<span class="whitespace-nowrap px-2.5 py-1 text-xs font-semibold rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">Modo Admin</span>`;

    const t = APP_STATE.adminTab;
    const btnClass = (tabKey, activeColor) =>
      t === tabKey
        ? `whitespace-nowrap px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-bold ${activeColor} text-white shadow transition flex items-center gap-1.5`
        : `whitespace-nowrap px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800/80 transition flex items-center gap-1.5`;

    // Barra de navegación minimalista del Administrador
    linksHtml = `
      <div class="flex items-center gap-1.5 bg-slate-900/90 p-1 rounded-2xl border border-slate-800">
        <button onclick="switchAdminTab('publico')" class="${btnClass('publico', 'bg-sky-600')}">
          <i data-lucide="layout-Grid" class="w-4 h-4"></i>
          <span>Público y Contenido</span>
        </button>
        <button onclick="switchAdminTab('comentarios')" class="${btnClass('comentarios', 'bg-amber-500 !text-slate-950')}">
          <i data-lucide="message-square-heart" class="w-4 h-4"></i>
          <span>Comentarios y Comunidad</span>
        </button>
        <button onclick="switchAdminTab('configuracion')" class="${btnClass('configuracion', 'bg-emerald-600')}">
          <i data-lucide="sliders" class="w-4 h-4"></i>
          <span>Configuración de la Web</span>
        </button>
      </div>
    `;

    mobileLinksHtml = `
      <div class="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-3 py-1">Secciones del Administrador</div>
      <button onclick="switchAdminTab('publico', 'apk')" class="w-full text-left px-4 py-2.5 rounded-xl text-sm font-semibold ${t === 'publico' ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30' : 'text-slate-200 hover:bg-slate-800/80'} flex items-center justify-between">
        <span class="flex items-center gap-2"><i data-lucide="layout-grid" class="w-4 h-4 text-sky-400"></i> 1. Público (APK, Alertas y Blog)</span>
      </button>
      <button onclick="switchAdminTab('comentarios')" class="w-full text-left px-4 py-2.5 rounded-xl text-sm font-semibold ${t === 'comentarios' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'text-slate-200 hover:bg-slate-800/80'} flex items-center justify-between">
        <span class="flex items-center gap-2"><i data-lucide="message-square-heart" class="w-4 h-4 text-amber-400"></i> 2. Comentarios y Sugerencias</span>
      </button>
      <button onclick="switchAdminTab('configuracion')" class="w-full text-left px-4 py-2.5 rounded-xl text-sm font-semibold ${t === 'configuracion' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'text-slate-200 hover:bg-slate-800/80'} flex items-center justify-between">
        <span class="flex items-center gap-2"><i data-lucide="sliders" class="w-4 h-4 text-emerald-400"></i> 3. Configuración de la Web</span>
      </button>
      <div class="pt-2 mt-2 border-t border-slate-800">
        <button onclick="switchView('public')" class="w-full py-2.5 px-3 rounded-xl text-xs font-semibold bg-slate-900 text-sky-300 border border-slate-800 flex items-center justify-center gap-1.5">
          <i data-lucide="eye" class="w-4 h-4"></i> Ir a Vista Pública en Vivo
        </button>
      </div>
    `;

    ctaHtml = APP_STATE.isAdminAuthenticated
      ? `<button onclick="logoutAdmin()" class="whitespace-nowrap inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-rose-300 bg-rose-500/15 border border-rose-500/30 hover:bg-rose-500/25 transition">
           <i data-lucide="log-out" class="w-3.5 h-3.5 shrink-0"></i> <span>Salir</span>
         </button>`
      : '';
  }

  navLinksContainer.innerHTML = linksHtml;
  if (mobileLinksContainer) mobileLinksContainer.innerHTML = mobileLinksHtml;
  navCta.innerHTML = ctaHtml;

  if (window.lucide) window.lucide.createIcons();
}

function toggleMobileMenu() {
  const menu = document.getElementById('mobile-nav-drawer');
  if (!menu) return;
  APP_STATE.isMobileMenuOpen = !APP_STATE.isMobileMenuOpen;
  if (APP_STATE.isMobileMenuOpen) {
    menu.classList.remove('hidden');
  } else {
    menu.classList.add('hidden');
  }
}

function closeMobileMenu() {
  const menu = document.getElementById('mobile-nav-drawer');
  if (menu) menu.classList.add('hidden');
  APP_STATE.isMobileMenuOpen = false;
}

// ============================================================================
// APARTADO DE NOTIFICACIONES (CAMPANA + PANEL DESPLEGABLE + SECCIÓN EN PÁGINA)
// ============================================================================
function renderNotificationsUI() {
  const list = APP_STATE.notifications;
  let readIds = [];
  try {
    readIds = JSON.parse(localStorage.getItem(STORAGE_KEYS.READ_NOTIFS) || '[]');
  } catch (e) {}

  const unreadCount = list.filter(n => !readIds.includes(n.id)).length;
  const badgeEl = document.getElementById('notif-unread-badge');
  if (badgeEl) {
    if (unreadCount > 0) {
      badgeEl.textContent = unreadCount > 9 ? '9+' : unreadCount;
      badgeEl.classList.remove('hidden');
    } else {
      badgeEl.classList.add('hidden');
    }
  }

  const drawerListEl = document.getElementById('notif-drawer-list');
  if (drawerListEl) {
    if (list.length === 0) {
      drawerListEl.innerHTML = `<div class="text-center py-8 text-xs text-slate-400">No hay notificaciones activas en este momento.</div>`;
    } else {
      drawerListEl.innerHTML = list.map(n => {
        const iconMap = {
          update: { icon: 'download-cloud', color: 'text-emerald-400 bg-emerald-500/15 border-emerald-500/30', tag: 'Actualización' },
          rate: { icon: 'trending-up', color: 'text-sky-400 bg-sky-500/15 border-sky-500/30', tag: 'Tasas en Vivo' },
          info: { icon: 'bell-ring', color: 'text-amber-400 bg-amber-500/15 border-amber-500/30', tag: 'Comunidad' }
        };
        const style = iconMap[n.type] || iconMap.info;
        const isUnread = !readIds.includes(n.id);

        return `
          <div class="p-3.5 rounded-2xl bg-slate-900/90 border ${isUnread ? 'border-sky-500/40' : 'border-slate-800'} flex items-start gap-3">
            <div class="w-9 h-9 rounded-xl border ${style.color} flex items-center justify-center shrink-0 mt-0.5">
              <i data-lucide="${style.icon}" class="w-4 h-4"></i>
            </div>
            <div class="flex-1 min-w-0">
              <div class="flex items-center justify-between gap-2 mb-0.5">
                <span class="text-[10px] font-bold uppercase tracking-wider text-sky-400">${style.tag}</span>
                <span class="text-[10px] text-slate-500 whitespace-nowrap">${formatDate(n.created_at)}</span>
              </div>
              <h4 class="text-xs font-bold text-white leading-snug mb-1">${escapeHtml(n.title)}</h4>
              <p class="text-xs text-slate-300 leading-relaxed">${escapeHtml(n.message)}</p>
            </div>
          </div>
        `;
      }).join('');
    }
  }

  const publicNotifGrid = document.getElementById('public-notifications-grid');
  if (publicNotifGrid) {
    if (list.length === 0) {
      publicNotifGrid.innerHTML = `<div class="col-span-full text-center py-8 text-sm text-slate-400">No hay avisos recientes.</div>`;
    } else {
      publicNotifGrid.innerHTML = list.slice(0, 3).map(n => {
        const isRate = n.type === 'rate';
        const isUpdate = n.type === 'update';
        const badgeClass = isUpdate
          ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
          : isRate
          ? 'bg-sky-500/15 text-sky-300 border-sky-500/30'
          : 'bg-amber-500/15 text-amber-300 border-amber-500/30';
        const badgeLabel = isUpdate ? 'Actualización APK' : isRate ? 'Tasas en Vivo' : 'Comunidad';

        return `
          <div class="glass-card rounded-2xl p-5 border border-slate-800 flex flex-col justify-between">
            <div>
              <div class="flex items-center justify-between gap-2 mb-3">
                <span class="px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${badgeClass}">
                  ${badgeLabel}
                </span>
                <span class="text-xs text-slate-400">${formatDate(n.created_at)}</span>
              </div>
              <h3 class="text-base font-bold text-white mb-1.5">${escapeHtml(n.title)}</h3>
              <p class="text-xs sm:text-sm text-slate-300 leading-relaxed">${escapeHtml(n.message)}</p>
            </div>
          </div>
        `;
      }).join('');
    }
  }

  if (window.lucide) window.lucide.createIcons();
}

function toggleNotificationsDrawer() {
  const drawer = document.getElementById('notifications-drawer');
  if (!drawer) return;
  APP_STATE.isNotifDrawerOpen = !APP_STATE.isNotifDrawerOpen;

  if (APP_STATE.isNotifDrawerOpen) {
    drawer.classList.remove('hidden');
    markAllNotificationsAsRead();
  } else {
    drawer.classList.add('hidden');
  }
}

function markAllNotificationsAsRead() {
  const list = APP_STATE.notifications;
  let readIds = [];
  try {
    readIds = JSON.parse(localStorage.getItem(STORAGE_KEYS.READ_NOTIFS) || '[]');
  } catch (e) {}
  list.forEach(n => {
    if (!readIds.includes(n.id)) readIds.push(n.id);
  });
  localStorage.setItem(STORAGE_KEYS.READ_NOTIFS, JSON.stringify(readIds));
  const badgeEl = document.getElementById('notif-unread-badge');
  if (badgeEl) badgeEl.classList.add('hidden');
}

// ============================================================================
// 1. RENDERIZADO DE LA VISTA PÚBLICO GENERAL (COMERCIAL + BLOG + COMENTARIOS)
// ============================================================================
function renderPublicView() {
  const s = APP_STATE.settings;
  const tgUrl = s.telegram_url || 'https://t.me/+A6xwBk-NT_Y1NGRh';

  document.querySelectorAll('.dyn-app-version').forEach(el => (el.textContent = `v${s.app_version}`));
  document.querySelectorAll('.dyn-apk-size').forEach(el => (el.textContent = s.apk_size));
  document.querySelectorAll('.dyn-apk-provider').forEach(el => (el.textContent = s.apk_provider));
  document.querySelectorAll('.dyn-apk-updated').forEach(el => (el.textContent = s.apk_updated_at));
  document.querySelectorAll('.dyn-apk-link').forEach(el => el.setAttribute('href', s.apk_url));
  document.querySelectorAll('.dyn-telegram-link').forEach(el => el.setAttribute('href', tgUrl));

  const changelogEl = document.getElementById('public-apk-changelog');
  if (changelogEl) {
    changelogEl.innerHTML = escapeHtml(s.apk_changelog).replace(/\n/g, '<br>');
  }

  // Renderizar artículos del blog subidos por el autor
  const blogGrid = document.getElementById('public-blog-grid');
  if (blogGrid) {
    if (APP_STATE.posts.length === 0) {
      blogGrid.innerHTML = `<div class="col-span-full text-center py-12 text-slate-400">Próximamente nuevas guías y novedades de Astro Tasas.</div>`;
    } else {
      blogGrid.innerHTML = APP_STATE.posts.map(post => `
        <article class="glass-card glass-card-hover rounded-2xl p-6 flex flex-col justify-between">
          <div>
            <div class="flex items-center justify-between gap-2 mb-4">
              <span class="px-3 py-1 text-xs font-semibold rounded-full bg-sky-500/15 text-sky-400 border border-sky-500/25">
                ${escapeHtml(post.category)}
              </span>
              <span class="text-xs text-slate-400 flex items-center gap-1">
                <i data-lucide="clock" class="w-3.5 h-3.5"></i> ${escapeHtml(post.read_time || '3 min')}
              </span>
            </div>
            <h3 class="text-lg font-bold text-white mb-2 leading-snug">${escapeHtml(post.title)}</h3>
            <p class="text-sm text-slate-300 leading-relaxed mb-5">${escapeHtml(post.summary)}</p>
          </div>
          <div class="pt-4 border-t border-slate-800/80 flex items-center justify-between">
            <span class="text-xs text-slate-400">${formatDate(post.created_at)}</span>
            <button onclick="openArticleModal(${post.id})" class="inline-flex items-center gap-1.5 text-sm font-semibold text-sky-400 hover:text-sky-300 transition">
              Leer artículo <i data-lucide="arrow-right" class="w-4 h-4"></i>
            </button>
          </div>
        </article>
      `).join('');
    }
  }

  // Renderizar Muro de Comentarios y Sugerencias de la Comunidad
  renderCommentsSection('public-comments-list', false);

  if (window.lucide) window.lucide.createIcons();
}

// ============================================================================
// MURO DE COMENTARIOS Y SUGERENCIAS CON PUNTAJE DE 5 ESTRELLAS POR COMENTARIO
// ============================================================================
function getVotedCommentsMap() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.VOTED_COMMENTS) || '{}');
  } catch (e) {
    return {};
  }
}

function saveVotedComment(commentId, stars) {
  const map = getVotedCommentsMap();
  map[String(commentId)] = stars;
  localStorage.setItem(STORAGE_KEYS.VOTED_COMMENTS, JSON.stringify(map));
}

function renderCommentsSection(containerId, isAdminMode = false) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const comments = APP_STATE.comments;
  const votedMap = getVotedCommentsMap();

  document.querySelectorAll('.dyn-comments-count').forEach(el => (el.textContent = comments.length));

  if (comments.length === 0) {
    container.innerHTML = `
      <div class="glass-card rounded-2xl p-8 text-center text-slate-400">
        Aún no hay comentarios. ¡Sé el primero en dejar tu comentario o sugerencia para Astro Tasas!
      </div>
    `;
    return;
  }

  container.innerHTML = comments.map(c => {
    const sum = Number(c.rating_sum) || 5;
    const count = Math.max(1, Number(c.rating_count) || 1);
    const avg = (sum / count).toFixed(1);
    const roundedAvg = Math.round(sum / count);
    const userVotedStars = votedMap[String(c.id)];

    const badgeColors = {
      Sugerencia: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
      Experiencia: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
      Comentario: 'bg-sky-500/15 text-sky-300 border-sky-500/30'
    };
    const bClass = badgeColors[c.comment_type] || badgeColors.Comentario;

    // Estrellas visuales de promedio
    const visualStars = [1, 2, 3, 4, 5]
      .map(i => `<span class="${i <= roundedAvg ? 'text-amber-400' : 'text-slate-600'}">★</span>`)
      .join('');

    // Botones interactivos para que otros visitantes voten de 1 a 5 estrellas este comentario
    const interactiveRatingBar = userVotedStars
      ? `<div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-semibold">
           <span>¡Calificaste este comentario con ${userVotedStars} ★!</span>
         </div>`
      : `<div class="flex flex-wrap items-center gap-1.5">
           <span class="text-xs text-slate-400 mr-1">Dar puntaje a este comentario:</span>
           ${[1, 2, 3, 4, 5].map(star => `
             <button onclick="handleRateComment(${c.id}, ${star})" title="Calificar con ${star} estrellas" class="px-2.5 py-1 rounded-lg bg-slate-800/90 hover:bg-amber-500/25 border border-slate-700 hover:border-amber-400 text-xs font-bold text-amber-400 transition flex items-center gap-0.5">
               <span>${star}</span><span>★</span>
             </button>
           `).join('')}
         </div>`;

    return `
      <div class="glass-card rounded-2xl p-5 sm:p-6 border border-slate-800 hover:border-slate-700 transition">
        <div class="flex flex-wrap items-start justify-between gap-3 mb-3">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-sky-500/20 border border-sky-500/30 flex items-center justify-center text-sky-300 font-extrabold text-base shrink-0">
              ${escapeHtml((c.author_name || 'U')[0].toUpperCase())}
            </div>
            <div>
              <div class="flex flex-wrap items-center gap-2">
                <h4 class="font-bold text-white text-sm sm:text-base">${escapeHtml(c.author_name)}</h4>
                <span class="px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${bClass}">
                  ${escapeHtml(c.comment_type || 'Comentario')}
                </span>
              </div>
              <span class="text-[11px] text-slate-500">${formatDate(c.created_at)}</span>
            </div>
          </div>

          <!-- Puntaje promedio en estrellas que tiene este comentario -->
          <div class="flex items-center gap-2">
            <div class="px-3 py-1 rounded-xl bg-slate-900/90 border border-amber-500/30 flex items-center gap-1.5">
              <span class="text-sm tracking-tight">${visualStars}</span>
              <span class="text-xs font-extrabold text-amber-300">${avg}</span>
              <span class="text-[11px] text-slate-400">(${count} ${count === 1 ? 'voto' : 'votos'})</span>
            </div>

            ${isAdminMode ? `
              <button onclick="handleDeleteComment(${c.id})" title="Eliminar comentario" class="p-2 rounded-xl bg-rose-500/15 text-rose-400 hover:bg-rose-500/30 transition">
                <i data-lucide="trash-2" class="w-4 h-4"></i>
              </button>
            ` : ''}
          </div>
        </div>

        <p class="text-sm text-slate-200 leading-relaxed mb-4 bg-slate-900/60 p-4 rounded-xl border border-slate-800/90">
          ${escapeHtml(c.content)}
        </p>

        <!-- Barra para que otros visitantes califiquen de 1 a 5 estrellas este comentario -->
        <div class="pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2">
          ${interactiveRatingBar}
        </div>
      </div>
    `;
  }).join('');

  if (window.lucide) window.lucide.createIcons();
}

async function handleCreateComment(e) {
  e.preventDefault();
  const author_name = document.getElementById('comm-author').value.trim();
  const comment_type = document.getElementById('comm-type').value;
  const initial_stars = document.getElementById('comm-stars').value;
  const content = document.getElementById('comm-content').value.trim();

  if (!author_name || !content) {
    showToast('Por favor escribe tu nombre y tu comentario o sugerencia.', 'error');
    return;
  }

  await window.portalDB.createComment({ author_name, comment_type, initial_stars, content });
  APP_STATE.comments = await window.portalDB.getComments();
  e.target.reset();
  renderCommentsSection('public-comments-list', false);
  showToast('¡Comentario publicado! Ahora otros visitantes pueden verlo y darle 5 estrellas.', 'success');
}

async function handleRateComment(commentId, stars) {
  const votedMap = getVotedCommentsMap();
  if (votedMap[String(commentId)]) {
    showToast('Ya calificaste este comentario anteriormente.', 'info');
    return;
  }

  await window.portalDB.rateComment(commentId, stars);
  saveVotedComment(commentId, stars);
  APP_STATE.comments = await window.portalDB.getComments();
  renderCommentsSection('public-comments-list', false);
  if (APP_STATE.currentView === 'admin') {
    renderCommentsSection('admin-comments-list', true);
  }
  showToast(`¡Le diste ${stars} ★ a este comentario!`, 'success');
}

async function handleDeleteComment(commentId) {
  APP_STATE.comments = await window.portalDB.deleteComment(commentId);
  renderCommentsSection('admin-comments-list', true);
  renderCommentsSection('public-comments-list', false);
  showToast('Comentario eliminado', 'info');
}

// --- SIMULADOR INTERACTIVO DEL CONVERSOR RÁPIDO ($ BCV, € EUR, USDT EN VIVO) ---
function setSimMode(mode) {
  APP_STATE.simRateMode = mode;
  ['USD', 'EUR', 'USDT'].forEach(m => {
    const btn = document.getElementById(`sim-btn-${m}`);
    if (btn) {
      if (m === mode) {
        btn.className = 'w-full py-2 px-2 rounded-xl text-xs font-bold bg-sky-600 text-white shadow transition text-center whitespace-nowrap';
      } else {
        btn.className = 'w-full py-2 px-2 rounded-xl text-xs font-medium bg-slate-800/90 text-slate-300 hover:bg-slate-700 transition text-center whitespace-nowrap';
      }
    }
  });
  updateSimulatorCalc();
}

function updateSimulatorCalc() {
  const inputEl = document.getElementById('sim-amount-input');
  const rateInfo = APP_STATE.simRates[APP_STATE.simRateMode];
  if (!inputEl || !rateInfo) return;

  const amount = parseFloat(inputEl.value) || 0;
  const totalBs = (amount * rateInfo.rate).toLocaleString('es-VE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });

  document.getElementById('sim-rate-label').textContent = rateInfo.label;
  document.getElementById('sim-rate-value').textContent = `Bs. ${rateInfo.rate.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  document.getElementById('sim-rate-source-tag').textContent = rateInfo.sourceLabel;
  document.getElementById('sim-result-bs').textContent = `Bs. ${totalBs}`;
}

// ============================================================================
// 2. RENDERIZADO DE TU VISTA (PANEL DE ADMINISTRACIÓN MINIMALISTA)
// ============================================================================
function renderAdminView() {
  const loginBox = document.getElementById('admin-login-box');
  const dashboardBox = document.getElementById('admin-dashboard-box');

  if (!APP_STATE.isAdminAuthenticated) {
    loginBox.classList.remove('hidden');
    dashboardBox.classList.add('hidden');
    if (window.lucide) window.lucide.createIcons();
    return;
  }

  loginBox.classList.add('hidden');
  dashboardBox.classList.remove('hidden');

  const s = APP_STATE.settings;

  // 1. Generar URLs exactas para compartir las 2 vistas
  const baseUrl = window.location.origin + window.location.pathname.replace(/\/(admin)$/i, '');
  const cleanBase = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;

  const publicShareLink = `${cleanBase}/`;
  const adminShareLink = `${cleanBase}/?vista=admin`;

  document.querySelectorAll('.adm-share-public-input').forEach(el => (el.value = publicShareLink));
  const admShareEl = document.getElementById('share-link-admin');
  if (admShareEl) admShareEl.value = adminShareLink;

  // 2. Poblar formulario de APK y Enlace de Telegram
  document.getElementById('adm-app-version').value = s.app_version;
  document.getElementById('adm-apk-provider').value = s.apk_provider;
  document.getElementById('adm-apk-url').value = s.apk_url;
  document.getElementById('adm-apk-size').value = s.apk_size;
  document.getElementById('adm-apk-updated').value = s.apk_updated_at;
  document.getElementById('adm-apk-changelog').value = s.apk_changelog;
  const tgInput = document.getElementById('adm-telegram-url');
  if (tgInput) tgInput.value = s.telegram_url || 'https://t.me/+A6xwBk-NT_Y1NGRh';

  // 3. Estado de conexión Supabase
  const supCfg = window.portalDB.getSupabaseConfig();
  document.getElementById('adm-supabase-url').value = supCfg.url || '';
  document.getElementById('adm-supabase-key').value = supCfg.anonKey || '';
  const statusBadge = document.getElementById('supabase-connection-badge');
  if (statusBadge) {
    if (window.portalDB.isCloudConnected) {
      statusBadge.className = 'px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30';
      statusBadge.textContent = '● Supabase Cloud Conectado';
    } else {
      statusBadge.className = 'px-3 py-1 rounded-full text-xs font-semibold bg-slate-800 text-slate-300 border border-slate-700';
      statusBadge.textContent = '● Modo Local Activo';
    }
  }

  // 4. Lista de Notificaciones en Admin
  const adminNotifsList = document.getElementById('admin-notifications-list');
  if (adminNotifsList) {
    adminNotifsList.innerHTML = APP_STATE.notifications.map(n => `
      <div class="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-xl bg-slate-900/70 border border-slate-800">
        <div class="min-w-0 flex-1">
          <span class="text-xs text-slate-400 block mb-0.5">${formatDate(n.created_at)}</span>
          <h5 class="font-bold text-white text-xs sm:text-sm">${escapeHtml(n.title)}</h5>
          <p class="text-xs text-slate-400 truncate">${escapeHtml(n.message)}</p>
        </div>
        <button onclick="handleDeleteNotification(${n.id})" class="px-3 py-1.5 rounded-lg text-xs font-medium bg-rose-500/15 text-rose-300 hover:bg-rose-500/30 transition shrink-0">
          Eliminar
        </button>
      </div>
    `).join('');
  }

  // 5. Lista de Artículos en Admin
  const adminPostsList = document.getElementById('admin-posts-list');
  if (adminPostsList) {
    adminPostsList.innerHTML = APP_STATE.posts.map(p => `
      <div class="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-xl bg-slate-900/70 border border-slate-800">
        <div class="min-w-0 flex-1">
          <span class="text-xs text-sky-400 font-semibold">${escapeHtml(p.category)} • ${formatDate(p.created_at)}</span>
          <h5 class="font-semibold text-white text-xs sm:text-sm truncate mt-0.5">${escapeHtml(p.title)}</h5>
        </div>
        <div class="flex items-center gap-2 shrink-0">
          <button onclick="openArticleModal(${p.id})" class="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 text-slate-200 hover:bg-slate-700 transition">
            Ver
          </button>
          <button onclick="handleDeletePost(${p.id})" class="px-3 py-1.5 rounded-lg text-xs font-medium bg-rose-500/15 text-rose-300 hover:bg-rose-500/30 transition">
            Eliminar
          </button>
        </div>
      </div>
    `).join('');
  }

  // 6. Bandeja de Comentarios y Sugerencias de la Comunidad en Admin
  renderCommentsSection('admin-comments-list', true);

  updateAdminTabsUI();
}

// --- AUTENTICACIÓN DEL ADMINISTRADOR ---
function toggleAdminPasswordVisibility() {
  const input = document.getElementById('admin-password-input');
  const icon = document.getElementById('admin-pass-eye-icon');
  if (!input) return;
  const isPass = input.type === 'password';
  input.type = isPass ? 'text' : 'password';
  if (icon) {
    icon.setAttribute('data-lucide', isPass ? 'eye-off' : 'eye');
    if (window.lucide) window.lucide.createIcons();
  }
}

function handleAdminLogin(e) {
  e.preventDefault();
  const rawInput = document.getElementById('admin-password-input').value || '';
  const cleanInput = rawInput.trim().replace(/^["'“”]+|["'“”]+$/g, '').trim();
  const savedPass = (localStorage.getItem(STORAGE_KEYS.ADMIN_PASS) || 'Mark*L15').trim();

  if (cleanInput === savedPass || cleanInput === 'Mark*L15') {
    APP_STATE.isAdminAuthenticated = true;
    sessionStorage.setItem(STORAGE_KEYS.ADMIN_AUTH, 'true');
    renderNavbarForView('admin');
    renderAdminView();
    showToast('Bienvenido a tu Panel de Control, Manuel', 'success');
  } else {
    showToast('Contraseña de administrador incorrecta', 'error');
  }
}

function handleChangeAdminPassword(e) {
  e.preventDefault();
  const newPass = document.getElementById('adm-new-password').value.trim();
  if (!newPass || newPass.length < 4) {
    showToast('Ingresa una contraseña de al menos 4 caracteres', 'error');
    return;
  }
  localStorage.setItem(STORAGE_KEYS.ADMIN_PASS, newPass);
  e.target.reset();
  showToast('Clave maestra de administrador actualizada con éxito', 'success');
}

function logoutAdmin() {
  APP_STATE.isAdminAuthenticated = false;
  sessionStorage.removeItem(STORAGE_KEYS.ADMIN_AUTH);
  renderNavbarForView('admin');
  renderAdminView();
  showToast('Sesión de administrador cerrada', 'info');
}

// --- GUARDAR CONFIGURACIÓN DEL APK Y COMUNIDAD TELEGRAM ---
async function handleSaveSettings(e) {
  e.preventDefault();
  const updated = {
    app_version: document.getElementById('adm-app-version').value.trim() || '2.5.6',
    apk_provider: document.getElementById('adm-apk-provider').value.trim() || 'Google Drive',
    apk_url: document.getElementById('adm-apk-url').value.trim(),
    apk_size: document.getElementById('adm-apk-size').value.trim() || '24.8 MB',
    apk_updated_at: document.getElementById('adm-apk-updated').value.trim() || 'Noviembre 2026',
    apk_changelog: document.getElementById('adm-apk-changelog').value.trim(),
    telegram_url: (document.getElementById('adm-telegram-url')?.value || '').trim() || 'https://t.me/+A6xwBk-NT_Y1NGRh'
  };

  const res = await window.portalDB.saveSettings(updated);
  APP_STATE.settings = await window.portalDB.getSettings();
  renderAdminView();
  showToast(
    res.source === 'supabase'
      ? 'Enlace APK y Comunidad Telegram actualizados en Supabase Cloud'
      : 'Enlace APK, versión y Telegram guardados correctamente',
    'success'
  );
}

// --- CREAR Y ELIMINAR NOTIFICACIONES DESDE ADMIN ---
async function handleCreateNotification(e) {
  e.preventDefault();
  const title = document.getElementById('notif-title').value.trim();
  const message = document.getElementById('notif-message').value.trim();
  const type = document.getElementById('notif-type').value;

  if (!title || !message) {
    showToast('Completa el título y mensaje de la notificación', 'error');
    return;
  }

  await window.portalDB.createNotification({ title, message, type });
  APP_STATE.notifications = await window.portalDB.getNotifications();
  e.target.reset();
  renderNotificationsUI();
  renderAdminView();
  showToast('Notificación publicada en el portal web', 'success');
}

async function handleDeleteNotification(notifId) {
  APP_STATE.notifications = await window.portalDB.deleteNotification(notifId);
  renderNotificationsUI();
  renderAdminView();
  showToast('Notificación eliminada', 'info');
}

// --- CREAR Y ELIMINAR ARTÍCULOS DEL BLOG ---
async function handleCreatePost(e) {
  e.preventDefault();
  const title = document.getElementById('post-title').value.trim();
  const category = document.getElementById('post-category').value.trim();
  const read_time = document.getElementById('post-readtime').value.trim() || '3 min';
  const summary = document.getElementById('post-summary').value.trim();
  const content = document.getElementById('post-content').value.trim();

  if (!title || !summary || !content) {
    showToast('Completa título, resumen y contenido del artículo', 'error');
    return;
  }

  await window.portalDB.createPost({ title, category, read_time, summary, content });
  APP_STATE.posts = await window.portalDB.getPosts();
  e.target.reset();
  renderAdminView();
  showToast('Artículo publicado exitosamente en el Blog', 'success');
}

async function handleDeletePost(postId) {
  APP_STATE.posts = await window.portalDB.deletePost(postId);
  renderAdminView();
  showToast('Artículo eliminado', 'info');
}

async function handleSaveSupabaseConfig(e) {
  e.preventDefault();
  const url = document.getElementById('adm-supabase-url').value.trim();
  const key = document.getElementById('adm-supabase-key').value.trim();

  const connected = window.portalDB.saveSupabaseConfig(url, key);
  if (connected) {
    APP_STATE.settings = await window.portalDB.getSettings();
    APP_STATE.posts = await window.portalDB.getPosts();
    APP_STATE.comments = await window.portalDB.getComments();
    APP_STATE.notifications = await window.portalDB.getNotifications();
    renderAdminView();
    showToast('Conectado a Supabase correctamente', 'success');
  } else {
    renderAdminView();
    showToast('Modo local activo (Credenciales de Supabase vacías o desconectadas)', 'info');
  }
}

// --- MODAL DE LECTURA DE ARTÍCULOS DEL BLOG ---
function openArticleModal(postId) {
  const post = APP_STATE.posts.find(p => String(p.id) === String(postId));
  if (!post) return;

  document.getElementById('modal-article-category').textContent = post.category;
  document.getElementById('modal-article-date').textContent = `${formatDate(post.created_at)} • ${post.read_time || '3 min'} de lectura`;
  document.getElementById('modal-article-title').textContent = post.title;

  const formattedHtml = escapeHtml(post.content)
    .replace(/^### (.*$)/gim, '<h3 class="text-lg font-bold text-white mt-5 mb-2">$1</h3>')
    .replace(/\*\*(.*?)\*\*/g, '<strong class="text-sky-300 font-semibold">$1</strong>')
    .replace(/`([^`]+)`/g, '<code class="px-1.5 py-0.5 rounded bg-slate-800 text-sky-300 text-xs font-mono">$1</code>')
    .replace(/^- (.*$)/gim, '<li class="ml-4 list-disc text-slate-300 my-1">$1</li>')
    .replace(/\n\n/g, '</p><p class="text-slate-300 leading-relaxed mb-4">')
    .replace(/\n/g, '<br>');

  document.getElementById('modal-article-body').innerHTML = `<p class="text-slate-300 leading-relaxed mb-4">${formattedHtml}</p>`;
  document.getElementById('article-modal').classList.remove('hidden');
}

function closeArticleModal() {
  document.getElementById('article-modal').classList.add('hidden');
}

function updatePrototypeBar() {}
function togglePrototypeBar() {}

// --- UTILIDADES ---
function copyInputValue(inputId, label) {
  const el = document.getElementById(inputId);
  if (!el) return;
  navigator.clipboard.writeText(el.value).then(() => {
    showToast(`¡Enlace de ${label} copiado al portapapeles!`, 'success');
  });
}

function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const colors = {
    success: 'bg-emerald-950/95 border-emerald-500/50 text-emerald-200',
    error: 'bg-rose-950/95 border-rose-500/50 text-rose-200',
    info: 'bg-slate-900/95 border-sky-500/50 text-sky-200'
  };

  const toast = document.createElement('div');
  toast.className = `px-4 py-3 rounded-xl border shadow-2xl backdrop-blur-md text-xs sm:text-sm font-medium flex items-center gap-2.5 animate-fade-in ${colors[type] || colors.info}`;
  toast.innerHTML = `<span>${escapeHtml(message)}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.remove();
  }, 4000);
}

function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function formatDate(isoStr) {
  try {
    const d = new Date(isoStr);
    return d.toLocaleDateString('es-VE', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch (e) {
    return 'Hoy';
  }
}

function formatTimeAgo(isoStr) {
  if (!isoStr) return 'Hoy';
  try {
    const d = new Date(isoStr);
    return d.toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' });
  } catch (e) {
    return 'Hoy';
  }
}

function setupEventListeners() {
  const simInput = document.getElementById('sim-amount-input');
  if (simInput) {
    simInput.addEventListener('input', updateSimulatorCalc);
  }

  window.addEventListener('popstate', () => {
    const view = resolveViewFromURL();
    switchView(view, false);
  });
}

document.addEventListener('DOMContentLoaded', initPortal);
