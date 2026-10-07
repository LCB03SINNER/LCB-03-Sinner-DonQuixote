class SerumBrowser {
  constructor() {
    this.tabs = [];
    this.activeTabId = null;
    this.tabCounter = 1;

    this.addressBar = document.getElementById('addressBar');
    this.goBtn = document.getElementById('goBtn');
    this.backBtn = document.getElementById('backBtn');
    this.forwardBtn = document.getElementById('forwardBtn');
    this.reloadBtn = document.getElementById('reloadBtn');
    this.newTabBtn = document.getElementById('newTabBtn');
    this.settingsBtn = document.getElementById('settingsBtn');
    this.tabsBar = document.getElementById('tabsBar');
    this.browserView = document.getElementById('browserView');
    this.statusText = document.getElementById('statusText');

    this.bindEvents();
    this.createTab('https://www.google.com');
  }

  bindEvents() {
    this.goBtn.addEventListener('click', () => this.navigate(this.addressBar.value));
    this.addressBar.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') this.navigate(this.addressBar.value);
    });

    this.backBtn.addEventListener('click', () => this.goBack());
    this.forwardBtn.addEventListener('click', () => this.goForward());
    this.reloadBtn.addEventListener('click', () => this.reloadPage());
    this.newTabBtn.addEventListener('click', () => this.createTab('https://www.google.com'));
    this.settingsBtn.addEventListener('click', () => {
      this.statusText.textContent = 'Settings coming soon';
    });

    document.addEventListener('keydown', (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 't') {
        event.preventDefault();
        this.createTab('https://www.google.com');
      }
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'l') {
        event.preventDefault();
        this.addressBar.focus();
        this.addressBar.select();
      }
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'w') {
        event.preventDefault();
        this.closeTab(this.activeTabId);
      }
    });

    this.browserView.addEventListener('did-finish-load', () => {
      const url = this.browserView.getURL();
      this.addressBar.value = url;
      this.statusText.textContent = 'Ready';
      this.updateTabTitle();
    });

    this.browserView.addEventListener('page-title-updated', (event) => {
      const title = event.title || 'New Tab';
      this.updateActiveTabMetadata(title);
    });

    if (window.electronAPI) {
      window.electronAPI.onNewTab(() => this.createTab('https://www.google.com'));
      window.electronAPI.onNavigateRequest((url) => this.navigate(url));
      window.electronAPI.onCloseTab((tabId) => this.closeTab(tabId));
    }
  }

  createTab(url = 'https://www.google.com') {
    const tabId = `tab-${this.tabCounter++}`;
    const tab = {
      id: tabId,
      title: 'New Tab',
      url,
    };

    this.tabs.push(tab);
    this.activeTabId = tabId;
    this.renderTabs();
    this.switchToTab(tabId);
  }

  renderTabs() {
    this.tabsBar.innerHTML = '';

    this.tabs.forEach((tab) => {
      const tabEl = document.createElement('div');
      tabEl.className = `tab ${tab.id === this.activeTabId ? 'active' : ''}`;
      tabEl.dataset.id = tab.id;

      const titleEl = document.createElement('span');
      titleEl.className = 'tab-title';
      titleEl.textContent = tab.title || 'New Tab';

      const closeEl = document.createElement('span');
      closeEl.className = 'tab-close';
      closeEl.textContent = '×';
      closeEl.addEventListener('click', (event) => {
        event.stopPropagation();
        this.closeTab(tab.id);
      });

      tabEl.appendChild(titleEl);
      tabEl.appendChild(closeEl);
      tabEl.addEventListener('click', () => this.switchToTab(tab.id));

      this.tabsBar.appendChild(tabEl);
    });
  }

  switchToTab(tabId) {
    const tab = this.tabs.find((item) => item.id === tabId);
    if (!tab) return;

    this.activeTabId = tabId;
    this.renderTabs();
    this.browserView.src = tab.url;
    this.addressBar.value = tab.url;
    this.statusText.textContent = 'Loading...';
  }

  closeTab(tabId) {
    if (!tabId) return;

    if (this.tabs.length === 1) {
      this.createTab('https://www.google.com');
      return;
    }

    const index = this.tabs.findIndex((tab) => tab.id === tabId);
    if (index === -1) return;

    this.tabs.splice(index, 1);

    if (this.activeTabId === tabId) {
      const nextTab = this.tabs[Math.max(0, index - 1)] || this.tabs[0];
      this.activeTabId = nextTab.id;
    }

    this.renderTabs();
    const activeTab = this.tabs.find((tab) => tab.id === this.activeTabId);
    if (activeTab) {
      this.switchToTab(activeTab.id);
    }
  }

  navigate(rawUrl) {
    let url = (rawUrl || '').trim();
    if (!url) return;

    if (!/^https?:\/\//i.test(url)) {
      if (url.includes('.')) {
        url = `https://${url}`;
      } else {
        url = `https://www.google.com/search?q=${encodeURIComponent(url)}`;
      }
    }

    const activeTab = this.tabs.find((tab) => tab.id === this.activeTabId);
    if (activeTab) {
      activeTab.url = url;
      this.addressBar.value = url;
      this.browserView.src = url;
      this.statusText.textContent = 'Loading...';
    }
  }

  goBack() {
    if (this.browserView.canGoBack()) {
      this.browserView.goBack();
    }
  }

  goForward() {
    if (this.browserView.canGoForward()) {
      this.browserView.goForward();
    }
  }

  reloadPage() {
    this.browserView.reload();
  }

  updateTabTitle() {
    const activeTab = this.tabs.find((tab) => tab.id === this.activeTabId);
    if (!activeTab) return;

    const currentUrl = this.browserView.getURL();
    if (currentUrl) {
      try {
        activeTab.title = new URL(currentUrl).hostname;
      } catch {
        activeTab.title = 'New Tab';
      }
    }

    activeTab.url = currentUrl;
    this.renderTabs();
  }

  updateActiveTabMetadata(title) {
    const activeTab = this.tabs.find((tab) => tab.id === this.activeTabId);
    if (!activeTab) return;

    activeTab.title = title || activeTab.title;
    this.renderTabs();
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.serumBrowser = new SerumBrowser();
});
