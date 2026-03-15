class TopicClassifier {
  constructor(settings) {
    this.settings = settings;
    this.cachedTopics = [];
    this.lastClassifiedCount = 0;
    this.isClassifying = false;
  }

  async classifyMessages(messages) {
    if (this.isClassifying) return this.cachedTopics;
    this.isClassifying = true;

    try {
      const prompt = this._buildPrompt(messages);
      const result = await this._callLLM(prompt);
      this.cachedTopics = result.topics || [];
      this.lastClassifiedCount = messages.length;
      return this.cachedTopics;
    } catch (err) {
      console.error('[CCN] Classification error:', err);
      return this.cachedTopics;
    } finally {
      this.isClassifying = false;
    }
  }

  async classifyIncremental(allMessages, newMessages) {
    // 새 메시지가 충분히 쌓였을 때만 재분류 (최소 2턴 = 1 왕복)
    if (allMessages.length - this.lastClassifiedCount < 2) {
      return this.cachedTopics;
    }
    return this.classifyMessages(allMessages);
  }

  _buildPrompt(messages) {
    const conversationSummary = messages.map((m, i) =>
      `[${i}] ${m.role}: ${m.excerpt}`
    ).join('\n');

    const systemPrompt = `You are a conversation topic classifier. Analyze the conversation below and group consecutive messages into topics.

Rules:
- Each topic should cover a coherent subject or task
- Messages within a topic must be consecutive (no gaps)
- Every message must belong to exactly one topic
- Create concise Korean titles (max 30 chars) that capture the essence
- Return valid JSON only

Return format:
{
  "topics": [
    {"title": "주제 제목", "startIndex": 0, "endIndex": 3},
    {"title": "다음 주제", "startIndex": 4, "endIndex": 7}
  ]
}`;

    const userPrompt = `다음 대화를 주제별로 분류해주세요:\n\n${conversationSummary}`;

    return [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ];
  }

  async _callLLM(promptMessages) {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage(
        {
          type: 'LLM_CLASSIFY',
          payload: {
            provider: this.settings.provider,
            apiKey: this.settings.apiKey,
            model: this.settings.model,
            messages: promptMessages
          }
        },
        (response) => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
            return;
          }
          if (response.success) {
            resolve(response.data);
          } else {
            reject(new Error(response.error));
          }
        }
      );
    });
  }
}
