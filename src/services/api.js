import { v4 as uuidv4 } from 'uuid';

// Vercel routes our /api path to the Python backend function
const API_URL = "/api"; 

// Function to get the Authorization header
const getAuthHeader = () => {
    const token = localStorage.getItem('access_token');
    if (!token) {
        // If no token, return headers that will fail authentication on the backend
        return { 'Content-Type': 'application/json' };
    }
    return { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };
};

// Helper function to process failed responses aggressively
const handleFailedResponse = async (res, action) => {
    let errorDetail = `Failed to ${action} (Status: ${res.status})`;

    // --- CRITICAL FIX 1: CENTRALIZED 401 HANDLING ---
    if (res.status === 401) {
        // Automatically log out the user by removing the token
        localStorage.removeItem('access_token');
        throw new Error('AuthenticationRequired');
    }
    // -------------------------------------------------

    // CRITICAL FIX FOR 409: Throw a specific error for the frontend component to handle.
    if (res.status === 409) {
        throw new Error('QuizAlreadyCompleted');
    }

    try {
        const data = await res.json();
        errorDetail = data.detail || errorDetail;
    } catch (e) {
        const text = await res.text();
        errorDetail = `${errorDetail}. Server response: ${text.substring(0, 100)}...`; 
    }

    console.error(`${action} Failed: ${errorDetail}`); 
    throw new Error(errorDetail);
}

export const api = {
    // --- AUTH ---
    auth: {
        login: async (email, password) => {
            const res = await fetch(`${API_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            if (!res.ok) {
                await handleFailedResponse(res, 'Login');
            }

            const data = await res.json();
            localStorage.setItem('access_token', data.access_token);
            return data; 
        },
        signup: async (name, email, password) => {
            const res = await fetch(`${API_URL}/auth/signup`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, password })
            });

            if (!res.ok) {
                await handleFailedResponse(res, 'Signup');
            }

            const data = await res.json();
            localStorage.setItem('access_token', data.access_token);
            return data;
        },
        me: async () => {
            const token = localStorage.getItem('access_token');
            if (!token) return null;

            // Uses getAuthHeader and relies on the new handleFailedResponse 
            // to manage token removal if 401 occurs.
            const res = await fetch(`${API_URL}/user/profile`, { headers: getAuthHeader() });

            if (!res.ok) {
                // Return null if fetch failed (includes 401, 500, etc.)
                return null;
            }

            const data = await res.json();
            return {
                id: data.id,
                name: data.name,
                email: data.email,
                is_admin: data.is_admin,
                avatar: `https://api.dicebear.com/8.x/initials/svg?seed=${data.name}`, 
                joined: data.created_at,
            };
        },
        
        // 🟢 NEW: Get current user with Cardano wallet address
        getCurrentUser: async () => {
            const token = localStorage.getItem('access_token');
            if (!token) return null;

            const res = await fetch(`${API_URL}/auth/me`, { headers: getAuthHeader() });

            if (!res.ok) {
                return null;
            }

            return res.json();
        },

        // 🟢 NEW: Get just wallet info
        getWallet: async () => {
            const res = await fetch(`${API_URL}/auth/wallet`, { headers: getAuthHeader() });
            
            if (!res.ok) {
                await handleFailedResponse(res, 'Fetch Wallet Info');
            }
            
            return res.json();
        },
    },

    // --- PROFILE ---
    profile: {
        getStats: async () => {
            const res = await fetch(`${API_URL}/user/stats`, { headers: getAuthHeader() });
            if (!res.ok) {
                try {
                    await handleFailedResponse(res, 'Fetch User Stats');
                } catch (e) {
                    // Non-fatal, return default data
                    console.error("Non-fatal error fetching user stats:", e.message);
                }
                return { lessons_completed: 0, quizzes_taken: 0 };
            }

            const data = await res.json();
            return data;
        },
    },

    // --- LEARN ---
    learn: {
        getCategories: async () => {
            const res = await fetch(`${API_URL}/lessons/categories`, { headers: getAuthHeader() });
            if (!res.ok) {
                try {
                    await handleFailedResponse(res, 'Fetch Categories');
                } catch (e) {
                    console.error("Non-fatal error fetching categories:", e.message);
                }
                return [];
            }

            const data = await res.json();
            return data.map(cat => ({
                id: cat.category.toLowerCase(), 
                name: cat.category, 
                count: cat.count,
                color: cat.category === 'JAMB' ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'
            }));
        },
        getLessons: async (categoryName) => {
            const res = await fetch(`${API_URL}/lessons/category/${categoryName}`, { headers: getAuthHeader() });
            if (!res.ok) {
                try {
                    await handleFailedResponse(res, 'Fetch Lessons');
                } catch (e) {
                    console.error("Non-fatal error fetching lessons:", e.message);
                }
                return [];
            }

            const data = await res.json();
            return data.map(l => ({
                ...l,
                duration: '15 min'
            }));
        },
        getLessonDetail: async (lessonId) => {
            const res = await fetch(`${API_URL}/lessons/${lessonId}`, { headers: getAuthHeader() });
            if (!res.ok) {
                await handleFailedResponse(res, 'Fetch Lesson Detail');
            }
            return res.json();
        },
        getQuizQuestions: async (lessonId) => {
            const res = await fetch(`${API_URL}/lessons/${lessonId}/quiz`, { headers: getAuthHeader() });

            // Uses handleFailedResponse, which now catches 401 (AuthRequired) and 409 (QuizAlreadyCompleted)
            if (!res.ok) {
                await handleFailedResponse(res, 'Fetch Quiz Questions'); 
            }

            return res.json();
        },
        submitQuiz: async (lessonId, answers) => {
            const res = await fetch(`${API_URL}/quiz/submit`, {
                method: 'POST',
                headers: getAuthHeader(),
                body: JSON.stringify({ lesson_id: lessonId, answers })
            });

            if (!res.ok) {
                await handleFailedResponse(res, 'Submit Quiz');
            }

            return res.json();
        }
    },

    // --- WALLET ---
    wallet: {
        getBalance: async () => {
            const res = await fetch(`${API_URL}/wallet/balance`, { headers: getAuthHeader() });
            if (!res.ok) {
                try {
                    await handleFailedResponse(res, 'Fetch Wallet Balance');
                } catch (e) {
                    console.error("Non-fatal error fetching balance:", e.message);
                }
                return { token_balance: 0 }; // 🟢 FIXED: Return object with token_balance
            }
            const data = await res.json();
            return data; // 🟢 FIXED: Return full object, not just token_balance
        },
        getHistory: async () => {
            const res = await fetch(`${API_URL}/wallet/history`, { headers: getAuthHeader() });
            if (!res.ok) {
                try {
                    await handleFailedResponse(res, 'Fetch Wallet History');
                } catch (e) {
                    console.error("Non-fatal error fetching wallet history:", e.message);
                }
                return [];
            }

            const data = await res.json();
            return data;
        }
    },

    // --- ADMIN ---
    admin: {
        // FIX: Renamed and consolidated 'getAllUsers' and 'getUsers' into a single function.
        getUsers: async () => {
            const res = await fetch(`${API_URL}/admin/users`, {
                headers: getAuthHeader()
            });
            if (!res.ok) {
                await handleFailedResponse(res, 'Fetch All Users (Admin)');
            }
            return res.json();
        },

        promoteUser: async (userId, isAdmin) => {
            const res = await fetch(`${API_URL}/admin/users/${userId}/promote?is_admin=${isAdmin}`, {
                method: 'PUT',
                headers: getAuthHeader(),
            });
            if (!res.ok) {
                await handleFailedResponse(res, isAdmin ? 'Promote User' : 'Demote User');
            }
            return res.json();
        },

        createLesson: async (lessonData) => {
            const res = await fetch(`${API_URL}/admin/lessons`, {
                method: 'POST',
                headers: getAuthHeader(),
                body: JSON.stringify(lessonData)
            });
            if (!res.ok) {
                await handleFailedResponse(res, 'Create Lesson');
            }
            return res.json();
        },

        deleteLesson: async (lessonId) => {
            const res = await fetch(`${API_URL}/admin/lessons/${lessonId}`, {
                method: 'DELETE',
                headers: getAuthHeader(),
            });
            if (!res.ok) {
                await handleFailedResponse(res, `Delete Lesson ID ${lessonId}`);
            }
            return {};
        },

        uploadQuiz: async (lessonId, questions) => {
            const quizRequest = { lesson_id: lessonId, questions };

            const res = await fetch(`${API_URL}/admin/quiz`, {
                method: 'POST',
                headers: getAuthHeader(),
                body: JSON.stringify(quizRequest)
            });
            if (!res.ok) {
                await handleFailedResponse(res, 'Upload Quiz Questions');
            }
            return res.json();
        },

        deleteQuiz: async (lessonId) => {
            const res = await fetch(`${API_URL}/admin/quiz/${lessonId}`, {
                method: 'DELETE',
                headers: getAuthHeader(),
            });
            if (!res.ok) {
                await handleFailedResponse(res, `Delete Quiz for Lesson ID ${lessonId}`);
            }
            return {};
        },

        getAllLessons: async () => {
            const res = await fetch(`${API_URL}/admin/lessons`, {
                headers: getAuthHeader()
            });
            if (!res.ok) {
                await handleFailedResponse(res, 'Fetch All Lessons');
            }
            return res.json();
        },

        createQuiz: async (quizData) => {
            const res = await fetch(`${API_URL}/admin/quiz`, {
                method: 'POST',
                headers: getAuthHeader(),
                body: JSON.stringify(quizData)
            });
            if (!res.ok) {
                await handleFailedResponse(res, 'Create Quiz');
            }
            return res.json();
        },
    }
};