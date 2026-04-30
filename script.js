const inputEl    = document.getElementById('inputText');
const outputEl   = document.getElementById('outputText');
const outputText2= document.getElementById('outputText2');
const srcLangEl  = document.getElementById('srcLang');
const tgtLangEl  = document.getElementById('tgtLang');
const tgtLang2El = document.getElementById('tgtLang2');
const translateBtn = document.getElementById('translateBtn');
const btnLabel   = document.getElementById('btnLabel');
const charCountEl = document.getElementById('charCount');
const statusEl   = document.getElementById('status');
const speakBtn   = document.getElementById('speakBtn');
const speakBtn2  = document.getElementById('speakBtn2');
const swapBtn    = document.getElementById('swapBtn');
const clearBtn   = document.getElementById('clearBtn');
const detectedLabel = document.getElementById('detectedLabel');
const copyInputBtn = document.getElementById('copyInputBtn');
const copyOutputBtn = document.getElementById('copyBtn');
const copyBtn2   = document.getElementById('copyBtn2');
const addCompareBtn = document.getElementById('addCompareBtn');
const tgtPanel2  = document.getElementById('tgtPanel2');
const downloadBtn = document.getElementById('downloadBtn');
const downloadBtn2= document.getElementById('downloadBtn2');

const uploadBtn = document.getElementById('uploadBtn');
const imageUpload = document.getElementById('imageUpload');

const cameraBtn = document.getElementById('cameraBtn');
const cameraOverlay = document.getElementById('cameraOverlay');
const closeCameraBtn = document.getElementById('closeCameraBtn');
const cameraVideo = document.getElementById('cameraVideo');
const cameraCanvas = document.getElementById('cameraCanvas');
const cameraOverlayText = document.getElementById('cameraOverlayText');
const captureBtn = document.getElementById('captureBtn');
const captureBtnLabel = document.getElementById('captureBtnLabel');

const historyBtn = document.getElementById('historyBtn');
const historySidebar = document.getElementById('historySidebar');
const closeHistoryBtn = document.getElementById('closeHistoryBtn');
const sidebarOverlay = document.getElementById('sidebarOverlay');
const historyList = document.getElementById('historyList');

// Populate tgtLang2 options from tgtLang
tgtLang2El.innerHTML = tgtLangEl.innerHTML;

// --- History Management ---
let translationHistory = JSON.parse(localStorage.getItem('translationHistory')) || [];

function saveHistory(src, tgt1, text, trans1, tgt2, trans2) {
    const item = { id: Date.now(), src, tgt1, text, trans1, tgt2, trans2 };
    translationHistory.unshift(item);
    if (translationHistory.length > 10) translationHistory.pop();
    localStorage.setItem('translationHistory', JSON.stringify(translationHistory));
}

function getLanguageName(code) {
    if (!code) return 'Auto-detect';
    const option = document.querySelector(`#srcLang option[value="${code}"]`) || 
                   document.querySelector(`#tgtLang option[value="${code}"]`);
    return option ? option.textContent : code;
}

function renderHistory() {
    historyList.innerHTML = '';
    translationHistory.forEach(item => {
        const div = document.createElement('div');
        div.className = 'history-item';
        let langs = `${getLanguageName(item.src)} → ${getLanguageName(item.tgt1)}`;
        if (item.tgt2) langs += ` & ${getLanguageName(item.tgt2)}`;
        
        div.innerHTML = `
            <div class="history-langs">${langs}</div>
            <div class="history-text" title="${item.text.replace(/"/g, '&quot;')}">${item.text}</div>
            <div class="history-translation" title="${item.trans1.replace(/"/g, '&quot;')}">${item.trans1}</div>
        `;
        div.onclick = () => loadHistoryItem(item);
        historyList.appendChild(div);
    });
}

function loadHistoryItem(item) {
    inputEl.value = item.text;
    srcLangEl.value = item.src || '';
    tgtLangEl.value = item.tgt1;
    outputEl.textContent = item.trans1;
    outputEl.className = 'output-area';
    lastTranslation = item.trans1;
    charCountEl.textContent = item.text.length;
    
    if (item.tgt2) {
        tgtLang2El.value = item.tgt2;
        tgtLang2El.classList.remove('hidden');
        tgtPanel2.classList.remove('hidden');
        outputText2.textContent = item.trans2;
        outputText2.className = 'output-area';
        lastTranslation2 = item.trans2;
        compareActive = true;
        addCompareBtn.classList.add('done');
    } else {
        tgtLang2El.classList.add('hidden');
        tgtPanel2.classList.add('hidden');
        compareActive = false;
        lastTranslation2 = '';
        addCompareBtn.classList.remove('done');
    }
    closeHistory();
}

function openHistory() {
    historySidebar.classList.add('active');
    sidebarOverlay.classList.add('active');
    renderHistory();
}
function closeHistory() {
    historySidebar.classList.remove('active');
    sidebarOverlay.classList.remove('active');
}

historyBtn.addEventListener('click', openHistory);
closeHistoryBtn.addEventListener('click', closeHistory);
sidebarOverlay.addEventListener('click', closeHistory);


// --- Smart Copy & Download ---
function downloadTxt(text, filename) {
    if (!text || text === 'Translation will appear here…') return;
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || 'translation.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function copyToClipboard(text, btnElement, appendFooter = false) {
    if (!text || text === 'Translation will appear here…') return;
    
    let finalText = text;
    if (appendFooter) {
        finalText += '\n\n— Translated by Trans[lator]';
    }

    navigator.clipboard.writeText(finalText).then(() => {
        const originalIcon = btnElement.textContent;
        btnElement.textContent = '✓';
        btnElement.classList.add('ok');
        setTimeout(() => {
            btnElement.textContent = originalIcon;
            btnElement.classList.remove('ok');
        }, 1500);
    });
}

copyInputBtn.addEventListener('click', () => copyToClipboard(inputEl.value, copyInputBtn, false));
copyOutputBtn.addEventListener('click', () => copyToClipboard(lastTranslation, copyOutputBtn, true));
copyBtn2.addEventListener('click', () => copyToClipboard(lastTranslation2, copyBtn2, true));

downloadBtn.addEventListener('click', () => downloadTxt(lastTranslation, 'translation_1.txt'));
downloadBtn2.addEventListener('click', () => downloadTxt(lastTranslation2, 'translation_2.txt'));


// --- Speech-to-Text (Microphone) ---
const micBtn = document.getElementById('micBtn');
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

if (SpeechRecognition) {
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.lang = srcLangEl.value || 'en-US';

    micBtn.addEventListener('click', () => {
        recognition.start();
        micBtn.textContent = '🛑';
        showStatus('Listening...', 'ok');
    });

    recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        inputEl.value = transcript;
        charCountEl.textContent = transcript.length;
        translateBtn.click(); 
    };

    recognition.onend = () => { micBtn.textContent = '🎤'; };
    recognition.onerror = () => {
        showStatus('Speech recognition error', 'err');
        micBtn.textContent = '🎤';
    };
} else {
    micBtn.style.display = 'none';
}


// --- Main Translation State ---
let lastTranslation = '';
let lastTranslation2 = '';
let speaking = false;
let compareActive = false;

addCompareBtn.addEventListener('click', () => {
    compareActive = !compareActive;
    if (compareActive) {
        tgtLang2El.classList.remove('hidden');
        tgtPanel2.classList.remove('hidden');
        addCompareBtn.classList.add('done');
    } else {
        tgtLang2El.classList.add('hidden');
        tgtPanel2.classList.add('hidden');
        addCompareBtn.classList.remove('done');
    }
});

inputEl.addEventListener('input', () => {
    charCountEl.textContent = inputEl.value.length;
});

clearBtn.addEventListener('click', () => {
    inputEl.value = '';
    charCountEl.textContent = '0';
    outputEl.textContent = 'Translation will appear here…';
    outputEl.className = 'output-area empty';
    outputText2.textContent = 'Translation will appear here…';
    outputText2.className = 'output-area empty';
    detectedLabel.style.display = 'none';
    statusEl.textContent = '';
    lastTranslation = '';
    lastTranslation2 = '';
});

swapBtn.addEventListener('click', () => {
    const sv = srcLangEl.value, tv = tgtLangEl.value;
    if (!sv) return;
    srcLangEl.value = tv;
    tgtLangEl.value = sv;
    if (lastTranslation) {
        inputEl.value = lastTranslation;
        charCountEl.textContent = lastTranslation.length;
        outputEl.textContent = 'Translation will appear here…';
        outputEl.className = 'output-area empty';
        lastTranslation = '';
        if(compareActive) {
            outputText2.textContent = 'Translation will appear here…';
            outputText2.className = 'output-area empty';
            lastTranslation2 = '';
        }
    }
});

// --- Text-to-Speech ---
const langMapSpeech = {
    en:'en-US', hi:'hi-IN', pa:'pa-IN', es:'es-ES', fr:'fr-FR',
    de:'de-DE', it:'it-IT', pt:'pt-PT', ru:'ru-RU', 'zh-Hans':'zh-CN',
    'zh-Hant':'zh-TW', ja:'ja-JP', ko:'ko-KR', ar:'ar-SA', tr:'tr-TR',
    nl:'nl-NL', pl:'pl-PL', bn:'bn-IN', ur:'ur-PK', th:'th-TH',
    vi:'vi-VN', sv:'sv-SE', el:'el-GR'
};

function doSpeak(text, langCode, btn) {
    if (!text) return;
    if (speaking) { speechSynthesis.cancel(); return; }
    const utt = new SpeechSynthesisUtterance(text);
    utt.lang = langMapSpeech[langCode] || 'en-US';
    speaking = true;
    btn.textContent = '■';
    utt.onend = utt.onerror = () => { speaking = false; btn.textContent = '▶'; };
    speechSynthesis.speak(utt);
}

speakBtn.addEventListener('click', () => doSpeak(lastTranslation, tgtLangEl.value, speakBtn));
speakBtn2.addEventListener('click', () => doSpeak(lastTranslation2, tgtLang2El.value, speakBtn2));


// --- Translate ---
async function fetchTranslation(text, from, to) {
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

    return res.json();
}

async function executeTranslation() {
    const text = inputEl.value.trim();
    if (!text) { showStatus('Please enter some text.', 'err'); return null; }
    const to1 = tgtLangEl.value;
    const to2 = compareActive ? tgtLang2El.value : null;
    const from = srcLangEl.value || null;

    setLoading(true);
    outputEl.textContent = '';
    outputEl.className = 'output-area';
    if (compareActive) {
        outputText2.textContent = '';
        outputText2.className = 'output-area';
    }
    detectedLabel.style.display = 'none';
    statusEl.className = 'status';
    statusEl.textContent = '';

    try {
        const promises = [fetchTranslation(text, from, to1)];
        if (compareActive && to2) {
            promises.push(fetchTranslation(text, from, to2));
        }

        const results = await Promise.all(promises);

        const data1 = results[0];
        lastTranslation = data1.translation;
        outputEl.textContent = lastTranslation;
        outputEl.className = 'output-area';

        let detected = data1.detectedLanguage;

        if (compareActive && results[1]) {
            const data2 = results[1];
            lastTranslation2 = data2.translation;
            outputText2.textContent = lastTranslation2;
            outputText2.className = 'output-area';
            if(!detected) detected = data2.detectedLanguage;
        }

        if (detected) {
            const fullName = getLanguageName(detected);
            detectedLabel.textContent = `Detected: ${fullName}`;
            detectedLabel.style.display = 'inline';
        }

        saveHistory(from, to1, text, lastTranslation, to2, lastTranslation2);

        showStatus('Translation complete', 'ok');
        setLoading(false);
        return results;

    } catch (e) {
        outputEl.textContent = 'Translation failed. Check the console for details.';
        outputEl.className = 'output-area empty';
        if (compareActive) {
            outputText2.textContent = 'Translation failed.';
            outputText2.className = 'output-area empty';
        }
        showStatus(e.message, 'err');
        console.error(e);
        setLoading(false);
        throw e;
    }
}

translateBtn.addEventListener('click', () => {
    executeTranslation().catch(() => {});
});

// --- Camera OCR Logic ---
let videoStream = null;

cameraBtn.addEventListener('click', async () => {
    try {
        videoStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
        cameraVideo.srcObject = videoStream;
        cameraOverlay.classList.remove('hidden');
        cameraOverlayText.classList.add('hidden');
        cameraOverlayText.textContent = '';
        captureBtn.disabled = false;
        captureBtnLabel.innerHTML = 'Capture & Translate';
    } catch (err) {
        showStatus('Camera access denied or unavailable', 'err');
        console.error(err);
    }
});

function stopCamera() {
    if (videoStream) {
        videoStream.getTracks().forEach(track => track.stop());
        videoStream = null;
    }
    cameraOverlay.classList.add('hidden');
}

closeCameraBtn.addEventListener('click', stopCamera);

captureBtn.addEventListener('click', async () => {
    const width = cameraVideo.videoWidth;
    const height = cameraVideo.videoHeight;
    if (!width || !height) return;

    cameraCanvas.width = width;
    cameraCanvas.height = height;
    const ctx = cameraCanvas.getContext('2d');
    ctx.drawImage(cameraVideo, 0, 0, width, height);

    const base64Image = cameraCanvas.toDataURL('image/jpeg', 0.8);

    captureBtn.disabled = true;
    captureBtnLabel.innerHTML = '<div class="spinner" style="border-top-color:#fff"></div>&nbsp;Processing OCR…';
    cameraOverlayText.classList.add('hidden');

    try {
        const res = await fetch('http://localhost:3000/ocr', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ image: base64Image })
        });

        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.error || `OCR server error ${res.status}`);
        }

        const data = await res.json();
        const extractedText = data.text;

        if (!extractedText || !extractedText.trim()) {
            throw new Error("No text found in image.");
        }

        inputEl.value = extractedText;
        charCountEl.textContent = extractedText.length;
        
        captureBtnLabel.innerHTML = '<div class="spinner" style="border-top-color:#fff"></div>&nbsp;Translating…';
        
        const results = await executeTranslation();
        
        if (results && results.length > 0) {
            cameraOverlayText.textContent = results[0].translation;
            if (results[1]) {
                cameraOverlayText.textContent += '\n\n---\n\n' + results[1].translation;
            }
            cameraOverlayText.classList.remove('hidden');
        }

        captureBtnLabel.innerHTML = 'Capture & Translate';
        captureBtn.disabled = false;

    } catch (e) {
        cameraOverlayText.textContent = `Error: ${e.message}`;
        cameraOverlayText.classList.remove('hidden');
        captureBtnLabel.innerHTML = 'Capture & Translate';
        captureBtn.disabled = false;
        console.error(e);
    }
});

// --- Upload Image OCR Logic ---
uploadBtn.addEventListener('click', () => {
    imageUpload.click();
});

imageUpload.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
        const base64Image = event.target.result;
        
        // Show loading state
        const originalIcon = uploadBtn.textContent;
        uploadBtn.innerHTML = '<div class="spinner" style="width:14px;height:14px;border-width:2px;display:inline-block"></div>';
        uploadBtn.disabled = true;
        showStatus('Processing Image OCR...', 'ok');

        try {
            const res = await fetch('http://localhost:3000/ocr', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ image: base64Image })
            });

            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || `OCR server error ${res.status}`);
            }

            const data = await res.json();
            const extractedText = data.text;

            if (!extractedText || !extractedText.trim()) {
                throw new Error("No text found in uploaded image.");
            }

            // Put text in source input
            inputEl.value = extractedText;
            charCountEl.textContent = extractedText.length;
            
            // Automatically trigger translation
            await executeTranslation();

        } catch (error) {
            showStatus(error.message, 'err');
            console.error(error);
        } finally {
            uploadBtn.innerHTML = originalIcon;
            uploadBtn.disabled = false;
            // Reset input so the same file can be uploaded again if needed
            imageUpload.value = '';
        }
    };
    reader.readAsDataURL(file);
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
