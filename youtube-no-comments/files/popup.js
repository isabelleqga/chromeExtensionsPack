const translations = {
    en: {
        title: 'YouTube No Comments',
        comments: 'Hide comments',
        commentsHint: "stupidity doesn't take a day off",
        sidebar: 'Hide sidebar',
    },
    pt: {
        title: 'YouTube Sem Comentários',
        comments: 'Ocultar comentários',
        commentsHint: 'estupidez não tira day-off',
        sidebar: 'Ocultar barra lateral',
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

// "Ocultar comentários" é travado sempre ativo e não pode mais ser desligado
const commentsCheckbox = document.getElementById('comments');
if (commentsCheckbox) {
    commentsCheckbox.checked = true;
    commentsCheckbox.disabled = true;
}
chrome.storage.local.remove('comments');

const preferences = ['sidebar'];

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
