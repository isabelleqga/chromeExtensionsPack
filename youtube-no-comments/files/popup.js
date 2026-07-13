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
