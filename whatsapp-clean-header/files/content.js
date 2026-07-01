// Lista de chaves que representam as classes CSS e os IDs no popup
const preferences = ['status', 'channels', 'communities', 'meta-ai', 'divider', 'filters'];

// Função para aplicar as classes no body baseado nas preferências
function applyStyles(result) {
    preferences.forEach(key => {
        const className = `hide-${key}`;
        // Se a preferência for true (toggle ativado para ocultar), adiciona a classe
        if (result[key] === true) {
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