chrome.storage.sync.get(['largura'], (res) => {
  const largura = res.largura || 80;

  function applyPinterestStyles() {
    if (document.getElementById('pinterest-mod-style')) return;

    const style = document.createElement('style');
    style.id = 'pinterest-mod-style';
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
    document.head.appendChild(style);
    
    // Force Pinterest to recalculate pin positions
    window.dispatchEvent(new Event('resize'));
  }

  // Initial load
  applyPinterestStyles();

  // The Observer to fight Pinterest's auto-reloads
  const observer = new MutationObserver(() => {
    applyPinterestStyles();
  });

  observer.observe(document.head, { 
    childList: true, 
    subtree: true 
  });
});