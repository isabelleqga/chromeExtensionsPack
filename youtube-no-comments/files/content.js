// A seção de comentários é sempre oculta e não é mais configurável
document.body.classList.add('hide-comments');

// "Ocultar barra lateral" continua configurável pelo popup
function applyStyles(result) {
    if (result.sidebar !== false) {
        document.body.classList.add('hide-sidebar');
    } else {
        document.body.classList.remove('hide-sidebar');
    }
}

// 1. Aplica o estado inicial assim que a página carrega
chrome.storage.local.get(['sidebar'], (result) => {
    applyStyles(result);
});

// 2. Escuta mudanças feitas no popup e aplica instantaneamente, sem precisar recarregar
chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'local') {
        chrome.storage.local.get(['sidebar'], (result) => {
            applyStyles(result);
        });
    }
});
