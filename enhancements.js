// Square Image Studio — additional preview controls
(() => {
  const canvas = document.getElementById('previewCanvas');
  const zoom = document.getElementById('zoom');
  const zoomValue = document.getElementById('zoomValue');
  const centreGuide = document.getElementById('centreGuide');
  const fitButton = document.getElementById('zoomFit');
  const fillButton = document.getElementById('zoomFill');

  function setZoom(next) {
    const clamped = Math.min(5, Math.max(.25, next));
    state.zoom = clamped;
    const pct = Math.round(clamped * 100);
    zoom.value = pct;
    zoomValue.textContent = `${pct}%`;
    render();
  }

  function currentBaseScale() {
    if (!state.image) return 1;
    return state.autoFit
      ? containScale(state.image, canvas.width, canvas.height, state.padding, state.rotation)
      : containScale(state.image, canvas.width, canvas.height, state.padding, 0);
  }

  // Allow mouse-wheel zoom up to 500% instead of the original 300% cap.
  canvas.addEventListener('wheel', (e) => {
    if (!state.image) return;
    e.preventDefault();
    e.stopImmediatePropagation();
    setZoom(state.zoom * (e.deltaY < 0 ? 1.05 : .95));
  }, { passive: false, capture: true });

  // Fit keeps the complete image inside the current padded working area.
  fitButton?.addEventListener('click', () => {
    if (!state.image) return;
    const desiredScale = containScale(
      state.image,
      canvas.width,
      canvas.height,
      state.padding,
      state.rotation
    );
    const baseScale = currentBaseScale();
    state.offsetX = 0;
    state.offsetY = 0;
    setZoom(desiredScale / baseScale);
  });

  // Fill scales the image so the complete canvas is covered, centred in the frame.
  fillButton?.addEventListener('click', () => {
    if (!state.image) return;

    const width = canvas.width;
    const height = canvas.height;
    const theta = Math.abs(state.rotation) * Math.PI / 180;
    const c = Math.abs(Math.cos(theta));
    const s = Math.abs(Math.sin(theta));

    // Exact scale required for the rotated image rectangle to cover all canvas corners.
    const requiredScale = Math.max(
      (width * c + height * s) / state.image.width,
      (width * s + height * c) / state.image.height
    );

    const baseScale = currentBaseScale();
    state.offsetX = 0;
    state.offsetY = 0;
    setZoom(requiredScale / baseScale);
  });

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
    c.strokeStyle = '#ff00ff';

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
