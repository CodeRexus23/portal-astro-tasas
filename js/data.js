// ============================================================================
// CAPA DE DATOS Y SINCRONIZACIÓN HÍBRIDA (SUPABASE + LOCALSTORAGE + APIS EN VIVO)
// ============================================================================

const STORAGE_KEYS = {
  SETTINGS: 'astrotasas_portal_settings_v3',
  POSTS: 'astrotasas_portal_posts_v3',
  COMMENTS: 'astrotasas_portal_comments_v3',
  VOTED_COMMENTS: 'astrotasas_portal_voted_comments_v3',
  NOTIFICATIONS: 'astrotasas_portal_notifs_v3',
  READ_NOTIFS: 'astrotasas_portal_read_notifs_v3',
  LIVE_RATES_CACHE: 'astrotasas_live_rates_cache_v3',
  SUPABASE_CFG: 'astrotasas_supabase_config_v1',
  ADMIN_AUTH: 'astrotasas_admin_session_v1',
  ADMIN_PASS: 'astrotasas_admin_pass_v1'
};

// Configuración inicial por defecto basada en Astro Tasas v2.5.6 real
const DEFAULT_SETTINGS = {
  id: 1,
  app_version: '2.5.6',
  apk_url: 'https://drive.google.com/drive/folders/ejemplo-astro-tasas-apk',
  apk_provider: 'Google Drive',
  apk_size: '24.8 MB',
  apk_updated_at: 'Noviembre 2026',
  apk_min_android: 'Android 7.0+ (API 24)',
  apk_changelog: '• Sincronización automática en segundo plano de tasas oficiales BCV, Euro y USDT P2P.\n• Escáner Cotizado OCR con cámara en vivo para convertir precios impresos al instante.\n• Centro de Inteligencia Financiera asistido por IA y mejoras en Planificador de Compras.',
  telegram_url: 'https://t.me/+A6xwBk-NT_Y1NGRh'
};

// Notificaciones iniciales del Portal Web
const DEFAULT_NOTIFICATIONS = [
  {
    id: 501,
    title: 'Versión v2.5.6 disponible para Android',
    message: 'Ya puedes descargar el nuevo APK con Escáner OCR de precios mejorado, Próxima Tasa BCV y caché Offline de alta velocidad.',
    type: 'update', // 'update' | 'rate' | 'info'
    created_at: new Date().toISOString()
  },
  {
    id: 502,
    title: '¡Únete a nuestra Comunidad Oficial en Telegram!',
    message: 'Comparte sugerencias, recibe avisos de actualizaciones del APK y entérate de todas las novedades de Astro Tasas.',
    type: 'info',
    created_at: new Date(Date.now() - 1800 * 1000).toISOString()
  },
  {
    id: 503,
    title: 'Conexión en Vivo con APIs Oficiales Activa',
    message: 'El conversor del portal web está sincronizado en tiempo real con las mismas fuentes de Astro Tasas (Dólar BCV, Euro BCV y USDT P2P).',
    type: 'rate',
    created_at: new Date(Date.now() - 3600 * 1000).toISOString()
  }
];

// Artículos iniciales del Blog (Subidos por el Administrador)
const DEFAULT_POSTS = [
  {
    id: 101,
    title: 'Cómo usar la función de Próxima Tasa BCV y el Modo Offline en Astro Tasas',
    category: 'Guía de Uso',
    read_time: '3 min',
    created_at: '2026-11-18T14:00:00Z',
    summary: 'Descubre cómo anticiparte a las variaciones cambiarias activando la Próxima Tasa BCV con un toque y cómo consultar tus conversiones sin conexión a internet.',
    content: `Astro Tasas sincroniza automáticamente en segundo plano tanto la tasa oficial vigente del Banco Central de Venezuela (USD y EUR) como la referencia del mercado P2P (USDT) y la **Próxima Tasa BCV** publicada para el siguiente día hábil.

### ¿Cómo activar la Próxima Tasa BCV?
1. Abre **Astro Tasas** en tu teléfono Android y dirígete al **Conversor Rápido**.
2. Cuando exista una tasa oficial anunciada para la siguiente jornada, verás un indicador interactivo de **Próxima Tasa**.
3. Actívalo manualmente con un toque para simular tus precios, presupuestos o pagos con la tasa que entrará en vigencia.

### Modo 100% Offline Automático
Sabemos que no siempre cuentas con datos móviles al momento de hacer una compra. Por eso, Astro Tasas guarda en una caché inteligente local la última actualización de todas las tasas e historiales para que puedas convertir montos, usar el planificador de compras y revisar tus cuentas claras en cualquier lugar sin depender de la señal.`
  },
  {
    id: 102,
    title: 'Escáner OCR de Precios: Apunta con tu cámara y convierte al instante',
    category: 'Funciones',
    read_time: '2 min',
    created_at: '2026-11-15T10:30:00Z',
    summary: 'Olvídate de teclear cada precio en el supermercado o tienda. Con el Escáner Cotizado solo enfocas la etiqueta y obtienes la conversión en Bolívares, Dólares o Euros.',
    content: `Una de las herramientas favoritas de los usuarios de **Astro Tasas v2.5.6** es el **Escáner Cotizado**.

### ¿Para qué sirve?
Cuando vas de compras y encuentras etiquetas en divisas o en bolívares, no necesitas abrir la calculadora ni escribir número por número:
- Abre el módulo **Escáner Cotizado** desde el menú principal.
- Apunta la cámara de tu Android hacia el precio en la etiqueta o factura.
- El motor de reconocimiento óptico detecta el monto numérico en milisegundos y muestra de inmediato su equivalencia exacta en **USD BCV, EUR BCV y USDT**.
- Además, puedes agregar el monto escaneado directamente a tu **Planificador de Compras** para llevar la suma total de tu carrito antes de llegar a la caja.`
  },
  {
    id: 103,
    title: 'Controla tus Ventas del Día, Comisiones y Agenda de Pago Móvil en un solo lugar',
    category: 'Finanzas Personales',
    read_time: '4 min',
    created_at: '2026-11-10T16:15:00Z',
    summary: 'Conoce las herramientas integradas para comerciantes, emprendedores y usuarios diarios: cálculo exacto de comisiones, Cuentas Claras y Agenda Bancaria.',
    content: `Astro Tasas va mucho más allá de un simple conversor. Es una suite financiera de bolsillo pensada para las operaciones del día a día:

- **Calculadora de Comisiones:** Calcula cuánto debes enviar o recibir exactamente considerando comisiones bancarias y de plataformas digitales.
- **Agenda de Datos Bancarios:** Guarda tus cuentas y datos de Pago Móvil frecuentes con sus logos bancarios y cópialos o compártelos por WhatsApp en un solo toque con el formato exacto.
- **Ventas del Día y Cuentas Claras:** Registra cobros, deudas por cobrar o pagar con recordatorios automáticos y exporta tus reportes diarios.`
  }
];

// Comentarios y Sugerencias iniciales de los usuarios (con puntaje de 5 estrellas por comentario)
const DEFAULT_COMMENTS = [
  {
    id: 901,
    author_name: 'Gabriel Morales',
    comment_type: 'Experiencia',
    content: 'El escáner de precios con la cámara me ahorra muchísimo tiempo en el supermercado y el modo sin internet funciona perfecto cuando no hay señal. ¡Recomendada al 100%!',
    rating_sum: 25,
    rating_count: 5,
    created_at: '2026-11-19T18:20:00Z'
  },
  {
    id: 902,
    author_name: 'Andrea Valentina',
    comment_type: 'Sugerencia',
    content: 'Sería genial que en el Planificador de Compras se puedan guardar listas frecuentes (como mercado quincenal o farmacia) para reutilizarlas rápido.',
    rating_sum: 19,
    rating_count: 4,
    created_at: '2026-11-18T14:10:00Z'
  },
  {
    id: 903,
    author_name: 'José Luis Perdomo',
    comment_type: 'Comentario',
    content: 'La Agenda de Pago Móvil y el botón para activar la Próxima Tasa BCV son súper prácticos para los que tenemos negocio y facturamos todos los días.',
    rating_sum: 15,
    rating_count: 3,
    created_at: '2026-11-17T11:45:00Z'
  }
];

// ============================================================================
// SERVICIO DE APIS CAMBIARIAS EN VIVO (MISMAS APIS DE NetworkService.kt)
// ============================================================================
class AstroLiveRatesService {
  constructor() {
    this.cachedRates = this.loadCachedRates();
  }

  loadCachedRates() {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.LIVE_RATES_CACHE);
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    return {
      usd: 46.85,
      eur: 50.60,
      usdt: 53.40,
      updatedAt: null,
      source: 'Caché inicial'
    };
  }

  saveCachedRates(ratesObj) {
    this.cachedRates = ratesObj;
    try {
      localStorage.setItem(STORAGE_KEYS.LIVE_RATES_CACHE, JSON.stringify(ratesObj));
    } catch (e) {}
  }

  async fetchLiveRates() {
    let usd = 0;
    let eur = 0;
    let usdt = 0;
    let apiTimestamp = null;

    // 1. Dólar BCV Oficial: https://ve.dolarapi.com/v1/dolares/oficial
    try {
      const resUsd = await fetch('https://ve.dolarapi.com/v1/dolares/oficial', { cache: 'no-store' });
      if (resUsd.ok) {
        const json = await resUsd.json();
        usd = Number(json.promedio || json.venta || json.compra || 0);
        if (json.fechaActualizacion) apiTimestamp = json.fechaActualizacion;
      }
    } catch (e) {}

    // 2. Euro BCV Oficial: https://ve.dolarapi.com/v1/euros/oficial
    try {
      const resEur = await fetch('https://ve.dolarapi.com/v1/euros/oficial', { cache: 'no-store' });
      if (resEur.ok) {
        const json = await resEur.json();
        eur = Number(json.promedio || json.venta || json.compra || 0);
      }
    } catch (e) {}

    if (eur <= 0 && usd > 0) {
      try {
        const resEr = await fetch('https://open.er-api.com/v6/latest/USD');
        if (resEr.ok) {
          const erJson = await resEr.json();
          const eurUsd = Number(erJson?.rates?.EUR || 0);
          if (eurUsd > 0) {
            eur = usd / eurUsd;
          }
        }
      } catch (e) {}
      if (eur <= 0) eur = usd * 1.08;
    }

    // 3. USDT Binance P2P: https://criptoya.com/api/binancep2p/usdt/ves/5
    try {
      const resCriptoYa = await fetch('https://criptoya.com/api/binancep2p/usdt/ves/5', { cache: 'no-store' });
      if (resCriptoYa.ok) {
        const json = await resCriptoYa.json();
        const ask = Number(json.ask || 0);
        const bid = Number(json.bid || 0);
        if (ask > 0 && bid > 0) {
          usdt = (ask + bid) / 2.0;
        } else if (ask > 0) {
          usdt = ask;
        }
      }
    } catch (e) {}

    if (usdt <= 0) {
      try {
        const resCripto = await fetch('https://ve.dolarapi.com/v1/dolares/cripto', { cache: 'no-store' });
        if (resCripto.ok) {
          const json = await resCripto.json();
          usdt = Number(json.promedio || json.venta || json.compra || 0);
        }
      } catch (e) {}
    }

    if (usdt <= 0) {
      try {
        const resParalelo = await fetch('https://ve.dolarapi.com/v1/dolares/paralelo', { cache: 'no-store' });
        if (resParalelo.ok) {
          const json = await resParalelo.json();
          usdt = Number(json.promedio || json.venta || json.compra || 0);
        }
      } catch (e) {}
    }

    const finalUsd = usd > 0 ? usd : this.cachedRates.usd;
    const finalEur = eur > 0 ? eur : (usd > 0 ? usd * 1.08 : this.cachedRates.eur);
    const finalUsdt = usdt > 0 ? usdt : (usd > 0 ? usd * 1.15 : this.cachedRates.usdt);

    const result = {
      usd: Number(finalUsd.toFixed(2)),
      eur: Number(finalEur.toFixed(2)),
      usdt: Number(finalUsdt.toFixed(2)),
      updatedAt: apiTimestamp || new Date().toISOString(),
      isLive: usd > 0 || usdt > 0,
      source: usd > 0 ? 've.dolarapi.com & CriptoYa P2P' : 'Caché Offline Local'
    };

    this.saveCachedRates(result);
    return result;
  }
}

// ============================================================================
// CONFIGURACIÓN OFICIAL DE SUPABASE (BASE DE DATOS EN LA NUBE)
// ============================================================================
const DEFAULT_SUPABASE_CONFIG = {
  url: 'https://kxilovoovnbecneyjnkk.supabase.co',
  anonKey: 'sb_publishable_6hQqAvYT4zaLutnbC5EFZA_EhER44HG'
};

// ============================================================================
// CLIENTE DE DATOS (CONEXIÓN A SUPABASE + FALLBACK LOCAL AUTOMÁTICO)
// ============================================================================
class PortalDataService {
  constructor() {
    this.supabase = null;
    this.isCloudConnected = false;
    this.initSupabase();
  }

  getSupabaseConfig() {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.SUPABASE_CFG);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.url && parsed.anonKey) return parsed;
      }
    } catch (e) {}
    return { ...DEFAULT_SUPABASE_CONFIG };
  }

  saveSupabaseConfig(url, anonKey) {
    const cleanUrl = (url || '').trim().replace(/\/rest\/v1\/?$/, '').replace(/\/$/, '');
    const cleanKey = (anonKey || '').trim();
    localStorage.setItem(STORAGE_KEYS.SUPABASE_CFG, JSON.stringify({ url: cleanUrl, anonKey: cleanKey }));
    return this.initSupabase();
  }

  initSupabase() {
    const cfg = this.getSupabaseConfig();
    const cleanUrl = (cfg.url || '').trim().replace(/\/rest\/v1\/?$/, '').replace(/\/$/, '');
    if (cleanUrl && cfg.anonKey && window.supabase) {
      try {
        this.supabase = window.supabase.createClient(cleanUrl, cfg.anonKey);
        this.isCloudConnected = true;
        return true;
      } catch (err) {
        console.warn('Error inicializando cliente Supabase:', err);
      }
    }
    this.supabase = null;
    this.isCloudConnected = false;
    return false;
  }

  // --- CONFIGURACIÓN GENERAL, APK Y COMUNIDAD TELEGRAM ---
  async getSettings() {
    if (this.isCloudConnected) {
      try {
        const { data, error } = await this.supabase
          .from('app_settings')
          .select('*')
          .eq('id', 1)
          .single();
        if (!error && data) {
          const merged = { ...DEFAULT_SETTINGS, ...data };
          localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(merged));
          return merged;
        }
      } catch (e) {}
    }
    try {
      const local = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (local) return { ...DEFAULT_SETTINGS, ...JSON.parse(local) };
    } catch (e) {}
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(DEFAULT_SETTINGS));
    return { ...DEFAULT_SETTINGS };
  }

  async saveSettings(newSettings) {
    const current = await this.getSettings();
    const updated = { ...current, ...newSettings, id: 1 };
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(updated));

    if (this.isCloudConnected) {
      try {
        const { error } = await this.supabase
          .from('app_settings')
          .upsert({
            id: 1,
            app_version: updated.app_version,
            apk_url: updated.apk_url,
            apk_provider: updated.apk_provider,
            apk_size: updated.apk_size,
            apk_updated_at: updated.apk_updated_at,
            apk_changelog: updated.apk_changelog,
            telegram_url: updated.telegram_url,
            updated_at: new Date().toISOString()
          });
        if (error) throw error;
        return { ok: true, source: 'supabase' };
      } catch (err) {
        return { ok: true, source: 'local', warning: err.message };
      }
    }
    return { ok: true, source: 'local' };
  }

  // --- NOTIFICACIONES DEL PORTAL WEB ---
  async getNotifications() {
    if (this.isCloudConnected) {
      try {
        const { data, error } = await this.supabase
          .from('notifications')
          .select('*')
          .order('created_at', { ascending: false });
        if (!error && data && data.length > 0) {
          localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(data));
          return data;
        }
      } catch (e) {}
    }
    try {
      const local = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
      if (local) return JSON.parse(local);
    } catch (e) {}
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(DEFAULT_NOTIFICATIONS));
    return [...DEFAULT_NOTIFICATIONS];
  }

  async createNotification(notifData) {
    const entry = {
      id: Date.now(),
      title: notifData.title,
      message: notifData.message,
      type: notifData.type || 'info',
      created_at: new Date().toISOString()
    };

    const current = await this.getNotifications();
    const updatedList = [entry, ...current];
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(updatedList));

    if (this.isCloudConnected) {
      try {
        const { data, error } = await this.supabase
          .from('notifications')
          .insert([{
            title: entry.title,
            message: entry.message,
            type: entry.type
          }])
          .select();
        if (!error && data && data[0]) {
          updatedList[0] = data[0];
          localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(updatedList));
        }
      } catch (e) {}
    }
    return entry;
  }

  async deleteNotification(notifId) {
    const current = await this.getNotifications();
    const filtered = current.filter(n => String(n.id) !== String(notifId));
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(filtered));

    if (this.isCloudConnected) {
      try {
        await this.supabase.from('notifications').delete().eq('id', notifId);
      } catch (e) {}
    }
    return filtered;
  }

  // --- ARTÍCULOS DEL BLOG (SUBIDOS POR EL AUTOR) ---
  async getPosts() {
    if (this.isCloudConnected) {
      try {
        const { data, error } = await this.supabase
          .from('posts')
          .select('*')
          .order('created_at', { ascending: false });
        if (!error && data && data.length > 0) {
          localStorage.setItem(STORAGE_KEYS.POSTS, JSON.stringify(data));
          return data;
        }
      } catch (e) {}
    }
    try {
      const local = localStorage.getItem(STORAGE_KEYS.POSTS);
      if (local) return JSON.parse(local);
    } catch (e) {}
    localStorage.setItem(STORAGE_KEYS.POSTS, JSON.stringify(DEFAULT_POSTS));
    return [...DEFAULT_POSTS];
  }

  async createPost(postData) {
    const newPost = {
      id: Date.now(),
      title: postData.title,
      category: postData.category || 'Novedades',
      summary: postData.summary,
      content: postData.content,
      read_time: postData.read_time || '3 min',
      created_at: new Date().toISOString()
    };

    const current = await this.getPosts();
    const updatedList = [newPost, ...current];
    localStorage.setItem(STORAGE_KEYS.POSTS, JSON.stringify(updatedList));

    if (this.isCloudConnected) {
      try {
        const { data, error } = await this.supabase
          .from('posts')
          .insert([{
            title: newPost.title,
            category: newPost.category,
            summary: newPost.summary,
            content: newPost.content,
            read_time: newPost.read_time
          }])
          .select();
        if (!error && data && data[0]) {
          updatedList[0] = data[0];
          localStorage.setItem(STORAGE_KEYS.POSTS, JSON.stringify(updatedList));
        }
      } catch (e) {}
    }
    return newPost;
  }

  async deletePost(postId) {
    const current = await this.getPosts();
    const filtered = current.filter(p => String(p.id) !== String(postId));
    localStorage.setItem(STORAGE_KEYS.POSTS, JSON.stringify(filtered));

    if (this.isCloudConnected) {
      try {
        await this.supabase.from('posts').delete().eq('id', postId);
      } catch (e) {}
    }
    return filtered;
  }

  // --- COMENTARIOS Y SUGERENCIAS DE LA COMUNIDAD (CON PUNTAJE DE 5 ESTRELLAS) ---
  async getComments() {
    if (this.isCloudConnected) {
      try {
        const { data, error } = await this.supabase
          .from('comments')
          .select('*')
          .order('created_at', { ascending: false });
        if (!error && data && data.length > 0) {
          localStorage.setItem(STORAGE_KEYS.COMMENTS, JSON.stringify(data));
          return data;
        }
      } catch (e) {}
    }
    try {
      const local = localStorage.getItem(STORAGE_KEYS.COMMENTS);
      if (local) return JSON.parse(local);
    } catch (e) {}
    localStorage.setItem(STORAGE_KEYS.COMMENTS, JSON.stringify(DEFAULT_COMMENTS));
    return [...DEFAULT_COMMENTS];
  }

  async createComment(commentData) {
    const initialStars = Math.min(5, Math.max(1, Number(commentData.initial_stars) || 5));
    const entry = {
      id: Date.now(),
      author_name: commentData.author_name,
      comment_type: commentData.comment_type || 'Sugerencia',
      content: commentData.content,
      rating_sum: initialStars,
      rating_count: 1,
      created_at: new Date().toISOString()
    };

    const current = await this.getComments();
    const updatedList = [entry, ...current];
    localStorage.setItem(STORAGE_KEYS.COMMENTS, JSON.stringify(updatedList));

    if (this.isCloudConnected) {
      try {
        const { data, error } = await this.supabase
          .from('comments')
          .insert([{
            author_name: entry.author_name,
            comment_type: entry.comment_type,
            content: entry.content,
            rating_sum: entry.rating_sum,
            rating_count: entry.rating_count
          }])
          .select();
        if (!error && data && data[0]) {
          updatedList[0] = data[0];
          localStorage.setItem(STORAGE_KEYS.COMMENTS, JSON.stringify(updatedList));
        }
      } catch (e) {}
    }
    return entry;
  }

  async rateComment(commentId, stars) {
    const numericStars = Math.min(5, Math.max(1, Number(stars) || 5));
    const current = await this.getComments();
    const idx = current.findIndex(c => String(c.id) === String(commentId));
    if (idx === -1) return null;

    current[idx].rating_sum = (Number(current[idx].rating_sum) || 0) + numericStars;
    current[idx].rating_count = (Number(current[idx].rating_count) || 0) + 1;

    localStorage.setItem(STORAGE_KEYS.COMMENTS, JSON.stringify(current));

    if (this.isCloudConnected) {
      try {
        await this.supabase
          .from('comments')
          .update({
            rating_sum: current[idx].rating_sum,
            rating_count: current[idx].rating_count
          })
          .eq('id', commentId);
      } catch (e) {}
    }
    return current[idx];
  }

  async deleteComment(commentId) {
    const current = await this.getComments();
    const filtered = current.filter(c => String(c.id) !== String(commentId));
    localStorage.setItem(STORAGE_KEYS.COMMENTS, JSON.stringify(filtered));

    if (this.isCloudConnected) {
      try {
        await this.supabase.from('comments').delete().eq('id', commentId);
      } catch (e) {}
    }
    return filtered;
  }
}

window.astroRatesAPI = new AstroLiveRatesService();
window.portalDB = new PortalDataService();
