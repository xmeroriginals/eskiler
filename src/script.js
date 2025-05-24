"use strict";
const searchInput = document.getElementById("search-input");
const resultsList = document.getElementById("results");
const emptyState = document.getElementById("empty-state");
const notification = document.getElementById("notification");
const themeToggle = document.getElementById("theme-toggle");
const sunIcon = document.getElementById("sun-icon");
const moonIcon = document.getElementById("moon-icon");
const backToTopBtn = document.getElementById('backToTopBtn');
const elem = document.getElementById("TDK");
const TDKManuelSearchBtn = document.getElementById("TDKManuelSearch");

let hideTimeout;
let data = [];
let lastSearchTime = 0;
const searchDebounceTime = 200;
const defaultPlaceholder = "Kelimenizi yazınız...";
elem.classList.add('hidden');

document.addEventListener("DOMContentLoaded", () => {
    loadData();
    setupThemeToggle();
    setupSearchInput();

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        document.documentElement.style.scrollBehavior = "auto";
    }
});

function setupThemeToggle() {
    const savedTheme = localStorage.getItem("theme");
    const systemPrefersDark = window.matchMedia(
        "(prefers-color-scheme: dark)"
    ).matches;

    if (savedTheme === "dark" || (!savedTheme && systemPrefersDark)) {
        document.documentElement.classList.add("dark");
        moonIcon.classList.remove("hidden");
        sunIcon.classList.add("hidden");
    } else {
        document.documentElement.classList.remove("dark");
        sunIcon.classList.remove("hidden");
        moonIcon.classList.add("hidden");
    }

    themeToggle.addEventListener("click", () => {
        const isDark = document.documentElement.classList.toggle("dark");
        localStorage.setItem("theme", isDark ? "dark" : "light");

        if (isDark) {
            moonIcon.classList.remove("hidden");
            sunIcon.classList.add("hidden");
        } else {
            sunIcon.classList.remove("hidden");
            moonIcon.classList.add("hidden");
        }
    });
}

function setupSearchInput() {
    emptyState.classList.remove("hidden");
    resultsList.classList.add("hidden");

    if (!data || !Array.isArray(data) || data.length === 0 || !data.every(item => typeof item === 'object' && item !== null)) {
        return;
    }

    searchInput.addEventListener("input", function () {
        const now = Date.now();
        if (now - lastSearchTime < searchDebounceTime) return;
        lastSearchTime = now;

        setTimeout(() => {
            const searchTerm = this.value.trim();
            if (searchTerm === "") {
                clearResults();
            } else {
                searchData(searchTerm);
            }
        }, searchDebounceTime);
    });

    if (window.innerWidth > 768) {
        setTimeout(() => searchInput.focus(), 300);
    }
}

async function loadData() {
    try {
        emptyState.innerHTML = `
                    <div class="mx-auto h-24 w-24 mb-4 flex items-center justify-center">
                        <svg class="animate-spin h-12 w-12 text-primary-light dark:text-primary-dark" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                    </div>
                    <p class="text-sm text-gray-400 dark:text-gray-500">Yükleniyor...</p>
                `;

        await new Promise((resolve) => setTimeout(resolve, 600));
        const response = await fetch("./data/data.json");
        data = await response.json();

        emptyState.innerHTML = `
                    <div class="mx-auto h-24 w-24 mb-4 flex items-center justify-center">
                        <svg class="h-full w-full text-gray-300 dark:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9.663 17h4.673M12 3v1m8.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                    </div>
                    <h3 class="text-lg font-medium text-gray-500 dark:text-gray-400 mb-1">Arama yapın</h3>
                    <p class="text-sm text-gray-400 dark:text-gray-500 max-w-xs mx-auto text-balance">
                        Eski kelimelerin modern karşılıklarını keşfetmek için bir kelime yazın
                    </p>
                `;
    } catch (err) {
        showNotification("Veriler yüklenirken bir hata oluştu.", "error");

        emptyState.innerHTML = `
                    <div class="mx-auto h-24 w-24 mb-4 flex items-center justify-center text-red-400">
                        <svg class="h-full w-full" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                    <h3 class="text-lg font-medium text-gray-500 dark:text-gray-400 mb-1">Bir hata oluştu</h3>
                    <p class="text-sm text-gray-400 dark:text-gray-500 max-w-xs mx-auto">
                        Veriler yüklenirken bir sorun oluştu. Lütfen sayfayı yenileyin.
                    </p>
                `;
    }
}

function searchData(searchTerm) {
    if ("requestIdleCallback" in window) {
        requestIdleCallback(
            () => {
                performSearch(searchTerm);
            },
            { timeout: 500 }
        );
    } else {
        performSearch(searchTerm);
    }
}
function normalizeString(str) {
    return str
        .toLowerCase()
        .replace("i", "i")
        .replace("i̇", "i")
        .replace("ğ", "g")
        .replace("ü", "u")
        .replace("ş", "s")
        .replace("ö", "o")
        .replace("ç", "c");
}

function performSearch(searchTerm) {
    if (!data || !Array.isArray(data) || data.length === 0 || !data.every(item => typeof item === 'object' && item !== null)) {
        showNotification("Bir hata oluştu.", "error");
        return;
    }

    const normalizedSearchTerm = normalizeString(searchTerm);
    const results = data.filter((item) => {
        for (let key in item) {
            const eskiKelime = normalizeString(key);
            const yeniKelime = normalizeString(item[key]);
            if (
                eskiKelime.includes(normalizedSearchTerm) ||
                yeniKelime.includes(normalizedSearchTerm)
            ) {
                return true;
            }
            const eskiKelimeler = eskiKelime.split(",").map((k) => k.trim());
            const yeniKelimeler = yeniKelime.split(",").map((k) => k.trim());

            if (
                eskiKelimeler.some((k) => k.includes(normalizedSearchTerm)) ||
                yeniKelimeler.some((k) => k.includes(normalizedSearchTerm))
            ) {
                return true;
            }
        }
        return false;
    });

    displayResults(results);
}


function displayResults(results) {
    if (results.length === 0 && searchInput.value.trim() !== "") {
        emptyState.innerHTML = `
                    <div class="mx-auto h-24 w-24 mb-4 flex items-center justify-center text-gray-300 dark:text-gray-600">
                        <svg class="h-full w-full" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <h3 class="text-lg font-medium text-gray-500 dark:text-gray-400 mb-1">Sonuç bulunamadı</h3>
                    <p class="text-sm text-gray-400 dark:text-gray-500 max-w-xs mx-auto break-words">
                        "${searchInput.value.trim()}" için bir sonuç bulunamadı
                    </p>
                    <button id="TDKSearch" class="mt-5 bg-surface-light dark:bg-surface-dark border border-gray-200 dark:border-gray-700 rounded-xl p-4 cursor-pointer transition-all duration-200 font-medium text-onSurface-light dark:text-onSurface-dark truncate">
                        TDK Üzerinde Arayın
                    </button>
                `;
        emptyState.classList.remove("hidden");
        resultsList.classList.add("hidden");

        const tdkSearchBtn = document.getElementById("TDKSearch");
        tdkSearchBtn.addEventListener("click", () => {
            searchTDK(results);
        });

        return;
    } else if (results.length === 0) {
        clearResults();
        return;
    }

    emptyState.classList.add("hidden");
    resultsList.classList.remove("hidden");
    resultsList.innerHTML = "";

    results.forEach((item, index) => {
        for (let key in item) {
            const eskiKelime = key;
            const yeniKelime = item[key];
            const listItem = createResultItem(
                eskiKelime,
                yeniKelime,
                index * 50
            );
            resultsList.appendChild(listItem);
        }
    });
}

function createResultItem(title, description, delay) {
    const listItem = document.createElement("li");
    listItem.className = `result-item bg-surface-light dark:bg-surface-dark border border-gray-200 dark:border-gray-700 rounded-xl p-4 cursor-pointer transition-all duration-200 overflow-hidden relative`;
    listItem.style.animationDelay = `${delay}ms`;

    listItem.innerHTML = `
                <div class="flex justify-between items-center">
                    <div class="min-w-0">
                        <h3 class="font-medium text-onSurface-light dark:text-onSurface-dark truncate">${description}</h3>
                        <p class="text-sm text-gray-500 dark:text-gray-400 truncate">${title}</p>
                    </div>
                    <button class="copy-btn p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 dark:text-gray-500 hover:text-primary-light dark:hover:text-primary-dark transition-colors duration-200">
                        <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                        </svg>
                    </button>
                </div>
            `;

    listItem.addEventListener("click", function (e) {
        if (e.target.closest(".copy-btn")) return;

        createRipple(e, this);
        searchTDK(description);
    });

    const copyBtn = listItem.querySelector(".copy-btn");
    copyBtn.addEventListener("click", function (e) {
        e.stopPropagation();
        createRipple(e, listItem);
        copyToClipboard(description);
    });

    return listItem;
}

function createRipple(event, element) {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches)
        return;

    const rect = element.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const diameter = Math.max(rect.width, rect.height);

    const ripple = document.createElement("span");
    ripple.className = "ripple";
    ripple.style.left = `${x}px`;
    ripple.style.top = `${y}px`;
    ripple.style.width = ripple.style.height = `${diameter}px`;

    element.appendChild(ripple);

    setTimeout(() => {
        ripple.remove();
    }, 600);
}

function copyToClipboard(text) {
    if (!text) {
        showNotification("Kopyalanacak veri bulunamadı.", "error");
        return;
    }

    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard
            .writeText(text)
            .then(() => {
                showNotification(`"${text}" panoya kopyalandı.`);
            })
            .catch((err) => {
                fallbackCopyToClipboard(text);
            });
    } else {
        fallbackCopyToClipboard(text);
    }
}

function fallbackCopyToClipboard(text) {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.position = "fixed";
    textArea.style.opacity = "0";

    document.body.appendChild(textArea);
    textArea.select();

    try {
        const successful = document.execCommand("copy");
        if (successful) {
            showNotification(`"${text}" panoya kopyalandı.`);
        } else {
            showNotification(
                "Kelime kopyalanamadı.",
                "error"
            );
        }
    } catch (err) {
        showNotification(
            "Kelime kopyalanamadı.",
            "error"
        );
    }

    document.body.removeChild(textArea);
}

function showNotification(message, type = "success") {
    clearTimeout(hideTimeout);

    notification.innerHTML = `
                <div class="notification px-4 py-3 rounded-full backdrop-blur ${type === "success"
            ? "bg-green-100/80 dark:bg-green-900/80 text-green-800 dark:text-green-200"
            : "bg-red-100/80 dark:bg-red-900/80 text-red-800 dark:text-red-200"
        }">
                    ${message}
                </div>
            `;

    notification.classList.remove("hidden");

    hideTimeout = setTimeout(() => {
        notification.classList.add("hidden");
    }, 2000);
}

function clearResults() {
    if (searchInput.value.trim() === "") {
        emptyState.classList.remove("hidden");
        resultsList.classList.add("hidden");

        emptyState.innerHTML = `
                    <div class="mx-auto h-24 w-24 mb-4 flex items-center justify-center">
                        <svg class="h-full w-full text-gray-300 dark:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9.663 17h4.673M12 3v1m8.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                    </div>
                    <h3 class="text-lg font-medium text-gray-500 dark:text-gray-400 mb-1">Arama yapın</h3>
                    <p class="text-sm text-gray-400 dark:text-gray-500 max-w-xs mx-auto text-balance">
                        Eski kelimelerin modern karşılıklarını keşfetmek için bir kelime yazın
                    </p>
                `;
    } else {
        emptyState.classList.remove("hidden");
        resultsList.classList.add("hidden");

        emptyState.innerHTML = `
                <div class="mx-auto h-24 w-24 mb-4 flex items-center justify-center text-gray-300 dark:text-gray-600">
                    <svg class="h-full w-full" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                </div>
                <h3 class="text-lg font-medium text-gray-500 dark:text-gray-400 mb-1">Sonuç bulunamadı</h3>
                <p class="text-sm text-gray-400 dark:text-gray-500 max-w-xs mx-auto">
                    "${searchInput.value.trim()}" için bir sonuç bulunamadı
                </p>
                <button id="TDKSearch" class="mt-5 bg-surface-light dark:bg-surface-dark border border-gray-200 dark:border-gray-700 rounded-xl p-4 cursor-pointer transition-all duration-200 font-medium text-onSurface-light dark:text-onSurface-dark truncate">
                    TDK Üzerinde Arayın
                </button>
            `;
    }
}

function scrollToTop() {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
}

backToTopBtn.addEventListener('click', scrollToTop);
TDKManuelSearchBtn.addEventListener('click', ManuelSearch);

function toggleBackToTopButton() {
    if (window.scrollY > 7) {
        backToTopBtn.classList.remove('hidden');
    } else {
        backToTopBtn.classList.add('hidden');
    }
}

window.addEventListener('scroll', toggleBackToTopButton);

function ManuelSearch() {
    let search
    search = searchInput.value.trim()

    if (search === "") {
        showNotification(`Öncelikle bir kelime yazınız.`, "error");
    } else {
        showNotification(`TDK Üzerinde Aratılıyor...`);
        searchTDK(search);
        showNotification(`TDK Sonuçları Yazıldı.`);
    }
}

async function searchTDK(text) {
    const resultElem = document.getElementById("TDKResults");
    elem.classList.add('hidden');

    try {
        const response = await fetch("https://sozluk.gov.tr/gts_id?id=" + encodeURIComponent(text));
        const data = await response.json();

        if (data.error) {
            elem.classList.add('hidden');
            resultElem.textContent = "";
            return;
        }

        if (Array.isArray(data) && data.length > 0) {
            const madde = data[0];
            let anlamlarText = "Anlamları | ";
            if (madde.anlamlarListe && madde.anlamlarListe.length > 0) {
                const anlamlar = madde.anlamlarListe.map(a => a.anlam.replace(/<\/?[^>]+(>|$)/g, "").trim());
                anlamlarText += anlamlar.join(", ");
            } else {
                anlamlarText += "Yok";
            }

            let telafuzText = "";
            if (madde.telaffuz) {
                telafuzText = "\n\nTelaffuz | " + madde.telaffuz;
            }

            let orneklerText = "";
            if (madde.anlamlarListe && madde.anlamlarListe.length > 0) {
                let orneklerArr = [];
                madde.anlamlarListe.forEach(anlam => {
                    if (anlam.orneklerListe && anlam.orneklerListe.length > 0) {
                        anlam.orneklerListe.forEach(ornek => {
                            orneklerArr.push(ornek.ornek);
                        });
                    }
                });
                if (orneklerArr.length > 0) {
                    orneklerText = "\n\nÖrnek | " + orneklerArr.join("; ");
                }
            }

            resultElem.textContent = anlamlarText + telafuzText + orneklerText;
            resultElem.style.display = "block";
            elem.classList.remove('hidden');
            elem.scrollIntoView({ behavior: "smooth" });
        } else {
            elem.classList.add('hidden');
            resultElem.textContent = "";
        }
    } catch (error) {
        elem.classList.add('hidden');
        resultElem.textContent = "";
    }
}
