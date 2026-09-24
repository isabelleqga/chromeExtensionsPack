const translations = {
  en: {
    title: 'Layout Settings',
    feedWidth: 'Feed Width',
    darkMode: 'Dark Mode',
  },
  pt: {
    title: 'Ajustes de Layout',
    feedWidth: 'Largura do Feed',
    darkMode: 'Modo escuro',
  },
};

// Detecta o idioma do navegador; usa português para qualquer variante pt-*, inglês para o resto
function detectBrowserLanguage() {
  const browserLang = (navigator.language || 'en').toLowerCase();
  return browserLang.startsWith('pt') ? 'pt' : 'en';
}

function applyLanguage(lang) {
  const dict = translations[lang] || translations.en;
  document.documentElement.lang = lang === 'pt' ? 'pt-BR' : 'en';

  document.querySelectorAll('[data-i18n]').forEach((el) => {
    const key = el.getAttribute('data-i18n');
    if (dict[key]) el.textContent = dict[key];
  });
}

// Idioma: sempre detectado a partir do navegador, sem opção de troca manual
applyLanguage(detectBrowserLanguage());

document.addEventListener('DOMContentLoaded', () => {
  const inputLargura = document.getElementById('inputLargura');
  const valLargura = document.getElementById('valLargura');
  const darkModeToggle = document.getElementById('darkMode');

  // Aplica o tema do próprio popup a partir do estado salvo do toggle
  function applyPopupTheme(enabled) {
    document.documentElement.setAttribute('data-theme', enabled ? 'dark' : 'light');
  }

  // Carrega os valores salvos e aplica no popup ao abrir
  chrome.storage.sync.get(['largura', 'darkMode'], (res) => {
    inputLargura.value = res.largura || 80;
    valLargura.textContent = inputLargura.value + '%';
    darkModeToggle.checked = res.darkMode || false;
    applyPopupTheme(darkModeToggle.checked);
  });

  // Slider aplica em tempo real, sem precisar de botão
  inputLargura.addEventListener('input', () => {
    valLargura.textContent = inputLargura.value + '%';
    chrome.storage.sync.set({ largura: inputLargura.value });
  });

  // Modo escuro também aplica em tempo real, no Pinterest e no próprio popup
  darkModeToggle.addEventListener('change', () => {
    chrome.storage.sync.set({ darkMode: darkModeToggle.checked });
    applyPopupTheme(darkModeToggle.checked);
  });
});
