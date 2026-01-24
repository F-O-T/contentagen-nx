/**
 * Blog Analytics Tracker
 *
 * Generates self-contained tracking scripts for embedding in blog posts.
 * Tracks page views, engagement metrics, scroll depth, section visibility,
 * link clicks, and CTA performance.
 */

export interface AnalyticsConfig {
	contentId: string;
	contentSlug: string;
	contentTitle: string;
	agentId: string;
	organizationId: string;
	wordCount: number;
	estimatedReadTime: number; // in seconds
	posthogHost: string;
	posthogApiKey: string; // Public project key for client-side
}

export type TrafficSource =
	| "organic"
	| "direct"
	| "referral"
	| "social"
	| "paid"
	| "email";

export type DeviceType = "desktop" | "tablet" | "mobile";

export class BlogAnalyticsTracker {
	/**
	 * Generate a self-contained tracking script for embedding in blog posts
	 */
	generateTrackingScript(config: AnalyticsConfig): string {
		const script = `
<script>
(function() {
  'use strict';

  // Respect Do Not Track
  if (navigator.doNotTrack === '1' || window.doNotTrack === '1') {
    return;
  }

  // Configuration
  var CONFIG = {
    contentId: '${this.escapeString(config.contentId)}',
    contentSlug: '${this.escapeString(config.contentSlug)}',
    contentTitle: '${this.escapeString(config.contentTitle)}',
    agentId: '${this.escapeString(config.agentId)}',
    organizationId: '${this.escapeString(config.organizationId)}',
    wordCount: ${config.wordCount},
    estimatedReadTime: ${config.estimatedReadTime},
    posthogHost: '${this.escapeString(config.posthogHost)}',
    posthogApiKey: '${this.escapeString(config.posthogApiKey)}'
  };

  // Generate visitor ID (persisted in localStorage)
  function getVisitorId() {
    var key = 'cta_visitor_id';
    var id = localStorage.getItem(key);
    if (!id) {
      id = 'v_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
      try { localStorage.setItem(key, id); } catch (e) {}
    }
    return id;
  }

  // Generate session ID (persisted in sessionStorage)
  function getSessionId() {
    var key = 'cta_session_id';
    var id = sessionStorage.getItem(key);
    if (!id) {
      id = 's_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
      try { sessionStorage.setItem(key, id); } catch (e) {}
    }
    return id;
  }

  // Detect traffic source from referrer and UTM params
  function getTrafficSource() {
    var params = new URLSearchParams(window.location.search);
    var utmSource = params.get('utm_source');
    var utmMedium = params.get('utm_medium');
    var referrer = document.referrer;

    if (utmMedium === 'cpc' || utmMedium === 'ppc' || utmMedium === 'paid') {
      return 'paid';
    }
    if (utmMedium === 'email' || utmSource === 'newsletter') {
      return 'email';
    }
    if (!referrer) {
      return 'direct';
    }

    var referrerDomain = new URL(referrer).hostname;
    var socialDomains = ['facebook.com', 'twitter.com', 'x.com', 'linkedin.com', 'instagram.com', 'tiktok.com', 'youtube.com', 'pinterest.com', 'reddit.com', 't.co'];
    var searchDomains = ['google.', 'bing.com', 'duckduckgo.com', 'yahoo.', 'baidu.com', 'yandex.'];

    for (var i = 0; i < socialDomains.length; i++) {
      if (referrerDomain.indexOf(socialDomains[i]) !== -1) return 'social';
    }
    for (var j = 0; j < searchDomains.length; j++) {
      if (referrerDomain.indexOf(searchDomains[j]) !== -1) return 'organic';
    }

    return 'referral';
  }

  // Detect device type
  function getDeviceType() {
    var width = window.innerWidth;
    if (width < 768) return 'mobile';
    if (width < 1024) return 'tablet';
    return 'desktop';
  }

  // Get UTM parameters
  function getUtmParams() {
    var params = new URLSearchParams(window.location.search);
    return {
      utm_source: params.get('utm_source') || undefined,
      utm_medium: params.get('utm_medium') || undefined,
      utm_campaign: params.get('utm_campaign') || undefined,
      utm_content: params.get('utm_content') || undefined,
      utm_term: params.get('utm_term') || undefined
    };
  }

  // Get referrer domain
  function getReferrerDomain() {
    if (!document.referrer) return '';
    try { return new URL(document.referrer).hostname; } catch (e) { return ''; }
  }

  // Send event via PostHog capture API or existing posthog instance
  function sendEvent(eventName, properties) {
    var payload = {
      api_key: CONFIG.posthogApiKey,
      event: eventName,
      properties: Object.assign({}, properties, {
        $lib: 'contentta-sdk',
        $lib_version: '1.0.0'
      }),
      timestamp: new Date().toISOString()
    };

    // Use existing posthog if available
    if (window.posthog && typeof window.posthog.capture === 'function') {
      window.posthog.capture(eventName, properties);
      return;
    }

    // Otherwise use sendBeacon or fetch
    var url = CONFIG.posthogHost + '/capture/';
    var data = JSON.stringify(payload);

    if (navigator.sendBeacon) {
      navigator.sendBeacon(url, data);
    } else {
      fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: data,
        keepalive: true
      }).catch(function() {});
    }
  }

  // State
  var visitorId = getVisitorId();
  var sessionId = getSessionId();
  var trafficSource = getTrafficSource();
  var deviceType = getDeviceType();
  var utmParams = getUtmParams();
  var referrerDomain = getReferrerDomain();

  var startTime = Date.now();
  var activeTime = 0;
  var lastActiveTime = startTime;
  var isActive = true;
  var maxScrollDepth = 0;
  var scrollMilestones = { 25: false, 50: false, 75: false, 100: false };
  var sectionsViewed = {};
  var eventsSent = { view: false, unload: false };

  // Base properties for all events
  function getBaseProperties() {
    return {
      content_id: CONFIG.contentId,
      content_slug: CONFIG.contentSlug,
      content_title: CONFIG.contentTitle,
      agent_id: CONFIG.agentId,
      organization_id: CONFIG.organizationId,
      visitor_id: visitorId,
      session_id: sessionId,
      referrer: document.referrer,
      referrer_domain: referrerDomain,
      traffic_source: trafficSource,
      device_type: deviceType,
      word_count: CONFIG.wordCount,
      estimated_read_time: CONFIG.estimatedReadTime,
      utm_source: utmParams.utm_source,
      utm_medium: utmParams.utm_medium,
      utm_campaign: utmParams.utm_campaign,
      utm_content: utmParams.utm_content,
      utm_term: utmParams.utm_term,
      page_url: window.location.href,
      page_path: window.location.pathname
    };
  }

  // Track page view
  function trackPageView() {
    if (eventsSent.view) return;
    eventsSent.view = true;

    sendEvent('blog_post_view', getBaseProperties());
  }

  // Track scroll depth
  function trackScrollDepth() {
    var scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    var docHeight = Math.max(
      document.body.scrollHeight,
      document.documentElement.scrollHeight,
      document.body.offsetHeight,
      document.documentElement.offsetHeight
    );
    var viewportHeight = window.innerHeight;
    var scrollPercent = Math.round((scrollTop / (docHeight - viewportHeight)) * 100);

    if (scrollPercent > maxScrollDepth) {
      maxScrollDepth = Math.min(scrollPercent, 100);
    }

    // Send milestone events
    var milestones = [25, 50, 75, 100];
    for (var i = 0; i < milestones.length; i++) {
      var milestone = milestones[i];
      if (scrollPercent >= milestone && !scrollMilestones[milestone]) {
        scrollMilestones[milestone] = true;
        sendEvent('blog_post_scroll', Object.assign({}, getBaseProperties(), {
          scroll_depth: milestone,
          time_to_scroll_ms: Date.now() - startTime
        }));
      }
    }
  }

  // Track section visibility using IntersectionObserver
  function trackSections() {
    if (!('IntersectionObserver' in window)) return;

    var headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
    if (!headings.length) return;

    var observer = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting) {
          var heading = entry.target;
          var headingText = heading.textContent.trim().substring(0, 100);
          var headingId = heading.id || headingText.toLowerCase().replace(/[^a-z0-9]+/g, '-');

          if (!sectionsViewed[headingId]) {
            sectionsViewed[headingId] = {
              firstViewTime: Date.now(),
              viewCount: 0
            };
          }
          sectionsViewed[headingId].viewCount++;

          sendEvent('blog_post_section_view', Object.assign({}, getBaseProperties(), {
            section_id: headingId,
            section_title: headingText,
            section_tag: heading.tagName.toLowerCase(),
            time_to_section_ms: Date.now() - startTime,
            view_count: sectionsViewed[headingId].viewCount
          }));
        }
      });
    }, { threshold: 0.5 });

    headings.forEach(function(heading) {
      observer.observe(heading);
    });
  }

  // Track active time (visibility-aware)
  function trackActiveTime() {
    var handleVisibilityChange = function() {
      if (document.hidden) {
        if (isActive) {
          activeTime += Date.now() - lastActiveTime;
          isActive = false;
        }
      } else {
        lastActiveTime = Date.now();
        isActive = true;
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Periodic heartbeat every 30 seconds
    setInterval(function() {
      if (isActive) {
        activeTime += Date.now() - lastActiveTime;
        lastActiveTime = Date.now();
      }
    }, 30000);
  }

  // Track link clicks
  function trackLinkClicks() {
    document.addEventListener('click', function(e) {
      var link = e.target.closest('a');
      if (!link) return;

      var href = link.getAttribute('href');
      if (!href) return;

      var isExternal = link.hostname !== window.location.hostname;
      var isAnchor = href.startsWith('#');
      var isCta = link.hasAttribute('data-cta') || link.classList.contains('cta');

      var linkType = 'internal';
      if (isExternal) linkType = 'external';
      if (isAnchor) linkType = 'anchor';

      sendEvent('blog_post_link_click', Object.assign({}, getBaseProperties(), {
        link_url: href,
        link_text: link.textContent.trim().substring(0, 100),
        link_type: linkType,
        is_cta: isCta,
        time_on_page_ms: Date.now() - startTime
      }));

      // Track CTA clicks separately
      if (isCta) {
        var ctaId = link.getAttribute('data-cta-id') || link.id || href;
        var ctaName = link.getAttribute('data-cta-name') || link.textContent.trim();

        sendEvent('blog_post_cta_click', Object.assign({}, getBaseProperties(), {
          cta_id: ctaId,
          cta_name: ctaName.substring(0, 100),
          cta_url: href,
          time_on_page_ms: Date.now() - startTime
        }));
      }
    }, true);
  }

  // Track CTA impressions
  function trackCtaImpressions() {
    if (!('IntersectionObserver' in window)) return;

    var ctas = document.querySelectorAll('[data-cta], .cta');
    if (!ctas.length) return;

    var ctaImpressed = {};
    var observer = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting) {
          var cta = entry.target;
          var ctaId = cta.getAttribute('data-cta-id') || cta.id || cta.getAttribute('href') || 'unknown';

          if (!ctaImpressed[ctaId]) {
            ctaImpressed[ctaId] = true;

            sendEvent('blog_post_cta_impression', Object.assign({}, getBaseProperties(), {
              cta_id: ctaId,
              cta_name: (cta.getAttribute('data-cta-name') || cta.textContent.trim()).substring(0, 100),
              time_on_page_ms: Date.now() - startTime
            }));
          }
        }
      });
    }, { threshold: 0.5 });

    ctas.forEach(function(cta) {
      observer.observe(cta);
    });
  }

  // Send final metrics on unload
  function trackUnload() {
    if (eventsSent.unload) return;
    eventsSent.unload = true;

    // Calculate final active time
    if (isActive) {
      activeTime += Date.now() - lastActiveTime;
    }

    var totalTimeMs = Date.now() - startTime;

    sendEvent('blog_post_time_spent', Object.assign({}, getBaseProperties(), {
      total_time_ms: totalTimeMs,
      active_time_ms: activeTime,
      max_scroll_depth: maxScrollDepth,
      sections_viewed_count: Object.keys(sectionsViewed).length,
      scroll_milestones_reached: Object.keys(scrollMilestones).filter(function(k) {
        return scrollMilestones[k];
      }).map(Number)
    }));
  }

  // Initialize tracking
  function init() {
    trackPageView();
    trackSections();
    trackActiveTime();
    trackLinkClicks();
    trackCtaImpressions();

    // Throttled scroll tracking
    var scrollTimeout;
    window.addEventListener('scroll', function() {
      if (scrollTimeout) return;
      scrollTimeout = setTimeout(function() {
        scrollTimeout = null;
        trackScrollDepth();
      }, 100);
    }, { passive: true });

    // Send final metrics on unload
    window.addEventListener('beforeunload', trackUnload);
    window.addEventListener('pagehide', trackUnload);
    document.addEventListener('visibilitychange', function() {
      if (document.visibilityState === 'hidden') {
        trackUnload();
      }
    });
  }

  // Start tracking when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
</script>`.trim();

		return script;
	}

	/**
	 * Escape string for safe inclusion in JavaScript
	 */
	private escapeString(str: string): string {
		return str
			.replace(/\\/g, "\\\\")
			.replace(/'/g, "\\'")
			.replace(/"/g, '\\"')
			.replace(/\n/g, "\\n")
			.replace(/\r/g, "\\r")
			.replace(/</g, "\\x3c")
			.replace(/>/g, "\\x3e");
	}

	/**
	 * Generate a minimal tracking script (no sections, no CTAs)
	 * Useful for simpler blog layouts
	 */
	generateMinimalTrackingScript(config: AnalyticsConfig): string {
		const script = `
<script>
(function() {
  'use strict';
  if (navigator.doNotTrack === '1') return;

  var CONFIG = {
    contentId: '${this.escapeString(config.contentId)}',
    organizationId: '${this.escapeString(config.organizationId)}',
    posthogHost: '${this.escapeString(config.posthogHost)}',
    posthogApiKey: '${this.escapeString(config.posthogApiKey)}'
  };

  function send(event, props) {
    var data = JSON.stringify({
      api_key: CONFIG.posthogApiKey,
      event: event,
      properties: props,
      timestamp: new Date().toISOString()
    });
    if (navigator.sendBeacon) {
      navigator.sendBeacon(CONFIG.posthogHost + '/capture/', data);
    }
  }

  var vid = localStorage.getItem('cta_vid') || (function() {
    var id = 'v_' + Date.now().toString(36) + Math.random().toString(36).substr(2);
    try { localStorage.setItem('cta_vid', id); } catch(e) {}
    return id;
  })();

  send('blog_post_view', {
    content_id: CONFIG.contentId,
    organization_id: CONFIG.organizationId,
    visitor_id: vid,
    referrer: document.referrer,
    page_url: location.href
  });
})();
</script>`.trim();

		return script;
	}
}

/**
 * Factory function to create a BlogAnalyticsTracker instance
 */
export function createAnalyticsTracker(): BlogAnalyticsTracker {
	return new BlogAnalyticsTracker();
}
