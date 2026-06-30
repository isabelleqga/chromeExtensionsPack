document.addEventListener('DOMContentLoaded', () => {
  const inputLargura = document.getElementById('inputLargura');
  const valLargura = document.getElementById('valLargura');
  const btnSalvar = document.getElementById('salvar');

  // 2. STORAGE FALTANTE: Pedindo as chaves showBusca e showLateral
  chrome.storage.sync.get(['largura'], (res) => {
    inputLargura.value = res.largura || 80;
    valLargura.textContent = inputLargura.value + '%';
    
  });

  inputLargura.addEventListener('input', () => {
    valLargura.textContent = inputLargura.value + '%';
  });

  btnSalvar.addEventListener('click', () => {
    chrome.storage.sync.set({
      largura: inputLargura.value,
    }, () => {
      chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
        // 4. SEGURANÇA: Verifica se a aba e a URL realmente existem antes do includes()
        if(tabs[0] && tabs[0].url && tabs[0].url.includes("pinterest")) {
          chrome.tabs.reload(tabs[0].id);
        }
      });
      window.close();
    });
  });
});