/* ============================================
   THE MARKET - JAVASCRIPT FUNCTIONALITY
   ============================================ */

const API_BASE = 'http://localhost:3000';
let products = [];
let currentUser = JSON.parse(localStorage.getItem('currentUser')) || null;

// Initialize page on load
document.addEventListener('DOMContentLoaded', () => {
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    const splashScreen = document.getElementById('splashScreen');

    if (splashScreen) {
        setTimeout(() => {
            splashScreen.classList.add('hidden');
        }, 3000);
    }
    
    // Check if user is logged in
    if (currentUser === null && (currentPage !== 'index.html' && currentPage !== 'login.html' && currentPage !== 'register.html')) {
        window.location.href = 'index.html';
    }

    // Display user info if logged in
    if (currentUser) {
        const userNameElements = document.querySelectorAll('#userName, #businessName');
        userNameElements.forEach(el => {
            el.textContent = currentUser.userType === 'customer'
                ? (currentUser.fullName || currentUser.name || currentUser.email)
                : (currentUser.businessName || currentUser.name || currentUser.email);
        });
    }

    // Handle different pages
    if (currentPage === 'register.html') {
        document.getElementById('userType').addEventListener('change', toggleBusinessFields);
        document.getElementById('registerForm').addEventListener('submit', handleRegister);
    } else if (currentPage === 'login.html') {
        document.getElementById('loginForm').addEventListener('submit', handleLogin);
    } else if (currentPage === 'customer-dashboard.html') {
        loadCustomerProducts();
        document.getElementById('searchInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') searchProducts();
        });
    } else if (currentPage === 'business-dashboard.html') {
        loadBusinessProducts();
        document.getElementById('editProductForm').addEventListener('submit', handleEditProduct);
    } else if (currentPage === 'add-product.html') {
        document.getElementById('productImage').addEventListener('change', updateImagePreview);
        document.getElementById('productImage').addEventListener('keyup', updateImagePreview);
        document.getElementById('addProductForm').addEventListener('submit', handleAddProduct);
    }
});

// ============================================
// AUTHENTICATION FUNCTIONS
// ============================================

function toggleBusinessFields() {
    const userType = document.getElementById('userType').value;
    const businessSection = document.getElementById('businessSection');
    const businessSection2 = document.getElementById('businessSection2');
    
    if (userType === 'business') {
        businessSection.classList.remove('hidden');
        businessSection2.classList.remove('hidden');
    } else {
        businessSection.classList.add('hidden');
        businessSection2.classList.add('hidden');
    }
}

async function handleRegister(e) {
    e.preventDefault();
    
    const fullName = document.getElementById('fullName').value;
    const email = document.getElementById('email').value;
    const phone = document.getElementById('phone').value;
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const userType = document.getElementById('userType').value;

    // Validate passwords match
    if (password !== confirmPassword) {
        alert('Passwords do not match!');
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/api/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: fullName,
                email,
                password
            })
        });

        const data = await response.json();
        if (!response.ok) {
            alert(data.message || 'Registration failed.');
            return;
        }

        alert('Registration successful! Please login.');
        window.location.href = 'login.html';
    } catch (error) {
        console.error(error);
        alert('Unable to register right now. Please try again later.');
    }
}

async function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const userType = document.getElementById('userType').value;

    try {
        const response = await fetch(`${API_BASE}/api/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email,
                password
            })
        });

        const data = await response.json();
        if (!response.ok) {
            alert(data.message || 'Invalid credentials!');
            return;
        }

        currentUser = {
            id: data.id,
            email: data.email,
            name: data.name,
            token: data.token,
            userType,
            fullName: data.name,
            businessName: userType === 'business' ? data.name : null
        };
        localStorage.setItem('currentUser', JSON.stringify(currentUser));

        if (userType === 'customer') {
            window.location.href = 'customer-dashboard.html';
        } else {
            window.location.href = 'business-dashboard.html';
        }
    } catch (error) {
        console.error(error);
        alert('Unable to login right now. Please try again later.');
    }
}

function logout() {
    currentUser = null;
    localStorage.setItem('currentUser', null);
    localStorage.removeItem('currentUser');
    window.location.href = 'index.html';
}

// ============================================
// NAVIGATION FUNCTIONS
// ============================================

function navigateTo(page) {
    window.location.href = page;
}

// ============================================
// CUSTOMER FUNCTIONS
// ============================================

async function loadProducts() {
    try {
        const response = await fetch(`${API_BASE}/api/products`);
        products = await response.json();
    } catch (err) {
        console.error('Failed to load products', err);
        products = [];
    }
}

async function loadCustomerProducts() {
    await loadProducts();
    const productsGrid = document.getElementById('productsGrid');
    
    if (products.length === 0) {
        productsGrid.innerHTML = '<div class="loading-state"><p>📦 No products available yet. Check back soon!</p></div>';
        return;
    }

    displayProducts(products);
}

function displayProducts(productsToDisplay) {
    const productsGrid = document.getElementById('productsGrid');
    
    if (productsToDisplay.length === 0) {
        productsGrid.innerHTML = '<div class="loading-state"><p>No products found.</p></div>';
        return;
    }

    productsGrid.innerHTML = productsToDisplay.map(product => `
        <div class="product-card" onclick="openProductModal(${product.id})">
            <img src="${product.image || 'https://via.placeholder.com/300x200?text=No+Image'}" alt="${product.name}" class="product-image">
            <div class="product-info">
                <div class="business-name">${product.businessName}</div>
                <div class="product-name">${product.name}</div>
                <div class="product-price">$${product.price}</div>
                <div class="product-category">${product.category}</div>
            </div>
        </div>
    `).join('');
}

function searchProducts() {
    const searchInput = document.getElementById('searchInput').value.toLowerCase();
    
    const filtered = products.filter(product => 
        product.name.toLowerCase().includes(searchInput) ||
        (product.businessName || '').toLowerCase().includes(searchInput) ||
        (product.category || '').toLowerCase().includes(searchInput)
    );

    displayProducts(filtered);
}

function sortProducts() {
    const sortBy = document.getElementById('sortBy').value;
    let sorted = [...products];

    switch(sortBy) {
        case 'name':
            sorted.sort((a, b) => a.name.localeCompare(b.name));
            break;
        case 'price-low':
            sorted.sort((a, b) => a.price - b.price);
            break;
        case 'price-high':
            sorted.sort((a, b) => b.price - a.price);
            break;
        case 'newest':
            sorted.sort((a, b) => b.id - a.id);
            break;
    }

    displayProducts(sorted);
}

function openProductModal(productId) {
    const product = products.find(p => p.id === productId);
    
    if (!product) return;

    document.getElementById('modalProductImage').src = product.image || 'https://via.placeholder.com/300x200?text=No+Image';
    document.getElementById('modalProductName').textContent = product.name;
    document.getElementById('modalBusinessName').textContent = `By: ${product.businessName}`;
    document.getElementById('modalProductDescription').textContent = product.description;
    document.getElementById('modalProductPrice').textContent = `$${product.price}`;
    document.getElementById('modalProductCategory').textContent = product.category;
    
    document.getElementById('productModal').classList.add('show');
}

function closeProductModal() {
    document.getElementById('productModal').classList.remove('show');
}

// ============================================
// BUSINESS FUNCTIONS
// ============================================

async function loadBusinessProducts() {
    await loadProducts();
    const productsTableBody = document.getElementById('productsTableBody');
    
    const businessProducts = products.filter(p => p.user_id === currentUser.id);

    if (businessProducts.length === 0) {
        productsTableBody.innerHTML = '<tr class="empty-state"><td colspan="6">No products added yet. <a href="add-product.html">Add your first product</a></td></tr>';
        return;
    }

    productsTableBody.innerHTML = businessProducts.map(product => `
        <tr>
            <td><img src="${product.image || 'https://via.placeholder.com/50x50?text=No+Image'}" alt="${product.name}"></td>
            <td>${product.name}</td>
            <td>${product.category || ''}</td>
            <td>$${product.price}</td>
            <td>${product.description.substring(0, 50)}...</td>
            <td>
                <div class="action-buttons">
                    <button class="btn btn-edit" onclick="openEditModal(${product.id})">Edit</button>
                    <button class="btn btn-delete" onclick="deleteProduct(${product.id})">Delete</button>
                </div>
            </td>
        </tr>
    `).join('');
}

function searchBusinessProducts() {
    const searchInput = document.getElementById('searchInput').value.toLowerCase();
    const productsTableBody = document.getElementById('productsTableBody');
    
    const businessProducts = products.filter(p => 
        p.user_id === currentUser.id && 
        (p.name.toLowerCase().includes(searchInput) ||
        (p.category || '').toLowerCase().includes(searchInput))
    );

    if (businessProducts.length === 0) {
        productsTableBody.innerHTML = '<tr class="empty-state"><td colspan="6">No products found.</td></tr>';
        return;
    }

    productsTableBody.innerHTML = businessProducts.map(product => `
        <tr>
            <td><img src="${product.image || 'https://via.placeholder.com/50x50?text=No+Image'}" alt="${product.name}"></td>
            <td>${product.name}</td>
            <td>${product.category}</td>
            <td>$${product.price}</td>
            <td>${product.description.substring(0, 50)}...</td>
            <td>
                <div class="action-buttons">
                    <button class="btn btn-edit" onclick="openEditModal(${product.id})">Edit</button>
                    <button class="btn btn-delete" onclick="deleteProduct(${product.id})">Delete</button>
                </div>
            </td>
        </tr>
    `).join('');
}

async function handleAddProduct(e) {
    e.preventDefault();

    const name = document.getElementById('productName').value;
    const category = document.getElementById('productCategory').value;
    const price = parseFloat(document.getElementById('productPrice').value);
    const description = document.getElementById('productDescription').value;
    const image = document.getElementById('productImage').value;
    const stock = parseInt(document.getElementById('productStock').value);

    try {
        const response = await fetch(`${API_BASE}/api/products`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${currentUser?.token}`
            },
            body: JSON.stringify({
                title: name,
                description,
                price,
                image
            })
        });

        const data = await response.json();
        if (!response.ok) {
            alert(data.message || 'Failed to add product.');
            return;
        }

        alert('Product added successfully!');
        window.location.href = 'business-dashboard.html';
    } catch (error) {
        console.error(error);
        alert('Unable to add product right now. Please try again later.');
    }
}

function openEditModal(productId) {
    const product = products.find(p => p.id === productId);
    
    if (!product) return;

    document.getElementById('editProductId').value = product.id;
    document.getElementById('editProductName').value = product.name;
    document.getElementById('editProductCategory').value = product.category;
    document.getElementById('editProductPrice').value = product.price;
    document.getElementById('editProductDescription').value = product.description;
    document.getElementById('editProductImage').value = product.image;

    document.getElementById('editModal').classList.add('show');
}

function closeEditModal() {
    document.getElementById('editModal').classList.remove('show');
}

function handleEditProduct(e) {
    e.preventDefault();

    const productId = parseInt(document.getElementById('editProductId').value);
    const productIndex = products.findIndex(p => p.id === productId);

    if (productIndex === -1) return;

    products[productIndex].name = document.getElementById('editProductName').value;
    products[productIndex].category = document.getElementById('editProductCategory').value;
    products[productIndex].price = parseFloat(document.getElementById('editProductPrice').value);
    products[productIndex].description = document.getElementById('editProductDescription').value;
    products[productIndex].image = document.getElementById('editProductImage').value;

    localStorage.setItem('products', JSON.stringify(products));
    
    alert('Product updated successfully!');
    closeEditModal();
    loadBusinessProducts();
}

function deleteProduct(productId) {
    if (confirm('Are you sure you want to delete this product?')) {
        products = products.filter(p => p.id !== productId);
        localStorage.setItem('products', JSON.stringify(products));
        loadBusinessProducts();
    }
}

// ============================================
// IMAGE PREVIEW FUNCTION
// ============================================

function updateImagePreview() {
    const imageUrl = document.getElementById('productImage').value;
    const imagePreview = document.getElementById('imagePreview');

    if (imageUrl) {
        const img = document.createElement('img');
        img.src = imageUrl;
        img.onload = function() {
            imagePreview.innerHTML = '';
            imagePreview.appendChild(img);
        };
        img.onerror = function() {
            imagePreview.innerHTML = '<p>❌ Invalid image URL</p>';
        };
    } else {
        imagePreview.innerHTML = '<p>Image will appear here</p>';
    }
}

// Close modals when clicking outside
window.onclick = function(event) {
    const productModal = document.getElementById('productModal');
    const editModal = document.getElementById('editModal');
    
    if (productModal && event.target === productModal) {
        closeProductModal();
    }
    if (editModal && event.target === editModal) {
        closeEditModal();
    }
};
