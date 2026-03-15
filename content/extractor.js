class MessageExtractor {
  constructor(container, mode) {
    this.container = container;
    this.mode = mode; // 'uuid' or 'testid'
  }

  extractAll() {
    if (this.mode === 'uuid') {
      return this._extractByUuid();
    }
    return this._extractByChildren();
  }

  // data-message-uuid 기반 추출
  _extractByUuid() {
    const elements = this.container.querySelectorAll(SELECTORS.messageUuid);
    const messages = [];

    elements.forEach((el, index) => {
      const text = this._extractText(el);
      if (!text.trim()) return;

      const id = el.getAttribute('data-message-uuid') || `msg-${index}`;
      el.dataset.ccnId = id;

      messages.push({
        id,
        index,
        role: this._detectRole(el),
        text,
        element: el,
        excerpt: text.substring(0, DEFAULTS.excerptLength)
      });
    });

    return messages;
  }

  // 컨테이너 직계 자식 기반 추출
  _extractByChildren() {
    const children = Array.from(this.container.children);
    const messages = [];

    children.forEach((child, index) => {
      const text = this._extractText(child);
      if (!text.trim()) return;

      // 버튼, 입력란 등 비대화 요소 제외
      if (child.querySelector('[data-testid="chat-input-grid-container"]')) return;
      if (child.querySelector('[data-testid="file-upload"]')) return;

      const id = child.dataset.ccnId || `msg-${index}`;
      child.dataset.ccnId = id;

      messages.push({
        id,
        index,
        role: this._detectRole(child),
        text,
        element: child,
        excerpt: text.substring(0, DEFAULTS.excerptLength)
      });
    });

    return messages;
  }

  _detectRole(element) {
    if (element.querySelector(SELECTORS.humanIndicator) ||
        element.matches?.(SELECTORS.humanIndicator)) {
      return 'human';
    }
    return 'assistant';
  }

  _extractText(element) {
    // user-message 내용 우선
    const userMsg = element.querySelector(SELECTORS.humanIndicator);
    if (userMsg) return userMsg.innerText;

    // 어시스턴트: whitespace-pre-wrap > prose > markdown > 전체
    const candidates = [
      element.querySelector('.whitespace-pre-wrap'),
      element.querySelector('.prose'),
      element.querySelector('[class*="markdown"]')
    ];

    for (const el of candidates) {
      if (el) return el.innerText;
    }

    return element.innerText;
  }
}
