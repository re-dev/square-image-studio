// Concise export filename convention for Square Image Studio v0.2.4
const ratioNames = {
  '1:1': 'square',
  '4:5': 'portrait',
  '16:9': 'landscape',
  '9:16': 'vertical',
};

document.getElementById('downloadBtn').addEventListener('click', (e) => {
  if (!state.image) return;

  // Override the original download handler so filenames include export settings.
  e.preventDefault();
  e.stopImmediatePropagation();

  const width = getExportWidth();
  const [w, h] = dimensionsForWidth(width);
  const out = document.createElement('canvas');
  out.width = w;
  out.height = h;
  renderTo(out, false);

  const format = document.getElementById('format').value;
  const quality = Number(document.getElementById('quality').value) / 100;
  const ext = format === 'image/jpeg' ? 'jpg' : format === 'image/webp' ? 'webp' : 'png';
  const proportion = ratioNames[state.ratio] || state.ratio.replace(':', 'x');
  const normalizedRotation = ((state.rotation % 360) + 360) % 360;
  const isRightAngle = normalizedRotation % 90 === 0;
  const diagonal = isRightAngle ? '' : '_diag';
  const filename = `${state.fileName}_${w}x${h}_${proportion}${diagonal}.${ext}`;

  out.toBlob((blob) => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }, format, quality);
}, true);
