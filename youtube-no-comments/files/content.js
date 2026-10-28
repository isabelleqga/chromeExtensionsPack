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


// ===== Tag de "tempo na lista" na playlist Assistir mais tarde =====
// A página não expõe a data de inclusão. Por isso a ordem "Data de inclusão (mais antigo)" é
// gravada uma vez (botão no popup) e os vídeos adicionados depois recebem a data em que foram vistos.
const WL_KEYS = ['wlTags', 'wlOrder', 'wlDates', 'wlCapturedAt'];

const wlStrings = {
    en: {
        oldest: (rank) => `#${rank}`,
        today: 'today',
        day: 'yesterday',
        days: (n) => `${n} days`,
        tip: (rank) => `Position ${rank} in the waiting order (1 = waiting the longest)`,
    },
    pt: {
        oldest: (rank) => `#${rank}`,
        today: 'hoje',
        day: 'ontem',
        days: (n) => `${n} dias`,
        tip: (rank) => `Posição ${rank} na ordem de espera (1 = espera há mais tempo)`,
    },
};
const wlLang = (navigator.language || 'en').toLowerCase().startsWith('pt') ? 'pt' : 'en';
const wl = wlStrings[wlLang];

function isWatchLater() {
    return location.pathname === '/playlist' && new URLSearchParams(location.search).get('list') === 'WL';
}

function getVideoItems() {
    return [...document.querySelectorAll('ytd-playlist-video-renderer')];
}

function getVideoId(item) {
    const link = item.querySelector('a#thumbnail[href*="v="], a#video-title[href*="v="]');
    if (!link) return null;
    try {
        return new URL(link.href).searchParams.get('v');
    } catch (e) {
        return null;
    }
}

// Enquanto existir o item de continuação, o YouTube ainda não carregou a lista inteira
function listFullyLoaded() {
    return !document.querySelector('ytd-playlist-video-list-renderer ytd-continuation-item-renderer');
}

// Conta dias de calendário (virou a meia-noite = outro dia), não blocos de 24 horas
function daysSince(addedAt) {
    const startOfDay = (time) => new Date(time).setHours(0, 0, 0, 0);
    return Math.round((startOfDay(Date.now()) - startOfDay(addedAt)) / 86400000);
}

function formatTime(addedAt) {
    const days = daysSince(addedAt);
    if (days <= 0) return wl.today;
    return days === 1 ? wl.day : wl.days(days);
}

// Cor da tag: vídeos com data usam dias de espera; os só com posição usam o terço da fila em que estão
function getLevel(addedAt, rank, undatedCount) {
    if (addedAt) {
        const days = daysSince(addedAt);
        if (days < 7) return 'fresh';
        if (days < 14) return 'recent';
        if (days < 30) return 'aging';
        return 'old';
    }
    const position = rank / undatedCount;
    if (position <= 1 / 3) return 'old';
    return position <= 2 / 3 ? 'aging' : 'recent';
}

// Ao recarregar a extensão, o content.js antigo continua vivo na aba e o chrome.* passa a lançar
// "Extension context invalidated". Nesse caso ele se desliga em silêncio.
function extensionAlive() {
    if (chrome.runtime && chrome.runtime.id) return true;
    clearTimeout(wlTimer);
    wlObserver.disconnect();
    document.removeEventListener('yt-navigate-finish', scheduleUpdate);
    return false;
}

function updateTags() {
    if (!extensionAlive() || !isWatchLater()) return;

    chrome.storage.local.get(WL_KEYS, (data) => {
        // Recurso desligado no popup: remove as tags e não acompanha a lista
        if (data.wlTags !== true) {
            document.querySelectorAll('.wl-age-tag').forEach((tag) => tag.remove());
            return;
        }

        let order = data.wlOrder;
        if (!order || !order.length) return; // sem ordem gravada ainda: nada a mostrar

        let dates = data.wlDates || {};
        const items = getVideoItems()
            .map((item) => ({ item, id: getVideoId(item) }))
            .filter((entry) => entry.id);
        if (!items.length) return;

        let changed = false;

        // Vídeos novos entram no fim da fila, datados com o dia em que foram vistos
        items.forEach(({ id }) => {
            if (!order.includes(id)) {
                order.push(id);
                dates[id] = Date.now();
                changed = true;
            }
        });

        // Com a lista inteira carregada, remove da fila os vídeos que saíram da playlist
        if (listFullyLoaded()) {
            const present = new Set(items.map((entry) => entry.id));
            const pruned = order.filter((id) => present.has(id));
            if (pruned.length !== order.length) {
                order = pruned;
                Object.keys(dates).forEach((id) => { if (!present.has(id)) delete dates[id]; });
                changed = true;
            }
        }

        if (changed) chrome.storage.local.set({ wlOrder: order, wlDates: dates });

        const undatedCount = order.filter((id) => !dates[id]).length;

        items.forEach(({ item, id }) => {
            const rank = order.indexOf(id) + 1;
            const text = dates[id] ? formatTime(dates[id]) : wl.oldest(rank);

            let tag = item.querySelector('.wl-age-tag');
            if (!tag) {
                tag = document.createElement('span');
                tag.className = 'wl-age-tag';
                (item.querySelector('ytd-thumbnail') || item).appendChild(tag);
            }
            if (tag.textContent !== text) tag.textContent = text;
            const level = getLevel(dates[id], rank, undatedCount);
            if (tag.dataset.level !== level) tag.dataset.level = level;
            tag.title = wl.tip(rank);
        });
    });
}

let wlTimer = null;
function scheduleUpdate() {
    if (!extensionAlive()) return;
    clearTimeout(wlTimer);
    wlTimer = setTimeout(updateTags, 300);
}

// Grava a ordem atual da página (deve estar ordenada por "Data de inclusão (mais antigo)")
let capturing = false;
async function captureOrder() {
    if (capturing || !isWatchLater()) return;
    capturing = true;
    chrome.storage.local.set({ wlCaptureStatus: 'running' });

    // Rola até o fim para o YouTube carregar todos os vídeos
    let lastCount = -1;
    let stable = 0;
    for (let i = 0; i < 80 && stable < 3; i++) {
        window.scrollTo(0, document.documentElement.scrollHeight);
        await new Promise((resolve) => setTimeout(resolve, 800));
        const count = getVideoItems().length;
        stable = (count === lastCount && listFullyLoaded()) ? stable + 1 : 0;
        lastCount = count;
    }
    window.scrollTo(0, 0);

    const ids = [...new Set(getVideoItems().map(getVideoId).filter(Boolean))];
    if (ids.length) {
        chrome.storage.local.set({
            wlOrder: ids,
            wlDates: {},
            wlCapturedAt: Date.now(),
            wlCaptureStatus: 'done',
        });
    } else {
        chrome.storage.local.set({ wlCaptureStatus: 'error' });
    }
    capturing = false;
}

chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== 'local') return;
    if (changes.wlCaptureRequest) captureOrder();
    if (changes.wlTags || changes.wlOrder || changes.wlDates) scheduleUpdate();
});

// O YouTube é uma SPA: reaplica as tags ao navegar e quando a lista é re-renderizada
document.addEventListener('yt-navigate-finish', scheduleUpdate);
const wlObserver = new MutationObserver(() => { if (isWatchLater()) scheduleUpdate(); });
wlObserver.observe(document.body, { childList: true, subtree: true });
scheduleUpdate();
