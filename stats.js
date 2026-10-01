// Square Image Studio — anonymous aggregate usage stats
(() => {
  const statsEl = document.getElementById('usageStats');
  const fileInput = document.getElementById('fileInput');
  const dropZone = document.getElementById('dropZone');
  const downloadBtn = document.getElementById('downloadBtn');

  function validImage(file) {
    return !!file && file.type?.startsWith('image/');
  }

  function renderStats(data) {
    if (!statsEl || !data) return;
    const images = Number(data.images || 0).toLocaleString();
    const exports = Number(data.exports || 0).toLocaleString();
    statsEl.textContent = `${images} images processed · ${exports} exports`;
    statsEl.classList.remove('hidden');
  }

  async function requestStats(event) {
    try {
      const response = await fetch('/api/usage-stats', {
        method: event ? 'POST' : 'GET',
        headers: event ? { 'Content-Type': 'application/json' } : undefined,
        body: event ? JSON.stringify({ event }) : undefined,
        cache: 'no-store',
      });
      if (response.ok) renderStats(await response.json());
    } catch {
      // Stats are deliberately non-critical: image editing still works if unavailable.
    }
  }

  fileInput?.addEventListener('change', (e) => {
    if (validImage(e.target.files?.[0])) requestStats('image');
  });

  dropZone?.addEventListener('drop', (e) => {
    if (validImage(e.dataTransfer?.files?.[0])) requestStats('image');
  });

  window.addEventListener('paste', (e) => {
    const file = [...(e.clipboardData?.files || [])].find(validImage);
    if (file) requestStats('image');
  });

  // Loaded before filename.js so this capture listener runs before its download override.
  downloadBtn?.addEventListener('click', () => {
    if (window.state?.image || (typeof state !== 'undefined' && state.image)) requestStats('export');
  }, true);

  requestStats();
})();
