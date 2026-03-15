// claude.ai DOM 탐색 - data-testid 앵커 기반 구조 자동 탐색
// CSS 클래스에 의존하지 않음

const SELECTORS = {
  humanIndicator: '[data-testid="user-message"]',
  // data-message-uuid가 있으면 더 강력한 메시지 식별자
  messageUuid: '[data-message-uuid]',
  streamingIndicators: [
    '[aria-label="Stop"]',
    'button[aria-label="Stop"]',
    '[aria-label="stop"]'
  ]
};

const DEFAULTS = {
  provider: 'openai',
  openaiModel: 'gpt-4o-mini',
  anthropicModel: 'claude-haiku-4-5-20241022',
  debounceMs: 3000,
  excerptLength: 300,
  sidebarWidth: 280
};

/**
 * user-message 앵커에서 부모 체인을 비교하여
 * 대화 컨테이너와 턴 레벨을 자동 탐색한다.
 */
function discoverConversationStructure() {
  // 1) data-message-uuid 방식 시도 (가장 안정적)
  const uuidMessages = document.querySelectorAll(SELECTORS.messageUuid);
  if (uuidMessages.length >= 2) {
    const container = findLowestCommonAncestor(uuidMessages[0], uuidMessages[1]);
    if (container) {
      console.log('[CCN] data-message-uuid 기반 구조 발견');
      return { container, mode: 'uuid' };
    }
  }

  // 2) data-testid="user-message" 방식
  const userMessages = document.querySelectorAll(SELECTORS.humanIndicator);
  if (userMessages.length >= 2) {
    // 첫 번째와 두 번째 user-message의 공통 조상 탐색
    const container = findLowestCommonAncestor(
      getTurnAncestor(userMessages[0]),
      getTurnAncestor(userMessages[1])
    );
    if (container) {
      console.log('[CCN] user-message 기반 구조 발견');
      return { container, mode: 'testid' };
    }
  }

  // 3) user-message 1개인 경우 — 부모 탐색으로 스크롤 컨테이너 찾기
  if (userMessages.length === 1) {
    const turnEl = getTurnAncestor(userMessages[0]);
    if (turnEl?.parentElement) {
      console.log('[CCN] 단일 user-message 기반 구조 발견 (폴백)');
      return { container: turnEl.parentElement, mode: 'testid' };
    }
  }

  return null;
}

/**
 * user-message에서 "턴" 수준 조상을 찾는다.
 * 턴 = 여러 형제가 있는 첫 번째 조상 (대화의 각 턴은 형제 관계)
 */
function getTurnAncestor(userMessageEl) {
  let current = userMessageEl.parentElement;
  while (current && current !== document.body) {
    const parent = current.parentElement;
    if (parent && parent.children.length > 1) {
      // 이 parent의 자식 중 하나가 current이고, 형제가 있으면
      // current가 "턴" 레벨일 가능성이 높음
      return current;
    }
    current = parent;
  }
  return current;
}

/**
 * 두 요소의 가장 낮은 공통 조상을 찾는다.
 */
function findLowestCommonAncestor(el1, el2) {
  if (!el1 || !el2) return null;
  const ancestors1 = new Set();
  let current = el1;
  while (current) {
    ancestors1.add(current);
    current = current.parentElement;
  }
  current = el2;
  while (current) {
    if (ancestors1.has(current)) return current;
    current = current.parentElement;
  }
  return null;
}

function getAncestorChain(el) {
  const chain = [];
  let current = el.parentElement;
  while (current && current !== document.body) {
    chain.push(current);
    current = current.parentElement;
  }
  return chain;
}
