// ===== GLOBAL VARIABLES =====
let cart = [];
let wishlist = [];
let currentFilter = 'all';
let currentSort = 'popular';
let productsPerPage = 8;
let currentPage = 1;

// ===== PRODUCT DATA =====
const products = [
    {
        id: 101,
        name: "Básico",
        price: 15,
        originalPrice: 15,
        image: "https://cdn-icons-png.flaticon.com/512/3523/3523887.png",
        category: "cheats",
        description: "Aimbot neck - (RAGE)\nChams\nFake Lag\nESP lineas\n\nIdeal para dominar partidas",
        features: ["Aimbot", "Chams", "Fake Lag", "ESP Líneas"],
        isNew: false,
        isFeatured: true
    },
    {
        id: 102,
        name: "External",
        price: 10,
        originalPrice: 10,
        image: "https://cdn-icons-png.flaticon.com/512/3523/3523888.png",
        category: "cheats",
        description: "Chams\nFake lag\nESP lineas\n\nJuega con seguridad",
        features: ["Chams", "Fake Lag", "ESP Líneas"],
        isNew: false,
        isFeatured: false
    },
    {
        id: 103,
        name: "Premium (Todo Incluido)",
        price: 20,
        originalPrice: 20,
        image: "https://cdn-icons-png.flaticon.com/512/3523/3523891.png",
        category: "cheats",
        description: "Aimbot perfecto + AWM\nCambio instantáneo\nCámara avanzada\nVer todo (paredes)\nVolar\nLag controlado\nMúltiples versiones\nESP + Teleport\nAnti-ban + Soporte VIP",
        features: ["Aimbot sin bug", "Cambio rápido", "Aim AWM", "Bug cámara", "Cámara side", "WallHack N32/P64", "Fly N32/P64", "Fake lag", "V1/V2/V2.1", "Ghost mode", "ESP líneas", "Teleport", "Antiban", "Soporte Premium"],
        isNew: true,
        isFeatured: true
    }
];

// ===== DOM ELEMENTS =====
const getElements = () => {
    return {
        loadingScreen: document.getElementById('loadingScreen'),
        header: document.getElementById('header'),
        searchInput: document.getElementById('searchInput'),
        searchSuggestions: document.getElementById('searchSuggestions'),
        productGrid: document.getElementById('productGrid'),
        cartModal: document.getElementById('cartModal'),
        cartItems: document.getElementById('cartItems'),
        cartEmpty: document.getElementById('cartEmpty'),
        cartFooter: document.getElementById('cartFooter'),
        cartSubtotal: document.getElementById('cartSubtotal'),
        cartShipping: document.getElementById('cartShipping'),
        cartTotal: document.getElementById('cartTotal'),
        cartCount: document.querySelector('.cart-count'),
        wishlistCount: document.querySelector('.wishlist-count'),
        navCart: document.getElementById('navCart'),
        closeCart: document.getElementById('closeCart'),
        checkoutBtn: document.getElementById('checkoutBtn'),
        hamburger: document.getElementById('hamburger'),
        backToTop: document.getElementById('backToTop'),
        notificationToast: document.getElementById('notificationToast'),
        quickViewModal: document.getElementById('quickViewModal'),
        loadMoreBtn: document.getElementById('loadMoreBtn'),
        sortSelect: document.getElementById('sortSelect'),
        // Nuevos elementos del modal de pago
        pagoModal: document.getElementById('pagoModal'),
        closePagoModal: document.getElementById('closePagoModal'),
        pagoForm: document.getElementById('pagoForm'),
        pagoProduct: document.getElementById('pagoProducto'),
        pagoMetodo: document.getElementById('pagoMetodo'),
        pagoStatus: document.getElementById('pagoStatus'),
        // Elementos del formulario de actualización
        updateForm: document.getElementById('updateForm')
    };
};

let elements = {};

// ===== UTILITY FUNCTIONS =====
const utils = {
    // Format price
    formatPrice: (price) => `$${price.toFixed(2)}`,
    
    // Debounce function
    debounce: (func, wait) => {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },
    
    // Animate number counting
    animateNumber: (element, target, duration = 2000) => {
        if (!element) return;
        const start = 0;
        const increment = target / (duration / 16);
        let current = start;
        
        const timer = setInterval(() => {
            current += increment;
            if (current >= target) {
                current = target;
                clearInterval(timer);
            }
            element.textContent = Math.floor(current).toLocaleString();
        }, 16);
    },
    
    // Generate random ID
    generateId: () => Date.now() + Math.random().toString(36).substr(2, 9),
    
    // Check if element is in viewport
    isInViewport: (element) => {
        if (!element) return false;
        const rect = element.getBoundingClientRect();
        return (
            rect.top >= 0 &&
            rect.left >= 0 &&
            rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
            rect.right <= (window.innerWidth || document.documentElement.clientWidth)
        );
    },
    
    // Safe query selector
    safeQuerySelector: (selector) => {
        try {
            return document.querySelector(selector);
        } catch (e) {
            console.warn(`Invalid selector: ${selector}`);
            return null;
        }
    },
    
    // Safe query selector all
    safeQuerySelectorAll: (selector) => {
        try {
            return document.querySelectorAll(selector);
        } catch (e) {
            console.warn(`Invalid selector: ${selector}`);
            return [];
        }
    }
};

// ===== LOADING SCREEN =====
const loadingScreen = {
    init: () => {
        if (!elements.loadingScreen) return;
        
        setTimeout(() => {
            elements.loadingScreen.style.opacity = '0';
            setTimeout(() => {
                elements.loadingScreen.style.display = 'none';
            }, 500);
        }, 1000);
    }
};

// ===== HEADER FUNCTIONALITY =====
const header = {
    init: () => {
        header.handleScroll();
        header.handleMobileMenu();
    },
    
    handleScroll: () => {
        window.addEventListener('scroll', utils.debounce(() => {
            if (!elements.header) return;
            
            if (window.scrollY > 100) {
                elements.header.classList.add('scrolled');
            } else {
                elements.header.classList.remove('scrolled');
            }
        }, 10));
    },
    
    handleMobileMenu: () => {
        if (!elements.hamburger) return;
        
        elements.hamburger.addEventListener('click', () => {
            elements.hamburger.classList.toggle('active');
            // Add mobile menu functionality here
        });
    }
};

// ===== SEARCH FUNCTIONALITY =====
const search = {
    init: () => {
        if (!elements.searchInput) return;
        
        search.handleSearchInput();
        search.handleSearchSubmit();
    },
    
    handleSearchInput: () => {
        elements.searchInput.addEventListener('input', utils.debounce((e) => {
            const query = e.target.value.trim();
            if (query.length >= 2) {
                search.showSuggestions(query);
            } else {
                search.hideSuggestions();
            }
        }, 300));
    },
    
    handleSearchSubmit: () => {
        const searchForm = elements.searchInput?.closest('.search-box');
        if (!searchForm) return;
        
        searchForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const query = elements.searchInput.value.trim();
            if (query) {
                search.performSearch(query);
            }
        });
    },
    
    showSuggestions: (query) => {
        if (!elements.searchSuggestions) return;
        
        const suggestions = products.filter(product => 
            product.name.toLowerCase().includes(query.toLowerCase()) ||
            product.category.toLowerCase().includes(query.toLowerCase())
        ).slice(0, 5);
        
        if (suggestions.length > 0) {
            elements.searchSuggestions.innerHTML = suggestions.map(product => `
                <div class="suggestion-item" data-product-id="${product.id}">
                    <img src="${product.image}" alt="${product.name}">
                    <div>
                        <h4>${product.name}</h4>
                        <p>${utils.formatPrice(product.price)}</p>
                    </div>
                </div>
            `).join('');
            
            elements.searchSuggestions.classList.add('active');
            search.handleSuggestionClicks();
        }
    },
    
    hideSuggestions: () => {
        if (elements.searchSuggestions) {
            elements.searchSuggestions.classList.remove('active');
        }
    },
    
    handleSuggestionClicks: () => {
        if (!elements.searchSuggestions) return;
        
        elements.searchSuggestions.addEventListener('click', (e) => {
            const suggestionItem = e.target.closest('.suggestion-item');
            if (suggestionItem) {
                const productId = parseInt(suggestionItem.dataset.productId);
                const product = products.find(p => p.id === productId);
                if (product) {
                    search.performSearch(product.name);
                }
            }
        });
    },
    
    performSearch: (query) => {
        // Filter products based on search query
        const filteredProducts = products.filter(product => 
            product.name.toLowerCase().includes(query.toLowerCase()) ||
            product.category.toLowerCase().includes(query.toLowerCase())
        );
        
        productGrid.renderProducts(filteredProducts);
        
        // Scroll to products section
        const productsSection = document.getElementById('productos');
        if (productsSection) {
            productsSection.scrollIntoView({ behavior: 'smooth' });
        }
    }
};

// ===== PRODUCT GRID =====
const productGrid = {
    init: () => {
        if (!elements.productGrid) return;
        
        productGrid.renderProducts(products);
        productGrid.handleFilters();
        productGrid.handleSort();
        productGrid.handleLoadMore();
    },
    
    renderProducts: (productsToRender = products) => {
        if (!elements.productGrid) return;
        
        const startIndex = (currentPage - 1) * productsPerPage;
        const endIndex = startIndex + productsPerPage;
        const productsToShow = productsToRender.slice(startIndex, endIndex);
        
        elements.productGrid.innerHTML = productsToShow.map(product => {
            console.log('Rendering product:', product.name, 'Price:', product.price);
            return `
            <div class="product-card cheat-card${product.id === 103 ? ' premium' : ''}">
                <div class="cheat-icon">
                    <img src="${product.image}" alt="${product.name}" style="width:48px;height:48px;object-fit:contain;">
                </div>
                <div class="product-info">
                    <h3 class="product-title">${product.name}</h3>
                    <p class="cheat-desc">${product.description}</p>
                    <div class="cheat-price">$${product.price} <span>/ mes</span></div>
                </div>
                <div class="cheat-button-container">
                    <button class="add-to-cart" data-product-id="${product.id}">Comprar</button>
                </div>
            </div>
        `;
        }).join('');
        
        productGrid.handleProductInteractions();
    },
    
    handleProductInteractions: () => {
        // Conectar botones de compra al nuevo modal de pago
        const buttons = utils.safeQuerySelectorAll('.cheat-card .add-to-cart');
        
        buttons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                
                const productCard = btn.closest('.cheat-card');
                const productId = parseInt(btn.dataset.productId);
                const product = products.find(p => p.id === productId);
                
                if (product) {
                    // Abrir modal de pago directamente
                    if (elements.pagoModal && elements.pagoProduct) {
                        elements.pagoProduct.value = product.name;
                        if (elements.pagoStatus) {
                            elements.pagoStatus.textContent = '';
                        }
                        if (elements.pagoForm) {
                            elements.pagoForm.reset();
                        }
                        
                        elements.pagoModal.classList.add('active');
                        document.body.classList.add('modal-open');
                    }
                }
            });
        });
    },
    
    handleFilters: () => {
        const filterButtons = utils.safeQuerySelectorAll('.filter-btn');
        filterButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                filterButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                currentFilter = btn.dataset.filter;
                currentPage = 1;
                productGrid.applyFiltersAndSort();
            });
        });
    },
    
    handleSort: () => {
        if (!elements.sortSelect) return;
        
        elements.sortSelect.addEventListener('change', (e) => {
            currentSort = e.target.value;
            currentPage = 1;
            productGrid.applyFiltersAndSort();
        });
    },
    
    applyFiltersAndSort: () => {
        let filteredProducts = products;
        
        // Apply category filter
        if (currentFilter !== 'all') {
            filteredProducts = products.filter(product => product.category === currentFilter);
        }
        
        // Apply sorting
        switch (currentSort) {
            case 'price-low':
                filteredProducts.sort((a, b) => a.price - b.price);
                break;
            case 'price-high':
                filteredProducts.sort((a, b) => b.price - a.price);
                break;
            case 'rating':
                filteredProducts.sort((a, b) => b.rating - a.rating);
                break;
            case 'newest':
                filteredProducts.sort((a, b) => b.isNew - a.isNew);
                break;
            default: // popular
                filteredProducts.sort((a, b) => b.reviews - a.reviews);
        }
        
        productGrid.renderProducts(filteredProducts);
    },
    
    handleLoadMore: () => {
        if (!elements.loadMoreBtn) return;
        
        elements.loadMoreBtn.addEventListener('click', () => {
            currentPage++;
            const currentProducts = productGrid.getCurrentFilteredProducts();
            const totalPages = Math.ceil(currentProducts.length / productsPerPage);
            
            if (currentPage > totalPages) {
                elements.loadMoreBtn.style.display = 'none';
                return;
            }
            
            productGrid.renderProducts(currentProducts);
        });
    },
    
    getCurrentFilteredProducts: () => {
        let filteredProducts = products;
        
        if (currentFilter !== 'all') {
            filteredProducts = products.filter(product => product.category === currentFilter);
        }
        
        return filteredProducts;
    }
};

// ===== CART MANAGER =====
const cartManager = {
    init: () => {
        cartManager.loadCart();
        cartManager.handleCartToggle();
        cartManager.handleCloseCart();
        cartManager.handleCheckout();
        cartManager.handleContinueShopping();
        cartManager.updateCartCount();
    },
    
    loadCart: () => {
        try {
            const savedCart = localStorage.getItem('cart');
            if (savedCart) {
                cart = JSON.parse(savedCart);
                cartManager.updateCartDisplay();
            }
        } catch (error) {
            console.error('Error loading cart:', error);
        }
    },
    
    saveCart: () => {
        try {
            localStorage.setItem('cart', JSON.stringify(cart));
        } catch (error) {
            console.error('Error saving cart:', error);
        }
    },
    
    addToCart: (product) => {
        const existingItem = cart.find(item => item.id === product.id);
        
        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            cart.push({
                ...product,
                quantity: 1
            });
        }
        
        cartManager.saveCart();
        cartManager.updateCartDisplay();
        cartManager.updateCartCount();
        notification.show(`¡${product.name} añadido al carrito!`, 'success');
    },
    
    removeFromCart: (productId) => {
        cart = cart.filter(item => item.id !== productId);
        cartManager.saveCart();
        cartManager.updateCartDisplay();
        cartManager.updateCartCount();
    },
    
    updateQuantity: (productId, newQuantity) => {
        if (newQuantity <= 0) {
            cartManager.removeFromCart(productId);
            return;
        }
        
        const item = cart.find(item => item.id === productId);
        if (item) {
            item.quantity = newQuantity;
            cartManager.saveCart();
            cartManager.updateCartDisplay();
            cartManager.updateCartCount();
        }
    },
    
    updateCartDisplay: () => {
        if (!elements.cartItems || !elements.cartEmpty || !elements.cartFooter) return;
        
        if (cart.length === 0) {
            elements.cartItems.style.display = 'none';
            elements.cartEmpty.style.display = 'flex';
            elements.cartFooter.style.display = 'none';
        } else {
            elements.cartItems.style.display = 'block';
            elements.cartEmpty.style.display = 'none';
            elements.cartFooter.style.display = 'block';
            
            elements.cartItems.innerHTML = cart.map(item => `
                <div class="cart-item" data-product-id="${item.id}">
                    <div class="cart-item-image">
                        <img src="${item.image}" alt="${item.name}">
                    </div>
                    <div class="cart-item-details">
                        <h4>${item.name}</h4>
                        <div class="cart-item-price">${utils.formatPrice(item.price)}</div>
                    </div>
                    <div class="cart-item-quantity">
                        <button class="quantity-btn minus" onclick="cartManager.updateQuantity(${item.id}, ${item.quantity - 1})">-</button>
                        <span>${item.quantity}</span>
                        <button class="quantity-btn plus" onclick="cartManager.updateQuantity(${item.id}, ${item.quantity + 1})">+</button>
                    </div>
                    <button class="remove-item" onclick="cartManager.removeFromCart(${item.id})">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            `).join('');
            
            cartManager.updateCartSummary();
        }
    },
    
    updateCartSummary: () => {
        if (!elements.cartSubtotal || !elements.cartTotal) return;
        
        const subtotal = cart.reduce((total, item) => total + (item.price * item.quantity), 0);
        const shipping = subtotal > 0 ? 0 : 0; // Free shipping
        const total = subtotal + shipping;
        
        elements.cartSubtotal.textContent = utils.formatPrice(subtotal);
        elements.cartTotal.textContent = utils.formatPrice(total);
    },
    
    updateCartCount: () => {
        if (!elements.cartCount) return;
        
        const totalItems = cart.reduce((total, item) => total + item.quantity, 0);
        elements.cartCount.textContent = totalItems;
        
        if (totalItems > 0) {
            elements.cartCount.style.display = 'block';
        } else {
            elements.cartCount.style.display = 'none';
        }
    },
    
    handleCartToggle: () => {
        if (!elements.navCart || !elements.cartModal) return;
        
        elements.navCart.addEventListener('click', () => {
            elements.cartModal.classList.add('active');
            document.body.classList.add('modal-open');
        });
    },
    
    handleCloseCart: () => {
        if (!elements.closeCart || !elements.cartModal) return;
        
        elements.closeCart.addEventListener('click', () => {
            elements.cartModal.classList.remove('active');
            document.body.classList.remove('modal-open');
        });
        
        // Close on overlay click
        const cartOverlay = utils.safeQuerySelector('.cart-overlay');
        if (cartOverlay) {
            cartOverlay.addEventListener('click', () => {
                elements.cartModal.classList.remove('active');
                document.body.classList.remove('modal-open');
            });
        }
    },
    
    handleCheckout: () => {
        if (!elements.checkoutBtn) return;
        
        elements.checkoutBtn.addEventListener('click', () => {
            if (cart.length === 0) {
                notification.show('Tu carrito está vacío', 'error');
                return;
            }
            
            // Cerrar carrito y abrir modal de pago
            elements.cartModal.classList.remove('active');
            document.body.classList.remove('modal-open');
            
            // Abrir modal de pago con el primer producto del carrito
            const firstProduct = cart[0];
            openPagoModal(firstProduct);
        });
    },
    
    handleContinueShopping: () => {
        const continueBtn = utils.safeQuerySelector('.continue-shopping-btn');
        if (!continueBtn) return;
        
        continueBtn.addEventListener('click', () => {
            elements.cartModal.classList.remove('active');
            document.body.classList.remove('modal-open');
            
            // Scroll to products section
            const productsSection = document.getElementById('productos');
            if (productsSection) {
                productsSection.scrollIntoView({ behavior: 'smooth' });
            }
        });
    }
};

// ===== WISHLIST MANAGER =====
const wishlistManager = {
    init: () => {
        wishlistManager.loadWishlist();
        wishlistManager.updateWishlistCount();
    },
    
    loadWishlist: () => {
        try {
            const savedWishlist = localStorage.getItem('wishlist');
            if (savedWishlist) {
                wishlist = JSON.parse(savedWishlist);
            }
        } catch (error) {
            console.error('Error loading wishlist:', error);
        }
    },
    
    saveWishlist: () => {
        try {
            localStorage.setItem('wishlist', JSON.stringify(wishlist));
        } catch (error) {
            console.error('Error saving wishlist:', error);
        }
    },
    
    toggleWishlist: (productId) => {
        const index = wishlist.indexOf(productId);
        if (index > -1) {
            wishlist.splice(index, 1);
        } else {
            wishlist.push(productId);
        }
        
        wishlistManager.saveWishlist();
        wishlistManager.updateWishlistCount();
    },
    
    updateWishlistCount: () => {
        if (!elements.wishlistCount) return;
        
        elements.wishlistCount.textContent = wishlist.length;
        
        if (wishlist.length > 0) {
            elements.wishlistCount.style.display = 'block';
        } else {
            elements.wishlistCount.style.display = 'none';
        }
    }
};

// ===== QUICK VIEW =====
const quickView = {
    init: () => {
        quickView.handleQuickViewButtons();
        quickView.handleCloseQuickView();
    },
    
    handleQuickViewButtons: () => {
        utils.safeQuerySelectorAll('.quick-view-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const productCard = btn.closest('.product-card');
                const productId = parseInt(productCard.dataset.productId);
                const product = products.find(p => p.id === productId);
                
                if (product) {
                    quickView.showQuickView(product);
                }
            });
        });
    },
    
    showQuickView: (product) => {
        if (!elements.quickViewModal) return;
        
        elements.quickViewModal.innerHTML = `
            <div class="quick-view-content">
                <button class="close-quick-view">
                    <i class="fas fa-times"></i>
                </button>
                <div class="quick-view-image">
                    <img src="${product.image}" alt="${product.name}">
                </div>
                <div class="quick-view-details">
                    <h3>${product.name}</h3>
                    <p>${product.description}</p>
                    <div class="quick-view-price">${utils.formatPrice(product.price)}</div>
                    <button class="add-to-cart-btn" onclick="cartManager.addToCart(${JSON.stringify(product).replace(/"/g, '&quot;')})">
                        Añadir al Carrito
                    </button>
                </div>
            </div>
        `;
        
        elements.quickViewModal.classList.add('active');
        document.body.classList.add('modal-open');
        
        quickView.handleCloseQuickView();
    },
    
    handleCloseQuickView: () => {
        const closeBtn = utils.safeQuerySelector('.close-quick-view');
        if (!closeBtn) return;
        
        closeBtn.addEventListener('click', () => {
            if (elements.quickViewModal) {
                elements.quickViewModal.classList.remove('active');
                document.body.classList.remove('modal-open');
            }
        });
    }
};

// ===== NOTIFICATION SYSTEM =====
const notification = {
    queue: [],
    isProcessing: false,
    
    show: (message, type = 'info', duration = 3000) => {
        notification.queue.push({ message, type, duration });
        
        if (!notification.isProcessing) {
            notification.processQueue();
        }
    },
    
    processQueue: () => {
        if (notification.queue.length === 0) {
            notification.isProcessing = false;
            return;
        }
        
        notification.isProcessing = true;
        const { message, type, duration } = notification.queue.shift();
        
        const toast = document.createElement('div');
        toast.className = `notification-toast ${type}`;
        toast.innerHTML = `
            <div class="toast-content">
                <div class="toast-icon ${type}">
                    <i class="fas fa-${notification.getIcon(type)}"></i>
                </div>
                <span class="toast-message">${message}</span>
            </div>
            <button class="toast-close" title="Cerrar">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        document.body.appendChild(toast);
        
        // Show toast
        setTimeout(() => {
            toast.classList.add('show');
        }, 100);
        
        // Auto hide
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
                notification.processQueue();
            }, 300);
        }, duration);
        
        // Manual close
        const closeBtn = toast.querySelector('.toast-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                toast.classList.remove('show');
                setTimeout(() => {
                    if (toast.parentNode) {
                        toast.parentNode.removeChild(toast);
                    }
                    notification.processQueue();
                }, 300);
            });
        }
    },
    
    getIcon: (type) => {
        switch (type) {
            case 'success': return 'check-circle';
            case 'error': return 'exclamation-circle';
            case 'warning': return 'exclamation-triangle';
            default: return 'info-circle';
        }
    }
};

// ===== ANIMATIONS =====
const animations = {
    init: () => {
        animations.handleScrollAnimations();
        animations.handleCounterAnimations();
    },
    
    handleScrollAnimations: () => {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate-in');
                }
            });
        }, { threshold: 0.1 });
        
        utils.safeQuerySelectorAll('.product-card, .category-card, .offer-card').forEach(el => {
            observer.observe(el);
        });
    },
    
    handleCounterAnimations: () => {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const target = entry.target;
                    const finalValue = parseInt(target.dataset.target);
                    utils.animateNumber(target, finalValue);
                    observer.unobserve(target);
                }
            });
        }, { threshold: 0.5 });
        
        utils.safeQuerySelectorAll('[data-target]').forEach(el => {
            observer.observe(el);
        });
    }
};

// ===== SMOOTH SCROLL =====
const smoothScroll = {
    init: () => {
        smoothScroll.handleNavLinks();
        smoothScroll.handleBackToTop();
    },
    
    handleNavLinks: () => {
        utils.safeQuerySelectorAll('a[href^="#"]').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const targetId = link.getAttribute('href');
                const targetElement = document.querySelector(targetId);
                
                if (targetElement) {
                    targetElement.scrollIntoView({ behavior: 'smooth' });
                }
            });
        });
    },
    
    handleBackToTop: () => {
        if (!elements.backToTop) return;
        
        window.addEventListener('scroll', () => {
            if (window.scrollY > 300) {
                elements.backToTop.classList.add('show');
            } else {
                elements.backToTop.classList.remove('show');
            }
        });
        
        elements.backToTop.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }
};

// ===== NEWSLETTER =====
const newsletter = {
    init: () => {
        newsletter.handleNewsletterSubmit();
    },
    
    handleNewsletterSubmit: () => {
        const newsletterForm = utils.safeQuerySelector('.newsletter-form');
        if (!newsletterForm) return;
        
        newsletterForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const emailInput = newsletterForm.querySelector('input[type="email"]');
            const email = emailInput.value.trim();
            
            if (email && newsletter.validateEmail(email)) {
                notification.show('¡Gracias por suscribirte!', 'success');
                emailInput.value = '';
            } else {
                notification.show('Por favor, introduce un email válido', 'error');
            }
        });
    },
    
    validateEmail: (email) => {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }
};

// ===== OFFER CARDS =====
const offerCards = {
    init: () => {
        offerCards.handleOfferClicks();
    },
    
    handleOfferClicks: () => {
        utils.safeQuerySelectorAll('.offer-card').forEach(card => {
            card.addEventListener('click', () => {
                const productId = parseInt(card.dataset.productId);
                const product = products.find(p => p.id === productId);
                
                if (product) {
                    cartManager.addToCart(product);
                }
            });
        });
    }
};

// ===== CATEGORY CARDS FUNCTIONALITY =====
const categoryCards = {
    init: () => {
        categoryCards.handleCategoryClicks();
    },
    
    handleCategoryClicks: () => {
        utils.safeQuerySelectorAll('.category-card').forEach(card => {
            card.addEventListener('click', () => {
                const category = card.dataset.category;
                if (category) {
                    // Set filter and render products
                    currentFilter = category;
                    currentPage = 1;
                    
                    // Update filter buttons
                    utils.safeQuerySelectorAll('.filter-btn').forEach(btn => {
                        btn.classList.remove('active');
                        if (btn.dataset.filter === category) {
                            btn.classList.add('active');
                        }
                    });
                    
                    productGrid.applyFiltersAndSort();
                    
                    // Scroll to products section
                    const productsSection = document.getElementById('productos');
                    if (productsSection) {
                        productsSection.scrollIntoView({ behavior: 'smooth' });
                    }
                }
            });
        });
    }
};

// ===== PAYMENT MODAL FUNCTIONALITY =====
const payment = {
    init: () => {
        payment.handlePagoModal();
        payment.handlePagoTabs();
        payment.handlePagoForm();
    },
    
    handlePagoModal: () => {
        if (!elements.pagoModal || !elements.closePagoModal) return;
        
        // Cerrar modal
        elements.closePagoModal.addEventListener('click', () => {
            elements.pagoModal.classList.remove('active');
            document.body.classList.remove('modal-open');
        });
        
        // Cerrar en overlay
        elements.pagoModal.addEventListener('click', (e) => {
            if (e.target === elements.pagoModal) {
                elements.pagoModal.classList.remove('active');
                document.body.classList.remove('modal-open');
            }
        });
    },
    
    handlePagoTabs: () => {
        const tabs = utils.safeQuerySelectorAll('.pago-tab');
        const contents = utils.safeQuerySelectorAll('.pago-content');
        
        console.log('Tabs encontrados:', tabs.length);
        console.log('Contents encontrados:', contents.length);
        
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const metodo = tab.dataset.metodo;
                console.log('Cambiando a método:', metodo);
                
                // Actualizar pestañas activas
                tabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                
                // Actualizar contenido activo
                contents.forEach(content => {
                    content.classList.remove('active');
                    if (content.classList.contains(`pago-${metodo}`)) {
                        content.classList.add('active');
                        console.log('Activando contenido:', content.className);
                    }
                });
                
                // Actualizar método en el formulario
                if (elements.pagoMetodo) {
                    elements.pagoMetodo.value = metodo.charAt(0).toUpperCase() + metodo.slice(1);
                }
            });
        });
    },
    
    handlePagoForm: () => {
        // Manejador para el formulario de Yape
        const yapeForm = document.getElementById('pagoForm');
        if (yapeForm) {
            yapeForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                await payment.handleFormSubmission('yape', yapeForm);
            });
        }
        
        // Manejador para el formulario de PayPal
        const paypalForm = document.getElementById('pagoFormPaypal');
        if (paypalForm) {
            paypalForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                await payment.handleFormSubmission('paypal', paypalForm);
            });
        }
        
        // Manejador para el formulario de Binance
        const binanceForm = document.getElementById('pagoFormBinance');
        if (binanceForm) {
            binanceForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                await payment.handleFormSubmission('binance', binanceForm);
            });
        }
        
        // Manejador para el formulario de Banco
        const bancoForm = document.getElementById('pagoFormBanco');
        if (bancoForm) {
            bancoForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                await payment.handleFormSubmission('banco', bancoForm);
            });
        }
    },
    
    handleFormSubmission: async (metodo, form) => {
        const statusElement = document.getElementById(`pagoStatus${metodo.charAt(0).toUpperCase() + metodo.slice(1)}`) || 
                             document.getElementById('pagoStatus');
        
        if (!statusElement) return;
        
        statusElement.textContent = 'Enviando comprobante...';
        
        const formData = new FormData();
        const nombre = form.querySelector('input[name="nombre"]').value;
        const email = form.querySelector('input[name="email"]').value;
        const producto = elements.pagoProduct.value;
        const file = form.querySelector('input[name="comprobante"]').files[0];
        
        if (!file) {
            statusElement.textContent = 'Adjunta una imagen del comprobante.';
            return;
        }
        
        formData.append('file', file);
        formData.append('payload_json', JSON.stringify({
            content: `🟣 **Nuevo pago ${metodo.toUpperCase()}**\n**Usuario:** ${nombre}\n**Correo:** ${email}\n**Producto:** ${producto}\n**Método:** ${metodo.toUpperCase()}`
        }));
        
        try {
            const res = await fetch(DISCORD_WEBHOOK, { 
                method: 'POST', 
                body: formData 
            });
            
            if (res.ok) {
                statusElement.textContent = '¡Comprobante enviado! Te contactaremos pronto.';
                form.reset();
                
                // Cerrar modal después de 2 segundos
                setTimeout(() => {
                    elements.pagoModal.classList.remove('active');
                    document.body.classList.remove('modal-open');
                }, 2000);
            } else {
                statusElement.textContent = 'Error al enviar. Intenta de nuevo.';
            }
        } catch (error) {
            statusElement.textContent = 'Error de red. Intenta de nuevo.';
        }
    }
};

// ===== GLOBAL FUNCTIONS =====
function openPagoModal(product) {
    if (!elements.pagoModal || !elements.pagoProduct) return;
    
    // Actualizar el producto en todos los formularios
    elements.pagoProduct.value = product.name;
    
    // Limpiar todos los estados de formularios
    const statusElements = [
        'pagoStatus',
        'pagoStatusPaypal', 
        'pagoStatusBinance', 
        'pagoStatusBanco'
    ];
    
    statusElements.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = '';
        }
    });
    
    // Resetear todos los formularios
    const forms = [
        'pagoForm',
        'pagoFormPaypal',
        'pagoFormBinance', 
        'pagoFormBanco'
    ];
    
    forms.forEach(id => {
        const form = document.getElementById(id);
        if (form) {
            form.reset();
        }
    });
    
    elements.pagoModal.classList.add('active');
    document.body.classList.add('modal-open');
}

// Función global para abrir modal desde HTML
window.openPagoModal = openPagoModal;

// Discord webhook URL
const DISCORD_WEBHOOK = "https://discord.com/api/webhooks/1381074076277149706/NiiZT9ZV_yIswrFkjx9tIKCJYIOGK0to-f8M0tHXugaOLHFaj0ZqNxkKOY7RZAreL8tf";

// ===== CUSTOM FUNCTIONS MODULE =====
const customFunctions = {
    selectedFunctions: new Map(),
    functionPrices: {
        aimbot: 5,
        chams: 6,
        cambio: 3,
        bugcamara: 3,
        camaraside: 3,
        wallhack: 8,
        fly: 4,
        esplines: 10,
        fakelag: 10,
        ghost: 2
    },
    
    init() {
        this.handleFunctionSelection();
        this.handleCustomBuy();
    },
    
    handleFunctionSelection() {
        const checkboxes = document.querySelectorAll('input[name="functions"]');
        checkboxes.forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                const functionName = e.target.value;
                const isChecked = e.target.checked;
                
                if (isChecked) {
                    this.selectedFunctions.set(functionName, this.functionPrices[functionName]);
                } else {
                    this.selectedFunctions.delete(functionName);
                }
                
                this.updateSummary();
            });
        });
    },
    
    updateSummary() {
        const selectedFunctionsDiv = document.getElementById('selectedFunctions');
        const totalPriceSpan = document.getElementById('totalPrice');
        const customBuyBtn = document.getElementById('customBuyBtn');
        
        if (this.selectedFunctions.size === 0) {
            selectedFunctionsDiv.innerHTML = '<p class="no-functions">Selecciona al menos 3 funciones</p>';
            totalPriceSpan.textContent = '$0';
            customBuyBtn.disabled = true;
            return;
        }
        
        if (this.selectedFunctions.size < 3) {
            selectedFunctionsDiv.innerHTML = functionsHTML;
            totalPriceSpan.textContent = `$${total}`;
            customBuyBtn.disabled = true;
            customBuyBtn.innerHTML = `<i class="fas fa-lock"></i> Selecciona al menos 3 funciones`;
            return;
        }
        
        let total = 0;
        let functionsHTML = '';
        
        this.selectedFunctions.forEach((price, functionName) => {
            total += price;
            const displayName = this.getDisplayName(functionName);
            functionsHTML += `
                <div class="selected-function">
                    <span class="selected-function-name">${displayName}</span>
                    <span class="selected-function-price">+$${price}</span>
                </div>
            `;
        });
        
        selectedFunctionsDiv.innerHTML = functionsHTML;
        
        // Si se seleccionan todas las funciones (10 funciones), mostrar $20/mes
        if (this.selectedFunctions.size === 10) {
            totalPriceSpan.textContent = '$20 / mes';
            // Agregar un mensaje especial
            selectedFunctionsDiv.innerHTML += '<div class="premium-notice"><i class="fas fa-star"></i> ¡Paquete Premium Completo!</div>';
        } else {
            totalPriceSpan.textContent = `$${total}`;
        }
        
        customBuyBtn.disabled = false;
        customBuyBtn.innerHTML = `<i class="fas fa-shopping-cart"></i> Comprar Personalizado`;
    },
    
    getDisplayName(functionName) {
        const names = {
            aimbot: 'Aimbot (Neck)',
            chams: 'Chams',
            cambio: 'Cambio Rápido',
            bugcamara: 'Bug Cámara',
            camaraside: 'Cámara Side',
            wallhack: 'WallHack (N32 - P64)',
            fly: 'Fly (N32 - P64)',
            esplines: 'ESP Líneas (TP BASE - BASE - TP 10M - UP PLAYER - RAGE)',
            fakelag: 'Fake Lag (V1 - V2 - V2.1)',
            ghost: 'Ghost Mode'
        };
        return names[functionName] || functionName;
    },
    
    handleCustomBuy() {
        const customBuyBtn = document.getElementById('customBuyBtn');
        if (!customBuyBtn) return;
        
        customBuyBtn.addEventListener('click', () => {
            if (this.selectedFunctions.size < 3) return;
            
            let total = Array.from(this.selectedFunctions.values()).reduce((sum, price) => sum + price, 0);
            const selectedFunctionsList = Array.from(this.selectedFunctions.keys()).map(name => this.getDisplayName(name)).join(', ');
            
            // Si se seleccionan todas las funciones (10 funciones), el precio es $20
            if (this.selectedFunctions.size === 10) {
                total = 20;
            }
            
            // Crear un producto personalizado
            const customProduct = {
                id: 999,
                name: `Paquete Personalizado`,
                price: total,
                originalPrice: total,
                image: "https://cdn-icons-png.flaticon.com/512/3523/3523891.png",
                category: "custom",
                description: `Funciones seleccionadas: ${selectedFunctionsList}`,
                features: Array.from(this.selectedFunctions.keys()),
                isNew: true,
                isFeatured: false
            };
            
            // Abrir modal de pago con el producto personalizado
            openPagoModal(customProduct);
        });
    }
};

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', () => {
    // Initialize elements first
    elements = getElements();
    
    // Ensure modals are hidden on startup
    if (elements.quickViewModal) elements.quickViewModal.classList.remove('active');
    if (elements.pagoModal) elements.pagoModal.classList.remove('active');
    
    // Initialize all modules
    loadingScreen.init();
    header.init();
    search.init();
    productGrid.init();
    cartManager.init();
    wishlistManager.init();
    animations.init();
    smoothScroll.init();
    newsletter.init();
    offerCards.init();
    categoryCards.init();
    payment.init();
    updateProject.init();
    customFunctions.init(); // Initialize custom functions module
    customProject.init(); // Initialize custom project module
    initMobileMenu(); // Initialize mobile menu
    initNotificationSystem(); // Initialize notification system
    
    // Initialize hero animations
    setTimeout(() => {
        utils.safeQuerySelectorAll('.hero-title-line').forEach((line, index) => {
            if (line) {
                line.style.animationDelay = `${index * 0.2}s`;
            }
        });
    }, 500);
    
    console.log('FFCheats initialized successfully!');
});

// ===== MOBILE MENU =====
function initMobileMenu() {
    const mobileMenuToggle = document.getElementById('mobileMenuToggle');
    const navMenu = document.getElementById('navMenu');
    
    if (!mobileMenuToggle || !navMenu) return;
    
    mobileMenuToggle.addEventListener('click', () => {
        mobileMenuToggle.classList.toggle('active');
        navMenu.classList.toggle('active');
        document.body.classList.toggle('menu-open');
    });
    
    // Cerrar menú al hacer click en un enlace
    const navLinks = navMenu.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            mobileMenuToggle.classList.remove('active');
            navMenu.classList.remove('active');
            document.body.classList.remove('menu-open');
        });
    });
    
    // Cerrar menú al hacer click fuera
    document.addEventListener('click', (e) => {
        if (!mobileMenuToggle.contains(e.target) && !navMenu.contains(e.target)) {
            mobileMenuToggle.classList.remove('active');
            navMenu.classList.remove('active');
            document.body.classList.remove('menu-open');
        }
    });
}

// ===== NOTIFICATION SYSTEM =====
function initNotificationSystem() {
    const notificationBell = document.getElementById('notificationBell');
    const notificationCenter = document.getElementById('notificationCenter');
    const closeNotifications = document.getElementById('closeNotifications');
    const notificationCount = document.getElementById('notificationCount');
    
    if (!notificationBell || !notificationCenter) return;
    
    // Abrir centro de notificaciones
    notificationBell.addEventListener('click', () => {
        notificationCenter.classList.add('active');
        document.body.style.overflow = 'hidden';
    });
    
    // Cerrar centro de notificaciones
    closeNotifications.addEventListener('click', () => {
        notificationCenter.classList.remove('active');
        document.body.style.overflow = '';
    });
    
    // Cerrar al hacer click fuera
    document.addEventListener('click', (e) => {
        if (!notificationBell.contains(e.target) && !notificationCenter.contains(e.target)) {
            notificationCenter.classList.remove('active');
            document.body.style.overflow = '';
        }
    });
    
    // Simular nuevas notificaciones
    let count = 3;
    setInterval(() => {
        if (Math.random() > 0.7) { // 30% de probabilidad cada 10 segundos
            count++;
            notificationCount.textContent = count;
            notificationCount.style.animation = 'pulse 0.5s ease-in-out';
            setTimeout(() => {
                notificationCount.style.animation = '';
            }, 500);
        }
    }, 10000);
}

// ===== UPDATE PROJECT MODULE =====
const updateProject = {
    init() {
        this.handleUpdateForm();
    },

    handleUpdateForm() {
        if (!elements.updateForm) return;

        elements.updateForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const formData = new FormData();
            const projectName = document.getElementById('projectName').value;
            const updateType = document.getElementById('updateType').value;
            const updateDescription = document.getElementById('updateDescription').value;
            const clientEmail = document.getElementById('clientEmail').value;
            const projectFiles = document.getElementById('projectFiles').files;

            // Validar campos requeridos
            if (!projectName || !updateType || !updateDescription || !clientEmail) {
                notification.show('Por favor completa todos los campos requeridos', 'error');
                return;
            }

            // Agregar datos del formulario
                                    formData.append('payload_json', JSON.stringify({
                            content: `🔄 **Nueva Solicitud de Actualización de Cheat**\n**Aplicación:** ${projectName}\n**Tipo:** ${updateType}\n**Cliente:** ${clientEmail}\n**Descripción:** ${updateDescription}`
                        }));

            // Agregar archivos si existen
            if (projectFiles.length > 0) {
                for (let i = 0; i < projectFiles.length; i++) {
                    formData.append('file', projectFiles[i]);
                }
            }

            try {
                // Mostrar estado de envío
                const submitBtn = elements.updateForm.querySelector('.update-submit-btn');
                const originalText = submitBtn.innerHTML;
                submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enviando...';
                submitBtn.disabled = true;

                const res = await fetch(DISCORD_WEBHOOK, { 
                    method: 'POST', 
                    body: formData 
                });

                if (res.ok) {
                    // Restaurar botón primero
                    submitBtn.innerHTML = originalText;
                    submitBtn.disabled = false;
                    
                    // Mostrar notificación
                    notification.show('¡Solicitud enviada! Te contactaremos pronto.', 'success');
                    elements.updateForm.reset();
                } else {
                    // Restaurar botón
                    submitBtn.innerHTML = originalText;
                    submitBtn.disabled = false;
                    notification.show('Error al enviar la solicitud. Intenta de nuevo.', 'error');
                }
            } catch (error) {
                // Restaurar botón
                const submitBtn = elements.updateForm.querySelector('.update-submit-btn');
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
                notification.show('Error de red. Intenta de nuevo.', 'error');
            }
        });
    }
};

// ===== CUSTOM PROJECT MODULE =====
const customProject = {
    init() {
        this.handleProjectForm();
    },
    
    handleProjectForm() {
        const form = document.getElementById('projectForm');
        const openPaymentBtn = document.getElementById('openProjectPayment');
        
        if (!form || !openPaymentBtn) return;
        
        openPaymentBtn.addEventListener('click', (e) => {
            e.preventDefault();
            
            // Validar formulario
            if (!form.checkValidity()) {
                form.reportValidity();
                return;
            }
            
            // Recopilar datos del proyecto
            const formData = new FormData(form);
            const projectData = {
                type: formData.get('projectType'),
                name: formData.get('projectName'),
                description: formData.get('projectDescription'),
                functions: formData.get('projectFunctions') || 'No especificadas',
                budget: formData.get('projectBudget') || 'No especificado',
                deadline: formData.get('projectDeadline') || 'No especificada',
                email: formData.get('clientEmail')
            };
            
            // Calcular precio basado en el tipo
            let price = 0;
            if (projectData.type === 'complete') {
                price = 150; // Proyecto completo
            } else {
                price = 80; // Proyecto personalizado
            }
            
            // Crear mensaje para WhatsApp
            const whatsappMessage = this.createWhatsAppMessage(projectData, price);
            
            // Abrir WhatsApp con el mensaje
            this.openWhatsApp(whatsappMessage);
            
            // Mostrar notificación
            notification.show('✅ Abriendo WhatsApp con los detalles del proyecto', 'success');
            
            // Resetear formulario después de un momento
            setTimeout(() => {
                form.reset();
            }, 2000);
        });
    },
    
    createWhatsAppMessage(projectData, price) {
        const typeText = projectData.type === 'complete' ? 'Proyecto Completo' : 'Proyecto Personalizado';
        
        return `🚀 *NUEVA SOLICITUD DE PROYECTO*

*Tipo:* ${typeText}
*Nombre:* ${projectData.name}
*Descripción:* ${projectData.description}
*Funciones:* ${projectData.functions}
*Presupuesto:* ${projectData.budget}
*Fecha de Entrega:* ${projectData.deadline}
*Email:* ${projectData.email}
*Precio Estimado:* $${price}

*Fecha:* ${new Date().toLocaleString('es-ES')}

Cliente interesado en contratar servicios de desarrollo de cheats para Free Fire.`;
    },
    
    openWhatsApp(message) {
        const phoneNumber = '+56974137256';
        const encodedMessage = encodeURIComponent(message);
        const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;
        
        // Abrir WhatsApp en nueva pestaña
        window.open(whatsappUrl, '_blank');
    }
};

// ===== GLOBAL FUNCTIONS FOR HTML ONCLICK =====
window.cartManager = cartManager;
window.wishlistManager = wishlistManager;
window.quickView = quickView;
window.openPagoModal = openPagoModal; 