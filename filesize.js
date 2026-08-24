// JPEG export filesize estimator for Square Image Studio
(() => {
  const qualityInput = document.querySelector('#quality');
  const qualityValue = document.querySelector('#qualityValue');
  const formatInput = document.querySelector('#format');
  if (!qualityInput || !qualityValue || !formatInput) return;

  let timer = null;
  let estimateRun = 0;

  function formatBytes(bytes) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
    const mb = bytes / (1024 * 1024);
    return `${mb < 10 ? mb.toFixed(1) : Math.round(mb)} MB`;
  }

  function baseQualityLabel() {
    return `${qualityInput.value}%`;
  }

  function scheduleEstimate(delay = 350) {
    clearTimeout(timer);
    timer = setTimeout(estimateJpegSize, delay);
  }

  function estimateJpegSize() {
    const run = ++estimateRun;
    const pct = baseQualityLabel();

    if (!state?.image || formatInput.value !== 'image/jpeg') {
      qualityValue.textContent = pct;
      return;
    }

    qualityValue.textContent = `${pct} · estimating…`;

    const width = getExportWidth();
    const [w, h] = dimensionsForWidth(width);
    const out = document.createElement('canvas');
    out.width = w;
    out.height = h;
    renderTo(out, false);

    const quality = Number(qualityInput.value) / 100;
    out.toBlob((blob) => {
      if (run !== estimateRun) return;
      qualityValue.textContent = blob
        ? `${pct} · ~${formatBytes(blob.size)}`
        : pct;
      out.width = 1;
      out.height = 1;
    }, 'image/jpeg', quality);
  }

  qualityInput.addEventListener('input', () => scheduleEstimate(300));
  formatInput.addEventListener('change', () => scheduleEstimate(0));
  document.querySelector('#exportPreset')?.addEventListener('change', () => scheduleEstimate(150));
  document.querySelector('#exportWidth')?.addEventListener('input', () => scheduleEstimate(350));

  [
    '#rotation', '#zoom', '#padding', '#bgColor', '#blur',
  ].forEach((selector) => {
    document.querySelector(selector)?.addEventListener('input', () => scheduleEstimate(400));
  });

  document.querySelectorAll('[data-rotate], [data-nudge-x], [data-bg], [data-ratio]').forEach((el) => {
    el.addEventListener('click', () => scheduleEstimate(250));
  });

  document.querySelector('#resetRotation')?.addEventListener('click', () => scheduleEstimate(250));
  document.querySelector('#resetAll')?.addEventListener('click', () => scheduleEstimate(250));
  document.querySelector('#previewCanvas')?.addEventListener('pointerup', () => scheduleEstimate(250));
  document.querySelector('#previewCanvas')?.addEventListener('wheel', () => scheduleEstimate(450), { passive: true });

  document.querySelector('#fileInput')?.addEventListener('change', () => scheduleEstimate(700));
  window.addEventListener('paste', () => scheduleEstimate(700));
  document.querySelector('#dropZone')?.addEventListener('drop', () => scheduleEstimate(700));

  scheduleEstimate(500);
})();