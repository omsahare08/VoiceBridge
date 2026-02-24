// VoiceBridge v1.6 – Fixed function order, working Clear All

'use strict';

// ── Language list ──────────────────────────────────────────────────────────────
const LANGUAGES = [
  {code:'af',name:'Afrikaans'},{code:'sq',name:'Albanian'},{code:'ar',name:'Arabic'},
  {code:'hy',name:'Armenian'},{code:'az',name:'Azerbaijani'},{code:'bn',name:'Bengali'},
  {code:'bs',name:'Bosnian'},{code:'bg',name:'Bulgarian'},{code:'ca',name:'Catalan'},
  {code:'zh',name:'Chinese (Simplified)'},{code:'zh-TW',name:'Chinese (Traditional)'},
  {code:'hr',name:'Croatian'},{code:'cs',name:'Czech'},{code:'da',name:'Danish'},
  {code:'nl',name:'Dutch'},{code:'en',name:'English'},{code:'et',name:'Estonian'},
  {code:'fi',name:'Finnish'},{code:'fr',name:'French'},{code:'gl',name:'Galician'},
  {code:'ka',name:'Georgian'},{code:'de',name:'German'},{code:'el',name:'Greek'},
  {code:'gu',name:'Gujarati'},{code:'he',name:'Hebrew'},{code:'hi',name:'Hindi'},
  {code:'hu',name:'Hungarian'},{code:'is',name:'Icelandic'},{code:'id',name:'Indonesian'},
  {code:'ga',name:'Irish'},{code:'it',name:'Italian'},{code:'ja',name:'Japanese'},
  {code:'kn',name:'Kannada'},{code:'kk',name:'Kazakh'},{code:'km',name:'Khmer'},
  {code:'ko',name:'Korean'},{code:'lo',name:'Lao'},{code:'lv',name:'Latvian'},
  {code:'lt',name:'Lithuanian'},{code:'mk',name:'Macedonian'},{code:'ms',name:'Malay'},
  {code:'ml',name:'Malayalam'},{code:'mt',name:'Maltese'},{code:'mr',name:'Marathi'},
  {code:'mn',name:'Mongolian'},{code:'my',name:'Myanmar (Burmese)'},{code:'ne',name:'Nepali'},
  {code:'no',name:'Norwegian'},{code:'fa',name:'Persian'},{code:'pl',name:'Polish'},
  {code:'pt',name:'Portuguese'},{code:'pa',name:'Punjabi'},{code:'ro',name:'Romanian'},
  {code:'ru',name:'Russian'},{code:'sr',name:'Serbian'},{code:'si',name:'Sinhala'},
  {code:'sk',name:'Slovak'},{code:'sl',name:'Slovenian'},{code:'so',name:'Somali'},
  {code:'es',name:'Spanish'},{code:'sw',name:'Swahili'},{code:'sv',name:'Swedish'},
  {code:'tg',name:'Tajik'},{code:'ta',name:'Tamil'},{code:'te',name:'Telugu'},
  {code:'th',name:'Thai'},{code:'tr',name:'Turkish'},{code:'uk',name:'Ukrainian'},
  {code:'ur',name:'Urdu'},{code:'uz',name:'Uzbek'},{code:'vi',name:'Vietnamese'},
  {code:'cy',name:'Welsh'},{code:'yi',name:'Yiddish'},{code:'yo',name:'Yoruba'},
  {code:'zu',name:'Zulu'}
];

// ── State ──────────────────────────────────────────────────────────────────────
let recognition   = null;
let isRecording   = false;
let isSpeaking    = false;
let autoDetect    = true;
let detectedLang  = null;
let finalText     = '';
let translatedTxt = '';
let waveTimer     = null;
let transTimer    = null;
let keepAlive     = null;
let safetyTimeout = null;
let toastTimer    = null;

// ── Safe getElementById shortcut ───────────────────────────────────────────────
const $ = id => document.getElementById(id);

// ══════════════════════════════════════════════════════════════════════════════
// 1. STOP FUNCTIONS  (defined first so Clear All can call them safely)
// ══════════════════════════════════════════════════════════════════════════════

function stopRecord() {
  isRecording = false;
  if (recognition) {
    recognition.onend = null;
    try { recognition.stop(); } catch(_) {}
    recognition = null;
  }
  // Reset record UI safely
  const btn = $('btnRecord');
  if (btn) btn.classList.remove('recording');
  const icon = $('micIcon');
  if (icon) icon.textContent = '🎙️';
  const lbl = $('btnRecordLabel');
  if (lbl) lbl.textContent = 'Record';
  const badge = $('statusBadge');
  if (badge && !isSpeaking) { badge.textContent = 'IDLE'; badge.classList.remove('active'); }
  stopWave();
}

function stopSpeak() {
  clearInterval(keepAlive);
  clearTimeout(safetyTimeout);
  try { if (window.speechSynthesis) speechSynthesis.cancel(); } catch(_) {}
  isSpeaking = false;
  // Reset speak UI safely
  const btn = $('btnSpeak');
  if (btn) btn.classList.remove('speaking');
  const icon = $('speakIcon');
  if (icon) icon.textContent = '🔊';
  const lbl = $('btnSpeakLabel');
  if (lbl) lbl.textContent = 'Speak';
  const badge = $('statusBadge');
  if (badge && !isRecording) { badge.textContent = 'IDLE'; badge.classList.remove('active'); }
}

function stopWave() {
  clearInterval(waveTimer);
  const bars = document.querySelectorAll('.wave-bar');
  bars.forEach(b => { b.classList.remove('active'); b.style.height = '6px'; });
}

// ══════════════════════════════════════════════════════════════════════════════
// 2. CLEAR ALL  (defined after stop functions)
// ══════════════════════════════════════════════════════════════════════════════

function doClearAll() {
  // Stop everything first
  stopRecord();
  stopSpeak();
  clearTimeout(transTimer);

  // Reset state
  finalText     = '';
  translatedTxt = '';
  detectedLang  = null;

  // Reset input panel
  const inp = $('inputText');
  if (inp) inp.innerHTML = '<span style="color:var(--muted);font-style:italic;font-size:13px">Click Record and start speaking...</span>';

  // Reset output panel
  const out = $('outputText');
  if (out) {
    out.textContent = 'Translation will appear here...';
    out.style.color = 'var(--muted)';
    out.style.fontStyle = 'italic';
    out.style.fontFamily = '"DM Mono", monospace';
    out.style.fontSize = '13px';
  }

  // Reset confidence bar
  const conf = $('confidenceFill');
  if (conf) conf.style.width = '0%';

  // Reset badges and arrows
  const db = $('detectedBadge');
  if (db) db.style.display = 'none';

  const arrow = $('translateArrow');
  if (arrow) arrow.classList.remove('active');

  const vi = $('voiceInfo');
  if (vi) vi.textContent = '';

  // Reset stats
  const wc = $('wordCount');
  if (wc) wc.textContent = '0';
  const cc = $('charCount');
  if (cc) cc.textContent = '0';

  showToast('✓ Cleared!');
}

// ══════════════════════════════════════════════════════════════════════════════
// 3. BOOT – runs after DOM is ready
// ══════════════════════════════════════════════════════════════════════════════

document.addEventListener('DOMContentLoaded', function() {
  buildLangSelects();
  buildWaveform();
  loadPrefs();
  wireEvents();
  setTimeout(updateVoiceInfo, 800);
  requestMic();
});

// ── Build language dropdowns ───────────────────────────────────────────────────
function buildLangSelects() {
  const inSel  = $('inputLang');
  const outSel = $('outputLang');
  LANGUAGES.forEach(l => {
    inSel.add(new Option(l.name, l.code));
    outSel.add(new Option(l.name, l.code));
  });
  inSel.value  = 'en';
  outSel.value = 'mr';
}

// ── Waveform ───────────────────────────────────────────────────────────────────
function buildWaveform() {
  const wf = $('waveform');
  if (!wf) return;
  for (let i = 0; i < 20; i++) {
    const b = document.createElement('div');
    b.className = 'wave-bar';
    b.style.height = '6px';
    b.style.setProperty('--speed', (0.4 + Math.random() * 0.5) + 's');
    b.style.animationDelay = (i * 0.05) + 's';
    wf.appendChild(b);
  }
}

// ── Preferences ───────────────────────────────────────────────────────────────
function loadPrefs() {
  try {
    const p = JSON.parse(localStorage.getItem('vb_prefs') || '{}');
    if (p.outLang) $('outputLang').value = p.outLang;
    if (p.inLang)  $('inputLang').value  = p.inLang;
    if (p.auto === false) {
      autoDetect = false;
      $('autoToggle').classList.remove('on');
      $('inputLang').style.display = 'block';
    }
  } catch(_) {}
}

function savePrefs() {
  try {
    localStorage.setItem('vb_prefs', JSON.stringify({
      outLang: $('outputLang').value,
      inLang:  $('inputLang').value,
      auto:    autoDetect
    }));
  } catch(_) {}
}

// ── Wire events ────────────────────────────────────────────────────────────────
function wireEvents() {
  $('btnRecord').addEventListener('click', toggleRecord);
  $('btnSpeak').addEventListener('click', toggleSpeak);

  // Clear All – attach every possible way
  const cb = $('btnClear');
  cb.addEventListener('click', doClearAll);
  cb.addEventListener('touchend', doClearAll);

  $('copyInput').addEventListener('click',  () => copyText(finalText,     'Input copied!'));
  $('copyOutput').addEventListener('click', () => copyText(translatedTxt, 'Translation copied!'));

  $('outputLang').addEventListener('change', () => {
    savePrefs();
    updateVoiceInfo();
    if (finalText) scheduleTranslate(finalText);
  });
  $('inputLang').addEventListener('change', savePrefs);

  $('autoDetectToggle').addEventListener('click', () => {
    autoDetect = !autoDetect;
    $('autoToggle').classList.toggle('on', autoDetect);
    $('inputLang').style.display = autoDetect ? 'none' : 'block';
    if (autoDetect) $('detectedBadge').style.display = 'none';
    savePrefs();
  });
}

// ── Mic permission ─────────────────────────────────────────────────────────────
async function requestMic() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    stream.getTracks().forEach(t => t.stop());
    $('micBanner').style.display = 'none';
  } catch(err) {
    if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
      $('micBanner').style.display = 'block';
      $('btnRecord').disabled = true;
      $('btnRecord').style.opacity = '0.4';
      $('btnRecord').style.cursor = 'not-allowed';
    }
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// 4. RECORDING
// ══════════════════════════════════════════════════════════════════════════════

function toggleRecord() {
  isRecording ? stopRecord() : startRecord();
}

function startRecord() {
  if (!window.SpeechRecognition && !window.webkitSpeechRecognition) {
    showToast('Speech recognition not supported in this browser'); return;
  }
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  recognition = new SR();
  recognition.continuous     = true;
  recognition.interimResults = true;
  recognition.lang           = autoDetect ? '' : $('inputLang').value;

  recognition.onstart = () => {
    isRecording = true;
    $('btnRecord').classList.add('recording');
    $('micIcon').textContent       = '⏹';
    $('btnRecordLabel').textContent = 'Stop';
    $('statusBadge').textContent   = 'LISTENING';
    $('statusBadge').classList.add('active');
    startWave();
  };

  recognition.onresult = ev => {
    let interim = '';
    finalText = '';
    for (let i = 0; i < ev.results.length; i++) {
      if (ev.results[i].isFinal) {
        finalText += ev.results[i][0].transcript;
        $('confidenceFill').style.width = Math.round(ev.results[i][0].confidence * 100) + '%';
      } else {
        interim += ev.results[i][0].transcript;
      }
    }
    if (autoDetect && finalText) detectLang(finalText);
    renderInput(finalText, interim);
    updateStats(finalText);
    if (finalText) scheduleTranslate(finalText);
  };

  recognition.onerror = ev => {
    if (ev.error === 'no-speech') {
      showToast('No speech detected – try again');
    } else if (ev.error === 'not-allowed' || ev.error === 'service-not-allowed') {
      $('micBanner').style.display = 'block';
      showToast('Microphone blocked – see banner above');
    } else {
      showToast('Recognition error: ' + ev.error);
    }
    stopRecord();
  };

  recognition.onend = () => { if (isRecording) recognition.start(); };
  recognition.start();
}

function startWave() {
  const bars = document.querySelectorAll('.wave-bar');
  bars.forEach(b => b.classList.add('active'));
  waveTimer = setInterval(() => {
    bars.forEach(b => { b.style.height = (4 + Math.random() * 28) + 'px'; });
  }, 100);
}

// ══════════════════════════════════════════════════════════════════════════════
// 5. LANGUAGE DETECTION
// ══════════════════════════════════════════════════════════════════════════════

function detectLang(text) {
  const scripts = {
    zh:/[\u4e00-\u9fa5]/, ja:/[\u3040-\u309f\u30a0-\u30ff]/,
    ko:/[\uac00-\ud7af]/, ar:/[\u0600-\u06ff]/,
    hi:/[\u0900-\u097f]/, ru:/[\u0400-\u04ff]/,
    el:/[\u0370-\u03ff]/, he:/[\u0590-\u05ff]/,
    th:/[\u0e00-\u0e7f]/
  };
  for (const [code, rx] of Object.entries(scripts)) {
    if (rx.test(text)) {
      detectedLang = code;
      const name = LANGUAGES.find(l => l.code === code)?.name || code;
      $('detectedBadge').textContent   = name;
      $('detectedBadge').style.display = 'inline';
      return;
    }
  }
  if (!detectedLang) {
    detectedLang = 'en';
    $('detectedBadge').textContent   = 'English';
    $('detectedBadge').style.display = 'inline';
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// 6. TRANSLATION
// ══════════════════════════════════════════════════════════════════════════════

function scheduleTranslate(text) {
  clearTimeout(transTimer);
  transTimer = setTimeout(() => doTranslate(text), 600);
}

async function doTranslate(text) {
  if (!text || !text.trim()) return;
  const tgt = $('outputLang').value;
  const src = autoDetect ? 'auto' : $('inputLang').value;

  $('translateArrow').classList.add('active');
  $('outputText').style.color = 'var(--muted)';
  $('outputText').textContent = 'Translating...';

  const result = await googleTranslate(text, src, tgt) || await myMemory(text, src, tgt);

  if (result) {
    translatedTxt = result;
    $('outputText').textContent    = translatedTxt;
    $('outputText').style.color    = 'var(--text)';
    $('outputText').style.fontStyle = 'normal';
    $('outputText').style.fontSize  = '13px';
    $('outputText').style.fontFamily = '"DM Mono", monospace';
  } else {
    $('outputText').textContent = 'Translation failed – check internet connection';
    $('outputText').style.color = '#ff6680';
    translatedTxt = '';
  }
  $('translateArrow').classList.remove('active');
}

async function googleTranslate(text, src, tgt) {
  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${src}&tl=${tgt}&dt=t&q=${encodeURIComponent(text)}`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const d = await res.json();
    return d?.[0]?.map(c => c[0]).filter(Boolean).join('') || null;
  } catch(_) { return null; }
}

async function myMemory(text, src, tgt) {
  try {
    const pair = src === 'auto' ? `en|${tgt}` : `${src}|${tgt}`;
    const url  = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${pair}`;
    const res  = await fetch(url);
    if (!res.ok) return null;
    const d = await res.json();
    return d?.responseStatus === 200 ? d.responseData?.translatedText : null;
  } catch(_) { return null; }
}

// ── Render input ───────────────────────────────────────────────────────────────
function renderInput(final, interim) {
  const el = $('inputText');
  el.innerHTML = '';
  if (final) {
    const s = document.createElement('span');
    s.textContent = final + ' ';
    s.style.color = 'var(--text)';
    el.appendChild(s);
  }
  if (interim) {
    const s = document.createElement('span');
    s.className   = 'interim';
    s.textContent = interim;
    el.appendChild(s);
  }
  if (!final && !interim) {
    el.innerHTML = '<span style="color:var(--muted);font-style:italic">Speak now… mic is active</span>';
  }
  el.scrollTop = el.scrollHeight;
}

// ══════════════════════════════════════════════════════════════════════════════
// 7. TEXT-TO-SPEECH
// ══════════════════════════════════════════════════════════════════════════════

function toggleSpeak() {
  isSpeaking ? stopSpeak() : startSpeak();
}

function getVoices() {
  return new Promise(resolve => {
    const v = speechSynthesis.getVoices();
    if (v.length) { resolve(v); return; }
    let n = 0;
    const t = setInterval(() => {
      const vv = speechSynthesis.getVoices();
      if (vv.length || ++n > 20) { clearInterval(t); resolve(vv); }
    }, 100);
  });
}

function pickVoice(voices, lang) {
  return voices.find(v => v.lang.toLowerCase() === lang.toLowerCase())
      || voices.find(v => v.lang.toLowerCase().startsWith(lang.toLowerCase()))
      || null;
}

async function startSpeak() {
  if (!translatedTxt || !translatedTxt.trim()) { showToast('No translation to speak yet!'); return; }
  if (!window.speechSynthesis) { showToast('TTS not supported in this browser'); return; }

  speechSynthesis.cancel();
  await new Promise(r => setTimeout(r, 150));

  const lang   = $('outputLang').value;
  const voices = await getVoices();
  const voice  = pickVoice(voices, lang);

  const utt = new SpeechSynthesisUtterance(translatedTxt);
  utt.lang   = lang;
  utt.rate   = 0.85;
  utt.pitch  = 1;
  utt.volume = 1;
  if (voice) utt.voice = voice;

  utt.onstart = () => {
    isSpeaking = true;
    $('btnSpeak').classList.add('speaking');
    $('speakIcon').textContent     = '⏹';
    $('btnSpeakLabel').textContent = 'Stop';
    $('statusBadge').textContent   = 'SPEAKING';
    $('statusBadge').classList.add('active');
    keepAlive = setInterval(() => {
      if (speechSynthesis.paused) speechSynthesis.resume();
    }, 10000);
  };

  utt.onend = () => { clearInterval(keepAlive); clearTimeout(safetyTimeout); isSpeaking = false; setSpeakUI(false); };
  utt.onerror = e => {
    clearInterval(keepAlive); clearTimeout(safetyTimeout); isSpeaking = false; setSpeakUI(false);
    if (e.error !== 'canceled' && e.error !== 'interrupted') showToast('TTS error: ' + e.error);
  };

  speechSynthesis.speak(utt);

  // Safety: retry if TTS never starts within 3s
  safetyTimeout = setTimeout(() => {
    if (!isSpeaking) {
      speechSynthesis.cancel();
      const f = new SpeechSynthesisUtterance(translatedTxt);
      f.lang = lang; f.rate = 0.85;
      f.onend   = () => { isSpeaking = false; setSpeakUI(false); };
      f.onerror = () => { isSpeaking = false; setSpeakUI(false); };
      speechSynthesis.speak(f);
    }
  }, 3000);
}

function setSpeakUI(on) {
  const btn = $('btnSpeak');
  if (btn) btn.classList.toggle('speaking', on);
  const icon = $('speakIcon');
  if (icon) icon.textContent = on ? '⏹' : '🔊';
  const lbl = $('btnSpeakLabel');
  if (lbl) lbl.textContent = on ? 'Stop' : 'Speak';
  const badge = $('statusBadge');
  if (badge && !isRecording) {
    badge.textContent = on ? 'SPEAKING' : 'IDLE';
    badge.classList.toggle('active', on);
  }
}

function updateVoiceInfo() {
  if (!window.speechSynthesis) return;
  const voices = speechSynthesis.getVoices();
  const lang   = $('outputLang')?.value || 'en';
  const voice  = pickVoice(voices, lang);
  const el     = $('voiceInfo');
  if (!el) return;
  if (voice) {
    el.textContent = `Voice: ${voice.name} (${voice.lang})`;
    el.style.color = 'var(--green)';
  } else if (voices.length) {
    el.textContent = 'No native voice for this language';
    el.style.color = '#ffaa44';
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// 8. UTILITIES
// ══════════════════════════════════════════════════════════════════════════════

function updateStats(text) {
  $('wordCount').textContent = text.trim() ? text.trim().split(/\s+/).length : 0;
  $('charCount').textContent = text.length;
}

async function copyText(text, msg) {
  if (!text || !text.trim()) { showToast('Nothing to copy!'); return; }
  try {
    await navigator.clipboard.writeText(text);
  } catch(_) {
    const ta = document.createElement('textarea');
    ta.value = text; document.body.appendChild(ta); ta.select();
    document.execCommand('copy'); ta.remove();
  }
  showToast(msg);
}

function showToast(msg) {
  const t = $('toast');
  if (!t) return;
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 2500);
}

// Pre-load voices
if (window.speechSynthesis) {
  speechSynthesis.getVoices();
  speechSynthesis.onvoiceschanged = updateVoiceInfo;
}
