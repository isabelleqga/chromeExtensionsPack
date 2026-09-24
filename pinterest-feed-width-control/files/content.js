chrome.storage.sync.get(['largura', 'darkMode'], (res) => {
  const largura = res.largura || 80;
  const darkMode = res.darkMode || false;

  function applyPinterestStyles(largura) {
    let style = document.getElementById('pinterest-mod-style');
    if (!style) {
      style = document.createElement('style');
      style.id = 'pinterest-mod-style';
      document.head.appendChild(style);
    }

    style.textContent = `
      /* 1. Liberate outer wrappers to span full screen and center their contents */
      /* By using > div, we target the randomly named class without needing its actual name! */
      main,
      [data-test-id="masonry-container"],
      [data-test-id="masonry-container"] > div {
        max-width: 100% !important;
        width: 100% !important;
        display: flex !important;
        justify-content: center !important;
        margin-left: 0 !important;
        padding-left: 0 !important;
      }

      /* 2. Apply your custom width ONLY to the primary wrapper */
      [data-test-id="max-width-container"] {
        max-width: ${largura}% !important;
        width: ${largura}% !important;
        margin: 0 auto !important;
      }

      /* 3. Tell the inner wrappers and the pin list to fill your chosen width perfectly */
      [data-test-id="max-width-container"] > div,
      div[role="list"] {
        max-width: 100% !important;
        width: 100% !important;
        margin: 0 auto !important;
      }
    `;

    // Force Pinterest to recalculate pin positions
    window.dispatchEvent(new Event('resize'));
  }

  // Falso modo escuro: inverte as cores da página inteira e desfaz a
  // inversão em fotos/vídeos/ícones para que continuem com cores naturais.
  // Como o Pinterest não expõe um tema escuro real, essa é a abordagem mais
  // resistente às mudanças de classes/DOM geradas dinamicamente pelo site.
  function applyDarkMode(enabled) {
    let style = document.getElementById('pinterest-dark-mode-style');

    if (!enabled) {
      if (style) style.remove();
      return;
    }

    if (!style) {
      style = document.createElement('style');
      style.id = 'pinterest-dark-mode-style';
      document.head.appendChild(style);
    }

    style.textContent = `
      html {
        filter: invert(1) hue-rotate(180deg) !important;
        background: #fff !important;
      }

      img, video, iframe, canvas, [style*="background-image"] {
        filter: invert(1) hue-rotate(180deg) !important;
      }
    `;
  }

  // Guarda os valores atuais para o Observer poder reaplicá-los
  let currentLargura = largura;
  let currentDarkMode = darkMode;

  // Aplica o estado inicial assim que a página carrega
  applyPinterestStyles(currentLargura);
  applyDarkMode(currentDarkMode);

  // O Observer para combater os re-renders automáticos do Pinterest,
  // que removem os <style> injetados
  const observer = new MutationObserver(() => {
    if (!document.getElementById('pinterest-mod-style')) {
      applyPinterestStyles(currentLargura);
    }
    if (currentDarkMode && !document.getElementById('pinterest-dark-mode-style')) {
      applyDarkMode(true);
    }
  });

  observer.observe(document.head, {
    childList: true,
    subtree: true
  });

  // Escuta mudanças feitas no popup e aplica instantaneamente, sem recarregar a página
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== 'sync') return;

    if (changes.largura) {
      currentLargura = changes.largura.newValue;
      applyPinterestStyles(currentLargura);
    }

    if (changes.darkMode) {
      currentDarkMode = changes.darkMode.newValue;
      applyDarkMode(currentDarkMode);
    }
  });
});
