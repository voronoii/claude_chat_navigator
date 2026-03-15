class Sidebar {
  constructor() {
    this.shadowHost = null;
    this.shadowRoot = null;
    this.sidebarEl = null;
    this.topicListEl = null;
    this.toggleBtn = null;
    this.isOpen = true;
    this.onTopicClick = null;
    this.onRefreshClick = null;
    this._inject();
  }

  _inject() {
    // Shadow DOM 호스트 생성
    this.shadowHost = document.createElement('div');
    this.shadowHost.id = 'ccn-shadow-host';
    document.body.appendChild(this.shadowHost);
    this.shadowRoot = this.shadowHost.attachShadow({ mode: 'closed' });

    // CSS 로드
    const style = document.createElement('style');
    style.textContent = this._getStyles();
    this.shadowRoot.appendChild(style);

    // 사이드바 HTML
    this.sidebarEl = document.createElement('div');
    this.sidebarEl.className = 'ccn-sidebar';
    this.sidebarEl.innerHTML = `
      <div class="ccn-header">
        <h2>Chat Navigator</h2>
        <button class="ccn-close-btn" title="닫기">&times;</button>
      </div>
      <div class="ccn-topic-list">
        <div class="ccn-empty">대화가 진행되면 주제가<br>자동으로 분류됩니다.</div>
      </div>
    `;
    this.shadowRoot.appendChild(this.sidebarEl);

    this.topicListEl = this.sidebarEl.querySelector('.ccn-topic-list');

    // 닫기 버튼
    this.sidebarEl.querySelector('.ccn-close-btn').addEventListener('click', () => {
      this.toggle();
    });

    // 토글 버튼 (사이드바 외부)
    this.toggleBtn = document.createElement('div');
    this.toggleBtn.className = 'ccn-toggle-btn sidebar-open';
    this.toggleBtn.innerHTML = '&#9776;';
    this.toggleBtn.title = 'Chat Navigator 토글';
    this.toggleBtn.addEventListener('click', () => this.toggle());
    this.shadowRoot.appendChild(this.toggleBtn);
  }

  toggle() {
    this.isOpen = !this.isOpen;
    this.sidebarEl.classList.toggle('collapsed', !this.isOpen);
    this.toggleBtn.classList.toggle('sidebar-open', this.isOpen);
    // claude.ai 본문 영역에 여백 조정
    document.body.style.marginRight = this.isOpen ? '280px' : '0';
  }

  showApiKeyGuide() {
    this.topicListEl.innerHTML = `
      <div class="ccn-empty">
        <div style="font-size:24px;margin-bottom:8px;">&#128273;</div>
        <strong>API Key\uAC00 \uD544\uC694\uD569\uB2C8\uB2E4</strong><br><br>
        \uD655\uC7A5\uD504\uB85C\uADF8\uB7A8 \uC544\uC774\uCF58\uC744 \uD074\uB9AD\uD558\uC5EC<br>
        API \uC81C\uACF5\uC790\uC640 Key\uB97C \uC124\uC815\uD574\uC8FC\uC138\uC694.
      </div>
    `;
  }

  showEmpty(message) {
    this.topicListEl.innerHTML = `
      <div class="ccn-empty">${this._escapeHtml(message)}</div>
    `;
  }

  showLoading() {
    this.topicListEl.innerHTML = `
      <div class="ccn-loading">
        <div class="ccn-spinner"></div>
        <span>주제 분류 중...</span>
      </div>
    `;
  }

  showError(message) {
    this.topicListEl.innerHTML = `
      <div class="ccn-error">
        ${message}
        <button class="ccn-refresh-btn">다시 시도</button>
      </div>
    `;
    const btn = this.topicListEl.querySelector('.ccn-refresh-btn');
    btn.addEventListener('click', () => {
      if (this.onRefreshClick) this.onRefreshClick();
    });
  }

  renderTopics(topics, messages) {
    if (!topics || topics.length === 0) {
      this.topicListEl.innerHTML = `
        <div class="ccn-empty">분류된 주제가 없습니다.</div>
      `;
      return;
    }

    this.topicListEl.innerHTML = '';

    topics.forEach((topic, idx) => {
      const item = document.createElement('div');
      item.className = 'ccn-topic-item';
      item.dataset.topicIndex = idx;
      item.dataset.startIndex = topic.startIndex;
      item.dataset.endIndex = topic.endIndex;

      const msgCount = topic.endIndex - topic.startIndex + 1;

      item.innerHTML = `
        <div class="ccn-topic-pin"></div>
        <div class="ccn-topic-info">
          <div class="ccn-topic-title">${this._escapeHtml(topic.title)}</div>
          <div class="ccn-topic-meta">${msgCount}개 메시지</div>
        </div>
      `;

      item.addEventListener('click', () => {
        if (this.onTopicClick) {
          this.onTopicClick(topic, idx);
        }
      });

      this.topicListEl.appendChild(item);
    });
  }

  setActiveTopic(index) {
    const items = this.topicListEl.querySelectorAll('.ccn-topic-item');
    items.forEach((item, i) => {
      item.classList.toggle('active', i === index);
    });

    // 활성 항목이 보이도록 스크롤
    const activeItem = items[index];
    if (activeItem) {
      activeItem.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }

  destroy() {
    document.body.style.marginRight = '0';
    this.shadowHost?.remove();
  }

  _escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  _getStyles() {
    // 인라인 CSS (Shadow DOM 내부에서만 적용)
    return `
:host {
  all: initial;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}

.ccn-sidebar {
  position: fixed;
  top: 0;
  right: 0;
  width: 280px;
  height: 100vh;
  background: #1b1b2f;
  border-left: 1px solid #2d2d44;
  z-index: 99999;
  display: flex;
  flex-direction: column;
  transition: transform 0.3s ease;
  color: #e0e0e0;
}

.ccn-sidebar.collapsed {
  transform: translateX(100%);
}

.ccn-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  border-bottom: 1px solid #2d2d44;
  flex-shrink: 0;
}

.ccn-header h2 {
  font-size: 14px;
  font-weight: 600;
  color: #b794f6;
  margin: 0;
}

.ccn-close-btn {
  background: none;
  border: none;
  color: #888;
  cursor: pointer;
  font-size: 18px;
  padding: 2px 6px;
  border-radius: 4px;
  line-height: 1;
}

.ccn-close-btn:hover {
  background: #2d2d44;
  color: #e0e0e0;
}

.ccn-topic-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px 0;
}

.ccn-topic-list::-webkit-scrollbar {
  width: 4px;
}

.ccn-topic-list::-webkit-scrollbar-thumb {
  background: #3d3d5c;
  border-radius: 2px;
}

.ccn-topic-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 10px 16px;
  cursor: pointer;
  transition: background 0.15s;
  border-left: 3px solid transparent;
}

.ccn-topic-item:hover {
  background: #24243e;
}

.ccn-topic-item.active {
  background: #24243e;
  border-left-color: #b794f6;
}

.ccn-topic-pin {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #6B4FBB;
  flex-shrink: 0;
  margin-top: 5px;
}

.ccn-topic-item.active .ccn-topic-pin {
  background: #b794f6;
  box-shadow: 0 0 6px rgba(183, 148, 246, 0.5);
}

.ccn-topic-info {
  flex: 1;
  min-width: 0;
}

.ccn-topic-title {
  font-size: 13px;
  font-weight: 500;
  color: #d0d0d0;
  line-height: 1.3;
  word-break: break-word;
}

.ccn-topic-item.active .ccn-topic-title {
  color: #fff;
}

.ccn-topic-meta {
  font-size: 11px;
  color: #666;
  margin-top: 2px;
}

.ccn-toggle-btn {
  position: fixed;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  width: 32px;
  height: 64px;
  background: #1b1b2f;
  border: 1px solid #2d2d44;
  border-right: none;
  border-radius: 8px 0 0 8px;
  color: #b794f6;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  z-index: 99998;
  transition: right 0.3s ease;
}

.ccn-toggle-btn.sidebar-open {
  right: 280px;
}

.ccn-toggle-btn:hover {
  background: #24243e;
}

.ccn-loading {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  color: #888;
  font-size: 12px;
}

.ccn-spinner {
  width: 14px;
  height: 14px;
  border: 2px solid #333;
  border-top-color: #b794f6;
  border-radius: 50%;
  animation: ccn-spin 0.8s linear infinite;
}

@keyframes ccn-spin {
  to { transform: rotate(360deg); }
}

.ccn-empty {
  padding: 20px 16px;
  text-align: center;
  color: #666;
  font-size: 12px;
  line-height: 1.5;
}

.ccn-error {
  padding: 12px 16px;
  color: #fc8181;
  font-size: 12px;
  line-height: 1.4;
}

.ccn-refresh-btn {
  display: block;
  margin: 8px auto 0;
  padding: 6px 14px;
  background: #2d2d44;
  border: 1px solid #3d3d5c;
  border-radius: 4px;
  color: #b794f6;
  font-size: 12px;
  cursor: pointer;
}

.ccn-refresh-btn:hover {
  background: #3d3d5c;
}
    `;
  }
}
