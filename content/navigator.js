class TopicNavigator {
  constructor(container, sidebar) {
    this.container = container;
    this.sidebar = sidebar;
    this.topics = [];
    this.messages = [];
    this.intersectionObserver = null;
    this.visibleMessageIndices = new Set();
  }

  update(topics, messages) {
    this.topics = topics;
    this.messages = messages;
    this._setupIntersectionObserver();
  }

  scrollToTopic(topic) {
    const targetMsg = this.messages.find(m => m.index === topic.startIndex);
    if (!targetMsg || !targetMsg.element) return;

    targetMsg.element.scrollIntoView({ behavior: 'smooth', block: 'start' });

    // 하이라이트 효과
    targetMsg.element.style.transition = 'outline 0.3s ease';
    targetMsg.element.style.outline = '2px solid rgba(183, 148, 246, 0.6)';
    targetMsg.element.style.outlineOffset = '4px';
    targetMsg.element.style.borderRadius = '8px';

    setTimeout(() => {
      targetMsg.element.style.outline = 'none';
      targetMsg.element.style.outlineOffset = '0';
    }, 1500);
  }

  _setupIntersectionObserver() {
    // 기존 observer 정리
    this.intersectionObserver?.disconnect();
    this.visibleMessageIndices.clear();

    if (!this.messages.length || !this.topics.length) return;

    this.intersectionObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          const idx = parseInt(entry.target.dataset.ccnId?.replace('msg-', '') || '-1');
          if (idx === -1) return;

          if (entry.isIntersecting) {
            this.visibleMessageIndices.add(idx);
          } else {
            this.visibleMessageIndices.delete(idx);
          }
        });
        this._updateActiveFromVisibility();
      },
      { threshold: 0.3 }
    );

    // 모든 메시지 요소 관찰
    this.messages.forEach(msg => {
      if (msg.element) {
        this.intersectionObserver.observe(msg.element);
      }
    });
  }

  _updateActiveFromVisibility() {
    if (this.visibleMessageIndices.size === 0) return;

    // 현재 보이는 메시지 중 가장 위에 있는 것의 인덱스
    const topVisibleIndex = Math.min(...this.visibleMessageIndices);

    // 해당 인덱스가 속한 토픽 찾기
    const activeTopicIdx = this.topics.findIndex(
      t => topVisibleIndex >= t.startIndex && topVisibleIndex <= t.endIndex
    );

    if (activeTopicIdx !== -1) {
      this.sidebar.setActiveTopic(activeTopicIdx);
    }
  }

  destroy() {
    this.intersectionObserver?.disconnect();
  }
}
