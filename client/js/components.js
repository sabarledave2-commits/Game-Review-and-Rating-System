export const components = {
    gameCard(game) {
        return `
            <div class="game-card" onclick="window.location.hash = '#game/${game.id}'">
                <div class="game-img">
                    ${game.image_url ? `<img src="${game.image_url}" alt="${game.title}" style="width: 100%; height: 100%; object-fit: cover;">` : '<i class="fas fa-gamepad"></i>'}
                </div>
                <div class="game-info">
                    <div class="game-title">${game.title}</div>
                    <div class="game-meta">
                        <span>${game.genre_name}</span>
                        <span class="rating"><i class="fas fa-star"></i> ${game.average_rating || 'N/A'}</span>
                    </div>
                </div>
            </div>
        `;
    },

    reviewCard(review, currentUserId = null) {
        const isOwner = currentUserId && review.user_id === currentUserId;
        return `
            <div class="review-card" id="review-${review.id}">
                <div class="review-header">
                    <span class="review-user">${review.username}</span>
                    <div class="review-meta">
                        <span class="rating"><i class="fas fa-star"></i> ${review.rating}/10</span>
                        ${isOwner ? `<button class="btn-edit-review" data-id="${review.id}"><i class="fas fa-edit"></i></button>` : ''}
                    </div>
                </div>
                <div class="review-content">
                    <p>${review.review_text}</p>
                    <small style="color: #a0a0a0">${new Date(review.created_at).toLocaleDateString()}</small>
                </div>
            </div>
        `;
    },

    gameForm(genres, platforms, game = null) {
        const isEdit = !!game;
        return `
            <div class="auth-container" style="max-width: 800px;">
                <h2>${isEdit ? 'Edit Game' : 'Add New Game'}</h2>
                <form id="game-form">
                    <div class="form-grid">
                        <div class="form-group">
                            <label>Title</label>
                            <input type="text" id="game-title" value="${game ? game.title : ''}" required>
                        </div>
                        <div class="form-group">
                            <label>Genre</label>
                            <select id="game-genre" required>
                                ${genres.map(g => `<option value="${g.id}" ${game && game.genre_id === g.id ? 'selected' : ''}>${g.name}</option>`).join('')}
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Developer</label>
                            <input type="text" id="game-developer" value="${game ? game.developer : ''}">
                        </div>
                        <div class="form-group">
                            <label>Release Date</label>
                            <input type="date" id="game-release-date" value="${game && game.release_date ? game.release_date.split('T')[0] : ''}">
                        </div>
                    </div>
                    <div class="form-group">
                        <label>Image URL</label>
                        <input type="url" id="game-image-url" value="${game ? game.image_url || '' : ''}" placeholder="https://example.com/image.jpg">
                    </div>
                    <div class="form-group">
                        <label>Description</label>
                        <textarea id="game-description" rows="5">${game ? game.description : ''}</textarea>
                    </div>
                    <div class="form-group">
                        <label>Platforms</label>
                        <div class="platforms-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 1rem; margin-top: 0.5rem;">
                            ${platforms.map(p => {
                                const checked = game && game.platforms.some(gp => gp.id === p.id) ? 'checked' : '';
                                return `
                                    <label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
                                        <input type="checkbox" name="platforms" value="${p.id}" ${checked}> ${p.name}
                                    </label>
                                `;
                            }).join('')}
                        </div>
                    </div>
                    <button type="submit">${isEdit ? 'Update Game' : 'Add Game'}</button>
                </form>
            </div>
        `;
    },

    editReviewForm(review) {
        return `
            <form class="edit-review-form" data-id="${review.id}">
                <div class="form-group">
                    <label>Rating (1-10)</label>
                    <input type="number" class="edit-rating" min="1" max="10" value="${review.rating}" required>
                </div>
                <div class="form-group">
                    <label>Your Review</label>
                    <textarea class="edit-text" rows="4" required>${review.review_text}</textarea>
                </div>
                <div style="display: flex; gap: 1rem;">
                    <button type="submit" style="width: auto; padding: 0.5rem 1rem;">Save</button>
                    <button type="button" class="btn-cancel-edit" style="width: auto; padding: 0.5rem 1rem; background: #444;">Cancel</button>
                </div>
            </form>
        `;
    },

    hero() {
        return `
            <section class="hero">
                <h1>Discover Your Next Adventure</h1>
                <p>Join our community to rate and review the latest games.</p>
            </section>
        `;
    },

    loginForm() {
        return `
            <div class="auth-container">
                <h2>Login</h2>
                <form id="login-form">
                    <div class="form-group">
                        <label>Email</label>
                        <input type="email" id="login-email" required>
                    </div>
                    <div class="form-group">
                        <label>Password</label>
                        <input type="password" id="login-password" required>
                    </div>
                    <button type="submit">Login</button>
                </form>
                <p style="margin-top: 1rem; text-align: center;">Don't have an account? <a href="#signup" style="color: var(--primary-color)">Sign Up</a></p>
            </div>
        `;
    },

    signupForm() {
        return `
            <div class="auth-container">
                <h2>Sign Up</h2>
                <form id="signup-form">
                    <div class="form-group">
                        <label>Username</label>
                        <input type="text" id="signup-username" required>
                    </div>
                    <div class="form-group">
                        <label>Email</label>
                        <input type="email" id="signup-email" required>
                    </div>
                    <div class="form-group">
                        <label>Password</label>
                        <input type="password" id="signup-password" required>
                    </div>
                    <button type="submit">Sign Up</button>
                </form>
                <p style="margin-top: 1rem; text-align: center;">Already have an account? <a href="#login" style="color: var(--primary-color)">Login</a></p>
            </div>
        `;
    }
};
