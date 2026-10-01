// Square Image Studio v0.3.0 — logo / graphic overlay
(() => {
  const input = document.getElementById('overlayInput');
  const removeBtn = document.getElementById('overlayRemove');
  const controls = document.getElementById('overlayControls');
  const scale = document.getElementById('overlayScale');
  const scaleValue = document.getElementById('overlayScaleValue');
  const margin = document.getElementById('overlayMargin');
  const marginValue = document.getElementById('overlayMarginValue');
  const opacity = document.getElementById('overlayOpacity');
  const opacityValue = document.getElementById('overlayOpacityValue');
  const greyscale = document.getElementById('overlayGreyscale');
  const watermark = document.getElementById('overlayWatermark');
  const positions = [...document.querySelectorAll('[data-overlay-position]')];

  const overlay = {
    image: null,
    url: null,
    position: 'bottom-right',
    scale: .18,
    margin: .04,
    opacity: 1,
    greyscale: false,
  };

  function closeOverlay() {
    overlay.image?.close?.();
    if (overlay.url) URL.revokeObjectURL(overlay.url);
    overlay.image = null;
    overlay.url = null;
  }

  async function loadOverlay(file) {
    if (!file || (!file.type.startsWith('image/') && !/\.svg$/i.test(file.name || ''))) return;
    closeOverlay();
    try {
      overlay.image = await createImageBitmap(file);
    } catch {
      overlay.url = URL.createObjectURL(file);
      overlay.image = await new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = overlay.url;
      });
    }
    controls.classList.remove('hidden');
    removeBtn.classList.remove('hidden');
    render();
  }

  function overlayBox(width, height) {
    const img = overlay.image;
    const targetW = width * overlay.scale;
    const targetH = targetW * (img.height / img.width);
    const maxH = height * .8;
    const factor = targetH > maxH ? maxH / targetH : 1;
    return [targetW * factor, targetH * factor];
  }

  function overlayXY(width, height, w, h) {
    const mx = width * overlay.margin;
    const my = height * overlay.margin;
    const x = {
      left: mx,
      center: (width - w) / 2,
      right: width - w - mx,
    };
    const y = {
      top: my,
      center: (height - h) / 2,
      bottom: height - h - my,
    };
    const map = {
      'top-left': [x.left, y.top], 'top-center': [x.center, y.top], 'top-right': [x.right, y.top],
      'center-left': [x.left, y.center], 'center': [x.center, y.center], 'center-right': [x.right, y.center],
      'bottom-left': [x.left, y.bottom], 'bottom-center': [x.center, y.bottom], 'bottom-right': [x.right, y.bottom],
    };
    return map[overlay.position] || map['bottom-right'];
  }

  // Overlay is composited after the base image and preview guides.
  const previousRenderTo = renderTo;
  renderTo = function(targetCanvas, includeGuide = false) {
    previousRenderTo(targetCanvas, includeGuide);
    if (!overlay.image) return;
    const c = targetCanvas.getContext('2d');
    const [w, h] = overlayBox(targetCanvas.width, targetCanvas.height);
    const [x, y] = overlayXY(targetCanvas.width, targetCanvas.height, w, h);
    c.save();
    c.globalAlpha = overlay.opacity;
    if (overlay.greyscale) c.filter = 'grayscale(1)';
    c.imageSmoothingEnabled = true;
    c.imageSmoothingQuality = 'high';
    c.drawImage(overlay.image, x, y, w, h);
    c.restore();
  };

  input.addEventListener('change', (e) => loadOverlay(e.target.files[0]));
  removeBtn.addEventListener('click', () => {
    closeOverlay();
    input.value = '';
    controls.classList.add('hidden');
    removeBtn.classList.add('hidden');
    render();
  });

  positions.forEach((button) => button.addEventListener('click', () => {
    positions.forEach((b) => b.classList.remove('active'));
    button.classList.add('active');
    overlay.position = button.dataset.overlayPosition;
    render();
  }));

  scale.addEventListener('input', (e) => {
    overlay.scale = Number(e.target.value) / 100;
    scaleValue.textContent = `${e.target.value}%`;
    render();
  });
  margin.addEventListener('input', (e) => {
    overlay.margin = Number(e.target.value) / 100;
    marginValue.textContent = `${e.target.value}%`;
    render();
  });
  opacity.addEventListener('input', (e) => {
    overlay.opacity = Number(e.target.value) / 100;
    opacityValue.textContent = `${e.target.value}%`;
    render();
  });
  greyscale.addEventListener('change', (e) => {
    overlay.greyscale = e.target.checked;
    render();
  });
  watermark.addEventListener('click', () => {
    overlay.position = 'center';
    overlay.scale = .45;
    overlay.opacity = .22;
    overlay.greyscale = true;
    scale.value = 45;
    scaleValue.textContent = '45%';
    opacity.value = 22;
    opacityValue.textContent = '22%';
    greyscale.checked = true;
    positions.forEach((b) => b.classList.toggle('active', b.dataset.overlayPosition === 'center'));
    render();
  });
})();
