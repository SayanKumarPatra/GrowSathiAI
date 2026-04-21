// ═══════════════════════════════════════════════════════
//  GrowSathi AI — script.js
//  AI-powered marketing tools for local businesses
// ═══════════════════════════════════════════════════════

// ── Config ───────────────────────────────────────────────
const CONFIG = {
  MODEL: 'claude-sonnet-4-20250514',
  MAX_TOKENS: 1000,
  FREE_LIMIT: 5,
  STORAGE_USES: 'growsathi_uses',
  STORAGE_DATE: 'growsathi_date',
  STORAGE_KEY:  'growsathi_api_key',
};

// ── State ────────────────────────────────────────────────
let activeTab = 'caption';
let usesToday  = 0;

// ── Init ─────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initUsageCounter();
  initTabs();
  initNavbar();
  checkApiKey();
});

// ── Navbar scroll effect ─────────────────────────────────
function initNavbar() {
  const nav = document.getElementById('navbar');
  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 30);
  });
}

// ── Mobile menu ──────────────────────────────────────────
document.getElementById('hamburger').addEventListener('click', () => {
  document.getElementById('mobileMenu').classList.toggle('open');
});
function closeMobile() {
  document.getElementById('mobileMenu').classList.remove('open');
}

// ── Tabs ─────────────────────────────────────────────────
function initTabs() {
  document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => switchTab(tab.dataset.tab));
  });
}

function switchTab(tabName) {
  activeTab = tabName;
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.tool-panel').forEach(p => p.classList.remove('active'));
  document.getElementById(`tab-${tabName}`).classList.add('active');
  document.getElementById(`tool-${tabName}`).classList.add('active');
}

function scrollToTool(name) {
  switchTab(name);
  document.getElementById('tools').scrollIntoView({ behavior: 'smooth' });
}

// ── Usage Counter ─────────────────────────────────────────
function initUsageCounter() {
  const today = new Date().toDateString();
  const savedDate = localStorage.getItem(CONFIG.STORAGE_DATE);
  if (savedDate !== today) {
    localStorage.setItem(CONFIG.STORAGE_DATE, today);
    localStorage.setItem(CONFIG.STORAGE_USES, '0');
  }
  usesToday = parseInt(localStorage.getItem(CONFIG.STORAGE_USES) || '0');
}

function incrementUsage() {
  usesToday++;
  localStorage.setItem(CONFIG.STORAGE_USES, String(usesToday));
}

function canGenerate() {
  return usesToday < CONFIG.FREE_LIMIT;
}

// ── API Key Management ────────────────────────────────────
function checkApiKey() {
  const key = localStorage.getItem(CONFIG.STORAGE_KEY);
  if (key) {
    document.getElementById('apiNotice').classList.add('hidden');
  }
}

function showApiModal() { document.getElementById('apiModal').classList.add('open'); }
function hideApiModal()  { document.getElementById('apiModal').classList.remove('open'); }

function closeApiModal(e) {
  if (e.target === document.getElementById('apiModal')) hideApiModal();
}

function saveApiKey() {
  const key = document.getElementById('apiKeyInput').value.trim();
  if (!key.startsWith('sk-ant')) {
    showToast('❌ সঠিক API key দিন (sk-ant- দিয়ে শুরু)', 'error');
    return;
  }
  localStorage.setItem(CONFIG.STORAGE_KEY, key);
  hideApiModal();
  document.getElementById('apiNotice').classList.add('hidden');
  showToast('✅ API Key সফলভাবে save হয়েছে!', 'success');
}

function getApiKey() {
  return localStorage.getItem(CONFIG.STORAGE_KEY) || '';
}

// ── Prompt Builders ───────────────────────────────────────
function buildPrompt(type) {
  if (type === 'caption') {
    const business = document.getElementById('cap-business').value.trim();
    const topic    = document.getElementById('cap-topic').value.trim();
    const lang     = document.getElementById('cap-lang').value;
    const tone     = document.getElementById('cap-tone').value;
    const extra    = document.getElementById('cap-extra').value.trim();

    if (!business || !topic) return null;

    return `You are a social media marketing expert for local businesses in South Asia.

Create a ${tone} Facebook/Instagram post caption for:
- Business: ${business}
- Post about: ${topic}
- Language: ${lang}
- Extra info: ${extra || 'none'}

Requirements:
- Write entirely in ${lang} (use ${lang} script naturally)
- Make it engaging and relatable for local customers
- Include 3-5 relevant emojis
- Add 5-8 relevant hashtags at the end
- Keep it between 80-150 words
- Sound natural, NOT like AI-generated text

Write ONLY the caption. No explanations.`;
  }

  if (type === 'whatsapp') {
    const business  = document.getElementById('wa-business').value.trim();
    const purpose   = document.getElementById('wa-purpose').value;
    const details   = document.getElementById('wa-details').value.trim();
    const lang      = document.getElementById('wa-lang').value;
    const customer  = document.getElementById('wa-customer').value.trim();

    if (!business || !details) return null;

    return `You are a WhatsApp marketing expert for local businesses in South Asia.

Write a professional WhatsApp marketing message for:
- Business: ${business}
- Purpose: ${purpose}
- Details: ${details}
- Language: ${lang}
- Customer name placeholder: ${customer || '{Customer Name}'}

Requirements:
- Write entirely in ${lang}
- Start with a warm greeting using the customer name
- Be conversational and friendly, NOT salesy
- Include relevant emojis (WhatsApp style)
- End with a clear call-to-action
- Keep it short: 60-100 words max
- Include business name signature at end

Write ONLY the WhatsApp message. No explanations.`;
  }

  if (type === 'business') {
    const name     = document.getElementById('biz-name').value.trim();
    const bizType  = document.getElementById('biz-type').value.trim();
    const location = document.getElementById('biz-location').value.trim();
    const years    = document.getElementById('biz-years').value.trim();
    const lang     = document.getElementById('biz-lang').value;
    const special  = document.getElementById('biz-special').value.trim();

    if (!name || !bizType) return null;

    return `You are a local business SEO and marketing expert for South Asia.

Write a professional business description for:
- Business name: ${name}
- Type: ${bizType}
- Location: ${location || 'local area'}
- Years in business: ${years || 'several years'}
- Language: ${lang}
- Specialities: ${special || 'quality service'}

Requirements:
- Write entirely in ${lang}
- Suitable for Google Business Profile & Facebook Page
- Highlight trust, experience, and local connection
- Include a subtle call-to-action
- 80-120 words
- Professional yet warm tone
- SEO-friendly naturally

Write ONLY the business description. No title or labels.`;
  }
}

// ── Main Generate Function ────────────────────────────────
async function generateContent(type) {
  const apiKey = getApiKey();
  if (!apiKey) {
    showApiModal();
    return;
  }

  if (!canGenerate()) {
    showToast(`❌ আজকের ${CONFIG.FREE_LIMIT}টি limit শেষ। কাল আবার try করুন বা Pro নিন!`, 'error');
    return;
  }

  const prompt = buildPrompt(type);
  if (!prompt) {
    showToast('❌ সব * চিহ্নিত field পূরণ করুন', 'error');
    return;
  }

  const resultEl = document.getElementById(`result-${type}`);
  const btn = document.querySelector(`#tool-${type} .btn-generate`);

  // Show loading
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner" style="width:18px;height:18px;border-width:2px;display:inline-block;"></span> Generating...';
  resultEl.innerHTML = `
    <div class="loading-state">
      <div class="spinner"></div>
      <p>AI লিখছে… মাত্র কয়েক সেকেন্ড 🤖</p>
    </div>`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: CONFIG.MODEL,
        max_tokens: CONFIG.MAX_TOKENS,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error?.message || `HTTP ${response.status}`);
    }

    const data = await response.json();
    const text = data.content?.[0]?.text || '';

    // Count usage
    incrementUsage();

    // Show result
    showResult(resultEl, type, text);

  } catch (err) {
    resultEl.innerHTML = `
      <div class="result-placeholder">
        <div class="placeholder-icon">❌</div>
        <p style="color:#f87171;">Error: ${err.message}</p>
        <p style="margin-top:8px;">API Key check করুন অথবা আবার try করুন।</p>
      </div>`;
    showToast('❌ Generate করা সম্ভব হয়নি। API Key ঠিক আছে কি?', 'error');
  } finally {
    btn.disabled = false;
    const icons = { caption: '📸', whatsapp: '💬', business: '🏪' };
    const labels = { caption: 'Caption', whatsapp: 'Message', business: 'Description' };
    btn.innerHTML = `<span class="btn-icon">✨</span> ${labels[type]} Generate করুন`;
  }
}

// ── Render Result ─────────────────────────────────────────
function showResult(container, type, text) {
  const labels = {
    caption:  '📸 CAPTION READY',
    whatsapp: '💬 WHATSAPP MESSAGE READY',
    business: '🏪 DESCRIPTION READY',
  };
  const remaining = CONFIG.FREE_LIMIT - usesToday;

  container.innerHTML = `
    <div class="result-content">
      <div class="result-header">
        <span class="result-label">${labels[type]}</span>
        <span>${remaining} uses বাকি আজকে</span>
      </div>
      <div class="result-text" id="text-${type}">${escapeHtml(text)}</div>
      <div class="result-actions">
        <button class="btn-copy" onclick="copyResult('${type}')">📋 Copy করুন</button>
        <button class="btn-regen" onclick="generateContent('${type}')">🔄 আবার বানান</button>
      </div>
    </div>`;
}

// ── Copy to Clipboard ─────────────────────────────────────
function copyResult(type) {
  const text = document.getElementById(`text-${type}`)?.innerText || '';
  navigator.clipboard.writeText(text).then(() => {
    showToast('✅ Clipboard এ copy হয়ে গেছে!', 'success');
  }).catch(() => {
    // Fallback
    const ta = document.createElement('textarea');
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
    showToast('✅ Copy হয়েছে!', 'success');
  });
}

// ── Toast Notification ────────────────────────────────────
let toastTimer;
function showToast(msg, type = 'success') {
  let toast = document.querySelector('.toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.className = 'toast';
    document.body.appendChild(toast);
  }
  toast.textContent  = msg;
  toast.className    = `toast ${type}`;
  void toast.offsetWidth; // reflow
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 3000);
}

// ── Utility ───────────────────────────────────────────────
function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Expose globals needed by inline handlers
window.generateContent  = generateContent;
window.copyResult       = copyResult;
window.scrollToTool     = scrollToTool;
window.showApiModal     = showApiModal;
window.hideApiModal     = hideApiModal;
window.closeApiModal    = closeApiModal;
window.saveApiKey       = saveApiKey;
window.closeMobile      = closeMobile;
