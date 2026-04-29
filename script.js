
const inputEl    = document.getElementById('inputText');
const outputEl   = document.getElementById('outputText');
const srcLangEl  = document.getElementById('srcLang');
const tgtLangEl  = document.getElementById('tgtLang');
const translateBtn = document.getElementById('translateBtn');
const btnLabel   = document.getElementById('btnLabel');
const charCountEl = document.getElementById('charCount');
const statusEl   = document.getElementById('status');
const speakBtn   = document.getElementById('speakBtn');
const swapBtn    = document.getElementById('swapBtn');
const clearBtn   = document.getElementById('clearBtn');
const detectedLabel = document.getElementById('detectedLabel');
const copyInputBtn = document.getElementById('copyInputBtn');
const copyOutputBtn = document.getElementById('copyBtn'); // This is your existing output copy btn



// Create a reusable copy function
function copyToClipboard(text, btnElement) {
if (!text || text === 'Translation will appear here…') return;

navigator.clipboard.writeText(text).then(() => {
// Visual feedback: Change icon to a checkmark
const originalIcon = btnElement.textContent;
btnElement.textContent = '✓';
btnElement.classList.add('ok');

// Revert back after 1.5 seconds
setTimeout(() => {
    btnElement.textContent = originalIcon;
    btnElement.classList.remove('ok');
}, 1500);
});
}

// Attach listeners to BOTH buttons
copyInputBtn.addEventListener('click', () => {
copyToClipboard(inputEl.value, copyInputBtn);
});

copyOutputBtn.addEventListener('click', () => {
// Use lastTranslation variable which holds the Azure result
copyToClipboard(lastTranslation, copyOutputBtn);
});




// text to speech

speakBtn.addEventListener('click', () => {
if (!lastTranslation) return;

// If already speaking, stop it (toggle)
if (speechSynthesis.speaking) {
speechSynthesis.cancel();
return;
}

const utterance = new SpeechSynthesisUtterance(lastTranslation);

// lanuage set
utterance.lang = tgtLangEl.value; 

utterance.onstart = () => speakBtn.classList.add('done');
utterance.onend = () => speakBtn.classList.remove('done');

speechSynthesis.speak(utterance);
});

// --- 2. Speech-to-Text (The Microphone) ---
const micBtn = document.getElementById('micBtn');
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

if (SpeechRecognition) {
const recognition = new SpeechRecognition();
recognition.continuous = false;
recognition.lang = srcLangEl.value || 'en-US';

micBtn.addEventListener('click', () => {
recognition.start();
micBtn.textContent = '🛑'; // Change icon while listening
showStatus('Listening...', 'ok');
});

recognition.onresult = (event) => {
const transcript = event.results[0][0].transcript;
inputEl.value = transcript;
charCountEl.textContent = transcript.length;

// Automatic trigger
translateBtn.click(); 
};

recognition.onend = () => {
micBtn.textContent = '🎤';
};

recognition.onerror = () => {
showStatus('Speech recognition error', 'err');
micBtn.textContent = '🎤';
};
} else {
micBtn.style.display = 'none'; //hidingn here
}









let lastTranslation = '';
let speaking = false;

// ── Char counter ──
inputEl.addEventListener('input', () => {
charCountEl.textContent = inputEl.value.length;
});

// ── Clear ──
clearBtn.addEventListener('click', () => {
inputEl.value = '';
charCountEl.textContent = '0';
outputEl.textContent = 'Translation will appear here…';
outputEl.className = 'output-area empty';
detectedLabel.style.display = 'none';
statusEl.textContent = '';
lastTranslation = '';
});

// ── Swap ──
swapBtn.addEventListener('click', () => {
const sv = srcLangEl.value, tv = tgtLangEl.value;
if (!sv) return; // can't swap auto-detect
srcLangEl.value = tv;
tgtLangEl.value = sv;
if (lastTranslation) {
    inputEl.value = lastTranslation;
    charCountEl.textContent = lastTranslation.length;
    outputEl.textContent = 'Translation will appear here…';
    outputEl.className = 'output-area empty';
    lastTranslation = '';
}
});


// ── Speak ──
speakBtn.addEventListener('click', () => {
if (!lastTranslation) return;
if (speaking) { speechSynthesis.cancel(); return; }
const langMap = {
    en:'en-US', hi:'hi-IN', pa:'pa-IN', es:'es-ES', fr:'fr-FR',
    de:'de-DE', it:'it-IT', pt:'pt-PT', ru:'ru-RU', 'zh-Hans':'zh-CN',
    'zh-Hant':'zh-TW', ja:'ja-JP', ko:'ko-KR', ar:'ar-SA', tr:'tr-TR',
    nl:'nl-NL', pl:'pl-PL', bn:'bn-IN', ur:'ur-PK', th:'th-TH',
    vi:'vi-VN', sv:'sv-SE', el:'el-GR'
};
const utt = new SpeechSynthesisUtterance(lastTranslation);
utt.lang = langMap[tgtLangEl.value] || 'en-US';
speaking = true;
speakBtn.textContent = '■';
utt.onend = utt.onerror = () => { speaking = false; speakBtn.textContent = '▶'; };
speechSynthesis.speak(utt);
});

// ── Translate ──
translateBtn.addEventListener('click', async () => {
const text = inputEl.value.trim();
if (!text) { showStatus('Please enter some text.', 'err'); return; }
const to   = tgtLangEl.value;
const from = srcLangEl.value || null;

setLoading(true);
outputEl.textContent = '';
outputEl.className = 'output-area';
detectedLabel.style.display = 'none';
statusEl.className = 'status';
statusEl.textContent = '';

try {
    const body = { text, to };
    if (from) body.from = from;

    const res = await fetch('http://localhost:3000/translate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
    });

    if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Server error ${res.status}`);
    }

    const data = await res.json();
    const translation = data.translation;
    const detected    = data.detectedLanguage;

    lastTranslation = translation;
    outputEl.textContent = translation;
    outputEl.className = 'output-area';

    if (detected) {
    detectedLabel.textContent = `Detected: ${detected}`;
    detectedLabel.style.display = 'inline';
    }
    showStatus('Translation complete', 'ok');

} catch (e) {
    outputEl.textContent = 'Translation failed. Check the console for details.';
    outputEl.className = 'output-area empty';
    showStatus(e.message, 'err');
    console.error(e);
}

setLoading(false);
});

function setLoading(on) {
translateBtn.disabled = on;
btnLabel.innerHTML = on
    ? '<div class="spinner"></div>&nbsp;Translating…'
    : 'Translate';
}

function showStatus(msg, type) {
statusEl.textContent = msg;
statusEl.className = `status ${type || ''}`;
}
