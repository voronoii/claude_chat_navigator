// Claude Chat Navigator - 메인 오케스트레이터
(function () {
  let sidebar = null;
  let topicNav = null;
  let classifier = null;
  let extractor = null;
  let msgObserver = null;
  let isInitialized = false;
  let initWatcher = null;

  console.log('[CCN] 확장프로그램 로드됨');

  async function initialize() {
    if (isInitialized) return;
    console.log('[CCN] 초기화 시작...');

    // 설정 로드
    const settings = await StorageUtil.getSettings();

    // 사이드바 먼저 표시
    if (!sidebar) {
      sidebar = new Sidebar();
      document.body.style.marginRight = '280px';
    }

    if (!settings.apiKey) {
      console.log('[CCN] API Key 미설정');
      sidebar.showApiKeyGuide();
      startInitWatcher(); // 메시지 출현 감시는 계속
      return;
    }

    // user-message가 있는지 확인
    const userMessages = document.querySelectorAll(SELECTORS.humanIndicator);
    console.log('[CCN] 현재 user-message 수:', userMessages.length);

    if (userMessages.length === 0) {
      console.log('[CCN] 메시지 없음. 출현 대기 중...');
      sidebar.showEmpty('대화를 시작하면 주제가 자동으로 분류됩니다.');
      startInitWatcher();
      return;
    }

    // DOM 구조 탐색
    const structure = discoverConversationStructure();
    if (!structure) {
      console.log('[CCN] 대화 구조 탐색 실패. 메시지가 더 쌓이면 재시도합니다.');
      startInitWatcher();
      return;
    }

    console.log('[CCN] 구조 발견! 모드:', structure.mode, '컨테이너:', structure.container.tagName);
    stopInitWatcher();
    isInitialized = true;

    const { container, mode } = structure;

    // 모듈 초기화
    topicNav = new TopicNavigator(container, sidebar);
    classifier = new TopicClassifier(settings);
    extractor = new MessageExtractor(container, mode);

    sidebar.onTopicClick = (topic) => topicNav.scrollToTopic(topic);
    sidebar.onRefreshClick = () => runClassification();

    // 기존 메시지 분류
    const messages = extractor.extractAll();
    console.log('[CCN] 추출된 메시지:', messages.length, '개');
    if (messages.length >= 2) {
      runClassification();
    } else {
      sidebar.showEmpty('메시지가 2개 이상이면 주제를 분류합니다.');
    }

    // 새 메시지 감지
    msgObserver = new MessageObserver(container, () => {
      console.log('[CCN] 새 메시지 감지');
      runClassification();
    });
    msgObserver.start();
  }

  // user-message 출현을 계속 감시하는 watcher
  function startInitWatcher() {
    if (initWatcher) return;
    console.log('[CCN] 메시지 출현 감시 시작');

    initWatcher = new MutationObserver(() => {
      const userMessages = document.querySelectorAll(SELECTORS.humanIndicator);
      if (userMessages.length >= 1 && !isInitialized) {
        console.log('[CCN] 메시지 출현 감지! 초기화 재시도...');
        // 스트리밍 완료 대기 후 초기화
        setTimeout(initialize, 2000);
      }
    });

    initWatcher.observe(document.body, { childList: true, subtree: true });
  }

  function stopInitWatcher() {
    initWatcher?.disconnect();
    initWatcher = null;
  }

  async function runClassification() {
    if (!classifier || !extractor || !sidebar) return;

    const messages = extractor.extractAll();
    console.log('[CCN] 분류 실행. 메시지 수:', messages.length);
    if (messages.length < 2) return;

    sidebar.showLoading();

    try {
      // 증분 분류: 이전 분류 이후 새 메시지가 2개 미만이면 스킵
      const topics = (messages.length - classifier.lastClassifiedCount >= 2 || classifier.lastClassifiedCount === 0)
        ? await classifier.classifyMessages(messages)
        : classifier.cachedTopics;

      if (topics && topics.length > 0) {
        sidebar.renderTopics(topics, messages);
        topicNav.update(topics, messages);
        sidebar.onTopicClick = (topic) => topicNav.scrollToTopic(topic);
      } else {
        sidebar.showEmpty('주제를 분류할 수 없습니다.');
      }
    } catch (err) {
      console.error('[CCN] 분류 실패:', err);
      sidebar.showError(`분류 실패: ${err.message}`);
    }
  }

  function teardown() {
    console.log('[CCN] teardown');
    stopInitWatcher();
    msgObserver?.stop();
    topicNav?.destroy();
    sidebar?.destroy();
    sidebar = null;
    topicNav = null;
    classifier = null;
    extractor = null;
    msgObserver = null;
    isInitialized = false;
  }

  // SPA 네비게이션 감지
  let lastUrl = location.href;
  const urlObserver = new MutationObserver(() => {
    if (location.href !== lastUrl) {
      console.log('[CCN] URL 변경:', lastUrl, '→', location.href);
      lastUrl = location.href;
      teardown();
      setTimeout(initialize, 1000);
    }
  });
  urlObserver.observe(document.body, { childList: true, subtree: true });

  // 설정 변경 감지
  chrome.storage.onChanged.addListener((changes) => {
    if (changes.apiKey || changes.provider || changes.model) {
      console.log('[CCN] 설정 변경 감지');
      teardown();
      setTimeout(initialize, 300);
    }
  });

  // 초기 실행
  initialize();
})();
