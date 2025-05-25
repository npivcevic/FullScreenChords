const button = document.createElement('button');
button.style.position = 'fixed';
button.style.bottom = '20px';
button.style.right = '20px';
button.style.width = '50px';
button.style.height = '50px';
button.style.borderRadius = '50%';
button.style.border = 'none';
button.style.backgroundColor = '#007BFF';
button.style.backgroundImage = `url(${chrome.runtime.getURL('images/128.png')})`;
button.style.backgroundSize = 'cover';
button.style.backgroundPosition = 'center';
button.style.cursor = 'pointer';
button.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';

const rgx = {
  chord: /(?<chord>(^|(?<=[\s|()-]))(?<root>C|C#|Db|D|D#|Eb|E|F|F#|Gb|G|G#|Ab|A|A#|Bb|B)(?<variant>m|maj|min|dim|aug|sus|sus2|sus4|7sus|7sus2|7sus4|add9|add11|madd9|madd11|M|m6|m7|min6|min7|min11|maj7|maj9|mmaj7|mmaj9|7|9|11|13|6|2|4|5|°|ø|♭5|#5|b5|#9|b9)?(?:\/(?<bass>C|C#|Db|D|D#|Eb|E|F|F#|Gb|G|G#|Ab|A|A#|Bb|B))?($|(?=[\s|()-*])))/,
  fingering: /((\d|x){4,7})/,
  brackets: /(\[|\])/,
};

// Add click event listener
button.addEventListener('click', () => {
  button.addEventListener('click', () => {
    const targetElement = document.querySelector('section code pre');
    if (!targetElement) {
      alert('Chords not found on this page.');
      return;
    }

    const styledDiv = createStyledDiv(targetElement.textContent);
    document.body.appendChild(styledDiv);
  });
});

// Append the button to the body
document.body.appendChild(button);


function createStyledDiv(textContent) {
  // Create a new div element
  const newDiv = document.createElement('div');

  // Style the div
  newDiv.style.fontFamily = "'Roboto Mono', 'Courier New', monospace";
  newDiv.style.fontSize = '16px'; // Default font size
  newDiv.style.lineHeight = '1.3';
  newDiv.style.padding = '10px';
  newDiv.style.backgroundColor = '#f9f9f9';
  newDiv.style.color = 'black';
  newDiv.style.border = '1px solid #ddd';
  newDiv.style.borderRadius = '4px';
  newDiv.style.overflow = 'auto';
  newDiv.style.whiteSpace = 'pre-wrap';

  // Process and style the text content
  const lines = textContent.split('\n').map(line => line.trimEnd());
  while (lines.length > 0 && lines[lines.length - 1].trim() === '') {
    lines.pop();
  }

  // Add lines to the div
  lines.forEach(line => {
    const p = document.createElement('p');
    p.style.margin = '0';
    p.style.padding = '0';

    if (line.trim() === '') {
      p.className = 'empty-line';
      p.innerHTML = '&nbsp;'; // Non-breaking space for empty lines
    } else {
      p.innerHTML = spanifyChords(line); // Use spanifyChords to style chords
    }

    newDiv.appendChild(p);
  });

  // Add custom styles for chords
  const style = document.createElement('style');
  style.textContent = `
        .chord {
            color: #007BFF;
            font-weight: bold;
            background-color: #e6f7ff;
            padding: 2px 4px;
            border-radius: 3px;
        }
    `;
  document.head.appendChild(style);

  newDiv.style.position = 'fixed';
  newDiv.style.top = '0';
  newDiv.style.left = '0';
  newDiv.style.width = '100vw';
  newDiv.style.height = '100vh';
  newDiv.style.zIndex = '29999';
  newDiv.style.backgroundColor = 'white';
  newDiv.style.overflow = 'scroll';

  return newDiv;
}

function encodeHtml(str) {
  const el = document.createElement('div');
  el.textContent = str;
  return el.innerHTML;
}

function spanifyChords(line) {
  const chordRegexGlobal = new RegExp(rgx.chord.source, "g");

  line = encodeHtml(line);

  const match = line.match(chordRegexGlobal);
  if (!match) {
    return line;
  }
  if (match.length < 2 && !isChordLine(line)) {
    return line;
  }

  return line.replaceAll(chordRegexGlobal, '<span class="chord">$&</span>');
}

function isChordLine(line) {
  if (line.trim() === '') {
    return false;
  }

  const allowedWithChords = `([\\s|%-*()]|${rgx.fingering.source}|${rgx.brackets.source})`;
  const onlyChordsRegex = new RegExp(`^(${allowedWithChords}*${rgx.chord.source}${allowedWithChords}*)+$`);
  return line.match(onlyChordsRegex);
}
