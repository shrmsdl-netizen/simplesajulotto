/**
 * ========================================
 * 🍀 사주로또 AI Module v1.1.0
 * ========================================
 * 
 * 한국어 AI 운세/궁합 해석 모듈
 * API: k-mudang.vercel.app (Claude API)
 * 
 * 특허: 10-2026-0010452
 * © 2026 사주로또 Pro. All Rights Reserved.
 */

(function() {
  'use strict';

  // ============================================================
  // CONFIG
  // ============================================================
  const CONFIG = {
    API_BASE: 'https://k-mudang.vercel.app',
    VERSION: '1.1.0',
    ENDPOINTS: {
      fortune: '/api/fortune',
      match: '/api/match',
      test: '/api/test'
    },
    TIERS: {
      free: { 
        model: 'claude-3-haiku', 
        price: 0, 
        priceKRW: '무료',
        desc: '간단한 AI 해석'
      },
      premium: { 
        model: 'claude-sonnet-4', 
        price: 5000, 
        priceKRW: '₩5,000',
        desc: '심층 AI 분석'
      }
    },
    MATCH_PRICE: {
      free: { priceKRW: '무료', desc: '기본 궁합 해석' },
      premium: { priceKRW: '₩7,000', desc: '심층 궁합 분석' }
    }
  };

  // ============================================================
  // STYLES (한국어 UI)
  // ============================================================
  const STYLES = `
    .sjl-ai-modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.85);
      z-index: 10000;
      display: flex;
      align-items: center;
      justify-content: center;
      opacity: 0;
      visibility: hidden;
      transition: all 0.3s ease;
      padding: 20px;
    }
    .sjl-ai-modal-overlay.active {
      opacity: 1;
      visibility: visible;
    }
    .sjl-ai-modal {
      background: linear-gradient(145deg, #1a1a2e 0%, #16213e 100%);
      border: 2px solid #FDD835;
      border-radius: 20px;
      width: 100%;
      max-width: 420px;
      max-height: 85vh;
      overflow-y: auto;
      transform: scale(0.9);
      transition: transform 0.3s ease;
      box-shadow: 0 20px 60px rgba(253, 216, 53, 0.2);
    }
    .sjl-ai-modal-overlay.active .sjl-ai-modal {
      transform: scale(1);
    }
    .sjl-ai-header {
      padding: 25px;
      text-align: center;
      border-bottom: 1px solid rgba(253, 216, 53, 0.2);
      position: relative;
    }
    .sjl-ai-header h2 {
      font-size: 1.5rem;
      font-weight: 900;
      background: linear-gradient(135deg, #FFD700, #FFA500);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      margin: 0;
    }
    .sjl-ai-header p {
      color: #9CA3AF;
      font-size: 0.85rem;
      margin-top: 8px;
    }
    .sjl-ai-close {
      position: absolute;
      top: 15px;
      right: 15px;
      background: rgba(255, 255, 255, 0.1);
      border: none;
      color: #9CA3AF;
      width: 32px;
      height: 32px;
      border-radius: 50%;
      cursor: pointer;
      font-size: 1.2rem;
      transition: all 0.2s;
    }
    .sjl-ai-close:hover {
      background: rgba(255, 255, 255, 0.2);
      color: #fff;
    }
    .sjl-ai-body {
      padding: 25px;
    }
    .sjl-ai-tier-cards {
      display: flex;
      flex-direction: column;
      gap: 15px;
    }
    .sjl-ai-tier-card {
      background: rgba(255, 255, 255, 0.05);
      border: 2px solid rgba(255, 255, 255, 0.1);
      border-radius: 15px;
      padding: 20px;
      cursor: pointer;
      transition: all 0.3s;
      position: relative;
      overflow: hidden;
    }
    .sjl-ai-tier-card:hover {
      border-color: rgba(253, 216, 53, 0.5);
      background: rgba(253, 216, 53, 0.05);
    }
    .sjl-ai-tier-card.premium {
      background: linear-gradient(145deg, rgba(253, 216, 53, 0.1), rgba(255, 165, 0, 0.05));
      border-color: rgba(253, 216, 53, 0.4);
    }
    .sjl-ai-tier-card.premium::before {
      content: '추천';
      position: absolute;
      top: 10px;
      right: -30px;
      background: linear-gradient(135deg, #FFD700, #FFA500);
      color: #1a1a2e;
      font-size: 0.7rem;
      font-weight: 700;
      padding: 3px 35px;
      transform: rotate(45deg);
    }
    .sjl-ai-tier-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 10px;
    }
    .sjl-ai-tier-name {
      font-size: 1.1rem;
      font-weight: 700;
      color: #fff;
    }
    .sjl-ai-tier-price {
      font-size: 1.2rem;
      font-weight: 900;
      color: #FDD835;
    }
    .sjl-ai-tier-desc {
      color: #9CA3AF;
      font-size: 0.85rem;
      line-height: 1.5;
    }
    .sjl-ai-tier-features {
      margin-top: 12px;
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }
    .sjl-ai-tier-feature {
      background: rgba(255, 255, 255, 0.1);
      padding: 4px 10px;
      border-radius: 12px;
      font-size: 0.75rem;
      color: #ccc;
    }
    .sjl-ai-loading {
      text-align: center;
      padding: 40px 20px;
    }
    .sjl-ai-spinner {
      width: 50px;
      height: 50px;
      border: 3px solid rgba(253, 216, 53, 0.2);
      border-top-color: #FDD835;
      border-radius: 50%;
      animation: sjlSpin 1s linear infinite;
      margin: 0 auto 20px;
    }
    @keyframes sjlSpin {
      to { transform: rotate(360deg); }
    }
    .sjl-ai-loading p {
      color: #FDD835;
      font-size: 1rem;
    }
    .sjl-ai-loading small {
      color: #9CA3AF;
      font-size: 0.8rem;
      display: block;
      margin-top: 8px;
    }
    .sjl-ai-result {
      padding: 25px;
    }
    .sjl-ai-result-header {
      text-align: center;
      margin-bottom: 20px;
    }
    .sjl-ai-result-emoji {
      font-size: 3rem;
      margin-bottom: 10px;
    }
    .sjl-ai-result-headline {
      font-size: 1.3rem;
      font-weight: 700;
      color: #FDD835;
      margin: 0;
    }
    .sjl-ai-result-body {
      background: rgba(255, 255, 255, 0.05);
      border-radius: 15px;
      padding: 20px;
      margin-bottom: 20px;
    }
    .sjl-ai-result-body p {
      color: #ddd;
      font-size: 0.95rem;
      line-height: 1.8;
      margin: 0;
    }
    .sjl-ai-result-advice {
      background: linear-gradient(145deg, rgba(253, 216, 53, 0.1), rgba(255, 165, 0, 0.05));
      border: 1px solid rgba(253, 216, 53, 0.3);
      border-radius: 12px;
      padding: 15px;
      text-align: center;
      margin-bottom: 20px;
    }
    .sjl-ai-result-advice-label {
      font-size: 0.75rem;
      color: #9CA3AF;
      margin-bottom: 5px;
    }
    .sjl-ai-result-advice-text {
      font-size: 1rem;
      font-weight: 600;
      color: #FDD835;
    }
    .sjl-ai-lucky-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 10px;
      margin-bottom: 20px;
    }
    .sjl-ai-lucky-item {
      background: rgba(255, 255, 255, 0.05);
      border-radius: 10px;
      padding: 12px;
      text-align: center;
    }
    .sjl-ai-lucky-label {
      font-size: 0.7rem;
      color: #9CA3AF;
      margin-bottom: 5px;
    }
    .sjl-ai-lucky-value {
      font-size: 0.9rem;
      font-weight: 600;
      color: #fff;
    }
    .sjl-ai-result-close {
      width: 100%;
      padding: 15px;
      background: linear-gradient(135deg, #FDD835, #FFA500);
      border: none;
      border-radius: 12px;
      color: #1a1a2e;
      font-size: 1rem;
      font-weight: 700;
      cursor: pointer;
      transition: transform 0.2s;
    }
    .sjl-ai-result-close:hover {
      transform: scale(1.02);
    }
    .sjl-ai-error {
      text-align: center;
      padding: 30px 20px;
    }
    .sjl-ai-error-icon {
      font-size: 3rem;
      margin-bottom: 15px;
    }
    .sjl-ai-error h3 {
      color: #F44336;
      margin-bottom: 10px;
    }
    .sjl-ai-error p {
      color: #9CA3AF;
      font-size: 0.9rem;
      margin-bottom: 20px;
    }
    .sjl-ai-error-btn {
      padding: 12px 30px;
      background: rgba(255, 255, 255, 0.1);
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 8px;
      color: #fff;
      cursor: pointer;
      margin: 0 5px;
    }
    .sjl-ai-btn-inject {
      background: linear-gradient(135deg, #9C27B0, #673AB7) !important;
      color: #fff !important;
      border: none !important;
      padding: 14px 24px !important;
      font-size: 0.95rem !important;
      font-weight: 700 !important;
      border-radius: 12px !important;
      cursor: pointer !important;
      width: 100% !important;
      margin-top: 12px !important;
      transition: all 0.3s !important;
      box-shadow: 0 4px 15px rgba(156, 39, 176, 0.3) !important;
    }
    .sjl-ai-btn-inject:hover {
      transform: translateY(-2px) !important;
      box-shadow: 0 6px 20px rgba(156, 39, 176, 0.4) !important;
    }
    .sjl-ai-btn-match {
      background: linear-gradient(135deg, #E91E63, #C2185B) !important;
    }
    .sjl-ai-btn-match:hover {
      box-shadow: 0 6px 20px rgba(233, 30, 99, 0.4) !important;
    }
    .sjl-ai-match-score {
      text-align: center;
      padding: 25px;
      background: linear-gradient(145deg, rgba(233, 30, 99, 0.1), rgba(156, 39, 176, 0.05));
      border-radius: 15px;
      margin-bottom: 20px;
    }
    .sjl-ai-match-score-value {
      font-size: 3.5rem;
      font-weight: 900;
      background: linear-gradient(135deg, #FFD700, #FF69B4);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
    .sjl-ai-match-score-label {
      font-size: 1rem;
      color: #9CA3AF;
      margin-top: 5px;
    }
    .sjl-ai-match-section {
      background: rgba(255, 255, 255, 0.05);
      border-radius: 12px;
      padding: 15px;
      margin-bottom: 15px;
    }
    .sjl-ai-match-section h4 {
      font-size: 0.9rem;
      color: #FDD835;
      margin-bottom: 10px;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .sjl-ai-match-section p {
      color: #ccc;
      font-size: 0.9rem;
      line-height: 1.7;
      margin: 0;
    }
  `;

  // ============================================================
  // STATE
  // ============================================================
  let state = {
    mode: null, // 'fortune' | 'match'
    tier: null,
    loading: false,
    result: null,
    error: null
  };

  // ============================================================
  // INIT
  // ============================================================
  function init() {
    console.log(`[사주로또 AI] 🚀 모듈 초기화 v${CONFIG.VERSION}...`);
    
    injectStyles();
    createModal();
    observeDOM();
    
    console.log('[사주로또 AI] ✅ 준비 완료. SajulottoAI.test()로 API 테스트 가능');
  }

  function injectStyles() {
    if (document.getElementById('sjl-ai-styles')) return;
    const style = document.createElement('style');
    style.id = 'sjl-ai-styles';
    style.textContent = STYLES;
    document.head.appendChild(style);
  }

  function createModal() {
    if (document.getElementById('sjl-ai-modal-overlay')) return;
    
    const overlay = document.createElement('div');
    overlay.id = 'sjl-ai-modal-overlay';
    overlay.className = 'sjl-ai-modal-overlay';
    overlay.innerHTML = `
      <div class="sjl-ai-modal">
        <div id="sjl-ai-content"></div>
      </div>
    `;
    
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closeModal();
    });
    
    document.body.appendChild(overlay);
  }

  // ============================================================
  // DOM OBSERVER (자동 버튼 주입)
  // ============================================================
  function observeDOM() {
    // 즉시 시도
    injectButtons();
    
    // MutationObserver로 DOM 변화 감지
    const observer = new MutationObserver(() => {
      injectButtons();
    });
    
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  function injectButtons() {
    // 1. 사주 분석 결과 - AI 운세 버튼
    injectFortuneButton();
    
    // 2. 궁합 결과 - AI 궁합 버튼
    injectMatchButton();
  }

  function injectFortuneButton() {
    // #ai-interpretation 영역에 버튼 추가
    const aiSection = document.getElementById('ai-interpretation');
    if (!aiSection) return;
    if (aiSection.querySelector('.sjl-ai-btn-inject')) return;
    
    const btn = document.createElement('button');
    btn.className = 'sjl-ai-btn-inject';
    btn.innerHTML = '🤖 AI 심층 운세 분석 받기';
    btn.onclick = () => openFortune();
    
    // 기존 copySajuForAI 버튼 아래에 추가
    const existingBtn = aiSection.parentElement.querySelector('button[onclick="copySajuForAI()"]');
    if (existingBtn) {
      existingBtn.parentElement.insertBefore(btn, existingBtn.nextSibling);
    } else {
      aiSection.appendChild(btn);
    }
  }

  function injectMatchButton() {
    // #match-result 영역에 버튼 추가
    const matchResult = document.getElementById('match-result');
    if (!matchResult) return;
    if (matchResult.innerHTML.trim() === '') return;
    if (matchResult.querySelector('.sjl-ai-btn-inject')) return;
    
    // copyMatchForAI 버튼이 있는 카드 찾기
    const aiCard = matchResult.querySelector('button[onclick="copyMatchForAI()"]');
    if (!aiCard) return;
    
    const btn = document.createElement('button');
    btn.className = 'sjl-ai-btn-inject sjl-ai-btn-match';
    btn.innerHTML = '💕 AI 심층 궁합 분석 받기';
    btn.onclick = () => openMatch();
    
    aiCard.parentElement.insertBefore(btn, aiCard.nextSibling);
  }

  // ============================================================
  // MODAL CONTROL
  // ============================================================
  function openModal() {
    const overlay = document.getElementById('sjl-ai-modal-overlay');
    if (overlay) {
      overlay.classList.add('active');
      document.body.style.overflow = 'hidden';
    }
  }

  function closeModal() {
    const overlay = document.getElementById('sjl-ai-modal-overlay');
    if (overlay) {
      overlay.classList.remove('active');
      document.body.style.overflow = '';
    }
    state = { mode: null, tier: null, loading: false, result: null, error: null };
  }

  // ============================================================
  // FORTUNE (운세)
  // ============================================================
  function openFortune() {
    if (typeof SAJU === 'undefined' || !SAJU) {
      toast('먼저 사주 분석을 해주세요! 🔮');
      return;
    }
    
    state.mode = 'fortune';
    renderTierSelection();
    openModal();
  }

  async function callFortuneAPI(tier) {
    state.tier = tier;
    state.loading = true;
    renderLoading();
    
    try {
      const payload = {
        year: BIRTH_YEAR,
        month: BIRTH_MONTH,
        day: BIRTH_DAY,
        hour: BIRTH_HOUR || 12,
        tier: tier,
        lang: 'ko'
      };
      
      const response = await fetch(`${CONFIG.API_BASE}${CONFIG.ENDPOINTS.fortune}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'API 응답 오류');
      }
      
      state.result = data;
      state.loading = false;
      renderFortuneResult();
      
    } catch (error) {
      console.error('[사주로또 AI] API 오류:', error);
      state.loading = false;
      state.error = error.message;
      renderError();
    }
  }

  // ============================================================
  // MATCH (궁합)
  // ============================================================
  function openMatch() {
    if (typeof SAJU === 'undefined' || !SAJU) {
      toast('먼저 사주 분석을 해주세요! 🔮');
      return;
    }
    if (typeof MATCH_RESULT === 'undefined' || !MATCH_RESULT) {
      toast('먼저 궁합 분석을 해주세요! 💕');
      return;
    }
    
    state.mode = 'match';
    renderTierSelection();
    openModal();
  }

  async function callMatchAPI(tier) {
    state.tier = tier;
    state.loading = true;
    renderLoading();
    
    try {
      // MATCH_RESULT에서 상대방 정보 추출
      const pSaju = MATCH_RESULT.pSaju;
      const relType = document.getElementById('relationship-type')?.value || 'romance';
      
      const payload = {
        my: {
          year: BIRTH_YEAR,
          month: BIRTH_MONTH,
          day: BIRTH_DAY
        },
        partner: {
          year: parseInt(document.getElementById('partner-year')?.value) || 1990,
          month: parseInt(document.getElementById('partner-month')?.value) || 1,
          day: parseInt(document.getElementById('partner-day')?.value) || 1
        },
        mode: relType,
        tier: tier,
        lang: 'ko'
      };
      
      const response = await fetch(`${CONFIG.API_BASE}${CONFIG.ENDPOINTS.match}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'API 응답 오류');
      }
      
      state.result = data;
      state.loading = false;
      renderMatchResult();
      
    } catch (error) {
      console.error('[사주로또 AI] API 오류:', error);
      state.loading = false;
      state.error = error.message;
      renderError();
    }
  }

  // ============================================================
  // RENDER FUNCTIONS
  // ============================================================
  function renderTierSelection() {
    const content = document.getElementById('sjl-ai-content');
    const isFortune = state.mode === 'fortune';
    const prices = isFortune ? CONFIG.TIERS : CONFIG.MATCH_PRICE;
    
    content.innerHTML = `
      <div class="sjl-ai-header">
        <button class="sjl-ai-close" onclick="SajulottoAI.close()">✕</button>
        <h2>${isFortune ? '🔮 AI 운세 분석' : '💕 AI 궁합 분석'}</h2>
        <p>${isFortune ? 'Claude AI가 당신의 사주를 해석합니다' : 'Claude AI가 두 분의 궁합을 분석합니다'}</p>
      </div>
      <div class="sjl-ai-body">
        <div class="sjl-ai-tier-cards">
          <div class="sjl-ai-tier-card" onclick="SajulottoAI.execute('free')">
            <div class="sjl-ai-tier-header">
              <span class="sjl-ai-tier-name">🆓 무료 체험</span>
              <span class="sjl-ai-tier-price">${prices.free.priceKRW}</span>
            </div>
            <div class="sjl-ai-tier-desc">${prices.free.desc || (isFortune ? CONFIG.TIERS.free.desc : CONFIG.MATCH_PRICE.free.desc)}</div>
            <div class="sjl-ai-tier-features">
              <span class="sjl-ai-tier-feature">⚡ 빠른 응답</span>
              <span class="sjl-ai-tier-feature">📝 기본 해석</span>
            </div>
          </div>
          <div class="sjl-ai-tier-card premium" onclick="SajulottoAI.execute('premium')">
            <div class="sjl-ai-tier-header">
              <span class="sjl-ai-tier-name">👑 프리미엄</span>
              <span class="sjl-ai-tier-price">${isFortune ? CONFIG.TIERS.premium.priceKRW : CONFIG.MATCH_PRICE.premium.priceKRW}</span>
            </div>
            <div class="sjl-ai-tier-desc">${isFortune ? CONFIG.TIERS.premium.desc : CONFIG.MATCH_PRICE.premium.desc}</div>
            <div class="sjl-ai-tier-features">
              <span class="sjl-ai-tier-feature">🧠 Claude Sonnet 4</span>
              <span class="sjl-ai-tier-feature">📊 심층 분석</span>
              <span class="sjl-ai-tier-feature">🎯 맞춤 조언</span>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  function renderLoading() {
    const content = document.getElementById('sjl-ai-content');
    const isFortune = state.mode === 'fortune';
    
    content.innerHTML = `
      <div class="sjl-ai-loading">
        <div class="sjl-ai-spinner"></div>
        <p>${isFortune ? '🔮 AI가 운세를 분석중...' : '💕 AI가 궁합을 분석중...'}</p>
        <small>잠시만 기다려주세요 (약 5-10초)</small>
      </div>
    `;
  }

  function renderFortuneResult() {
    const content = document.getElementById('sjl-ai-content');
    const fortune = state.result.fortune;
    
    content.innerHTML = `
      <div class="sjl-ai-result">
        <div class="sjl-ai-result-header">
          <div class="sjl-ai-result-emoji">${fortune.energy?.emoji || '🔮'}</div>
          <h3 class="sjl-ai-result-headline">${fortune.headline || '오늘의 운세'}</h3>
        </div>
        
        <div class="sjl-ai-result-body">
          <p>${fortune.body || ''}</p>
        </div>
        
        ${fortune.advice ? `
        <div class="sjl-ai-result-advice">
          <div class="sjl-ai-result-advice-label">💡 오늘의 조언</div>
          <div class="sjl-ai-result-advice-text">${fortune.advice}</div>
        </div>
        ` : ''}
        
        ${fortune.lucky ? `
        <div class="sjl-ai-lucky-grid">
          ${fortune.lucky.color ? `
          <div class="sjl-ai-lucky-item">
            <div class="sjl-ai-lucky-label">🎨 행운 색상</div>
            <div class="sjl-ai-lucky-value">${fortune.lucky.color}</div>
          </div>
          ` : ''}
          ${fortune.lucky.direction ? `
          <div class="sjl-ai-lucky-item">
            <div class="sjl-ai-lucky-label">🧭 행운 방향</div>
            <div class="sjl-ai-lucky-value">${fortune.lucky.direction}</div>
          </div>
          ` : ''}
          ${fortune.lucky.time ? `
          <div class="sjl-ai-lucky-item">
            <div class="sjl-ai-lucky-label">⏰ 행운 시간</div>
            <div class="sjl-ai-lucky-value">${fortune.lucky.time}</div>
          </div>
          ` : ''}
        </div>
        ` : ''}
        
        <button class="sjl-ai-result-close" onclick="SajulottoAI.close()">
          닫기
        </button>
      </div>
    `;
  }

  function renderMatchResult() {
    const content = document.getElementById('sjl-ai-content');
    const data = state.result;
    const analysis = data.analysis || {};
    const match = data.match || {};
    
    content.innerHTML = `
      <div class="sjl-ai-result">
        <div class="sjl-ai-match-score">
          <div class="sjl-ai-match-score-value">${match.score || '??'}점</div>
          <div class="sjl-ai-match-score-label">${match.grade || '궁합 점수'}</div>
        </div>
        
        ${analysis.chemistry ? `
        <div class="sjl-ai-match-section">
          <h4>💫 케미스트리</h4>
          <p>${analysis.chemistry}</p>
        </div>
        ` : ''}
        
        ${analysis.strengths ? `
        <div class="sjl-ai-match-section">
          <h4>💪 강점</h4>
          <p>${analysis.strengths}</p>
        </div>
        ` : ''}
        
        ${analysis.cautions ? `
        <div class="sjl-ai-match-section">
          <h4>⚠️ 주의점</h4>
          <p>${analysis.cautions}</p>
        </div>
        ` : ''}
        
        ${analysis.advice ? `
        <div class="sjl-ai-match-section">
          <h4>💡 조언</h4>
          <p>${analysis.advice}</p>
        </div>
        ` : ''}
        
        <button class="sjl-ai-result-close" onclick="SajulottoAI.close()">
          닫기
        </button>
      </div>
    `;
  }

  function renderError() {
    const content = document.getElementById('sjl-ai-content');
    
    content.innerHTML = `
      <div class="sjl-ai-error">
        <div class="sjl-ai-error-icon">😢</div>
        <h3>오류가 발생했습니다</h3>
        <p>${state.error || '잠시 후 다시 시도해주세요.'}</p>
        <button class="sjl-ai-error-btn" onclick="SajulottoAI.retry()">다시 시도</button>
        <button class="sjl-ai-error-btn" onclick="SajulottoAI.close()">닫기</button>
      </div>
    `;
  }

  // ============================================================
  // UTILITIES
  // ============================================================
  function toast(msg) {
    // 기존 사주로또의 toast 함수 사용
    if (typeof window.toast === 'function') {
      window.toast(msg);
    } else {
      alert(msg);
    }
  }

  async function testAPI() {
    try {
      const response = await fetch(`${CONFIG.API_BASE}${CONFIG.ENDPOINTS.test}`);
      const data = await response.json();
      console.log('[사주로또 AI] API 테스트 결과:', data);
      return data;
    } catch (error) {
      console.error('[사주로또 AI] API 테스트 실패:', error);
      return { error: error.message };
    }
  }

  // ============================================================
  // PUBLIC API
  // ============================================================
  window.SajulottoAI = {
    // 모달 열기
    openFortune: openFortune,
    openMatch: openMatch,
    
    // 모달 닫기
    close: closeModal,
    
    // 실행 (tier: 'free' | 'premium')
    execute: function(tier) {
      if (state.mode === 'fortune') {
        callFortuneAPI(tier);
      } else if (state.mode === 'match') {
        callMatchAPI(tier);
      }
    },
    
    // 재시도
    retry: function() {
      if (state.mode && state.tier) {
        this.execute(state.tier);
      } else {
        renderTierSelection();
      }
    },
    
    // API 테스트
    test: testAPI,
    
    // 버전
    version: CONFIG.VERSION
  };

  // ============================================================
  // AUTO INIT
  // ============================================================
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
