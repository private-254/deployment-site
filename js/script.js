class ThemeManager {
  constructor() {
    this.theme = localStorage.getItem('Davex-theme') || 
                 (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    this.init();
  }

  init() {
    this.applyTheme();
    this.setupToggle();
    this.watchSystemTheme();
  }

  applyTheme() {
    document.body.className = `${this.theme}-theme`;
    localStorage.setItem('Davex-theme', this.theme);

    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.content = this.theme === 'dark' ? '#0f172a' : '#6366f1';
    }
  }

  toggle() {
    this.theme = this.theme === 'light' ? 'dark' : 'light';
    this.applyTheme();

    document.body.style.transition = 'background-color 0.3s ease, color 0.3s ease';
    setTimeout(() => {
      document.body.style.transition = '';
    }, 300);
  }

  setupToggle() {
    const toggle = document.getElementById('theme-toggle');
    if (toggle) {
      toggle.addEventListener('click', () => this.toggle());
    }
  }

  watchSystemTheme() {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addListener((e) => {
      if (!localStorage.getItem('Davex-theme')) {
        this.theme = e.matches ? 'dark' : 'light';
        this.applyTheme();
      }
    });
  }
}

class PWAManager {
  constructor() {
    this.deferredPrompt = null;
    this.init();
  }

  async init() {
    await this.registerServiceWorker();
    this.setupInstallPrompt();
    this.setupInstallBanner();
  }

  async registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js');
        console.log('Service Worker registered successfully:', registration);

        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              this.showUpdateNotification();
            }
          });
        });
      } catch (error) {
        console.error('Service Worker registration failed:', error);
      }
    }
  }

  setupInstallPrompt() {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      this.deferredPrompt = e;
      this.showInstallBanner();
    });

    window.addEventListener('appinstalled', () => {
      console.log('PWA installed successfully');
      this.hideInstallBanner();
      this.deferredPrompt = null;
    });
  }

  setupInstallBanner() {
    const installBtn = document.getElementById('pwa-install');
    const dismissBtn = document.getElementById('pwa-dismiss');

    if (installBtn) {
      installBtn.addEventListener('click', () => this.installApp());
    }

    if (dismissBtn) {
      dismissBtn.addEventListener('click', () => this.hideInstallBanner());
    }
  }

  showInstallBanner() {
    const banner = document.getElementById('pwa-banner');
    if (banner && !this.isInstalled()) {
      banner.style.display = 'block';
      setTimeout(() => banner.classList.add('show'), 100);
    }
  }

  hideInstallBanner() {
    const banner = document.getElementById('pwa-banner');
    if (banner) {
      banner.classList.remove('show');
      setTimeout(() => banner.style.display = 'none', 300);
    }
  }

  async installApp() {
    if (!this.deferredPrompt) return;

    this.deferredPrompt.prompt();
    const { outcome } = await this.deferredPrompt.userChoice;

    console.log(`User response to install prompt: ${outcome}`);
    this.deferredPrompt = null;

    if (outcome === 'accepted') {
      this.hideInstallBanner();
    }
  }

  isInstalled() {
    return window.matchMedia('(display-mode: standalone)').matches ||
           window.navigator.standalone === true;
  }

  showUpdateNotification() {
    const notification = document.createElement('div');
    notification.className = 'update-notification';
    notification.innerHTML = `
      <div class="update-content">
        <i class="fas fa-sync-alt"></i>
        <span>App updated! Refresh to get the latest version.</span>
        <button onclick="window.location.reload()">Refresh</button>
      </div>
    `;
    document.body.appendChild(notification);

    setTimeout(() => notification.classList.add('show'), 100);
  }
}

class CopyManager {
  constructor() {
    this.setupCopyButtons();
  }

  setupCopyButtons() {
    document.querySelectorAll('.copy-btn').forEach(button => {
      button.addEventListener('click', (e) => this.handleCopy(e));
    });

    document.querySelectorAll('.copy-btn.small').forEach(button => {
      button.addEventListener('click', (e) => this.handleSmallCopy(e));
    });
  }

  async handleCopy(event) {
    const button = event.currentTarget;
    const copyId = button.getAttribute('data-copy');

    let textToCopy;
    if (copyId) {
      const element = document.getElementById(copyId);
      textToCopy = element ? element.textContent : '';
    } else {
      const codeBlock = button.closest('.code-block')?.querySelector('pre code');
      textToCopy = codeBlock ? codeBlock.textContent : '';
    }

    await this.copyToClipboard(textToCopy, button);
  }

  async handleSmallCopy(event) {
    const button = event.currentTarget;
    const textToCopy = button.getAttribute('data-copy-text') ||
                      button.previousElementSibling?.textContent ||
                      '';

    await this.copyToClipboard(textToCopy, button);
  }

  async copyToClipboard(text, button) {
    try {
      await navigator.clipboard.writeText(text);
      this.showCopySuccess(button);

      this.trackCopyEvent(text.substring(0, 50));
    } catch (error) {
      console.error('Copy failed:', error);
      this.showCopyError(button);
    }
  }

  showCopySuccess(button) {
    const originalContent = button.innerHTML;
    button.innerHTML = '<i class="fas fa-check"></i> Copied!';
    button.classList.add('copied');

    setTimeout(() => {
      button.innerHTML = originalContent;
      button.classList.remove('copied');
    }, 2000);
  }

  showCopyError(button) {
    const originalContent = button.innerHTML;
    button.innerHTML = '<i class="fas fa-times"></i> Error';
    button.style.background = '#ef4444';

    setTimeout(() => {
      button.innerHTML = originalContent;
      button.style.background = '';
    }, 2000);
  }

  trackCopyEvent(text) {
    if (typeof gtag !== 'undefined') {
      gtag('event', 'copy_code', {
        event_category: 'engagement',
        event_label: text
      });
    }
  }
}

class GitHubStatsManager {
  constructor() {
    this.repos = [
      { 
        name: "VENOM-XMD", 
        repo: "gifteddevsmd/VENOM-XMD", 
        starsElement: "venomxmd-stars", 
        forksElement: "venomxmd-forks" 
      },
      { 
        name: "DAVE-MD", 
        repo: "gifteddevsmd/DAVE-MD2", 
        starsElement: "davemd-stars", 
        forksElement: "davemd-forks" 
      },
      { 
        name: "Dave-Ai", 
        repo: "gifteddevsmd/Dave-Ai", 
        starsElement: "daveai-stars", 
        forksElement: "daveai-forks" 
      }
    ];
    this.cache = new Map();
    this.init();
  }

  init() {
    this.fetchAllStats();
    setInterval(() => this.fetchAllStats(), 5 * 60 * 1000);
  }

  async fetchAllStats() {
    const promises = this.repos.map(repo => this.fetchRepoStats(repo));
    await Promise.allSettled(promises);
  }

  async fetchRepoStats(repoInfo) {
    const { repo, starsElement, forksElement } = repoInfo;
    const apiUrl = `https://api.github.com/repos/${repo}`;

    const starsEl = document.getElementById(starsElement);
    const forksEl = document.getElementById(forksElement);

    if (starsEl) starsEl.textContent = '...';
    if (forksEl) forksEl.textContent = '...';

    try {
      const cached = this.cache.get(repo);
      if (cached && Date.now() - cached.timestamp < 5 * 60 * 1000) {
        this.updateElements(cached.data, starsEl, forksEl);
        return;
      }

      const response = await fetch(apiUrl);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      this.cache.set(repo, {
        data,
        timestamp: Date.now()
      });

      this.updateElements(data, starsEl, forksEl);
      this.animateNumbers(data, starsEl, forksEl);

    } catch (error) {
      console.error(`Failed to fetch ${repo} stats:`, error);
      if (starsEl) starsEl.textContent = 'Error';
      if (forksEl) forksEl.textContent = 'Error';
    }
  }

  updateElements(data, starsEl, forksEl) {
    if (starsEl) {
      starsEl.textContent = data.stargazers_count ? 
        this.formatNumber(data.stargazers_count) : 'N/A';
    }
    if (forksEl) {
      forksEl.textContent = data.forks_count ? 
        this.formatNumber(data.forks_count) : 'N/A';
    }
  }

  animateNumbers(data, starsEl, forksEl) {
    if (starsEl && data.stargazers_count) {
      this.animateCounter(starsEl, 0, data.stargazers_count, 1000);
    }
    if (forksEl && data.forks_count) {
      this.animateCounter(forksEl, 0, data.forks_count, 1000);
    }
  }

  animateCounter(element, start, end, duration) {
    const startTime = performance.now();

    const updateCounter = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      const current = Math.floor(start + (end - start) * this.easeOutCubic(progress));
      element.textContent = this.formatNumber(current);

      if (progress < 1) {
        requestAnimationFrame(updateCounter);
      }
    };

    requestAnimationFrame(updateCounter);
  }

  easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
  }

  formatNumber(num) {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  }
}

class DownloadManager {
  constructor() {
    this.repos = [
      {
        name: "venom-xmd",
        repo: "gifteddevsmd/VENOM-XMD",
        downloadElement: "venom-xmd-download-zip",
        fallbackUrl: "https://github.com/gifteddevsmd/VENOM-XMD/archive/refs/heads/main.zip",
        isRelease: true,
        btnText: "Latest Release"
      },
      {
        name: "dave-md",
        repo: "gifteddevsmd/DAVE-MD2",
        downloadElement: "davemd-download-zip",
        fallbackUrl: "https://github.com/gifteddevsmd/DAVE-MD2/archive/refs/heads/main.zip",
        isRelease: false,
        btnText: "Source Code"
      },
      {
        name: "dave-ai",
        repo: "gifteddevsmd/Dave-Ai",
        downloadElement: "daveai-download-zip",
        fallbackUrl: "https://github.com/gifteddevsmd/Dave-Ai/archive/refs/heads/main.zip",
        isRelease: false,
        btnText: "Source Code"
      }
    ];
    this.init();
  }

  async init() {
    const promises = this.repos.map(repo => this.setupDownloadLink(repo));
    await Promise.allSettled(promises);
  }

  async setupDownloadLink(repoInfo) {
    const { repo, downloadElement, fallbackUrl, isRelease, btnText } = repoInfo;
    const downloadLink = document.getElementById(downloadElement);

    if (!downloadLink) return;

    downloadLink.textContent = btnText;

    try {
      let zipUrl = fallbackUrl;

      if (isRelease) {
        const apiUrl = `https://api.github.com/repos/${repo}/releases/latest`;
        const response = await fetch(apiUrl);
        if (response.ok) {
          const data = await response.json();
          zipUrl = data.zipball_url || fallbackUrl;
        }
      }

      downloadLink.href = zipUrl;
      downloadLink.setAttribute('target', '_blank');
      downloadLink.setAttribute('rel', 'noopener noreferrer');

      downloadLink.addEventListener('click', () => {
        this.trackDownload(repo, btnText);
      });

    } catch (error) {
      console.error(`Failed to fetch download link for ${repo}:`, error);
      downloadLink.href = fallbackUrl;
      downloadLink.setAttribute('target', '_blank');
      downloadLink.setAttribute('rel', 'noopener noreferrer');
    }
  }

  trackDownload(repo, type) {
    if (typeof gtag !== 'undefined') {
      gtag('event', 'download', {
        event_category: 'engagement',
        event_label: `${repo}-${type}`
      });
    }
  }
}

class TabManager {
  constructor() {
    this.setupTabs();
  }

  setupTabs() {
    const tabButtons = document.querySelectorAll('.tab-btn');

    tabButtons.forEach(button => {
      button.addEventListener('click', () => {
        const tabId = button.getAttribute('data-tab');
        this.switchTab(tabId, button);
      });
    });

    // Set initial active tab
    const activeTab = document.querySelector('.tab-btn.active');
    if (activeTab) {
      const tabId = activeTab.getAttribute('data-tab');
      this.switchTab(tabId, activeTab);
    }
  }

  switchTab(tabId, activeButton) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));

    activeButton.classList.add('active');
    const targetTab = document.getElementById(`${tabId}-tab`);
    if (targetTab) {
      targetTab.classList.add('active');
    }

    if (typeof gtag !== 'undefined') {
      gtag('event', 'tab_switch', {
        event_category: 'engagement',
        event_label: tabId
      });
    }
  }
}

class NavigationManager {
  constructor() {
    this.setupFloatingNav();
    this.setupSmoothScroll();
    this.setupMobileNavigation();
  }

  setupFloatingNav() {
    const navItems = document.querySelectorAll('.nav-item');
    const sections = document.querySelectorAll('section, header');

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const sectionId = entry.target.id;
          this.updateActiveNav(sectionId, navItems);
        }
      });
    }, {
      threshold: 0.3,
      rootMargin: '-100px 0px -100px 0px'
    });

    sections.forEach(section => {
      if (section.id) {
        observer.observe(section);
      }
    });
  }

  updateActiveNav(sectionId, navItems) {
    navItems.forEach(item => {
      item.classList.remove('active');
      if (item.getAttribute('href') === `#${sectionId}`) {
        item.classList.add('active');
      }
    });
  }

  setupSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', (e) => {
        e.preventDefault();
        const targetId = anchor.getAttribute('href').substring(1);
        const targetElement = document.getElementById(targetId);

        if (targetElement) {
          targetElement.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
          });

          // Update URL without page reload
          history.pushState(null, null, `#${targetId}`);
        }
      });
    });
  }

  setupMobileNavigation() {
    // Create mobile menu toggle for smaller screens
    if (window.innerWidth <= 768) {
      this.createMobileMenu();
    }
  }

  createMobileMenu() {
    const floatingNav = document.querySelector('.floating-nav');
    if (!floatingNav) return;

    // Add mobile class for styling
    floatingNav.classList.add('mobile-nav');

    // Add click handler for better mobile experience
    floatingNav.querySelectorAll('.nav-item').forEach(item => {
      item.addEventListener('click', () => {
        // Add visual feedback for mobile taps
        item.style.transform = 'scale(0.95)';
        setTimeout(() => {
          item.style.transform = '';
        }, 150);
      });
    });
  }
}

class DisclaimerManager {
  constructor() {
    this.setupDisclaimer();
  }

  setupDisclaimer() {
    const agreeBtn = document.getElementById('disclaimer-agree');
    if (agreeBtn) {
      agreeBtn.addEventListener('click', () => {
        this.handleAgreement(agreeBtn);
      });
    }

    // Check if user already agreed
    if (localStorage.getItem('Davex-disclaimer-agreed') === 'true') {
      this.hideDisclaimer();
    }
  }

  handleAgreement(agreeBtn) {
    const disclaimerCard = agreeBtn.closest('.disclaimer-card');
    if (disclaimerCard) {
      // Add animation
      disclaimerCard.style.transform = 'scale(0.95)';
      disclaimerCard.style.opacity = '0';

      setTimeout(() => {
        this.hideDisclaimer();
      }, 300);

      localStorage.setItem('Davex-disclaimer-agreed', 'true');

      // Track agreement
      if (typeof gtag !== 'undefined') {
        gtag('event', 'disclaimer_agreed', {
          event_category: 'engagement'
        });
      }
    }
  }

  hideDisclaimer() {
    const disclaimerSection = document.querySelector('.disclaimer-section');
    if (disclaimerSection) {
      disclaimerSection.style.display = 'none';
    }
  }
}

class PerformanceMonitor {
  constructor() {
    this.init();
  }

  init() {
    window.addEventListener('load', () => {
      setTimeout(() => this.reportPerformance(), 1000);
    });

    // Monitor core web vitals
    this.monitorCoreWebVitals();
  }

  reportPerformance() {
    if ('performance' in window) {
      const navigation = performance.getEntriesByType('navigation')[0];
      if (navigation) {
        const loadTime = navigation.loadEventEnd - navigation.loadEventStart;
        console.log(`Page load time: ${loadTime}ms`);

        if (typeof gtag !== 'undefined') {
          gtag('event', 'page_load_time', {
            event_category: 'performance',
            value: Math.round(loadTime)
          });
        }
      }
    }
  }

  monitorCoreWebVitals() {
    // Largest Contentful Paint (LCP)
    const lcpObserver = new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      const lastEntry = entries[entries.length - 1];
      console.log('LCP:', lastEntry.startTime);
    });

    // First Input Delay (FID)
    const fidObserver = new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      entries.forEach(entry => {
        console.log('FID:', entry.processingStart - entry.startTime);
      });
    });

    try {
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
      fidObserver.observe({ entryTypes: ['first-input'] });
    } catch (e) {
      console.log('Performance Observer not supported');
    }
  }
}

class AnimationManager {
  constructor() {
    this.setupScrollAnimations();
    this.setupHoverEffects();
    this.setupLoadingAnimations();
  }

  setupScrollAnimations() {
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.style.opacity = '1';
          entry.target.style.transform = 'translateY(0)';
        }
      });
    }, observerOptions);

    document.querySelectorAll('.glass-card, .section-header, .hero-content, .access-card').forEach(el => {
      el.style.opacity = '0';
      el.style.transform = 'translateY(30px)';
      el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
      observer.observe(el);
    });
  }

  setupHoverEffects() {
    document.querySelectorAll('.glass-card').forEach(card => {
      card.addEventListener('mouseenter', () => {
        card.style.transform = 'translateY(-8px) scale(1.02)';
      });

      card.addEventListener('mouseleave', () => {
        card.style.transform = 'translateY(0) scale(1)';
      });
    });

    // Enhanced button hover effects
    document.querySelectorAll('.hero-btn, .deploy-btn, .server-btn').forEach(btn => {
      btn.addEventListener('mouseenter', () => {
        btn.style.transform = 'translateY(-2px)';
      });

      btn.addEventListener('mouseleave', () => {
        btn.style.transform = 'translateY(0)';
      });
    });
  }

  setupLoadingAnimations() {
    // Add loading animation to stats
    const statsElements = document.querySelectorAll('.stat-value');
    statsElements.forEach(el => {
      if (el.textContent === '...') {
        el.classList.add('loading');
      }
    });
  }
}

class DeploymentManager {
  constructor() {
    this.setupDeploymentTracking();
  }

  setupDeploymentTracking() {
    document.querySelectorAll('.deploy-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const platform = btn.closest('.deploy-card').querySelector('h4').textContent;
        const botType = btn.closest('.deploy-group').querySelector('.deploy-group-title').textContent;

        this.trackDeployment(platform, botType);
      });
    });
  }

  trackDeployment(platform, botType) {
    if (typeof gtag !== 'undefined') {
      gtag('event', 'deployment_click', {
        event_category: 'deployment',
        event_label: `${botType} - ${platform}`
      });
    }
  }
}

class ContactManager {
  constructor() {
    this.setupContactTracking();
  }

  setupContactTracking() {
    // Track email clicks
    document.querySelectorAll('a[href^="mailto:"]').forEach(link => {
      link.addEventListener('click', () => {
        this.trackContact('email');
      });
    });

    // Track WhatsApp clicks
    document.querySelectorAll('a[href^="https://wa.me/"]').forEach(link => {
      link.addEventListener('click', () => {
        this.trackContact('whatsapp');
      });
    });
  }

  trackContact(method) {
    if (typeof gtag !== 'undefined') {
      gtag('event', 'contact_click', {
        event_category: 'engagement',
        event_label: method
      });
    }
  }
}

class DaveXApp {
  constructor() {
    this.managers = {};
    this.init();
  }

  async init() {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.initializeManagers());
    } else {
      this.initializeManagers();
    }

    // Add global error handler
    this.setupErrorHandling();
  }

  initializeManagers() {
    try {
      this.managers.theme = new ThemeManager();
      this.managers.pwa = new PWAManager();
      this.managers.copy = new CopyManager();
      this.managers.githubStats = new GitHubStatsManager();
      this.managers.download = new DownloadManager();
      this.managers.tabs = new TabManager();
      this.managers.navigation = new NavigationManager();
      this.managers.disclaimer = new DisclaimerManager();
      this.managers.performance = new PerformanceMonitor();
      this.managers.animation = new AnimationManager();
      this.managers.deployment = new DeploymentManager();
      this.managers.contact = new ContactManager();

      console.log('DaveX WhatsApp Bots App initialized successfully');
    } catch (error) {
      console.error('Failed to initialize DaveX App:', error);
    }
  }

  setupErrorHandling() {
    window.addEventListener('error', (e) => {
      console.error('Global error:', e.error);
    });

    window.addEventListener('unhandledrejection', (e) => {
      console.error('Unhandled promise rejection:', e.reason);
    });
  }

  // Public method to manually refresh GitHub stats
  refreshStats() {
    if (this.managers.githubStats) {
      this.managers.githubStats.fetchAllStats();
    }
  }

  // Public method to toggle theme
  toggleTheme() {
    if (this.managers.theme) {
      this.managers.theme.toggle();
    }
  }
}

// Initialize the app
const app = new DaveXApp();

// Make app globally available for debugging
window.DaveXApp = app;

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { DaveXApp };
}

// Add some CSS for the update notification
const updateNotificationStyles = `
.update-notification {
  position: fixed;
  top: 20px;
  right: 20px;
  background: var(--glass-bg);
  border: 1px solid var(--glass-border);
  border-radius: 12px;
  padding: 16px;
  backdrop-filter: blur(10px);
  box-shadow: var(--shadow);
  z-index: 10000;
  transform: translateX(100%);
  opacity: 0;
  transition: all 0.3s ease;
}

.update-notification.show {
  transform: translateX(0);
  opacity: 1;
}

.update-content {
  display: flex;
  align-items: center;
  gap: 12px;
}

.update-content i {
  color: var(--primary);
  font-size: 1.2rem;
}

.update-content span {
  flex: 1;
  font-weight: 500;
}

.update-content button {
  background: var(--primary);
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
}

.update-content button:hover {
  background: var(--primary-dark);
}

.loading {
  position: relative;
  color: transparent !important;
}

.loading::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 16px;
  height: 16px;
  margin: -8px 0 0 -8px;
  border: 2px solid var(--primary);
  border-top: 2px solid transparent;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

@media (max-width: 768px) {
  .mobile-nav .nav-item {
    width: 45px;
    height: 45px;
  }
  
  .mobile-nav .nav-item i {
    font-size: 1.1rem;
  }
}
`;

// Inject styles
const styleSheet = document.createElement('style');
styleSheet.textContent = updateNotificationStyles;
document.head.appendChild(styleSheet);