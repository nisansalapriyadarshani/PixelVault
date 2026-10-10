// SELECT ELEMENTS

const galleryItems = Array.from(
    document.querySelectorAll(".gallery-item")
);

const filterButtons = document.querySelectorAll(".filter-btn");

const searchInput = document.getElementById("searchInput");

const imageCounter = document.getElementById("imageCounter");

const emptyMessage = document.getElementById("emptyMessage");

const lightbox = document.getElementById("lightbox");

const lightboxImage = document.getElementById("lightboxImage");

const lightboxTitle = document.getElementById("lightboxTitle");

const lightboxCategory = document.getElementById("lightboxCategory");

const lightboxCounter = document.getElementById("lightboxCounter");

const favoriteBtn = document.getElementById("favoriteBtn");

const downloadBtn = document.getElementById("downloadBtn");

const fullscreenBtn = document.getElementById("fullscreenBtn");

const slideshowBtn = document.getElementById("slideshowBtn");

const themeToggle = document.getElementById("themeToggle");

const backToTop = document.getElementById("backToTop");

const closeBtn = document.getElementById("closeLightbox");

const nextBtn = document.getElementById("nextBtn");

const prevBtn = document.getElementById("prevBtn");

// VARIABLES

let currentFilter = "all";

let visibleImages = [];

let currentIndex = 0;

let slideshowInterval = null;

let lastFocusedElement = null;


// LOCAL STORAGE HELPERS

function readStorage(key, fallback) {
    try {
        const value = localStorage.getItem(key);

        return value === null ? fallback : JSON.parse(value);
    } catch {
        return fallback;
    }
}

function saveStorage(key, value) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch {
        console.warn("Local storage is unavailable.");
    }
}

// FAVORITES

const storedFavorites = readStorage("pixelvaultFavorites", []);

let favorites = new Set(
    Array.isArray(storedFavorites) ? storedFavorites : []
);

function getImageId(item) {
    return item.querySelector("img").getAttribute("src");
}

function toggleFavorite() {

    const item = visibleImages[currentIndex];

    if (!item) return;

    const id = getImageId(item);

    if (favorites.has(id)) {
        favorites.delete(id);
    } else {
        favorites.add(id);
    }

    saveStorage(
        "pixelvaultFavorites",
        Array.from(favorites)
    );

    updateFavoriteButton();

    // Refresh when viewing Favorites
    if (currentFilter === "favorites") {
        applyFilters();

        if (visibleImages.length === 0) {
            closeLightbox();
        } else {
            currentIndex = Math.min(
                currentIndex,
                visibleImages.length - 1
            );

            showImage(currentIndex);
        }
    }
}

function updateFavoriteButton() {

    const item = visibleImages[currentIndex];

    if (!item) return;

    const id = getImageId(item);

    const isFavorite = favorites.has(id);

    favoriteBtn.textContent = isFavorite ? "♥" : "♡";

    favoriteBtn.classList.toggle(
        "is-favorite",
        isFavorite
    );

    favoriteBtn.setAttribute(
        "aria-pressed",
        String(isFavorite)
    );
}

favoriteBtn.addEventListener("click", toggleFavorite);

// IMAGE FILTERING

function applyFilters() {

    const search = searchInput.value.toLowerCase().trim();

    visibleImages = [];

    galleryItems.forEach(item => {

        const category = item.dataset.category;

        const title = item.dataset.title.toLowerCase();

        const imageId = getImageId(item);

        const matchesSearch =
            title.includes(search) ||
            category.includes(search);

        const matchesCategory =
            currentFilter === "all" ||
            currentFilter === category ||
            (
                currentFilter === "favorites" &&
                favorites.has(imageId)
            );

        const shouldShow =
            matchesSearch && matchesCategory;

        item.classList.toggle(
            "hidden",
            !shouldShow
        );

        if (shouldShow) {
            visibleImages.push(item);
        }

    });

    imageCounter.textContent =
        `Showing ${visibleImages.length} of ${galleryItems.length} photos`;

    emptyMessage.hidden = visibleImages.length !== 0;
}


// FILTER BUTTONS

filterButtons.forEach(button => {

    button.addEventListener("click", () => {

        currentFilter = button.dataset.filter;

        filterButtons.forEach(btn => {
            btn.classList.remove("active");
        });

        button.classList.add("active");

        applyFilters();

    });

});


// LIVE SEARCH

searchInput.addEventListener("input", applyFilters);

// LIGHTBOX

function openLightbox(item) {

    applyFilters();

    currentIndex = visibleImages.indexOf(item);

    if (currentIndex === -1) return;

    lastFocusedElement = document.activeElement;

    showImage(currentIndex);

    lightbox.classList.add("active");

    lightbox.setAttribute("aria-hidden", "false");

    document.body.style.overflow = "hidden";

    closeBtn.focus();
}


function showImage(index) {

    if (visibleImages.length === 0) return;

    const item = visibleImages[index];

    const image = item.querySelector("img");

    lightboxImage.src = image.src;

    lightboxImage.alt = image.alt;

    lightboxTitle.textContent = item.dataset.title;

    lightboxCategory.textContent =
        item.dataset.category.toUpperCase();

    lightboxCounter.textContent =
        `${index + 1} / ${visibleImages.length}`;

    updateFavoriteButton();
}


// OPEN IMAGE

galleryItems.forEach(item => {

    item.setAttribute("tabindex", "0");
    item.setAttribute("role", "button");

    item.setAttribute(
        "aria-label",
        `View ${item.dataset.title}`
    );

    item.addEventListener("click", () => {
        openLightbox(item);
    });

    item.addEventListener("keydown", event => {

        if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            openLightbox(item);
        }

    });

});

// NEXT / PREVIOUS

function nextImage() {

    if (visibleImages.length === 0) return;

    currentIndex =
        (currentIndex + 1) % visibleImages.length;

    showImage(currentIndex);
}

function previousImage() {

    if (visibleImages.length === 0) return;

    currentIndex =
        (currentIndex - 1 + visibleImages.length)
        % visibleImages.length;

    showImage(currentIndex);
}

nextBtn.addEventListener("click", nextImage);

prevBtn.addEventListener("click", previousImage);

// CLOSE LIGHTBOX

function closeLightbox() {

    stopSlideshow();

    lightbox.classList.remove("active");

    lightbox.setAttribute("aria-hidden", "true");

    document.body.style.overflow = "";

    if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
    }

    if (lastFocusedElement &&
        lastFocusedElement.isConnected &&
        !lastFocusedElement.classList.contains("hidden")) {

        lastFocusedElement.focus();

    } else {
        document.querySelector(".filter-btn.active").focus();
    }
}

closeBtn.addEventListener("click", closeLightbox);

lightbox.addEventListener("click", event => {

    if (event.target === lightbox) {
        closeLightbox();
    }

});

// DOWNLOAD IMAGE

downloadBtn.addEventListener("click", async () => {

    const item = visibleImages[currentIndex];

    if (!item) return;

    const image = item.querySelector("img");

    const url = image.src;

    const filename = new URL(url).pathname.split("/").pop();

    try {

        const response = await fetch(url);

        if (!response.ok) {
            throw new Error("Image download failed");
        }

        const blob = await response.blob();

        const blobUrl = URL.createObjectURL(blob);

        const link = document.createElement("a");

        link.href = blobUrl;
        link.download = filename || "pixelvault-image";

        document.body.appendChild(link);

        link.click();

        link.remove();

        setTimeout(() => {
            URL.revokeObjectURL(blobUrl);
        }, 1000);

    } catch (error) {

        console.error(error);

        alert("Unable to download this image.");

    }

});

// FULLSCREEN

fullscreenBtn.addEventListener("click", async () => {

    try {

        if (!document.fullscreenElement) {

            if (!lightbox.requestFullscreen) {
                alert("Fullscreen is not supported.");
                return;
            }

            await lightbox.requestFullscreen();

        } else {

            await document.exitFullscreen();

        }

    } catch (error) {

        console.error(error);

    }

});

// SLIDESHOW

function startSlideshow() {

    if (slideshowInterval !== null) return;

    slideshowInterval = setInterval(() => {
        nextImage();
    }, 3000);

    slideshowBtn.textContent = "⏸";

    slideshowBtn.setAttribute(
        "aria-label",
        "Pause slideshow"
    );
}

function stopSlideshow() {

    if (slideshowInterval !== null) {

        clearInterval(slideshowInterval);

        slideshowInterval = null;

    }

    slideshowBtn.textContent = "▶";

    slideshowBtn.setAttribute(
        "aria-label",
        "Start slideshow"
    );
}

slideshowBtn.addEventListener("click", () => {

    if (slideshowInterval === null) {
        startSlideshow();
    } else {
        stopSlideshow();
    }

});

// KEYBOARD CONTROLS

document.addEventListener("keydown", event => {

    if (!lightbox.classList.contains("active")) {
        return;
    }

    if (event.key === "ArrowRight") {
        nextImage();
    }

    if (event.key === "ArrowLeft") {
        previousImage();
    }

    if (event.key === "Escape") {
        closeLightbox();
    }

    // Keep keyboard focus inside the dialog
    if (event.key === "Tab") {

        const buttons = Array.from(
            lightbox.querySelectorAll("button")
        ).filter(button => !button.disabled);

        const first = buttons[0];
        const last = buttons[buttons.length - 1];

        if (event.shiftKey && document.activeElement === first) {
            event.preventDefault();
            last.focus();
        } else if (!event.shiftKey &&
                   document.activeElement === last) {
            event.preventDefault();
            first.focus();
        }
    }

});

// THEME TOGGLE

const savedTheme = readStorage("pixelvaultTheme", "dark");

if (savedTheme === "light") {
    document.body.classList.add("light-mode");
}

function updateThemeButton() {

    const isLight =
        document.body.classList.contains("light-mode");

    themeToggle.textContent = isLight ? "🌙" : "☀️";

    themeToggle.setAttribute(
        "aria-label",
        isLight ? "Switch to dark mode" : "Switch to light mode"
    );
}

themeToggle.addEventListener("click", () => {

    document.body.classList.toggle("light-mode");

    const theme =
        document.body.classList.contains("light-mode")
            ? "light"
            : "dark";

    saveStorage("pixelvaultTheme", theme);

    updateThemeButton();

});

updateThemeButton();

// SCROLL ANIMATIONS

const revealElements = document.querySelectorAll(".reveal");

if ("IntersectionObserver" in window) {

    const observer = new IntersectionObserver(entries => {

        entries.forEach(entry => {

            if (entry.isIntersecting) {

                entry.target.classList.add("visible");

                observer.unobserve(entry.target);

            }

        });

    }, {
        threshold: 0.05
    });

    revealElements.forEach(element => {
        observer.observe(element);
    });

} else {

    revealElements.forEach(element => {
        element.classList.add("visible");
    });

}

// BACK TO TOP

function updateBackToTop() {

    backToTop.classList.toggle(
        "show",
        window.scrollY > 350
    );
}

window.addEventListener("scroll", updateBackToTop);

backToTop.addEventListener("click", () => {

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });

});

// INITIALIZE

applyFilters();

updateBackToTop();

console.log("PixelVault 2.0 initialized successfully!");

/* Active Navigation Links */

const navLinks = document.querySelectorAll(".nav-link");

navLinks.forEach(link => {

    link.addEventListener("click", () => {

        navLinks.forEach(nav => {
            nav.classList.remove("active");
        });

        link.classList.add("active");

    });

});

/* Update Navigation While Scrolling */

const pageSections = document.querySelectorAll(
    "#home, #gallery, #about"
);

function updateActiveNavigation() {

    let currentSection = "home";

    pageSections.forEach(section => {

        const sectionTop =
            section.getBoundingClientRect().top;

        if (sectionTop <= 180) {
            currentSection = section.id;
        }

    });

    navLinks.forEach(link => {

        const isActive =
            link.getAttribute("href") ===
            `#${currentSection}`;

        link.classList.toggle("active", isActive);

    });

}

window.addEventListener("scroll", updateActiveNavigation);

window.addEventListener("load", updateActiveNavigation);

