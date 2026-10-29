const translations = {
    en: {
        title: 'YouTube No Comments',
        comments: 'Hide comments',
        commentsHint: "stupidity doesn't take a day off",
        sidebar: 'Hide sidebar',
        posts: 'Hide community posts',
        wlTitle: 'Watch Later tags',
        wlHint: 'Open Watch Later, sort by "Date added (oldest)", then record the order. Switch back to manual sort afterwards.',
        wlButton: 'Record',
        wlButtonHint: 'Only press this if there are videos in your list without a tag. After the first recording, new videos are tagged automatically with the date they were added.',
        wlNone: 'No order recorded yet',
        wlRunning: 'Recording...',
        wlError: 'Open the Watch Later playlist first',
        wlDone: (n, date) => `${n} videos · ${date}`,
    },
    pt: {
        title: 'YouTube Sem Comentários',
        comments: 'Ocultar comentários',
        commentsHint: 'estupidez não tira day-off',
        sidebar: 'Ocultar barra lateral',
        posts: 'Ocultar posts da comunidade',
        wlTitle: 'Tags do Assistir mais tarde',
        wlHint: 'Abra o Assistir mais tarde, ordene por "Data de inclusão (mais antigo)" e grave a ordem. Depois volte para a ordem manual.',
        wlButton: 'Gravar',
        wlButtonHint: 'Só clique aqui se houver vídeos na lista sem tag. Depois da primeira gravação, os vídeos novos são marcados automaticamente com a data em que foram adicionados.',
        wlNone: 'Nenhuma ordem gravada ainda',
        wlRunning: 'Gravando...',
        wlError: 'Abra primeiro a playlist Assistir mais tarde',
        wlDone: (n, date) => `${n} vídeos · ${date}`,
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
        if (typeof dict[key] === 'string') el.textContent = dict[key];
    });

    // Textos longos ficam no tooltip (title) para não ocupar espaço no popup
    document.querySelectorAll('[data-i18n-title]').forEach((el) => {
        const key = el.getAttribute('data-i18n-title');
        if (typeof dict[key] === 'string') el.title = dict[key];
    });
}

// Idioma: sempre detectado a partir do navegador, sem opção de troca manual
applyLanguage(detectBrowserLanguage());

// "Ocultar comentários" é travado sempre ativo e não pode mais ser desligado
const commentsCheckbox = document.getElementById('comments');
if (commentsCheckbox) {
    commentsCheckbox.checked = true;
    commentsCheckbox.disabled = true;
}
chrome.storage.local.remove('comments');

const preferences = ['sidebar', 'posts'];

// Ao abrir o popup, carrega o estado salvo dos botões e marca os checkboxes corretamente
chrome.storage.local.get(preferences, (result) => {
    preferences.forEach(key => {
        const checkbox = document.getElementById(key);
        if (checkbox) {
            checkbox.checked = result[key] !== false; // default é true (ocultar)
        }
    });
});

// Adiciona um evento de escuta ("listener") para salvar sempre que o usuário clicar em um checkbox
preferences.forEach(key => {
    const checkbox = document.getElementById(key);
    if (checkbox) {
        checkbox.addEventListener('change', (e) => {
            const saveObj = {};
            saveObj[key] = e.target.checked;
            chrome.storage.local.set(saveObj);
        });
    }
});

// ===== Tags de tempo no Assistir mais tarde =====
// Ao contrário dos outros toggles, este começa desligado; a linha de gravar só aparece quando ligado
const wlTagsCheckbox = document.getElementById('wlTags');
const wlRecordRow = document.getElementById('wlRecordRow');

chrome.storage.local.get(['wlTags'], (result) => {
    wlTagsCheckbox.checked = result.wlTags === true;
    wlRecordRow.hidden = !wlTagsCheckbox.checked;
});

wlTagsCheckbox.addEventListener('change', (e) => {
    wlRecordRow.hidden = !e.target.checked;
    chrome.storage.local.set({ wlTags: e.target.checked });
});

const wlDict = translations[detectBrowserLanguage()];
const wlStatus = document.getElementById('wlStatus');
const wlButton = document.getElementById('wlCapture');

function renderWlStatus() {
    chrome.storage.local.get(['wlOrder', 'wlCapturedAt', 'wlCaptureStatus'], (result) => {
        if (result.wlCaptureStatus === 'running' || result.wlCaptureStatus === 'requested') {
            wlStatus.textContent = wlDict.wlRunning;
        } else if (result.wlOrder && result.wlOrder.length && result.wlCapturedAt) {
            const date = new Date(result.wlCapturedAt).toLocaleDateString(navigator.language);
            wlStatus.textContent = wlDict.wlDone(result.wlOrder.length, date);
        } else if (result.wlCaptureStatus === 'error') {
            wlStatus.textContent = wlDict.wlError;
        } else {
            wlStatus.textContent = wlDict.wlNone;
        }
    });
}

// O content.js da aba aberta na playlist escuta este pedido, passa o status para "running" e grava a ordem
wlButton.addEventListener('click', () => {
    chrome.storage.local.set({ wlCaptureRequest: Date.now(), wlCaptureStatus: 'requested' });
    // Se nenhuma aba do Assistir mais tarde assumir o pedido, avisa depois de alguns segundos
    setTimeout(() => {
        chrome.storage.local.get(['wlCaptureStatus'], (result) => {
            if (result.wlCaptureStatus === 'requested') {
                chrome.storage.local.set({ wlCaptureStatus: 'error' });
            }
        });
    }, 4000);
});

chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'local' && (changes.wlCaptureStatus || changes.wlOrder)) renderWlStatus();
});
renderWlStatus();
