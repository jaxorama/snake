(function () {
  function canvasFingerprint() {
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      ctx.textBaseline = 'top';
      ctx.font = "14px 'Arial'";
      ctx.fillStyle = '#f60';
      ctx.fillRect(125, 1, 62, 20);
      ctx.fillStyle = '#069';
      ctx.fillText('fingerprint', 2, 15);
      ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
      ctx.fillText('fingerprint', 4, 17);
      return canvas.toDataURL().slice(-64); // short hash-like tail, not full image
    } catch {
      return null;
    }
  }

  function collect() {
    const nav = navigator;
    const scr = screen;
    return {
      clientTimestamp: new Date().toISOString(),
      url: location.href,
      screen: {
        width: scr.width,
        height: scr.height,
        availWidth: scr.availWidth,
        availHeight: scr.availHeight,
        colorDepth: scr.colorDepth,
        pixelRatio: window.devicePixelRatio,
      },
      viewport: { width: window.innerWidth, height: window.innerHeight },
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      timezoneOffsetMinutes: new Date().getTimezoneOffset(),
      language: nav.language,
      languages: nav.languages,
      platform: nav.platform,
      userAgent: nav.userAgent,
      hardwareConcurrency: nav.hardwareConcurrency || null,
      deviceMemory: nav.deviceMemory || null,
      touchPoints: nav.maxTouchPoints || 0,
      cookieEnabled: nav.cookieEnabled,
      doNotTrack: nav.doNotTrack,
      connection: nav.connection
        ? {
            effectiveType: nav.connection.effectiveType,
            downlink: nav.connection.downlink,
            rtt: nav.connection.rtt,
          }
        : null,
      canvasFingerprint: canvasFingerprint(),
      referrer: document.referrer || null,
    };
  }

  function send(data) {
    fetch('/api/log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).catch(() => {});
  }

  send(collect());

  const locBtn = document.getElementById('locBtn');
  const locStatus = document.getElementById('locStatus');
  if (locBtn) {
    locBtn.addEventListener('click', () => {
      const feedbackForm = document.getElementById('feedbackForm');
      if (feedbackForm) feedbackForm.style.display = 'block';

      if (!navigator.geolocation) {
        locStatus.textContent = 'Geolocation not supported.';
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          send({
            type: 'geolocation',
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
          });
          locStatus.textContent = 'Location shared. Thank you.';
        },
        () => {
          locStatus.textContent = 'Location permission denied.';
        }
      );
    });
  }

  const feedbackSubmit = document.getElementById('feedbackSubmit');
  const feedbackText = document.getElementById('feedbackText');
  const feedbackStatus = document.getElementById('feedbackStatus');
  if (feedbackSubmit) {
    feedbackSubmit.addEventListener('click', () => {
      const text = feedbackText.value.trim();
      if (!text) {
        feedbackStatus.textContent = 'Please enter some feedback first.';
        return;
      }
      send({ type: 'feedback', text });
      feedbackText.value = '';
      feedbackStatus.textContent = 'Thanks for your feedback!';
    });
  }
})();
