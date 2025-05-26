let buttonEl;
let contentEl;
let fontControls; // Make fontControls accessible globally
let isContentVisible = false;

let chordsContent = '';
let currentFontSize = 14;

appendContent();
appendStyles()
appendMainButton()

const rgx = {
  chord: /(?<chord>(^|(?<=[\s|()-]))(?<root>C|C#|Db|D|D#|Eb|E|F|F#|Gb|G|G#|Ab|A|A#|Bb|B)(?<variant>m|maj|min|dim|aug|sus|sus2|sus4|7sus|7sus2|7sus4|add9|add11|madd9|madd11|M|m6|m7|min6|min7|min11|maj7|maj9|mmaj7|mmaj9|7|9|11|13|6|2|4|5|°|ø|♭5|#5|b5|#9|b9)?(?:\/(?<bass>C|C#|Db|D|D#|Eb|E|F|F#|Gb|G|G#|Ab|A|A#|Bb|B))?($|(?=[\s|()-*])))/,
  fingering: /((\d|x){4,7})/,
  brackets: /(\[|\])/,
}


function updateContent (textContent, fontSize, contentDiv) {
  contentDiv.innerHTML = '' // Clear previous content

  // Process and style the text content
  const lines = textContent.split('\n').map(line => line.trimEnd())
  while (lines.length > 0 && lines[lines.length - 1].trim() === '') {
    lines.pop()
  }

  const lineHeight = calcLineHeight(fontSize)
  const availableHeight = window.innerHeight - 20 // Subtract padding/margin
  const maxLinesPerColumn = Math.floor(availableHeight / lineHeight)

  // Find the first chord line index
  let firstChordIdx = lines.findIndex(isChordLine)
  if (firstChordIdx === -1) firstChordIdx = 0

  // Split lines into columns
  const columns = []
  let i = 0
  while (i < lines.length) {
    let end = i + maxLinesPerColumn
    if (end >= lines.length) {
      end = lines.length
    } else if (isChordLine(lines[end - 1]) && end < lines.length) {
      end--
    }
    let column = lines.slice(i, end)
    // Skip the first line if it's blank
    if (column.length > 0 && column[0].trim() === '') {
      column = column.slice(1)
      i++
    }
    columns.push(column)
    i = end
  }

  columns.forEach((columnLines, idx) => {
    const columnDiv = document.createElement('div')
    columnDiv.style.flex = 'none'
    columnDiv.style.marginRight = '20px'
    if (idx !== columns.length - 1) {
      columnDiv.style.borderRight = '1px solid #e0e0e0'
    }

    // For the first column, measure width only from first chord line onward
    let maxLineWidth = 0
    if (idx === 0) {
      const measureEl = document.createElement('span')
      measureEl.style.fontFamily = '\'Roboto Mono\', \'Courier New\', monospace'
      measureEl.style.fontSize = fontSize + 'px'
      measureEl.style.visibility = 'hidden'
      measureEl.style.whiteSpace = 'pre'
      document.body.appendChild(measureEl)
      let foundChord = false
      columnLines.forEach((line, lineIdx) => {
        if (!foundChord && isChordLine(line)) foundChord = true
        if (foundChord) {
          measureEl.textContent = line === '' ? ' ' : line
          const width = measureEl.getBoundingClientRect().width
          if (width > maxLineWidth) maxLineWidth = width
        }
      })
      document.body.removeChild(measureEl)
    } else {
      // For other columns, measure all lines
      const measureEl = document.createElement('span')
      measureEl.style.fontFamily = '\'Roboto Mono\', \'Courier New\', monospace'
      measureEl.style.fontSize = fontSize + 'px'
      measureEl.style.visibility = 'hidden'
      measureEl.style.whiteSpace = 'pre'
      document.body.appendChild(measureEl)
      columnLines.forEach(line => {
        measureEl.textContent = line === '' ? ' ' : line
        const width = measureEl.getBoundingClientRect().width
        if (width > maxLineWidth) maxLineWidth = width
      })
      document.body.removeChild(measureEl)
    }
    columnDiv.style.minWidth = Math.ceil(maxLineWidth) + 'px'

    let foundChord = false
    columnLines.forEach((line, lineIdx) => {
      const p = document.createElement('p')
      p.style.margin = '0'
      p.style.padding = '0'
      if (idx === 0 && !foundChord && isChordLine(line)) foundChord = true
      if (idx === 0 && !foundChord) {
        // Description lines: allow wrapping, set maxWidth to column width
        p.style.whiteSpace = 'pre-wrap'
        p.style.fontFamily = 'inherit'
        p.style.wordBreak = 'break-word'
        p.style.overflowWrap = 'break-word'
        p.style.maxWidth = Math.ceil(maxLineWidth) + 'px'
        p.innerHTML = encodeHtml(line)
      } else {
        if (line.trim() === '') {
          p.className = 'empty-line'
          p.innerHTML = '&nbsp;'
        } else {
          p.innerHTML = spanifyChords(line)
        }
      }
      columnDiv.appendChild(p)
    })
    contentDiv.appendChild(columnDiv)
  })
  contentEl.style.display = 'flex'
  contentEl.style.fontSize = currentFontSize + 'px'
}

function encodeHtml (str) {
  const el = document.createElement('div')
  el.textContent = str
  return el.innerHTML
}

function spanifyChords (line) {
  const chordRegexGlobal = new RegExp(rgx.chord.source, 'g')

  line = encodeHtml(line)

  const match = line.match(chordRegexGlobal)
  if (!match) {
    return line
  }
  if (match.length < 2 && !isChordLine(line)) {
    return line
  }

  return line.replaceAll(chordRegexGlobal, '<span class="chord">$&</span>')
}

function isChordLine (line) {
  if (line.trim() === '') {
    return false
  }

  const allowedWithChords = `([\\s|%-*()]|${rgx.fingering.source}|${rgx.brackets.source})`
  const onlyChordsRegex = new RegExp(`^(${allowedWithChords}*${rgx.chord.source}${allowedWithChords}*)+$`)
  return line.match(onlyChordsRegex)
}

function appendStyles () {
  const style = document.createElement('style')
  style.textContent = `
    .chord {
      font-weight: bold;
      color: #007BFF;
      background-color: #f0f8ff;
      padding: 2px 4px;
      border-radius: 3px;
    }
    .empty-line {
      color: transparent; /* Hide empty lines */
    }
    .fullscreen-btn-icon {
      font-size: 28px;
      color: white;
      pointer-events: none;
      display: flex;
      align-items: center;
      justify-content: center;
      align-content: center;
      width: 100%;
      height: 100%;
    }
  `
  document.head.appendChild(style)

  // Add FontAwesome CDN if not already present
  if (!document.getElementById('fa-cdn')) {
    const fa = document.createElement('link')
    fa.id = 'fa-cdn'
    fa.rel = 'stylesheet'
    fa.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css'
    document.head.appendChild(fa)
  }
}

function appendMainButton () {
  buttonEl = document.createElement('button')
  buttonEl.style.position = 'fixed'
  buttonEl.style.bottom = '20px'
  buttonEl.style.right = '20px'
  buttonEl.style.width = '50px'
  buttonEl.style.height = '50px'
  buttonEl.style.borderRadius = '50%'
  buttonEl.style.border = 'none'
  buttonEl.style.backgroundColor = '#007BFF'
  buttonEl.style.cursor = 'pointer'
  buttonEl.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)'
  buttonEl.style.zIndex = '1000'
  buttonEl.style.display = 'flex'
  buttonEl.style.alignItems = 'center'
  buttonEl.style.justifyContent = 'center'

  // Add FontAwesome icon
  const icon = document.createElement('i')
  icon.className = 'fas fa-expand fullscreen-btn-icon'
  buttonEl.appendChild(icon)

  buttonEl.addEventListener('click', () => {
    const targetElement = document.querySelector('section code pre')
    if (!targetElement) {
      alert('Chords not found on this page.')
      return
    }
    chordsContent = chordsContent = targetElement.textContent.replace(/\nX$/, '');;
    toggleContent();
    // Toggle icon
    if (isContentVisible) {
      icon.className = 'fas fa-compress fullscreen-btn-icon'
    } else {
      icon.className = 'fas fa-expand fullscreen-btn-icon'
    }
  })

  // Font size buttons
  fontControls = document.createElement('div')
  fontControls.style.position = 'fixed'
  fontControls.style.bottom = '80px'
  fontControls.style.right = '20px'
  fontControls.style.display = 'flex'
  fontControls.style.flexDirection = 'column'
  fontControls.style.gap = '10px'
  fontControls.style.zIndex = '1001'
  fontControls.style.display = 'none' // Hide by default

  const plusBtn = document.createElement('button')
  plusBtn.textContent = '+'
  plusBtn.style.width = '40px'
  plusBtn.style.height = '40px'
  plusBtn.style.borderRadius = '50%'
  plusBtn.style.border = 'none'
  plusBtn.style.backgroundColor = '#28a745'
  plusBtn.style.color = 'white'
  plusBtn.style.fontSize = '24px'
  plusBtn.style.cursor = 'pointer'
  plusBtn.style.boxShadow = '0 2px 4px rgba(0,0,0,0.08)'

  const minusBtn = document.createElement('button')
  minusBtn.textContent = '-'
  minusBtn.style.width = '40px'
  minusBtn.style.height = '40px'
  minusBtn.style.borderRadius = '50%'
  minusBtn.style.border = 'none'
  minusBtn.style.backgroundColor = '#dc3545'
  minusBtn.style.color = 'white'
  minusBtn.style.fontSize = '24px'
  minusBtn.style.cursor = 'pointer'
  minusBtn.style.boxShadow = '0 2px 4px rgba(0,0,0,0.08)'

  plusBtn.addEventListener('click', () => {
    currentFontSize = Math.min(currentFontSize + 1, 48)
    if (isContentVisible) updateContent(chordsContent, currentFontSize, contentEl)
  })
  minusBtn.addEventListener('click', () => {
    currentFontSize = Math.max(currentFontSize - 1, 8)
    if (isContentVisible) updateContent(chordsContent, currentFontSize, contentEl)
  })

  fontControls.appendChild(plusBtn)
  fontControls.appendChild(minusBtn)
  document.body.appendChild(fontControls)

  document.body.appendChild(buttonEl)
}

function appendContent () {
  contentEl = document.createElement('div')

  // Style the div
  contentEl.style.fontFamily = '\'Roboto Mono\', \'Courier New\', monospace'
  contentEl.style.fontSize = currentFontSize + 'px'
  contentEl.style.lineHeight = '1.3'
  contentEl.style.padding = '10px'
  contentEl.style.backgroundColor = '#f9f9f9'
  contentEl.style.color = 'black'
  contentEl.style.border = '1px solid #ddd'
  contentEl.style.borderRadius = '4px'
  contentEl.style.overflow = 'auto'
  contentEl.style.whiteSpace = 'pre-wrap'
  contentEl.style.display = 'none'
  // contentEl.style.flexWrap = 'wrap'
  contentEl.style.position = 'fixed'
  contentEl.style.top = '0'
  contentEl.style.left = '0'
  contentEl.style.width = '100%'
  contentEl.style.height = '100%'
  contentEl.style.zIndex = '999'
  contentEl.style.overflowY = 'hidden'
  contentEl.style.overflowX = 'auto'

  document.body.appendChild(contentEl)
}

function calcLineHeight (fontSize) {
  // Create a temporary element to measure line height
  const measureEl = document.createElement('span')
  measureEl.style.fontFamily = '\'Roboto Mono\', \'Courier New\', monospace'
  measureEl.style.fontSize = fontSize + 'px'
  measureEl.style.lineHeight = '1.3'
  measureEl.style.visibility = 'hidden'
  measureEl.style.whiteSpace = 'pre'
  measureEl.textContent = 'Sample text'
  document.body.appendChild(measureEl)
  const lineHeight = measureEl.getBoundingClientRect().height
  document.body.removeChild(measureEl)
  return lineHeight
}

function toggleContent() {
  if (isContentVisible) {
    contentEl.style.display = 'none'
    if (fontControls) fontControls.style.display = 'none'
    isContentVisible = false
  } else {
    if (chordsContent) {
      updateContent(chordsContent, currentFontSize, contentEl)
    } else {
      alert('No chords content available.')
    }
    contentEl.style.display = 'flex'
    if (fontControls) fontControls.style.display = 'flex'
    isContentVisible = true
  }
  // Toggle icon if buttonEl exists
  if (buttonEl && buttonEl.firstChild) {
    buttonEl.firstChild.className = isContentVisible
      ? 'fas fa-compress fullscreen-btn-icon'
      : 'fas fa-expand fullscreen-btn-icon'
  }
}
