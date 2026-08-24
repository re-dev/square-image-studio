// Square Image Studio v0.2.2 — Build 24 Aug 2026
const $ = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];

const canvas = $('#previewCanvas');
const ctx = canvas.getContext('2d');
const emptyState = $('#emptyState');
const dropZone = $('#dropZone');

const state = {
  image: null,
  fileName: 'image',
  rotation: 0,
  zoom: 1,
  padding: 0.08,
  offsetX: 0,
  offsetY: 0,
  bgMode: 'solid',
  bgColor: '#ffffff',
  blur: 24,
  ratio: '1:1',
  autoFit: true,
  showGuide: true,
};

const ratios = {
  '1:1': [1, 1],
  '4:5': [4, 5],
  '16:9': [16, 9],
  '9:16': [9, 16],
};

function dimensionsForWidth(width) {
  const [rw, rh] = ratios[state.ratio];
  return [width, Math.round(width * rh / rw)];
}

function setPreviewDimensions() {
  const max = 900;
  const [rw, rh] = ratios[state.ratio];
  if (rw >= rh) {
    canvas.width = max;
    canvas.height = Math.round(max * rh / rw);
  } else {
    canvas.height = max;
    canvas.width = Math.round(max * rw / rh);
  }
  render();
  updateDimensionHint();
}

function containScale(img, width, height, padding, rotation) {
  const availW = Math.max(1, width * (1 - padding * 2));
  const availH = Math.max(1, height * (1 - padding * 2));
  const theta = Math.abs(rotation) * Math.PI / 180;
  const c = Math.abs(Math.cos(theta));
  const s = Math.abs(Math.sin(theta));
  const rotatedW = img.width * c + img.height * s;
  const rotatedH = img.width * s + img.height * c;
  return Math.min(availW / rotatedW, availH / rotatedH);
}

function coverScale(img, width, height) {
  return Math.max(width / img.width, height / img.height);
}

function drawCover(targetCtx, img, width, height, blur) {
  const scale = coverScale(img, width, height);
  const w = img.width * scale;
  const h = img.height * scale;
  targetCtx.save();
  targetCtx.filter = `blur(${blur}px)`;
  targetCtx.drawImage(img, (width - w) / 2, (height - h) / 2, w, h);
  targetCtx.restore();
}

function renderTo(targetCanvas, includeGuide = false) {
  const c = targetCanvas.getContext('2d');
  const width = targetCanvas.width;
  const height = targetCanvas.height;
  c.clearRect(0, 0, width, height);

  if (state.bgMode === 'solid') {
    c.fillStyle = state.bgColor;
    c.fillRect(0, 0, width, height);
  } else if (state.bgMode === 'blur' && state.image) {
    drawCover(c, state.image, width, height, state.blur * (width / canvas.width));
    c.fillStyle = 'rgba(0,0,0,0.03)';
    c.fillRect(0, 0, width, height);
  }

  if (!state.image) return;

  const fit = containScale(state.image, width, height, state.padding, state.rotation);
  const baseScale = state.autoFit ? fit : containScale(state.image, width, height, state.padding, 0);
  const scale = baseScale * state.zoom;
  const normalizedX = state.offsetX / canvas.width;
  const normalizedY = state.offsetY / canvas.height;

  c.save();
  c.translate(width / 2 + normalizedX * width, height / 2 + normalizedY * height);
  c.rotate(state.rotation * Math.PI / 180);
  c.scale(scale, scale);
  c.imageSmoothingEnabled = true;
  c.imageSmoothingQuality = 'high';
  c.drawImage(state.image, -state.image.width / 2, -state.image.height / 2);
  c.restore();

  if (includeGuide && state.showGuide) {
    const px = width * state.padding;
    c.save();
    c.setLineDash([10, 8]);
    c.lineWidth = Math.max(1, width / 700);
    c.strokeStyle = '#00e5ff';
    c.strokeRect(px, px, width - px * 2, height - px * 2);
    c.restore();
  }
}

function render() {
  renderTo(canvas, true);
}

async function loadFile(file) {
  if (!file || !file.type.startsWith('image/')) return;
  try {
    const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
    state.image?.close?.();
    state.image = bitmap;
    state.fileName = (file.name || 'image').replace(/\.[^.]+$/, '') || 'image';
  } catch {
    const url = URL.createObjectURL(file);
    const img = await new Promise((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = reject;
      el.src = url;
    });
    URL.revokeObjectURL(url);
    state.image = img;
  }
  resetTransform();
  emptyState.classList.add('hidden');
  $('#downloadBtn').disabled = false;
  render();
}

function resetTransform() {
  state.rotation = 0;
  state.zoom = 1;
  state.offsetX = 0;
  state.offsetY = 0;
  $('#rotation').value = 0;
  $('#zoom').value = 100;
  $('#rotationValue').textContent = '0°';
  $('#zoomValue').textContent = '100%';
}

$('#fileInput').addEventListener('change', (e) => loadFile(e.target.files[0]));

dropZone.addEventListener('dragover', (e) => { e.preventDefault(); $('#stage').classList.add('dragging'); });
dropZone.addEventListener('dragleave', () => $('#stage').classList.remove('dragging'));
dropZone.addEventListener('drop', (e) => {
  e.preventDefault();
  $('#stage').classList.remove('dragging');
  loadFile(e.dataTransfer.files[0]);
});

window.addEventListener('paste', (e) => {
  const file = [...(e.clipboardData?.files || [])].find((f) => f.type.startsWith('image/'));
  if (file) loadFile(file);
});

$('#rotation').addEventListener('input', (e) => {
  state.rotation = Number(e.target.value);
  $('#rotationValue').textContent = `${state.rotation}°`;
  render();
});
$$('[data-rotate]').forEach((b) => b.addEventListener('click', () => {
  let v = state.rotation + Number(b.dataset.rotate);
  if (v > 180) v -= 360;
  if (v < -180) v += 360;
  state.rotation = v;
  $('#rotation').value = v;
  $('#rotationValue').textContent = `${v}°`;
  render();
}));
$('#resetRotation').addEventListener('click', () => {
  state.rotation = 0;
  $('#rotation').value = 0;
  $('#rotationValue').textContent = '0°';
  render();
});

$('#zoom').addEventListener('input', (e) => {
  state.zoom = Number(e.target.value) / 100;
  $('#zoomValue').textContent = `${e.target.value}%`;
  render();
});

function nudgeImage(dx, dy) {
  if (!state.image) return;
  state.offsetX += dx;
  state.offsetY += dy;
  render();
}

$$('[data-nudge-x]').forEach((button) => button.addEventListener('click', () => {
  nudgeImage(Number(button.dataset.nudgeX), Number(button.dataset.nudgeY));
}));

window.addEventListener('keydown', (e) => {
  if (!state.image || !['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) return;
  const target = e.target;
  if (target.matches?.('input, select, textarea, button') || target.isContentEditable) return;
  e.preventDefault();
  const step = e.shiftKey ? 1 : 10;
  const moves = {
    ArrowUp: [0, -step],
    ArrowDown: [0, step],
    ArrowLeft: [-step, 0],
    ArrowRight: [step, 0],
  };
  nudgeImage(...moves[e.key]);
});
$('#padding').addEventListener('input', (e) => {
  state.padding = Number(e.target.value) / 100;
  $('#paddingValue').textContent = `${e.target.value}%`;
  render();
});
$('#safeGuide').addEventListener('change', (e) => { state.showGuide = e.target.checked; render(); });
$('#autoFit').addEventListener('change', (e) => { state.autoFit = e.target.checked; render(); });
$('#bgColor').addEventListener('input', (e) => { state.bgColor = e.target.value; render(); });
$('#blur').addEventListener('input', (e) => {
  state.blur = Number(e.target.value);
  $('#blurValue').textContent = `${e.target.value}px`;
  render();
});
$$('[data-bg]').forEach((b) => b.addEventListener('click', () => {
  $$('[data-bg]').forEach((x) => x.classList.remove('active'));
  b.classList.add('active');
  state.bgMode = b.dataset.bg;
  $('#blurWrap').classList.toggle('hidden', state.bgMode !== 'blur');
  $('#bgColor').disabled = state.bgMode === 'transparent';
  render();
}));
$$('[data-ratio]').forEach((b) => b.addEventListener('click', () => {
  $$('[data-ratio]').forEach((x) => x.classList.remove('active'));
  b.classList.add('active');
  state.ratio = b.dataset.ratio;
  state.offsetX = 0;
  state.offsetY = 0;
  setPreviewDimensions();
}));

let drag = null;
canvas.addEventListener('pointerdown', (e) => {
  if (!state.image) return;
  canvas.setPointerCapture(e.pointerId);
  drag = { x: e.clientX, y: e.clientY, ox: state.offsetX, oy: state.offsetY };
});
canvas.addEventListener('pointermove', (e) => {
  if (!drag) return;
  const rect = canvas.getBoundingClientRect();
  const sx = canvas.width / rect.width;
  const sy = canvas.height / rect.height;
  state.offsetX = drag.ox + (e.clientX - drag.x) * sx;
  state.offsetY = drag.oy + (e.clientY - drag.y) * sy;
  render();
});
canvas.addEventListener('pointerup', () => drag = null);
canvas.addEventListener('pointercancel', () => drag = null);
canvas.addEventListener('wheel', (e) => {
  if (!state.image) return;
  e.preventDefault();
  const next = Math.min(3, Math.max(.25, state.zoom * (e.deltaY < 0 ? 1.05 : .95)));
  state.zoom = next;
  const pct = Math.round(next * 100);
  $('#zoom').value = pct;
  $('#zoomValue').textContent = `${pct}%`;
  render();
}, { passive: false });

$('#resetAll').addEventListener('click', () => {
  resetTransform();
  state.padding = .08;
  $('#padding').value = 8;
  $('#paddingValue').textContent = '8%';
  render();
});

const formatHelp = {
  'image/png': '<strong>PNG</strong> — Lossless and ideal for graphics, logos, sharp edges and transparent backgrounds. File sizes are usually larger.',
  'image/jpeg': '<strong>JPG</strong> — Best for photographs and product shots when you want smaller files and excellent compatibility. JPG does not support transparency.',
  'image/webp': '<strong>WebP</strong> — A modern web format that delivers excellent image quality at smaller file sizes. Ideal for websites and online publishing.',
};

$('#format').addEventListener('change', (e) => {
  $('#qualityWrap').classList.toggle('hidden', e.target.value === 'image/png');
  $('#formatHelp').innerHTML = formatHelp[e.target.value];
});
$('#quality').addEventListener('input', (e) => $('#qualityValue').textContent = `${e.target.value}%`);
$('#exportPreset').addEventListener('change', (e) => {
  const custom = e.target.value === 'custom';
  $('#customWidthWrap').classList.toggle('hidden', !custom);
  if (!custom) $('#exportWidth').value = e.target.value;
  updateDimensionHint();
});
$('#exportWidth').addEventListener('input', updateDimensionHint);

function getExportWidth() {
  const preset = $('#exportPreset').value;
  const raw = preset === 'custom' ? Number($('#exportWidth').value) : Number(preset);
  return Math.max(100, Math.min(10000, raw || 1600));
}

function updateDimensionHint() {
  const width = getExportWidth();
  const [w, h] = dimensionsForWidth(width);
  $('#dimensionHint').textContent = `${w} × ${h} px`;
}

$('#downloadBtn').addEventListener('click', () => {
  if (!state.image) return;
  const width = getExportWidth();
  const [w, h] = dimensionsForWidth(width);
  const out = document.createElement('canvas');
  out.width = w;
  out.height = h;
  renderTo(out, false);
  const format = $('#format').value;
  const quality = Number($('#quality').value) / 100;
  out.toBlob((blob) => {
    if (!blob) return;
    const ext = format === 'image/jpeg' ? 'jpg' : format === 'image/webp' ? 'webp' : 'png';
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${state.fileName}-${state.ratio.replace(':','x')}.${ext}`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }, format, quality);
});

setPreviewDimensions();
