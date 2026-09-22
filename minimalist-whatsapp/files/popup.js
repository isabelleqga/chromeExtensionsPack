const NAVBAR_PREFERENCES = ['header', 'calls', 'status', 'channels', 'communities', 'divider', 'meta-ai', 'footer'];
const CHATLIST_PREFERENCES = ['drawer-title', 'new-chat', 'search', 'filters', 'locked-chats', 'encryption-info', 'intro-panel'];
const CHATS_PREFERENCES = ['message-details', 'last-message'];
const PREFERENCES = [...NAVBAR_PREFERENCES, ...CHATLIST_PREFERENCES, ...CHATS_PREFERENCES];

const translations = {
  en: {
    title: 'Minimalist WhatsApp',
    tabNavbar: 'Navbar',
    tabChatlist: 'Chatlist',
    tabChats: 'Chats',
    header: 'Entire header',
    calls: 'Calls',
    status: 'Status',
    channels: 'Channels',
    communities: 'Communities',
    divider: 'Divider',
    metaAi: 'Meta AI',
    footer: 'Footer icons',
    search: 'Search bar',
    newChat: 'New chat button',
    filters: 'Filters',
    drawerTitle: 'Drawer title',
    messageDetails: 'Message details',
    lastMessage: 'Last message',
    encryptionInfo: 'Encryption info',
    introPanel: 'Intro panel',
    lockedChats: 'Locked chats',
  },
  pt: {
    title: 'WhatsApp Minimalista',
    tabNavbar: 'Navegação',
    tabChatlist: 'Lista de conversas',
    tabChats: 'Conversas',
    header: 'Cabeçalho inteiro',
    calls: 'Chamadas',
    status: 'Status',
    channels: 'Canais',
    communities: 'Comunidades',
    divider: 'Divisor',
    metaAi: 'Meta AI',
    footer: 'Rodapé',
    search: 'Barra de busca',
    newChat: 'Botão nova conversa',
    filters: 'Filtros',
    drawerTitle: 'Título',
    messageDetails: 'Detalhes da mensagem',
    lastMessage: 'Última mensagem',
    encryptionInfo: 'Aviso de Criptografia',
    introPanel: 'Painel inicial',
    lockedChats: 'Conversas trancadas',
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

// Quando "Cabeçalho inteiro" está ativo, os demais toggles da aba Navbar
// ficam forçados em true e travados, já que ficam visualmente redundantes.
function setNavbarLock(locked) {
  NAVBAR_PREFERENCES.forEach((key) => {
    if (key === 'header') return;
    const checkbox = document.getElementById(key);
    if (!checkbox) return;
    checkbox.disabled = locked;
    if (locked) {
      checkbox.checked = true;
      chrome.storage.local.set({ [key]: true });
    }
  });
}

function switchTab(tabName) {
  document.querySelectorAll('.tab-btn').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.tab === tabName);
  });
  document.querySelectorAll('.tab-content').forEach((content) => {
    content.classList.toggle('active', content.id === `tab-${tabName}`);
  });
}

// Idioma: sempre detectado a partir do navegador, sem opção de troca manual
applyLanguage(detectBrowserLanguage());

document.querySelectorAll('.tab-btn').forEach((btn) => {
  btn.addEventListener('click', () => switchTab(btn.dataset.tab));
});

// Aba inicial
switchTab('navbar');

// Ao abrir o popup, carrega o estado salvo dos botões e marca os checkboxes corretamente
chrome.storage.local.get(PREFERENCES, (result) => {
  PREFERENCES.forEach((key) => {
    const checkbox = document.getElementById(key);
    if (checkbox) {
      checkbox.checked = result[key] === true; // default é false (o usuário ativa um por um)
    }
  });

  const headerCheckbox = document.getElementById('header');
  if (headerCheckbox) {
    setNavbarLock(headerCheckbox.checked);
  }
});

// Adiciona um evento de escuta ("listener") para salvar sempre que o usuário clicar em um checkbox
PREFERENCES.forEach((key) => {
  const checkbox = document.getElementById(key);
  if (checkbox) {
    checkbox.addEventListener('change', (e) => {
      const saveObj = {};
      saveObj[key] = e.target.checked;
      chrome.storage.local.set(saveObj);
    });
  }
});

const headerCheckbox = document.getElementById('header');
if (headerCheckbox) {
  headerCheckbox.addEventListener('change', (e) => setNavbarLock(e.target.checked));
}
