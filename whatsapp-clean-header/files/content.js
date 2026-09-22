// Lista de chaves que representam as classes CSS e os IDs no popup
const preferences = [
    'header', 'calls', 'status', 'channels', 'communities', 'divider', 'meta-ai', 'footer',
    'drawer-title', 'new-chat', 'search', 'filters', 'encryption-info', 'intro-panel', 'locked-chats',
    'message-details', 'last-message',
];

// Função para aplicar as classes no body baseado nas preferências
function applyStyles(result) {
    preferences.forEach(key => {
        const className = `hide-${key}`;
        // Padrão é ocultar (true); só deixa de ocultar se o usuário desativou explicitamente
        if (result[key] !== false) {
            document.body.classList.add(className);
        } else {
            document.body.classList.remove(className);
        }
    });
}

// 1. Aplica o estado inicial assim que a página carrega
chrome.storage.local.get(preferences, (result) => {
    applyStyles(result);
});

// 2. Escuta mudanças feitas no popup e aplica instantaneamente, sem precisar recarregar
chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'local') {
        chrome.storage.local.get(preferences, (result) => {
            applyStyles(result);
        });
    }
});