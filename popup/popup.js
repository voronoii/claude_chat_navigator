const providerEl = document.getElementById('provider');
const apiKeyEl = document.getElementById('apiKey');
const modelEl = document.getElementById('model');
const saveBtn = document.getElementById('saveBtn');
const statusEl = document.getElementById('status');
const openaiGroup = document.getElementById('openai-models');
const anthropicGroup = document.getElementById('anthropic-models');

// 제공자에 따라 모델 옵션 표시/숨김
function updateModelVisibility() {
  const provider = providerEl.value;
  openaiGroup.style.display = provider === 'openai' ? '' : 'none';
  anthropicGroup.style.display = provider === 'anthropic' ? '' : 'none';

  // 현재 선택된 모델이 숨겨진 그룹에 있으면 첫 번째 보이는 옵션 선택
  const selected = modelEl.value;
  const visibleGroup = provider === 'openai' ? openaiGroup : anthropicGroup;
  const hiddenGroup = provider === 'openai' ? anthropicGroup : openaiGroup;
  const hiddenValues = Array.from(hiddenGroup.querySelectorAll('option')).map(o => o.value);

  if (hiddenValues.includes(selected)) {
    modelEl.value = visibleGroup.querySelector('option').value;
  }
}

providerEl.addEventListener('change', updateModelVisibility);

// 설정 불러오기
chrome.storage.sync.get(
  { provider: 'openai', apiKey: '', model: '' },
  (settings) => {
    providerEl.value = settings.provider || 'openai';
    apiKeyEl.value = settings.apiKey || '';
    updateModelVisibility();
    if (settings.model) {
      modelEl.value = settings.model;
    }
  }
);

// 저장
saveBtn.addEventListener('click', () => {
  const provider = providerEl.value;
  const apiKey = apiKeyEl.value.trim();
  const model = modelEl.value;

  if (!apiKey) {
    statusEl.textContent = 'API Key를 입력해주세요';
    statusEl.className = 'status error';
    return;
  }

  chrome.storage.sync.set({ provider, apiKey, model }, () => {
    statusEl.textContent = '저장되었습니다';
    statusEl.className = 'status success';
    setTimeout(() => {
      statusEl.textContent = '';
      statusEl.className = 'status';
    }, 2000);
  });
});
