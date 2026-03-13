/* ======================================================
   Latent-XAI Docs — Main JavaScript
   - Dark / light mode toggle (persisted)
   - TOC active section tracking (IntersectionObserver)
   - Copy-to-clipboard for code blocks
   - Mobile sidebar toggle
   ====================================================== */

(function () {
  'use strict';

  /* ---- Dark Mode ---- */
  const THEME_KEY = 'lxai-theme';
  const themeToggle = document.getElementById('theme-toggle');
  const root = document.documentElement;

  function applyTheme(theme) {
    root.setAttribute('data-theme', theme);
    if (themeToggle) {
      themeToggle.textContent = theme === 'dark' ? '☀️' : '🌙';
      themeToggle.title = theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode';
    }
  }

  function loadTheme() {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved) return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  applyTheme(loadTheme());

  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      const current = root.getAttribute('data-theme');
      const next = current === 'dark' ? 'light' : 'dark';
      applyTheme(next);
      localStorage.setItem(THEME_KEY, next);
    });
  }

  /* ---- TOC Active Section Tracking ---- */
  function initTOC() {
    const tocLinks = document.querySelectorAll('.toc-list a');
    if (tocLinks.length === 0) return;

    const headings = [];
    tocLinks.forEach(link => {
      const id = link.getAttribute('href').replace('#', '');
      const el = document.getElementById(id);
      if (el) headings.push({ el, link });
    });

    if (headings.length === 0) return;

    let activeLink = null;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const found = headings.find(h => h.el === entry.target);
          if (found) {
            if (activeLink) activeLink.classList.remove('active');
            found.link.classList.add('active');
            activeLink = found.link;
          }
        }
      });
    }, {
      rootMargin: '-60px 0px -70% 0px',
      threshold: 0
    });

    headings.forEach(({ el }) => observer.observe(el));
  }

  /* ---- Copy Buttons for Code Blocks ---- */
  function initCopyButtons() {
    document.querySelectorAll('.copy-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const wrapper = btn.closest('.code-block-wrapper');
        const pre = wrapper ? wrapper.querySelector('pre') : null;
        if (!pre) return;
        const text = pre.innerText || pre.textContent;
        navigator.clipboard.writeText(text).then(() => {
          btn.textContent = '✓ Copied';
          btn.classList.add('copied');
          setTimeout(() => {
            btn.textContent = '⧉ Copy';
            btn.classList.remove('copied');
          }, 2000);
        }).catch(() => {
          // Fallback for browsers without clipboard API
          const ta = document.createElement('textarea');
          ta.value = text;
          ta.style.position = 'fixed';
          ta.style.opacity = '0';
          document.body.appendChild(ta);
          ta.select();
          document.execCommand('copy');
          document.body.removeChild(ta);
          btn.textContent = '✓ Copied';
          btn.classList.add('copied');
          setTimeout(() => {
            btn.textContent = '⧉ Copy';
            btn.classList.remove('copied');
          }, 2000);
        });
      });
    });
  }

  /* ---- Lightweight Syntax Highlighting for Plain Python Blocks ---- */
  function initSyntaxHighlighting() {
    const keywordPattern = /\b(import|from|as|def|class|return|for|while|if|elif|else|with|in|is|not|and|or|lambda|pass|break|continue|try|except|finally|raise|yield|True|False|None)\b/g;
    const numberPattern = /\b\d+(?:\.\d+)?\b/g;
    const opPattern = /(\*\*|==|!=|<=|>=|\+=|-=|\*=|\/=|%=|=|\+|-|\*|\/|%|<|>)/g;

    const escapeHtml = (text) => text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    const highlightPython = (source) => {
      const escaped = escapeHtml(source);
      const stash = [];

      const take = (value) => {
        const key = `@@TOK${stash.length}@@`;
        stash.push(value);
        return key;
      };

      // Protect strings first.
      let out = escaped.replace(/"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'/g, (m) => {
        return take(`<span class="tok-str">${m}</span>`);
      });

      // Protect comments after strings to avoid coloring # inside strings.
      out = out.replace(/#[^\n]*/g, (m) => {
        return take(`<span class="tok-cm">${m}</span>`);
      });

      // Highlight remaining Python syntax.
      out = out.replace(keywordPattern, '<span class="tok-kw">$1</span>');
      out = out.replace(numberPattern, '<span class="tok-num">$&</span>');
      out = out.replace(opPattern, '<span class="tok-op">$1</span>');

      // Restore protected tokens.
      out = out.replace(/@@TOK(\d+)@@/g, (_, idx) => stash[Number(idx)]);
      return out;
    };

    document.querySelectorAll('.code-block-wrapper pre code').forEach(codeEl => {
      // Skip blocks that already have manual token markup.
      if (codeEl.querySelector('[class^="tok-"]')) return;

      let text = codeEl.textContent || '';
      // Recover from accidental literal token tags rendered as text.
      // Example broken input: <span class="tok-kw">import</span> sys
      text = text.replace(/<\/?span\b[^>]*>/gi, '');
      if (!text.trim()) return;

      codeEl.innerHTML = highlightPython(text);
    });
  }

  /* ---- Mobile Sidebar Toggle ---- */
  function initSidebar() {
    const toggleBtn = document.getElementById('sidebar-toggle');
    const sidebar = document.querySelector('.sidebar');
    const overlay = document.getElementById('sidebar-overlay');

    if (!toggleBtn || !sidebar) return;

    function openSidebar() {
      sidebar.classList.add('open');
      if (overlay) overlay.classList.add('visible');
      document.body.style.overflow = 'hidden';
    }
    function closeSidebar() {
      sidebar.classList.remove('open');
      if (overlay) overlay.classList.remove('visible');
      document.body.style.overflow = '';
    }

    toggleBtn.addEventListener('click', () => {
      sidebar.classList.contains('open') ? closeSidebar() : openSidebar();
    });
    if (overlay) overlay.addEventListener('click', closeSidebar);
  }

  /* ---- Highlight Active Nav Link ---- */
  function highlightActiveNav() {
    const currentPath = window.location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.sidebar-nav a').forEach(link => {
      const href = link.getAttribute('href');
      if (!href) return;
      const linkFile = href.split('/').pop();
      if (linkFile === currentPath) {
        link.classList.add('active');
        // Expand parent group if nested
        const subGroup = link.closest('.nav-sub');
        if (subGroup) subGroup.style.display = 'block';
      }
    });
  }

  /* ---- Smooth scroll offset for sticky header ---- */
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        e.preventDefault();
        const offset = 70;
        const top = target.getBoundingClientRect().top + window.pageYOffset - offset;
        window.scrollTo({ top, behavior: 'smooth' });
      }
    });
  });

  /* ---- Init all ---- */
  document.addEventListener('DOMContentLoaded', () => {
    initSyntaxHighlighting();
    initTOC();
    initCopyButtons();
    initSidebar();
    highlightActiveNav();
  });

  // Also run immediately in case DOM is already ready
  if (document.readyState !== 'loading') {
    initSyntaxHighlighting();
    initTOC();
    initCopyButtons();
    initSidebar();
    highlightActiveNav();
  }

})();
