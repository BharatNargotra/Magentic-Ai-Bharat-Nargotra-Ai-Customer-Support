/**
 * AI Support Platform - Embeddable Chat Widget
 * Usage: <script src="widget.js" data-api-key="sk_live_..." defer></script>
 */
(function () {
  const script = document.currentScript || document.querySelector('script[data-api-key]');
  const API_KEY = script?.getAttribute('data-api-key');
  const API_BASE = script?.getAttribute('data-api-url') || 'https://your-api-domain.com';

  if (!API_KEY) {
    console.warn('[AI Support Widget] No API key provided');
    return;
  }

  // Styles
  const style = document.createElement('style');
  style.textContent = `
    #ai-support-btn {
      position: fixed; bottom: 24px; right: 24px; z-index: 9999;
      width: 56px; height: 56px; border-radius: 50%;
      background: #4f46e5; color: white; border: none;
      cursor: pointer; box-shadow: 0 4px 20px rgba(79,70,229,0.4);
      display: flex; align-items: center; justify-content: center;
      font-size: 24px; transition: transform 0.2s, box-shadow 0.2s;
    }
    #ai-support-btn:hover { transform: scale(1.05); box-shadow: 0 6px 24px rgba(79,70,229,0.5); }
    #ai-support-widget {
      position: fixed; bottom: 92px; right: 24px; z-index: 9998;
      width: 380px; height: 560px; max-height: calc(100vh - 120px);
      background: white; border-radius: 16px;
      box-shadow: 0 8px 40px rgba(0,0,0,0.15);
      display: flex; flex-direction: column; overflow: hidden;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      transition: opacity 0.2s, transform 0.2s;
      transform-origin: bottom right;
    }
    #ai-support-widget.hidden { opacity: 0; transform: scale(0.95); pointer-events: none; }
    .widget-header {
      background: #4f46e5; color: white; padding: 16px;
      display: flex; align-items: center; gap: 10px;
    }
    .widget-avatar {
      width: 36px; height: 36px; background: rgba(255,255,255,0.2);
      border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 18px;
    }
    .widget-title { font-weight: 600; font-size: 15px; }
    .widget-subtitle { font-size: 12px; opacity: 0.8; }
    .widget-close { margin-left: auto; background: none; border: none; color: white; cursor: pointer; font-size: 20px; opacity: 0.8; }
    .widget-close:hover { opacity: 1; }
    .widget-messages {
      flex: 1; overflow-y: auto; padding: 16px; display: flex;
      flex-direction: column; gap: 10px; background: #f8fafc;
    }
    .msg-bubble {
      max-width: 80%; padding: 10px 14px; border-radius: 16px; font-size: 14px; line-height: 1.5;
    }
    .msg-user { background: #4f46e5; color: white; align-self: flex-end; border-radius: 16px 16px 4px 16px; }
    .msg-ai { background: white; color: #1f2937; align-self: flex-start; border-radius: 16px 16px 16px 4px; box-shadow: 0 1px 3px rgba(0,0,0,0.08); }
    .msg-ai ul { padding-left: 16px; margin: 4px 0; }
    .msg-ai p { margin: 0 0 4px; }
    .msg-ai p:last-child { margin: 0; }
    .msg-bubble.loading { color: #6b7280; }
    .typing-dots span {
      display: inline-block; width: 6px; height: 6px; background: #9ca3af;
      border-radius: 50%; margin: 0 2px; animation: typing 1.2s infinite;
    }
    .typing-dots span:nth-child(2) { animation-delay: 0.2s; }
    .typing-dots span:nth-child(3) { animation-delay: 0.4s; }
    @keyframes typing { 0%,60%,100%{transform:translateY(0)} 30%{transform:translateY(-5px)} }
    .suggested-qs { padding: 8px 16px; display: flex; gap: 6px; flex-wrap: wrap; border-bottom: 1px solid #e5e7eb; background: white; }
    .suggested-q {
      font-size: 12px; padding: 5px 10px; border-radius: 16px;
      background: #f3f4f6; border: 1px solid #e5e7eb; cursor: pointer; color: #374151;
      white-space: nowrap; transition: background 0.15s;
    }
    .suggested-q:hover { background: #e0e7ff; border-color: #818cf8; color: #4338ca; }
    .widget-input-area { padding: 12px 16px; border-top: 1px solid #e5e7eb; background: white; display: flex; gap: 8px; }
    .widget-input {
      flex: 1; border: 1px solid #d1d5db; border-radius: 10px; padding: 8px 12px;
      font-size: 14px; outline: none; font-family: inherit; resize: none; max-height: 100px; min-height: 38px;
    }
    .widget-input:focus { border-color: #6366f1; box-shadow: 0 0 0 2px rgba(99,102,241,0.15); }
    .widget-send {
      width: 38px; height: 38px; background: #4f46e5; color: white; border: none;
      border-radius: 10px; cursor: pointer; display: flex; align-items: center; justify-content: center;
      transition: background 0.15s; flex-shrink: 0;
    }
    .widget-send:hover { background: #4338ca; }
    .widget-send:disabled { background: #9ca3af; cursor: not-allowed; }
    .escalation-notice {
      margin: 8px 16px; padding: 10px 12px; background: #fef3c7; border: 1px solid #fcd34d;
      border-radius: 8px; font-size: 12px; color: #92400e;
    }
  `;
  document.head.appendChild(style);

  // State
  let conversationId = null;
  let botConfig = null;
  let isLoading = false;

  // Fetch bot config
  // fetch(`${API_BASE}/api/chat/config?apiKey=${API_KEY}`).then(r => r.json()).then(data => {
  //   botConfig = data;
  //   renderSuggestedQs();
  // }).catch(() => {});
  // Config loaded from admin settings page, so no need to fetch here.

  // Build widget HTML
  const btn = document.createElement('button');
  btn.id = 'ai-support-btn';
  btn.innerHTML = '💬';
  btn.setAttribute('aria-label', 'Open support chat');
  document.body.appendChild(btn);

  const widget = document.createElement('div');
  widget.id = 'ai-support-widget';
  widget.classList.add('hidden');
  widget.innerHTML = `
    <div class="widget-header">
      <div class="widget-avatar">🤖</div>
      <div>
        <div class="widget-title">Support</div>
        <div class="widget-subtitle">We usually reply instantly</div>
      </div>
      <button class="widget-close" id="widget-close-btn">×</button>
    </div>
    <div class="widget-messages" id="widget-messages">
      <div class="msg-bubble msg-ai">Hi! How can I help you today?</div>
    </div>
    <div class="suggested-qs" id="suggested-qs"></div>
    <div class="widget-input-area">
      <textarea class="widget-input" id="widget-input" placeholder="Type a message..." rows="1"></textarea>
      <button class="widget-send" id="widget-send">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M2 21l21-9L2 3v7l15 2-15 2v7z"/>
        </svg>
      </button>
    </div>
  `;
  document.body.appendChild(widget);

  function renderSuggestedQs() {
    const container = document.getElementById('suggested-qs');
    if (!container || !botConfig?.suggestedQs?.length) { if(container) container.style.display = 'none'; return; }
    container.innerHTML = botConfig.suggestedQs.map((q) =>
      `<button class="suggested-q" onclick="window._aiSupportSendMsg(${JSON.stringify(q)})">${q}</button>`
    ).join('');
  }

  function addMessage(content, role) {
    const msgs = document.getElementById('widget-messages');
    const div = document.createElement('div');
    div.className = `msg-bubble msg-${role}`;
    if (role === 'ai') {
      // Basic markdown: bold, lists
      div.innerHTML = content
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/^- (.+)/gm, '<li>$1</li>')
        .replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>')
        .replace(/\n/g, '<br>');
    } else {
      div.textContent = content;
    }
    msgs.appendChild(div);
    msgs.scrollTop = msgs.scrollHeight;
    return div;
  }

  function showTyping() {
    const msgs = document.getElementById('widget-messages');
    const div = document.createElement('div');
    div.className = 'msg-bubble msg-ai loading';
    div.id = 'typing-indicator';
    div.innerHTML = '<div class="typing-dots"><span></span><span></span><span></span></div>';
    msgs.appendChild(div);
    msgs.scrollTop = msgs.scrollHeight;
  }

  function hideTyping() {
    document.getElementById('typing-indicator')?.remove();
  }

  async function sendMessage(text) {
    if (!text.trim() || isLoading) return;
    isLoading = true;
    document.getElementById('widget-send').disabled = true;
    document.getElementById('widget-input').value = '';
    document.getElementById('suggested-qs').style.display = 'none';

    addMessage(text, 'user');
    showTyping();

    try {
      const res = await fetch(`${API_BASE}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-API-Key': API_KEY },
        body: JSON.stringify({ message: text, conversationId }),
      });
      const data = await res.json();
      hideTyping();

      if (data.conversationId) conversationId = data.conversationId;
      addMessage(data.message || 'Sorry, I encountered an error.', 'ai');

      if (data.escalated && !document.getElementById('escalation-notice')) {
        const notice = document.createElement('div');
        notice.id = 'escalation-notice';
        notice.className = 'escalation-notice';
        notice.textContent = '🎫 Your query has been escalated to our team. We\'ll follow up via email shortly.';
        document.getElementById('widget-messages').appendChild(notice);
      }
    } catch {
      hideTyping();
      addMessage('Sorry, something went wrong. Please try again.', 'ai');
    } finally {
      isLoading = false;
      document.getElementById('widget-send').disabled = false;
    }
  }

  window._aiSupportSendMsg = sendMessage;

  // Event listeners
  btn.addEventListener('click', () => {
    widget.classList.toggle('hidden');
    if (!widget.classList.contains('hidden')) {
      document.getElementById('widget-input').focus();
    }
  });

  document.getElementById('widget-close-btn').addEventListener('click', () => {
    widget.classList.add('hidden');
  });

  document.getElementById('widget-send').addEventListener('click', () => {
    sendMessage(document.getElementById('widget-input').value);
  });

  document.getElementById('widget-input').addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(e.target.value);
    }
  });
})();
