// Square Image Studio v0.2.3 — descriptive download filenames

function filenameNumber(value) {
  const rounded = Math.round(value);
  return rounded >= 0 ? `+${rounded}` : `${rounded}`;
}

function backgroundFilenameTag() {
  if (state.bgMode === 'transparent') return 'bg-clear';
  if (state.bgMode === 'blur') return `bg-blur${Math.round(state.blur)}`;
  const hex = String(state.bgColor || '#ffffff').replace('#', '').toLowerCase();
  const common = {
    'ffffff': 'white',
    '000000': 'black',
  };
  return `bg-${common[hex] || hex}`;
}

function buildDownloadFilename(width, height, format) {
  const ext = format === 'image/jpeg' ? 'jpg' : format === 'image/webp' ? 'webp' : 'png';
  const ratio = state.ratio.replace(':', 'x');
  const padding = String(Math.round(state.padding * 100)).padStart(2, '0');
  const rotation = filenameNumber(state.rotation);
  const zoom = Math.round(state.zoom * 100);
  const posX = Math.round(state.offsetX);
  const posY = Math.round(state.offsetY);
  const quality = Math.round(Number($('#quality').value));

  const parts = [
    state.fileName,
    ratio,
    `${width}x${height}`,
    `pad${padding}`,
    `rot${rotation}`,
    `zoom${zoom}`,
    `pos${filenameNumber(posX)}x${filenameNumber(posY)}`,
    backgroundFilenameTag(),
  ];

  if (format !== 'image/png') parts.push(`q${quality}`);
  return `${parts.join('-')}.${ext}`;
}

// Override the original download handler at capture phase so only one file is generated.
$('#downloadBtn').addEventListener('click', (event) => {
  if (!state.image) return;
  event.preventDefault();
  event.stopImmediatePropagation();

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
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = buildDownloadFilename(w, h, format);
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }, format, quality);
}, true);
