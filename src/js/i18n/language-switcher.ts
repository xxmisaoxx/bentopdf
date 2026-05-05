import {
  supportedLanguages,
  languageNames,
  getLanguageFromUrl,
  changeLanguage,
  t,
} from './i18n';

export const createLanguageSwitcher = (): HTMLElement => {
  const currentLang = getLanguageFromUrl();

  const container = document.createElement('div');
  container.className = 'relative';
  container.id = 'language-switcher';

  const button = document.createElement('button');
  button.className = `
    inline-flex items-center gap-1.5 text-sm font-medium
    bg-gray-800 text-gray-200 border border-gray-600
    px-3 py-1.5 rounded-full transition-colors duration-200
    shadow-sm hover:shadow-md hover:bg-gray-700
  `.trim();
  button.setAttribute('aria-haspopup', 'true');
  button.setAttribute('aria-expanded', 'false');

  const textSpan = document.createElement('span');
  textSpan.className = 'font-medium';
  textSpan.textContent = languageNames[currentLang];

  const chevron = document.createElement('svg');
  chevron.className = 'w-4 h-4';
  chevron.setAttribute('fill', 'none');
  chevron.setAttribute('stroke', 'currentColor');
  chevron.setAttribute('viewBox', '0 0 24 24');
  chevron.innerHTML =
    '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>';

  button.appendChild(textSpan);
  button.appendChild(chevron);

  const dropdown = document.createElement('div');
  dropdown.className = `
    hidden absolute right-0 mt-2 z-50
    w-64 max-w-[calc(100vw-2rem)]
    rounded-lg bg-gray-800 border border-gray-700 shadow-xl
    flex flex-col overflow-hidden
  `.trim();
  dropdown.setAttribute('role', 'menu');

  const searchWrapper = document.createElement('div');
  searchWrapper.className =
    'p-2 border-b border-gray-700 bg-gray-800 flex-shrink-0';

  const searchPlaceholder =
    t('nav.searchLanguage') !== 'nav.searchLanguage'
      ? t('nav.searchLanguage')
      : 'Search language…';

  const searchInput = document.createElement('input');
  searchInput.type = 'search';
  searchInput.placeholder = searchPlaceholder;
  searchInput.className = `
    w-full px-3 py-1.5 text-sm
    bg-gray-900 text-gray-200
    border border-gray-700 rounded-md
    focus:outline-none focus:border-indigo-500
    placeholder-gray-500
  `.trim();
  searchInput.setAttribute('aria-label', searchPlaceholder);
  searchWrapper.appendChild(searchInput);
  dropdown.appendChild(searchWrapper);

  const list = document.createElement('div');
  list.className = 'max-h-64 overflow-y-auto py-1';
  list.setAttribute('role', 'none');

  const emptyState = document.createElement('p');
  emptyState.className = 'hidden px-4 py-3 text-sm text-gray-400 text-center';
  const emptyText =
    t('nav.noLanguagesFound') !== 'nav.noLanguagesFound'
      ? t('nav.noLanguagesFound')
      : 'No languages found';
  emptyState.textContent = emptyText;

  const options: HTMLButtonElement[] = [];
  supportedLanguages.forEach((lang) => {
    const option = document.createElement('button');
    option.type = 'button';
    option.className = `
      w-full px-4 py-2 text-left text-sm text-gray-200
      hover:bg-gray-700 flex items-center gap-2 transition-colors
      ${lang === currentLang ? 'bg-gray-700' : ''}
    `.trim();
    option.setAttribute('role', 'menuitem');
    option.dataset.lang = lang;
    option.dataset.searchKey = `${languageNames[lang]} ${lang}`.toLowerCase();

    const name = document.createElement('span');
    name.textContent = languageNames[lang];
    option.appendChild(name);

    option.addEventListener('click', () => {
      if (lang !== currentLang) {
        changeLanguage(lang);
      }
    });

    options.push(option);
    list.appendChild(option);
  });

  list.appendChild(emptyState);
  dropdown.appendChild(list);

  const filterOptions = () => {
    const query = searchInput.value.trim().toLowerCase();
    let visible = 0;
    options.forEach((option) => {
      const key = option.dataset.searchKey || '';
      const match = !query || key.includes(query);
      option.classList.toggle('hidden', !match);
      if (match) visible++;
    });
    emptyState.classList.toggle('hidden', visible > 0);
  };

  searchInput.addEventListener('input', filterOptions);
  dropdown.addEventListener('click', (e) => {
    if (e.target instanceof HTMLButtonElement && e.target.dataset.lang) return;
    e.stopPropagation();
  });
  searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      dropdown.classList.add('hidden');
      button.setAttribute('aria-expanded', 'false');
      button.focus();
    }
  });

  container.appendChild(button);
  container.appendChild(dropdown);

  button.addEventListener('click', (e) => {
    e.stopPropagation();
    const isExpanded = button.getAttribute('aria-expanded') === 'true';
    const nextOpen = !isExpanded;
    button.setAttribute('aria-expanded', nextOpen.toString());
    dropdown.classList.toggle('hidden', !nextOpen);
    if (nextOpen) {
      searchInput.value = '';
      filterOptions();
      list.scrollTop = 0;
      requestAnimationFrame(() => searchInput.focus());
    }
  });

  document.addEventListener('click', () => {
    button.setAttribute('aria-expanded', 'false');
    dropdown.classList.add('hidden');
  });

  return container;
};

export const injectLanguageSwitcher = (): void => {
  const simpleModeContainer = document.getElementById(
    'simple-mode-language-switcher'
  );
  if (simpleModeContainer) {
    const switcher = createLanguageSwitcher();
    simpleModeContainer.appendChild(switcher);
    return;
  }

  // Try navbar first (desktop)
  const navbarContainer = document.getElementById('navbar-language-switcher');
  if (navbarContainer) {
    const switcher = createLanguageSwitcher();
    // Style for light navbar theme
    const button = switcher.querySelector('button');
    if (button) {
      button.className = `
        inline-flex items-center gap-1.5 text-sm font-medium
        bg-white text-gray-700 border border-gray-200
        px-3 py-1.5 rounded-lg transition-colors duration-200
        shadow-sm hover:bg-gray-50 hover:border-gray-300
      `.trim();
    }
    const dropdown = switcher.querySelector(
      'div[role="menu"]'
    ) as HTMLElement | null;
    if (dropdown) {
      dropdown.className = `
        hidden absolute right-0 mt-2 z-50
        w-64 max-w-[calc(100vw-2rem)]
        rounded-lg bg-white border border-gray-200 shadow-xl
        flex flex-col overflow-hidden
      `.trim();
      const searchWrapper = dropdown.querySelector('div');
      if (searchWrapper) {
        searchWrapper.className =
          'p-2 border-b border-gray-100 bg-white flex-shrink-0';
      }
      const searchInput = dropdown.querySelector('input');
      if (searchInput) {
        searchInput.className = `
          w-full px-3 py-1.5 text-sm
          bg-gray-50 text-gray-900
          border border-gray-200 rounded-md
          focus:outline-none focus:border-indigo-500
          placeholder-gray-400
        `.trim();
      }
      const options = dropdown.querySelectorAll('button[role="menuitem"]');
      options.forEach((opt) => {
        (opt as HTMLElement).className = `
          w-full px-4 py-2 text-left text-sm text-gray-700
          hover:bg-gray-50 flex items-center gap-2 transition-colors
        `.trim();
      });
    }
    navbarContainer.appendChild(switcher);
    return;
  }

  // Try navbar mobile (hamburger bar)
  const navbarMobileContainer = document.getElementById(
    'navbar-language-switcher-mobile'
  );
  if (navbarMobileContainer) {
    const switcher = createLanguageSwitcher();
    const button = switcher.querySelector('button');
    if (button) {
      button.className = `
        inline-flex items-center gap-1 text-sm font-medium
        bg-white text-gray-700 border border-gray-200
        px-2 py-1.5 rounded-lg transition-colors
        hover:bg-gray-50
      `.trim();
    }
    navbarMobileContainer.appendChild(switcher);
    return;
  }

  // Try mobile menu dropdown
  const mobileMenuContainer = document.getElementById(
    'mobile-menu-language-switcher'
  );
  if (mobileMenuContainer) {
    const switcher = createLanguageSwitcher();
    const button = switcher.querySelector('button');
    if (button) {
      button.className = `
        flex items-center justify-between w-full text-sm font-medium
        bg-white text-gray-700 border border-gray-200
        px-3 py-2 rounded-lg transition-colors
        hover:bg-gray-50
      `.trim();
    }
    const dropdown = switcher.querySelector(
      'div[role="menu"]'
    ) as HTMLElement | null;
    if (dropdown) {
      dropdown.className = `
        hidden absolute left-0 mt-2 z-50
        w-full max-w-[calc(100vw-2rem)]
        rounded-lg bg-white border border-gray-200 shadow-xl
        flex flex-col overflow-hidden
      `.trim();
      const searchWrapper = dropdown.querySelector('div');
      if (searchWrapper) {
        searchWrapper.className =
          'p-2 border-b border-gray-100 bg-white flex-shrink-0';
      }
      const searchInput = dropdown.querySelector('input');
      if (searchInput) {
        searchInput.className = `
          w-full px-3 py-1.5 text-sm
          bg-gray-50 text-gray-900
          border border-gray-200 rounded-md
          focus:outline-none focus:border-indigo-500
          placeholder-gray-400
        `.trim();
      }
      const options = dropdown.querySelectorAll('button[role="menuitem"]');
      options.forEach((opt) => {
        (opt as HTMLElement).className = `
          w-full px-4 py-2 text-left text-sm text-gray-700
          hover:bg-gray-50 flex items-center gap-2 transition-colors
        `.trim();
      });
    }
    mobileMenuContainer.appendChild(switcher);
    return;
  }

  // Fallback to footer
  const footer = document.querySelector('footer');
  if (!footer) return;

  const headings = footer.querySelectorAll('h3, h4');
  let followUsColumn: HTMLElement | null = null;

  headings.forEach((heading) => {
    const text = heading.textContent?.trim();
    if (
      text === 'Follow Us' ||
      text === 'Folgen Sie uns' ||
      text === 'Theo dõi chúng tôi'
    ) {
      followUsColumn = heading.parentElement;
    }
  });

  if (followUsColumn) {
    const socialIconsContainer = followUsColumn.querySelector('.space-x-4');

    if (socialIconsContainer) {
      const wrapper = document.createElement('div');
      wrapper.className = 'inline-flex flex-col gap-4';

      socialIconsContainer.parentNode?.insertBefore(
        wrapper,
        socialIconsContainer
      );

      wrapper.appendChild(socialIconsContainer);
      const switcher = createLanguageSwitcher();

      switcher.className = 'relative w-full';

      const button = switcher.querySelector('button');
      if (button) {
        button.className = `
                    flex items-center justify-between w-full text-sm font-medium
                    bg-gray-800 text-gray-400 border border-gray-700
                    px-3 py-2 rounded-lg transition-colors duration-200
                    hover:text-white hover:border-gray-600
                `.trim();
      }

      const dropdown = switcher.querySelector(
        'div[role="menu"]'
      ) as HTMLElement | null;
      if (dropdown) {
        dropdown.classList.remove('mt-2', 'w-64');
        dropdown.classList.add('bottom-full', 'mb-2', 'w-full');
      }

      wrapper.appendChild(switcher);
    } else {
      const switcherContainer = document.createElement('div');
      switcherContainer.className = 'mt-4 w-full';
      const switcher = createLanguageSwitcher();
      switcherContainer.appendChild(switcher);
      followUsColumn.appendChild(switcherContainer);
    }
  }
};
