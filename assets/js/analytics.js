/**
 * Michel Domenella Portfolio - Custom Privacy-First Analytics Engine
 * Lightweight, zero-dependency visitor & recruiter tracker.
 */

(function () {
  'use strict';

  // Configuration
  const CONFIG = {
    supabaseUrl: (window.ANALYTICS_CONFIG && window.ANALYTICS_CONFIG.supabaseUrl) || 'https://xeysfzxizzdftwzjbirp.supabase.co',
    supabaseAnonKey: (window.ANALYTICS_CONFIG && window.ANALYTICS_CONFIG.supabaseAnonKey) || 'sb_publishable_U4i9nnuj-Sa09NEZU_ufmA_YbQl3YnN',
    endpoint: '/rest/v1/',
    debug: false,
  };

  // Detect automated bots, web crawlers, search spiders, and headless scrapers
  function isBotOrCrawler() {
    // 1. Explicit automation flag (Puppeteer, Playwright, Selenium, WebDriver)
    if (navigator.webdriver) return true;

    // 2. Headless browser globals and injection hooks
    if (window.callPhantom || window._phantom || window.__nightmare || window.domAutomation || window.domAutomationController) {
      return true;
    }

    // 3. User-Agent crawler/bot signatures
    const ua = (navigator.userAgent || '').toLowerCase();
    const botPattern = /bot|crawler|spider|slurp|headless|phantom|scraper|search|archiver|transcoder|facebookexternalhit|whatsapp|preview|lighthouse|insights|pingdom|uptimerobot|monitoring|curl|wget|python|java|urllib|postman|apachebench|feed|ahrefs|semrush|petalbot|dotbot|bytespider|yandex|sogou|exabot|ia_archiver|mj12bot|screaming frog|netcraft|censys|shodan|googlebot|bingbot|duckduckbot|baiduspider|yodaobot|applebot|yandexbot|gptbot|claudebot|perplexity/i;
    if (botPattern.test(ua)) return true;

    // 4. Headless Chrome token
    if (ua.includes('headlesschrome')) return true;

    // 5. Zero screen resolution / impossible screen metrics (typical in scraping containers)
    if (window.screen && (window.screen.width === 0 || window.screen.height === 0 || window.screen.availWidth === 0)) {
      return true;
    }

    // 6. Missing language definition (common in automated headless environments)
    if (navigator.languages !== undefined && Array.isArray(navigator.languages) && navigator.languages.length === 0) {
      return true;
    }

    return false;
  }

  // Generate or retrieve persistent session ID (lives for the browser tab session)
  function getSessionId() {
    let sid = sessionStorage.getItem('va_session_id');
    if (!sid) {
      sid = 's_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 9);
      sessionStorage.setItem('va_session_id', sid);
    }
    return sid;
  }

  // Extract recruiter or campaign tag from URL (?ref=tesla or ?utm_source=apple)
  function getRecruiterTag() {
    const params = new URLSearchParams(window.location.search);
    const tag = params.get('ref') || params.get('utm_source') || params.get('company') || '';
    if (tag) {
      sessionStorage.setItem('va_recruiter_tag', tag);
      return tag;
    }
    return sessionStorage.getItem('va_recruiter_tag') || '';
  }

  // Determine device category
  function getDeviceType() {
    const ua = navigator.userAgent;
    if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) return 'Tablet';
    if (/Mobile|iP(hone|od)|Android|BlackBerry|IEMobile|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/i.test(ua)) return 'Mobile';
    return 'Desktop';
  }

  // Detect referrer source
  function getReferrer() {
    const ref = document.referrer;
    if (!ref) return 'Direct';
    try {
      const refUrl = new URL(ref);
      if (refUrl.hostname === window.location.hostname) return 'Internal';
      return refUrl.hostname.replace('www.', '');
    } catch (e) {
      return ref;
    }
  }

  const sessionId = getSessionId();
  const recruiterTag = getRecruiterTag();
  const deviceType = getDeviceType();
  const referrer = getReferrer();
  const pageStartTime = Date.now();

  // Send payload to Supabase REST API via fetch or sendBeacon
  function sendToBackend(table, data) {
    if (!CONFIG.supabaseUrl || !CONFIG.supabaseAnonKey) {
      if (CONFIG.debug) {
        console.log(`[Analytics: ${table}]`, data);
      }
      // Store in local buffer for testing / offline preview
      try {
        const localLog = JSON.parse(localStorage.getItem('va_offline_events') || '[]');
        localLog.push({ table, data, timestamp: new Date().toISOString() });
        if (localLog.length > 200) localLog.shift();
        localStorage.setItem('va_offline_events', JSON.stringify(localLog));
      } catch (e) {}
      return;
    }

    const url = `${CONFIG.supabaseUrl}${CONFIG.endpoint}${table}`;
    const payload = JSON.stringify(data);
    const headers = {
      'Content-Type': 'application/json',
      'apikey': CONFIG.supabaseAnonKey,
      'Authorization': `Bearer ${CONFIG.supabaseAnonKey}`,
      'Prefer': 'return=minimal',
    };

    // Use sendBeacon if available and suitable
    if (navigator.sendBeacon && typeof Blob !== 'undefined') {
      try {
        const blob = new Blob([payload], { type: 'application/json' });
        // Note: fetch with keepalive is preferred for custom headers
      } catch (e) {}
    }

    return fetch(url, {
      method: 'POST',
      headers: headers,
      body: payload,
      keepalive: true,
    }).catch(function (err) {
      if (CONFIG.debug) console.warn('[Analytics Error]', err);
    });
  }

  // Record initial session ping
  function recordSession() {
    const isNewSession = !sessionStorage.getItem('va_session_recorded');
    if (isNewSession) {
      sessionStorage.setItem('va_session_recorded', 'true');
      const sessionData = {
        session_id: sessionId,
        referrer: referrer,
        ref_tag: recruiterTag,
        device_type: deviceType,
        screen_res: `${window.screen.width}x${window.screen.height}`,
        user_agent: navigator.userAgent,
        created_at: new Date().toISOString(),
      };
      return sendToBackend('analytics_sessions', sessionData);
    }
    return Promise.resolve();
  }

  // Record Pageview Event
  function recordPageview() {
    const pageData = {
      session_id: sessionId,
      event_type: 'pageview',
      page_path: window.location.pathname,
      page_title: document.title,
      ref_tag: recruiterTag,
      created_at: new Date().toISOString(),
      event_data: {
        search: window.location.search,
        referrer: referrer,
      },
    };
    return sendToBackend('analytics_events', pageData);
  }

  // Custom Event Tracker (Exposed globally)
  window.trackPortfolioEvent = function (eventType, eventData) {
    if (isBotOrCrawler()) return;
    const eventPayload = {
      session_id: sessionId,
      event_type: eventType,
      page_path: window.location.pathname,
      page_title: document.title,
      ref_tag: recruiterTag,
      created_at: new Date().toISOString(),
      event_data: eventData || {},
    };
    sendToBackend('analytics_events', eventPayload);
  };

  // Record Dwell Time on Exit
  function recordPageExit() {
    if (isBotOrCrawler()) return;
    const dwellSeconds = Math.round((Date.now() - pageStartTime) / 1000);
    if (dwellSeconds > 1) {
      window.trackPortfolioEvent('page_dwell', {
        duration_seconds: dwellSeconds,
        page_path: window.location.pathname,
      });
    }
  }

  // Auto-track user interactions (Resume download, contact clicks, CAD viewer)
  function attachInteractionListeners() {
    document.addEventListener('click', function (e) {
      const target = e.target.closest('a, button');
      if (!target) return;

      const href = target.getAttribute('href') || '';
      const text = (target.textContent || '').trim();

      // Resume download
      if (href.toLowerCase().includes('.pdf') || href.toLowerCase().includes('resume')) {
        window.trackPortfolioEvent('resume_click', {
          link_url: href,
          link_text: text,
          page: window.location.pathname,
        });
      }
      // Contact / Email click
      else if (href.startsWith('mailto:')) {
        window.trackPortfolioEvent('contact_click', {
          email: href.replace('mailto:', ''),
          link_text: text,
          page: window.location.pathname,
        });
      }
      // Navigation / project card clicks
      else if (target.classList.contains('project-card') || target.closest('.project-card')) {
        const cardTitle = target.querySelector('h3') ? target.querySelector('h3').textContent : text;
        window.trackPortfolioEvent('project_click', {
          project: cardTitle,
          href: href,
        });
      }
    }, true);

    // Track 3D CAD interaction on Clippard page
    const cadCanvases = document.querySelectorAll('.project-artifact__canvas');
    cadCanvases.forEach(function (canvas) {
      let cadInteracted = false;
      const onCadInteract = function () {
        if (!cadInteracted) {
          cadInteracted = true;
          window.trackPortfolioEvent('cad_viewer_interact', {
            model: canvas.closest('.project-artifact')?.dataset?.model || 'NPV3',
            page: window.location.pathname,
          });
        }
      };
      canvas.addEventListener('mousedown', onCadInteract, { once: true, passive: true });
      canvas.addEventListener('touchstart', onCadInteract, { once: true, passive: true });
      canvas.addEventListener('wheel', onCadInteract, { once: true, passive: true });
    });
  }

  // Initialize
  function init() {
    // 1. Filter out automated bots, search indexers, and headless scrapers
    if (isBotOrCrawler()) {
      if (CONFIG.debug) console.log('[Analytics] Automated bot or crawler detected. Tracking ignored.');
      return;
    }

    // 2. Handle speculative browser pre-rendering
    if (document.prerendering) {
      document.addEventListener('prerenderingchange', function () {
        if (!document.prerendering) init();
      }, { once: true });
      return;
    }

    Promise.resolve(recordSession())
      .then(function () {
        return recordPageview();
      })
      .catch(function (err) {
        if (CONFIG.debug) console.warn('[Analytics Init Error]', err);
      });

    attachInteractionListeners();

    // Listen for page exit / navigation
    window.addEventListener('visibilitychange', function () {
      if (document.visibilityState === 'hidden') {
        recordPageExit();
      }
    });
    window.addEventListener('pagehide', recordPageExit);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
