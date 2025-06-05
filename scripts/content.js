let buttonEl;
let contentEl;
let fontControls; // Make fontControls accessible globally
let isContentVisible = false;

let chordsContent = '';
let currentFontSize = 14;
let hideButtonEl;

appendContent();
appendStyles();
appendMainButton();
appendHideButton();
addResizeListener();

const rgx = {
  chord: /(?<chord>(^|(?<=[\s|()-]))(?<root>C|C#|Db|D|D#|Eb|E|F|F#|Gb|G|G#|Ab|A|A#|Bb|B)(?<variant>m|maj|min|dim|aug|sus|sus2|sus4|7sus|7sus2|7sus4|add9|add11|madd9|madd11|M|m6|m7|min6|min7|min11|maj7|maj9|mmaj7|mmaj9|7|9|11|13|6|2|4|5|°|ø|♭5|#5|b5|#9|b9)?(?:\/(?<bass>C|C#|Db|D|D#|Eb|E|F|F#|Gb|G|G#|Ab|A|A#|Bb|B))?($|(?=[\s|()-*])))/,
  fingering: /((\d|x){4,7})/,
  brackets: /(\[|\])/,
};

function addFontAwesome() {
  if (!document.getElementById('fa-cdn')) {
    const fa = document.createElement('link');
    fa.id = 'fa-cdn';
    fa.rel = 'stylesheet';
    fa.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css';
    document.head.appendChild(fa);
  }
}

function appendStyles() {
  // Inject content.css
  if (!document.getElementById('fsc-content-css')) {
    const link = document.createElement('link');
    link.id = 'fsc-content-css';
    link.rel = 'stylesheet';
    link.href = chrome.runtime.getURL('scripts/content.css');
    document.head.appendChild(link);
  }
  addFontAwesome();
}

function createButton() {
  const btn = document.createElement('button');
  btn.className = 'fsc-main-btn';
  const icon = document.createElement('i');
  icon.className = 'fas fa-expand fsc-fullscreen-btn-icon';
  btn.appendChild(icon);
  return btn;
}

function createFontControls() {
  const controls = document.createElement('div');
  controls.className = 'fsc-font-controls';
  const plusBtn = document.createElement('button');
  plusBtn.textContent = '+';
  plusBtn.className = 'fsc-font-btn fsc-plus';
  const minusBtn = document.createElement('button');
  minusBtn.textContent = '-';
  minusBtn.className = 'fsc-font-btn fsc-minus';
  controls.appendChild(plusBtn);
  controls.appendChild(minusBtn);
  return { controls, plusBtn, minusBtn };
}

function appendMainButton() {
  buttonEl = createButton();
  const icon = buttonEl.firstChild;
  buttonEl.addEventListener('click', () => {
    const targetElement = document.querySelector('section code pre');
    if (!targetElement) {
      alert('Chords not found on this page.');
      return;
    }
    chordsContent = targetElement.textContent.replace(/\nX$/, '');
    toggleContent();
    icon.className = isContentVisible
      ? 'fas fa-compress fsc-fullscreen-btn-icon'
      : 'fas fa-expand fsc-fullscreen-btn-icon';
  });

  // Font size controls
  const { controls, plusBtn, minusBtn } = createFontControls();
  fontControls = controls;
  plusBtn.addEventListener('click', () => {
    currentFontSize = Math.min(currentFontSize + 0.5, 48);
    if (isContentVisible) updateContent(chordsContent, currentFontSize, contentEl);
  });
  minusBtn.addEventListener('click', () => {
    currentFontSize = Math.max(currentFontSize - 0.5, 8);
    if (isContentVisible) updateContent(chordsContent, currentFontSize, contentEl);
  });
  document.body.appendChild(fontControls);
  document.body.appendChild(buttonEl);
}

function appendContent() {
  contentEl = document.createElement('div');
  contentEl.className = 'fsc-content';
  document.body.appendChild(contentEl);
}

function calcLineHeight(fontSize) {
  const measureEl = document.createElement('span');
  measureEl.style.fontFamily = '\'Roboto Mono\', \'Courier New\', monospace';
  measureEl.style.fontSize = fontSize + 'px';
  measureEl.style.lineHeight = '1.3';
  measureEl.style.visibility = 'hidden';
  measureEl.style.whiteSpace = 'pre';
  measureEl.textContent = 'Sample text';
  document.body.appendChild(measureEl);
  const lineHeight = measureEl.getBoundingClientRect().height;
  document.body.removeChild(measureEl);
  return lineHeight;
}

function toggleContent() {
  if (!contentEl) return;
  if (isContentVisible) {
    contentEl.classList.remove('fsc-visible');
    if (fontControls) fontControls.classList.remove('fsc-visible');
    isContentVisible = false;
  } else {
    if (chordsContent) {
      updateContent(chordsContent, currentFontSize, contentEl);
    } else {
      alert('No chords content available.');
      return;
    }
    contentEl.classList.add('fsc-visible');
    if (fontControls) fontControls.classList.add('fsc-visible');
    isContentVisible = true;
  }
  // Toggle icon if buttonEl exists
  if (buttonEl && buttonEl.firstChild) {
    buttonEl.firstChild.className = isContentVisible
      ? 'fas fa-compress fsc-fullscreen-btn-icon'
      : 'fas fa-expand fsc-fullscreen-btn-icon';
  }
}

function updateContent(textContent, fontSize, contentDiv) {
  contentDiv.innerHTML = '';
  const lines = textContent.split('\n').map(line => line.trimEnd());
  while (lines.length > 0 && lines[lines.length - 1].trim() === '') lines.pop();
  const lineHeight = calcLineHeight(fontSize);
  const availableHeight = window.innerHeight - 20;
  const maxLinesPerColumn = Math.floor(availableHeight / lineHeight);
  let firstChordIdx = lines.findIndex(isChordLine);
  if (firstChordIdx === -1) firstChordIdx = 0;
  const columns = [];
  let i = 0;
  while (i < lines.length) {
    let end = i + maxLinesPerColumn;
    if (end >= lines.length) {
      end = lines.length;
    } else if (isChordLine(lines[end - 1]) && end < lines.length) {
      end--;
    }
    let column = lines.slice(i, end);
    if (column.length > 0 && column[0].trim() === '') {
      column = column.slice(1);
      i++;
    }
    columns.push(column);
    i = end;
  }
  columns.forEach((columnLines, idx) => {
    const columnDiv = document.createElement('div');
    columnDiv.style.flex = 'none';
    columnDiv.style.marginRight = '20px';
    columnDiv.style.paddingRight = '10px';
    if (idx !== columns.length - 1) {
      columnDiv.style.borderRight = '1px solid #e0e0e0';
    }
    let maxLineWidth = 0;
    const measureEl = document.createElement('span');
    measureEl.style.fontFamily = '\'Roboto Mono\', \'Courier New\', monospace';
    measureEl.style.fontSize = fontSize + 'px';
    measureEl.style.visibility = 'hidden';
    measureEl.style.whiteSpace = 'pre';
    document.body.appendChild(measureEl);
    if (idx === 0) {
      let foundChord = false;
      columnLines.forEach((line) => {
        if (!foundChord && isChordLine(line)) foundChord = true;
        if (foundChord) {
          measureEl.textContent = line === '' ? ' ' : line;
          const width = measureEl.getBoundingClientRect().width;
          if (width > maxLineWidth) maxLineWidth = width;
        }
      });
    } else {
      columnLines.forEach(line => {
        measureEl.textContent = line === '' ? ' ' : line;
        const width = measureEl.getBoundingClientRect().width;
        if (width > maxLineWidth) maxLineWidth = width;
      });
    }
    document.body.removeChild(measureEl);
    columnDiv.style.minWidth = Math.ceil(maxLineWidth) + 'px';
    let foundChord = false;
    columnLines.forEach((line) => {
      const p = document.createElement('p');
      p.style.margin = '0';
      p.style.padding = '0';
      if (idx === 0 && !foundChord && isChordLine(line)) foundChord = true;
      if (idx === 0 && !foundChord) {
        p.style.whiteSpace = 'pre-wrap';
        p.style.fontFamily = 'inherit';
        p.style.wordBreak = 'break-word';
        p.style.overflowWrap = 'break-word';
        p.style.maxWidth = Math.ceil(maxLineWidth) + 'px';
        p.innerHTML = spanifyChords(line);
      } else {
        if (line.trim() === '') {
          p.className = 'fsc-empty-line';
          p.innerHTML = '&nbsp;';
        } else {
          p.innerHTML = spanifyChords(line);
        }
      }
      columnDiv.appendChild(p);
    });
    contentDiv.appendChild(columnDiv);
  });
  // initialize p-element selection and hide button visibility
  initializeSelection(contentDiv);
  contentEl.style.fontSize = currentFontSize + 'px';
}

function encodeHtml(str) {
  const el = document.createElement('div');
  el.textContent = str;
  return el.innerHTML;
}

function spanifyChords(line) {
  const chordRegexGlobal = new RegExp(rgx.chord.source, 'g');
  line = encodeHtml(line);
  const sectionHeaderRegex = /\[[^\]]+\]/g;
  line = line.replace(sectionHeaderRegex, match => `<span class="fsc-section-header">${match}</span>`);
  const match = line.match(chordRegexGlobal);
  if (!match) return line;
  if (match.length < 2 && !isChordLine(line)) return line;
  return line.replaceAll(chordRegexGlobal, '<span class="fsc-chord">$&</span>');
}

function isChordLine(line) {
  if (line.trim() === '') {
    return false;
  }
  const allowedWithChords = `([\\s|%-*()]|${rgx.fingering.source}|${rgx.brackets.source})`;
  const onlyChordsRegex = new RegExp(`^(${allowedWithChords}*${rgx.chord.source}${allowedWithChords}*)+$`);
  return line.match(onlyChordsRegex);
}

function addResizeListener() {
  window.addEventListener('resize', () => {
    if (!isContentVisible) return;
    updateContent(chordsContent, currentFontSize, contentEl);
  });
}
// define helper functions for selection and hiding
function handleContentClick(e) {
  // Only handle clicks not on a p element
  if (e.target.tagName.toLowerCase() !== 'p') {
    clearSelection();
  }
}

function handlePClick(event) {
  event.stopPropagation();
  const p = event.currentTarget;
  if (p.classList.contains('fsc-hidden')) return;
  const selected = contentEl.querySelectorAll('p.fsc-selected');
  // If multiple are selected, clear all and select just this one
  if (selected.length > 1) {
    clearSelection();
    p.classList.add('fsc-selected');
    updateHideButton();
    return;
  }
  // If only this one is selected, unselect it
  if (selected.length === 1 && selected[0] === p) {
    p.classList.remove('fsc-selected');
    updateHideButton();
    return;
  }
  // Otherwise, select just this one
  clearSelection();
  p.classList.add('fsc-selected');
  updateHideButton();
}

function updateHideButton() {
  const selected = contentEl.querySelectorAll('p.fsc-selected');
  if (selected.length > 0) {
    hideButtonEl.classList.add('fsc-visible');
    // Position the button next to the first selected element
    const first = selected[0];
    const rect = first.getBoundingClientRect();
    // Place the button to the right of the selected line, vertically centered
    hideButtonEl.style.position = 'fixed';
    hideButtonEl.style.top = `${rect.top + rect.height / 2 - hideButtonEl.offsetHeight / 2}px`;
    hideButtonEl.style.left = `${rect.right + 12}px`;
    hideButtonEl.style.bottom = '';
    hideButtonEl.style.right = '';
    hideButtonEl.style.zIndex = 2000;
  } else {
    hideButtonEl.classList.remove('fsc-visible');
    // Reset to default position (off-screen)
    hideButtonEl.style.top = '';
    hideButtonEl.style.left = '';
    hideButtonEl.style.bottom = '140px';
    hideButtonEl.style.right = '20px';
    hideButtonEl.style.zIndex = '';
  }
}

function clearSelection() {
  contentEl.querySelectorAll('p.fsc-selected').forEach(p => p.classList.remove('fsc-selected'));
  updateHideButton();
}

function initializeSelection(contentDiv) {
  let isDragging = false;
  let dragStart = null;
  let dragEnd = null;
  let mouseMoved = false;
  const ps = Array.from(contentDiv.querySelectorAll('p'));
  ps.forEach(p => {
    p.style.userSelect = 'none';
    p.style.cursor = 'pointer';
    p.removeEventListener('click', handlePClick);
    p.addEventListener('click', handlePClick);
    p.removeEventListener('mousedown', handlePMouseDown);
    p.addEventListener('mousedown', handlePMouseDown);
  });
  contentDiv.removeEventListener('mousemove', handlePMouseMove);
  contentDiv.addEventListener('mousemove', handlePMouseMove);
  document.removeEventListener('mouseup', handlePMouseUp);
  document.addEventListener('mouseup', handlePMouseUp);

  function handlePMouseDown(e) {
    if (e.button !== 0) return;
    if (this.classList.contains('fsc-hidden')) return;
    isDragging = true;
    mouseMoved = false;
    handlePClick._dragging = false;
    dragStart = ps.indexOf(this);
    dragEnd = dragStart;
    // Don't clearSelection here, let click handle single selection
    // Only select on drag
    e.preventDefault();
  }

  function handlePMouseMove(e) {
    if (!isDragging) return;
    mouseMoved = true;
    handlePClick._dragging = true;
    const target = e.target.closest('p');
    if (!target || target.classList.contains('fsc-hidden')) return;
    dragEnd = ps.indexOf(target);
    if (dragStart === -1 || dragEnd === -1) return;
    const [from, to] = [dragStart, dragEnd].sort((a, b) => a - b);
    clearSelection();
    for (let i = from; i <= to; i++) {
      ps[i].classList.add('fsc-selected');
    }
    updateHideButton();
  }

  function handlePMouseUp(e) {
    if (!isDragging) return;
    isDragging = false;
    setTimeout(() => { handlePClick._dragging = false; }, 0);
    dragStart = null;
    dragEnd = null;
    updateHideButton();
  }

  updateHideButton();
}

function appendHideButton() {
  hideButtonEl = document.createElement('button');
  hideButtonEl.textContent = 'Hide';
  hideButtonEl.className = 'fsc-hide-btn';
  hideButtonEl.addEventListener('click', () => {
    // Get all selected <p> elements
    const selectedPs = Array.from(contentEl.querySelectorAll('p.fsc-selected'));
    // Get their text content (trimmed, as in updateContent)
    const selectedLines = selectedPs.map(p => p.textContent.trimEnd());
    // Remove those lines from chordsContent
    let lines = chordsContent.split('\n');
    // Remove all selected lines (may be duplicates, so remove by index)
    // Build a set of indices to remove
    let indicesToRemove = new Set();
    selectedLines.forEach(selLine => {
      lines.forEach((line, idx) => {
        if (!indicesToRemove.has(idx) && line.trimEnd() === selLine) {
          indicesToRemove.add(idx);
        }
      });
    });
    // Remove by index
    chordsContent = lines.filter((_, idx) => !indicesToRemove.has(idx)).join('\n');
    clearSelection();
    updateContent(chordsContent, currentFontSize, contentEl);
  });
  document.body.appendChild(hideButtonEl);
}
