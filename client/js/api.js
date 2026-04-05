const API_URL = 'http://localhost:3000/api';

const handleResponse = async (response) => {
    const contentType = response.headers.get('content-type');
    let data;
    
    if (contentType && contentType.includes('application/json')) {
        data = await response.json();
    } else {
        const text = await response.text();
        if (!response.ok) {
            throw new Error(`Server error (${response.status}): ${text.slice(0, 100)}`);
        }
        return text;
    }

    if (!response.ok) {
        const error = new Error(data.message || 'Something went wrong');
        error.details = data.details || data.error || JSON.stringify(data);
        throw error;
    }
    return data;
};

export const api = {
    async getGames() {
        const response = await fetch(`${API_URL}/games`);
        return handleResponse(response);
    },

    async getGame(id) {
        const response = await fetch(`${API_URL}/games/${id}`);
        return handleResponse(response);
    },

    async login(email, password) {
        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        return handleResponse(response);
    },

    async signup(username, email, password) {
        const response = await fetch(`${API_URL}/auth/signup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, email, password })
        });
        return handleResponse(response);
    },

    async postReview(reviewData) {
        const response = await fetch(`${API_URL}/reviews`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(reviewData)
        });
        return handleResponse(response);
    },

    async updateReview(id, reviewData) {
        const response = await fetch(`${API_URL}/reviews/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(reviewData)
        });
        return handleResponse(response);
    },

    async createGame(gameData) {
        const response = await fetch(`${API_URL}/games`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(gameData)
        });
        return handleResponse(response);
    },

    async updateGame(id, gameData) {
        const response = await fetch(`${API_URL}/games/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(gameData)
        });
        return handleResponse(response);
    },

    async deleteGame(id) {
        const response = await fetch(`${API_URL}/games/${id}`, {
            method: 'DELETE'
        });
        return handleResponse(response);
    },

    async getGenres() {
        const response = await fetch(`${API_URL}/genres`);
        return handleResponse(response);
    },

    async getPlatforms() {
        const response = await fetch(`${API_URL}/platforms`);
        return handleResponse(response);
    }
};
