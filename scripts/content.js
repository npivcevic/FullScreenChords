let buttonEl;
let contentEl;
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

  // Calculate the number of lines that fit in the available screen height
  const availableHeight = window.innerHeight - 20 // Subtract padding/margin
  const maxLinesPerColumn = Math.floor(availableHeight / lineHeight)

  // Split lines into columns
  const columns = []
  for (let i = 0; i < lines.length; i += maxLinesPerColumn) {
    columns.push(lines.slice(i, i + maxLinesPerColumn))
  }

  // Add columns to the div
  columns.forEach(columnLines => {
    const columnDiv = document.createElement('div')
    columnDiv.style.flex = '1'
    columnDiv.style.marginRight = '20px'

    columnLines.forEach(line => {
      const p = document.createElement('p')
      p.style.margin = '0'
      p.style.padding = '0'

      if (line.trim() === '') {
        p.className = 'empty-line'
        p.innerHTML = '&nbsp;' // Non-breaking space for empty lines
      } else {
        p.innerHTML = spanifyChords(line) // Use spanifyChords to style chords
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
  `
  document.head.appendChild(style)
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
  buttonEl.style.backgroundImage = `url(${chrome.runtime.getURL('images/128.png')})`
  buttonEl.style.backgroundSize = 'cover'
  buttonEl.style.backgroundPosition = 'center'
  buttonEl.style.cursor = 'pointer'
  buttonEl.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)'
  buttonEl.style.zIndex = '1000'

  buttonEl.addEventListener('click', () => {
    const targetElement = document.querySelector('section code pre')
    if (!targetElement) {
      alert('Chords not found on this page.')
      return
    }

    chordsContent = targetElement.textContent;

    toggleContent();
  })


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
  contentEl.style.flexWrap = 'wrap'
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
    isContentVisible = false
  } else {
    if (chordsContent) {
      updateContent(chordsContent, currentFontSize, contentEl)
    } else {
      alert('No chords content available.')
    }
    contentEl.style.display = 'flex'
    isContentVisible = true
  }
}
