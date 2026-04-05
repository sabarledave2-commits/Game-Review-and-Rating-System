import { api } from './api.js';
import { components } from './components.js';

const appContent = document.getElementById('app-content');
const authLinks = document.getElementById('auth-links');
const userInfo = document.getElementById('user-info');
const usernameDisplay = document.getElementById('username-display');
const navHome = document.getElementById('nav-home');
const navGames = document.getElementById('nav-games');
const navLogout = document.getElementById('nav-logout');

let currentUser = JSON.parse(localStorage.getItem('user')) || null;

function updateAuthState() {
    if (currentUser) {
        authLinks.classList.add('hidden');
        userInfo.classList.remove('hidden');
        usernameDisplay.textContent = `Hi, ${currentUser.username}`;
    } else {
        authLinks.classList.remove('hidden');
        userInfo.classList.add('hidden');
    }
}

async function renderHome() {
    appContent.innerHTML = components.hero();
    try {
        const games = await api.getGames();
        const grid = document.createElement('div');
        grid.className = 'game-grid';
        grid.innerHTML = games.slice(0, 4).map(game => components.gameCard(game)).join('');
        appContent.appendChild(grid);
    } catch (error) {
        console.error("Failed to render home games:", error);
        appContent.innerHTML = '<p style="color: red; text-align: center;">Could not load games. Please try again later.</p>';
    }
}

async function renderGames() {
    appContent.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem;">
            <h2>All Games</h2>
            ${currentUser ? '<button id="btn-add-game" class="btn-primary" style="width: auto; padding: 0.5rem 1rem;">Add New Game</button>' : ''}
        </div>
    `;
    try {
        const games = await api.getGames();
        const grid = document.createElement('div');
        grid.className = 'game-grid';
        grid.innerHTML = games.map(game => components.gameCard(game)).join('');
        appContent.appendChild(grid);

        if (currentUser) {
            document.getElementById('btn-add-game').addEventListener('click', () => {
                window.location.hash = '#add-game';
            });
        }
    } catch (error) {
        console.error("Failed to render games list:", error);
        appContent.innerHTML += '<p style="color: red; text-align: center;">Could not load games list. Please try again later.</p>';
    }
}

async function renderGameDetail(id) {
    try {
        const game = await api.getGame(id);

        appContent.innerHTML = `
            <div class="game-detail">
                <div class="detail-img">
                    ${game.image_url ? `<img src="${game.image_url}" alt="${game.title}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 8px;">` : '<i class="fas fa-gamepad"></i>'}
                </div>
                <div class="detail-content">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                        <h2>${game.title}</h2>
                        ${currentUser ? `
                            <div style="display: flex; gap: 0.5rem;">
                                <button id="btn-edit-game" class="btn-secondary" style="width: auto; padding: 0.4rem 0.8rem;">
                                    <i class="fas fa-edit"></i> Edit
                                </button>
                                <button id="btn-delete-game" class="btn-danger" style="width: auto; padding: 0.4rem 0.8rem; background-color: #ff4d4d; color: white;">
                                    <i class="fas fa-trash"></i> Delete
                                </button>
                            </div>
                        ` : ''}
                    </div>
                    <div class="detail-meta">
                        <span class="tag">${game.genre_name}</span>
                        <span class="rating"><i class="fas fa-star"></i> ${game.average_rating || '0.00'}/10</span>
                        <span class="tag">${game.developer}</span>
                        <span class="tag">${game.release_date ? new Date(game.release_date).getFullYear() : 'N/A'}</span>
                    </div>
                    <div class="detail-meta">
                        ${game.platforms && Array.isArray(game.platforms) ? game.platforms.map(p => `<span class="tag">${p.name}</span>`).join('') : ''}
                    </div>
                    <p style="font-size: 1.1rem; margin-bottom: 2rem;">${game.description}</p>
                    
                    <div id="review-form-container">
                        ${currentUser ? `
                            <h3>Write a Review</h3>
                            <form id="review-form" style="margin-bottom: 2rem;">
                                <div class="form-group">
                                    <label>Rating (1-10)</label>
                                    <input type="number" id="review-rating" min="1" max="10" value="10" required>
                                </div>
                                <div class="form-group">
                                    <label>Your Review</label>
                                    <textarea id="review-text" rows="4" placeholder="Tell us what you think..." required></textarea>
                                </div>
                                <button type="submit" style="width: auto; padding: 0.8rem 2rem;">Post Review</button>
                            </form>
                        ` : '<p><a href="#login" style="color: var(--primary-color)">Login</a> to write a review.</p>'}
                    </div>

                    <div class="reviews-section">
                        <h3>Community Reviews</h3>
                        <div id="reviews-list">
                            ${game.reviews && Array.isArray(game.reviews) && game.reviews.length > 0 ? game.reviews.map(r => components.reviewCard(r, currentUser?.id)).join('') : '<p>No reviews yet. Be the first!</p>'}
                        </div>
                    </div>
                </div>
            </div>
        `;

        if (currentUser) {
            document.getElementById('btn-edit-game')?.addEventListener('click', () => {
                window.location.hash = `#edit-game/${id}`;
            });

            document.getElementById('btn-delete-game')?.addEventListener('click', async () => {
                if (confirm('Are you sure you want to delete this game? This will also remove all its reviews.')) {
                    try {
                        await api.deleteGame(id);
                        alert('Game deleted successfully');
                        window.location.hash = '#games';
                    } catch (err) {
                        console.error('Error deleting game:', err);
                        alert('Error deleting game: ' + err.message);
                    }
                }
            });

            document.getElementById('review-form')?.addEventListener('submit', async (e) => {
                e.preventDefault();
                const rating = document.getElementById('review-rating').value;
                const review_text = document.getElementById('review-text').value;
                
                try {
                    await api.postReview({
                        game_id: id,
                        user_id: currentUser.id,
                        rating,
                        review_text
                    });
                    renderGameDetail(id); // Reload
                } catch (err) {
                    console.error("Error posting review:", err);
                    alert('Error posting review: ' + err.message);
                }
            });

            // Review Edit Buttons
            document.querySelectorAll('.btn-edit-review').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const reviewId = btn.dataset.id;
                    const review = game.reviews.find(r => r.id == reviewId);
                    const reviewCard = document.getElementById(`review-${reviewId}`);
                    const originalContent = reviewCard.querySelector('.review-content').innerHTML;
                    
                    reviewCard.querySelector('.review-content').innerHTML = components.editReviewForm(review);
                    
                    reviewCard.querySelector('.edit-review-form').addEventListener('submit', async (formEv) => {
                        formEv.preventDefault();
                        const rating = reviewCard.querySelector('.edit-rating').value;
                        const review_text = reviewCard.querySelector('.edit-text').value;
                        
                        try {
                            await api.updateReview(reviewId, { rating, review_text });
                            renderGameDetail(id); // Reload full detail to update avg rating too
                        } catch (err) {
                            console.error("Error updating review:", err);
                            alert('Error updating review: ' + err.message);
                        }
                    });

                    reviewCard.querySelector('.btn-cancel-edit').addEventListener('click', () => {
                        reviewCard.querySelector('.review-content').innerHTML = originalContent;
                    });
                });
            });
        }
    } catch (error) {
        console.error(`Error fetching or rendering game detail for ID ${id}:`, error);
        appContent.innerHTML = `<p style="color: red; text-align: center;">Failed to load game details. ${error.message || 'Please try again later.'}</p>`;
    }
}

async function renderGameForm(id = null) {
    if (!currentUser) {
        window.location.hash = '#login';
        return;
    }

    let genres, platforms, game = null;
    try {
        [genres, platforms] = await Promise.all([
            api.getGenres(),
            api.getPlatforms()
        ]);

        if (id) {
            game = await api.getGame(id);
        }

        appContent.innerHTML = components.gameForm(genres, platforms, game);

        document.getElementById('game-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = {
                title: document.getElementById('game-title').value,
                genre_id: document.getElementById('game-genre').value,
                developer: document.getElementById('game-developer').value,
                release_date: document.getElementById('game-release-date').value,
                image_url: document.getElementById('game-image-url').value,
                description: document.getElementById('game-description').value,
                platforms: Array.from(document.querySelectorAll('input[name="platforms"]:checked')).map(cb => cb.value)
            };

            try {
                if (id) {
                    await api.updateGame(id, formData);
                    alert('Game updated successfully!');
                    window.location.hash = `#game/${id}`;
                } else {
                    const res = await api.createGame(formData);
                    alert('Game added successfully!');
                    window.location.hash = `#game/${res.id}`;
                }
            } catch (err) {
                console.error('Error saving game:', err);
                let msg = 'Error saving game: ' + err.message;
                if (err.details) msg += '\n\nDetails: ' + err.details;
                if (err.stack && !err.message.includes('stack')) {
                    console.log('Server Stack Trace:', err.stack);
                }
                alert(msg);
            }
        });
    } catch (error) {
        console.error("Failed to render game form:", error);
        appContent.innerHTML = `<p style="color: red; text-align: center;">Could not load form data. ${error.message}</p>`;
    }
}

function handleRouting() {
    const hash = window.location.hash;
    const [page, id] = hash.slice(1).split('/');

    // Clear active classes
    navHome.classList.remove('active');
    navGames.classList.remove('active');

    if (page === 'game' && id) {
        renderGameDetail(id);
    } else if (page === 'games') {
        navGames.classList.add('active');
        renderGames();
    } else if (page === 'add-game') {
        renderGameForm();
    } else if (page === 'edit-game' && id) {
        renderGameForm(id);
    } else if (page === 'login') {
        appContent.innerHTML = components.loginForm();
        setupAuthForms();
    } else if (page === 'signup') {
        appContent.innerHTML = components.signupForm();
        setupAuthForms();
    } else {
        navHome.classList.add('active');
        renderHome();
    }
}

function setupAuthForms() {
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('login-email').value;
            const password = document.getElementById('login-password').value;
            try {
                const res = await api.login(email, password);
                if (res.user) {
                    currentUser = res.user;
                    localStorage.setItem('user', JSON.stringify(currentUser));
                    updateAuthState();
                    window.location.hash = '#';
                } else {
                    alert(res.message);
                }
            } catch (err) {
                console.error("Login error:", err);
                alert('Login failed. Please check your credentials.');
            }
        });
    }

    const signupForm = document.getElementById('signup-form');
    if (signupForm) {
        signupForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = document.getElementById('signup-username').value;
            const email = document.getElementById('signup-email').value;
            const password = document.getElementById('signup-password').value;
            try {
                const res = await api.signup(username, email, password);
                if (res.message === 'User created successfully') {
                    window.location.hash = '#login';
                } else {
                    alert(res.message);
                }
            } catch (err) {
                console.error("Signup error:", err);
                alert('Signup failed. Please try again.');
            }
        });
    }
}

// Navigation Events
navHome.addEventListener('click', (e) => { e.preventDefault(); window.location.hash = '#'; });
navGames.addEventListener('click', (e) => { e.preventDefault(); window.location.hash = '#games'; });
document.getElementById('nav-login').addEventListener('click', (e) => { e.preventDefault(); window.location.hash = '#login'; });
document.getElementById('nav-signup').addEventListener('click', (e) => { e.preventDefault(); window.location.hash = '#signup'; });
navLogout.addEventListener('click', (e) => {
    e.preventDefault();
    currentUser = null;
    localStorage.removeItem('user');
    updateAuthState();
    window.location.hash = '#';
});

window.addEventListener('hashchange', handleRouting);
window.addEventListener('DOMContentLoaded', () => {
    updateAuthState();
    handleRouting();
});
