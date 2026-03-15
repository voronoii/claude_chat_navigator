// chrome.storage.sync 래퍼
const StorageUtil = {
  async getSettings() {
    return new Promise((resolve) => {
      chrome.storage.sync.get(
        {
          provider: DEFAULTS.provider,
          apiKey: '',
          model: '',
          sidebarVisible: true
        },
        (result) => resolve(result)
      );
    });
  },

  async saveSettings(settings) {
    return new Promise((resolve) => {
      chrome.storage.sync.set(settings, resolve);
    });
  },

  async getApiKey() {
    const settings = await this.getSettings();
    return settings.apiKey;
  },

  async getProvider() {
    const settings = await this.getSettings();
    return settings.provider;
  },

  async getModel() {
    const settings = await this.getSettings();
    if (settings.model) return settings.model;
    return settings.provider === 'openai'
      ? DEFAULTS.openaiModel
      : DEFAULTS.anthropicModel;
  }
};
