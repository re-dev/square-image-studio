// Square Image Studio — additional preview controls
(() => {
  const canvas = document.getElementById('previewCanvas');
  const zoom = document.getElementById('zoom');
  const zoomValue = document.getElementById('zoomValue');
  const centreGuide = document.getElementById('centreGuide');

  // Allow mouse-wheel zoom up to 500% instead of the original 300% cap.
  canvas.addEventListener('wheel', (e) => {
    if (!state.image) return;
    e.preventDefault();
    e.stopImmediatePropagation();

    const next = Math.min(5, Math.max(.25, state.zoom * (e.deltaY < 0 ? 1.05 : .95)));
    state.zoom = next;
    const pct = Math.round(next * 100);
    zoom.value = pct;
    zoomValue.textContent = `${pct}%`;
    render();
  }, { passive: false, capture: true });

  // Wrap preview rendering to add horizontal and vertical centre guides.
  const originalRenderTo = renderTo;
  renderTo = function(targetCanvas, includeGuide = false) {
    originalRenderTo(targetCanvas, includeGuide);

    if (!includeGuide || !centreGuide?.checked) return;

    const c = targetCanvas.getContext('2d');
    const width = targetCanvas.width;
    const height = targetCanvas.height;

    c.save();
    c.setLineDash([10, 8]);
    c.lineWidth = Math.max(1, width / 700);
    c.strokeStyle = '#00e5ff';

    c.beginPath();
    c.moveTo(width / 2, 0);
    c.lineTo(width / 2, height);
    c.moveTo(0, height / 2);
    c.lineTo(width, height / 2);
    c.stroke();
    c.restore();
  };

  centreGuide?.addEventListener('change', render);
})();
