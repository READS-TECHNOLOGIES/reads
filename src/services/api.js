import { v4 as uuidv4 } from 'uuid';

const API_URL = "/api";

const getAuthHeader = () => {
    const token = localStorage.getItem('access_token');
    if (!token) {
        return { 'Content-Type': 'application/json' };
    }
    return { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };
};

const handleFailedResponse = async (res, action) => {
    let errorDetail = `Failed to ${action} (Status: ${res.status})`;

    if (res.status === 401) {
        localStorage.removeItem('access_token');
        throw new Error('AuthenticationRequired');
    }

    if (res.status === 409) {
        throw new Error('QuizAlreadyCompleted');
    }

    // Read body once and handle all cases
    let responseData;
    try {
        const text = await res.text();
        try {
            responseData = JSON.parse(text);
        } catch {
            responseData = { detail: text };
        }
    } catch {
        responseData = {};
    }

    if (res.status === 429) {
        throw new Error(responseData.detail || 'Rate limit exceeded. Please try again later.');
    }

    errorDetail = responseData.detail || responseData.message || errorDetail;

    console.error(`${action} Failed: ${errorDetail}`); 
    throw new Error(errorDetail);
}

export const api = {
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

        forgotPassword: async (email) => {
            const res = await fetch(`${API_URL}/auth/request-password-reset`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });

            if (!res.ok) {
                await handleFailedResponse(res, 'Send Password Reset Email');
            }

            return res.json();
        },

        resetPassword: async (token, newPassword) => {
            const res = await fetch(`${API_URL}/auth/reset-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, new_password: newPassword })
            });

            if (!res.ok) {
                await handleFailedResponse(res, 'Reset Password');
            }

            return res.json();
        },

        me: async () => {
            const token = localStorage.getItem('access_token');
            if (!token) return null;

            const res = await fetch(`${API_URL}/user/profile`, { headers: getAuthHeader() });

            if (!res.ok) {
                return null;
            }

            const data = await res.json();
            return {
                id: data.id,
                name: data.name,
                email: data.email,
                is_admin: data.is_admin,
                cardano_address: data.cardano_address,
                avatar: `https://api.dicebear.com/8.x/initials/svg?seed=${data.name}`, 
                joined: data.created_at,
            };
        },

        deleteAccount: async () => {
            const res = await fetch(`${API_URL}/user/delete`, {
                method: 'DELETE',
                headers: getAuthHeader()
            });

            if (!res.ok) {
                await handleFailedResponse(res, 'Delete Account');
            }

            localStorage.removeItem('access_token');
            return res.json();
        },
    },

    profile: {
        getStats: async () => {
            const res = await fetch(`${API_URL}/user/stats`, { headers: getAuthHeader() });
            if (!res.ok) {
                console.error("Error fetching user stats");
                return { lessons_completed: 0, quizzes_taken: 0 };
            }
            return res.json();
        },

        getLeaderboard: async (limit = 10) => {
            const res = await fetch(`${API_URL}/leaderboard?limit=${limit}`, { headers: getAuthHeader() });
            if (!res.ok) {
                console.error("Error fetching leaderboard");
                return [];
            }
            return res.json();
        },
    },

    user: {
        getNotifications: async () => {
            const res = await fetch(`${API_URL}/user/notifications`, { headers: getAuthHeader() });
            if (!res.ok) {
                console.error("Error fetching notifications");
                return [];
            }
            return res.json();
        },

        markNotificationRead: async (notificationId) => {
            const res = await fetch(`${API_URL}/user/notifications/${notificationId}/read`, {
                method: 'PUT',
                headers: getAuthHeader()
            });
            if (!res.ok) {
                console.error("Error marking notification as read");
            }
            return res.ok;
        },

        markAllNotificationsRead: async () => {
            const res = await fetch(`${API_URL}/user/notifications/read-all`, {
                method: 'PUT',
                headers: getAuthHeader()
            });
            if (!res.ok) {
                console.error("Error marking all notifications as read");
            }
            return res.ok;
        },

        getUnreadCount: async () => {
            const res = await fetch(`${API_URL}/user/notifications/unread-count`, { headers: getAuthHeader() });
            if (!res.ok) {
                console.error("Error fetching unread count");
                return 0;
            }
            const data = await res.json();
            return data.count || 0;
        },
    },

    learn: {
        getCategories: async () => {
            const res = await fetch(`${API_URL}/lessons/categories`, { headers: getAuthHeader() });
            if (!res.ok) {
                console.error("Error fetching categories");
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
                console.error("Error fetching lessons");
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

        trackLessonTime: async (lessonId, readTimeSeconds) => {
            const res = await fetch(`${API_URL}/lessons/${lessonId}/track-time`, {
                method: 'POST',
                headers: getAuthHeader(),
                body: JSON.stringify({ 
                    lesson_id: lessonId, 
                    read_time_seconds: readTimeSeconds 
                })
            });

            if (!res.ok) {
                console.warn('Failed to track lesson time');
            }

            return res.ok;
        },

        checkQuizStatus: async (lessonId) => {
            const res = await fetch(`${API_URL}/quiz/${lessonId}/status`, {
                headers: getAuthHeader()
            });

            if (!res.ok) {
                await handleFailedResponse(res, 'Check Quiz Status');
            }

            return res.json();
        },

        startQuizAttempt: async (lessonId) => {
            const res = await fetch(`${API_URL}/quiz/start`, {
                method: 'POST',
                headers: getAuthHeader(),
                body: JSON.stringify({ lesson_id: lessonId })
            });

            if (!res.ok) {
                await handleFailedResponse(res, 'Start Quiz Attempt');
            }

            return res.json();
        },

        flagQuizAttempt: async (lessonId, attemptId, violationType, violationDetails = null) => {
            try {
                const res = await fetch(`${API_URL}/quiz/flag`, {
                    method: 'POST',
                    headers: getAuthHeader(),
                    body: JSON.stringify({ 
                        lesson_id: lessonId, 
                        attempt_id: attemptId,
                        violation_type: violationType,
                        violation_details: violationDetails
                    })
                });

                if (!res.ok) {
                    console.warn('Failed to flag quiz');
                    return { success: false };
                }

                const data = await res.json();
                return { success: true, data };

            } catch (error) {
                console.error('Error flagging quiz:', error);
                return { success: false, error: error.message };
            }
        },

        submitQuizAttempt: async (lessonId, attemptId, answers, totalTimeSeconds) => {
            const res = await fetch(`${API_URL}/quiz/submit`, {
                method: 'POST',
                headers: getAuthHeader(),
                body: JSON.stringify({ 
                    lesson_id: lessonId, 
                    attempt_id: attemptId,
                    answers: answers,
                    total_time_seconds: totalTimeSeconds
                })
            });

            if (!res.ok) {
                await handleFailedResponse(res, 'Submit Quiz');
            }

            return res.json();
        },
    },

    wallet: {
        getBalance: async () => {
            const res = await fetch(`${API_URL}/wallet/balance`, { headers: getAuthHeader() });
            if (!res.ok) {
                console.error("Error fetching wallet balance");
                return 0;
            }
            const data = await res.json();
            return data.token_balance;
        },

        getHistory: async () => {
            const res = await fetch(`${API_URL}/wallet/history`, { headers: getAuthHeader() });
            if (!res.ok) {
                console.error("Error fetching wallet history");
                return [];
            }
            return res.json();
        }
    },

    admin: {
        getUsers: async () => {
            const res = await fetch(`${API_URL}/admin/users`, {
                headers: getAuthHeader()
            });
            if (!res.ok) {
                await handleFailedResponse(res, 'Fetch All Users');
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
            const res = await fetch(`${API_URL}/admin/quiz`, {
                method: 'POST',
                headers: getAuthHeader(),
                body: JSON.stringify({ lesson_id: lessonId, questions })
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

        createQuizConfig: async (configData) => {
            const res = await fetch(`${API_URL}/admin/quiz/config`, {
                method: 'POST',
                headers: getAuthHeader(),
                body: JSON.stringify(configData)
            });
            if (!res.ok) {
                await handleFailedResponse(res, 'Create Quiz Config');
            }
            return res.json();
        },

        updateQuizConfig: async (lessonId, configData) => {
            const res = await fetch(`${API_URL}/admin/quiz/config/${lessonId}`, {
                method: 'PUT',
                headers: getAuthHeader(),
                body: JSON.stringify(configData)
            });
            if (!res.ok) {
                await handleFailedResponse(res, 'Update Quiz Config');
            }
            return res.json();
        },

        getQuizConfig: async (lessonId) => {
            const res = await fetch(`${API_URL}/admin/quiz/config/${lessonId}`, {
                headers: getAuthHeader()
            });
            if (!res.ok) {
                await handleFailedResponse(res, 'Get Quiz Config');
            }
            return res.json();
        },

        getSuspiciousAttempts: async (limit = 50) => {
            const res = await fetch(`${API_URL}/admin/suspicious-attempts?limit=${limit}`, {
                headers: getAuthHeader()
            });
            if (!res.ok) {
                await handleFailedResponse(res, 'Fetch Suspicious Attempts');
            }
            return res.json();
        },

        sendNotification: async (payload) => {
            const res = await fetch(`${API_URL}/admin/notifications/send`, {
                method: 'POST',
                headers: getAuthHeader(),
                body: JSON.stringify(payload)
            });
            
            const data = await res.json();
            
            if (!res.ok) {
                throw new Error(data.message || 'Failed to send notification');
            }
            
            return data;
        },

        getRecentNotifications: async (limit = 10) => {
            const res = await fetch(`${API_URL}/admin/notifications/recent?limit=${limit}`, {
                headers: getAuthHeader()
            });
            
            const data = await res.json();
            
            if (!res.ok) {
                throw new Error(data.message || 'Failed to fetch recent notifications');
            }
            
            return data;
        },
    }
};

push: {
        saveSubscription: async (subscription) => {
            const res = await fetch(`${API_URL}/push/subscribe`, {
                method: 'POST',
                headers: getAuthHeader(),
                body: JSON.stringify({
                    endpoint: subscription.endpoint,
                    p256dh: subscription.keys.p256dh,
                    auth: subscription.keys.auth,
                })
            });
            if (!res.ok) {
                console.warn('Failed to save push subscription');
            }
            return res.ok;
        },

        unsubscribe: async (endpoint) => {
            const res = await fetch(`${API_URL}/push/unsubscribe`, {
                method: 'DELETE',
                headers: getAuthHeader(),
                body: JSON.stringify({ endpoint })
            });
            return res.ok;
        },
    }
};

export const fetchProtectedData = async (endpoint, token, options = {}) => {
    const res = await fetch(`${API_URL}${endpoint}`, {
        method: options.method || 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            ...options.headers
        },
        body: options.body ? JSON.stringify(options.body) : undefined
    });

    if (!res.ok) {
        await handleFailedResponse(res, `Fetch ${endpoint}`);
    }

    return res.json();
};