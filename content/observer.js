class MessageObserver {
  constructor(container, onNewMessages) {
    this.container = container;
    this.onNewMessages = onNewMessages;
    this.observer = null;
    this.knownChildCount = 0;
    this.debounceTimer = null;
  }

  start() {
    this.knownChildCount = this.container.children.length;

    // 컨테이너의 직계 자식 변화만 감시 (subtree: false)
    this.observer = new MutationObserver(() => {
      const currentCount = this.container.children.length;
      if (currentCount > this.knownChildCount) {
        this.knownChildCount = currentCount;
        this._debouncedCallback();
      }
    });

    this.observer.observe(this.container, {
      childList: true,
      subtree: true
    });
  }

  _debouncedCallback() {
    clearTimeout(this.debounceTimer);
    this.debounceTimer = setTimeout(() => {
      if (this._isStreamingInProgress()) {
        // 스트리밍 중이면 1초 후 재시도
        this.debounceTimer = setTimeout(() => this._debouncedCallback(), 1000);
        return;
      }
      this.onNewMessages();
    }, DEFAULTS.debounceMs);
  }

  _isStreamingInProgress() {
    for (const sel of SELECTORS.streamingIndicators) {
      if (document.querySelector(sel)) return true;
    }
    return false;
  }

  stop() {
    this.observer?.disconnect();
    clearTimeout(this.debounceTimer);
  }
}
