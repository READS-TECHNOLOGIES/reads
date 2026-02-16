import { v4 as uuidv4 } from 'uuid';

// Vercel routes our /api path to the Python backend function
const API_URL = "/api"; 

// Function to get the Authorization header
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

// Helper function to process failed responses aggressively
const handleFailedResponse = async (res, action) => {
    let errorDetail = `Failed to ${action} (Status: ${res.status})`;

    if (res.status === 401) {
        localStorage.removeItem('access_token');
        throw new Error('AuthenticationRequired');
    }

    if (res.status === 409) {
        throw new Error('QuizAlreadyCompleted');
    }

    // 🆕 Handle rate limit errors
    if (res.status === 429) {
        try {
            const data = await res.json();
            throw new Error(data.detail || 'Rate limit exceeded');
        } catch (e) {
            throw new Error('Rate limit exceeded. Please try again later.');
        }
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
        forgotPassword: async (email) => {
            const res = await fetch(`${API_URL}/auth/request-password-reset`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });

            if (!res.ok) {
                await handleFailedResponse(res, 'Send Password Reset Email');
            }

            const data = await res.json();
            return data;
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

            const data = await res.json();
            return data;
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

            // Clear local storage on successful deletion
            localStorage.removeItem('access_token');
            
            const data = await res.json();
            return data;
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
                    console.error("Non-fatal error fetching user stats:", e.message);
                }
                return { lessons_completed: 0, quizzes_taken: 0 };
            }

            const data = await res.json();
            return data;
        },
        getLeaderboard: async (limit = 10) => {
            const res = await fetch(`${API_URL}/leaderboard?limit=${limit}`, { headers: getAuthHeader() });
            if (!res.ok) {
                try {
                    await handleFailedResponse(res, 'Fetch Leaderboard');
                } catch (e) {
                    console.error("Non-fatal error fetching leaderboard:", e.message);
                }
                return [];
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

        // 🆕 ANTI-CHEAT: Track lesson read time
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
                console.warn('Failed to track lesson time (non-fatal)');
            }
            
            return res.ok;
        },

        // 🆕 ANTI-CHEAT: Check if user can take quiz
        checkQuizStatus: async (lessonId) => {
            const res = await fetch(`${API_URL}/quiz/${lessonId}/status`, {
                headers: getAuthHeader()
            });
            
            if (!res.ok) {
                await handleFailedResponse(res, 'Check Quiz Status');
            }
            
            return res.json();
        },

        // 🆕 ANTI-CHEAT: Start new quiz attempt with random questions
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

        // 🆕 ANTI-CHEAT: Flag quiz for security violations
        flagQuizAttempt: async (lessonId, attemptId, violationType, violationDetails = null) => {
            console.log('🚨 Flagging quiz attempt:', { 
                lessonId, 
                attemptId, 
                violationType, 
                violationDetails 
            });
            
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
                    console.warn('Failed to flag quiz (non-fatal)');
                    return { success: false };
                }

                const data = await res.json();
                console.log('✅ Quiz flagged successfully:', data);
                return { success: true, data };
                
            } catch (error) {
                console.error('❌ Error flagging quiz:', error);
                return { success: false, error: error.message };
            }
        },

        // 🆕 ANTI-CHEAT: Submit quiz with timing validation
        submitQuizAttempt: async (lessonId, attemptId, answers, totalTimeSeconds) => {
            console.log('🔵 submitQuizAttempt called with:', { 
                lessonId, 
                attemptId, 
                answers, 
                totalTimeSeconds 
            });
            
            try {
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

                console.log('🔵 Quiz submit response status:', res.status);

                if (!res.ok) {
                    console.log('🔴 Response not OK, handling error...');
                    await handleFailedResponse(res, 'Submit Quiz');
                }

                const data = await res.json();
                console.log('🟢 Quiz submit SUCCESS - Response data:', data);
                return data;
                
            } catch (error) {
                console.error('🔴 Quiz submit FAILED with error:', error);
                throw error;
            }
        },

        // Keep old methods for backward compatibility (DEPRECATED)
        getQuizQuestions: async (lessonId) => {
            console.warn('⚠️ getQuizQuestions is deprecated. Use startQuizAttempt instead.');
            const res = await fetch(`${API_URL}/lessons/${lessonId}/quiz`, { headers: getAuthHeader() });

            if (!res.ok) {
                await handleFailedResponse(res, 'Fetch Quiz Questions'); 
            }

            return res.json();
        },
        submitQuiz: async (lessonId, answers) => {
            console.warn('⚠️ submitQuiz is deprecated. Use submitQuizAttempt instead.');
            console.log('🔵 submitQuiz called with:', { lessonId, answers });
            
            try {
                const res = await fetch(`${API_URL}/quiz/submit`, {
                    method: 'POST',
                    headers: getAuthHeader(),
                    body: JSON.stringify({ lesson_id: lessonId, answers })
                });

                console.log('🔵 Quiz submit response status:', res.status);

                if (!res.ok) {
                    console.log('🔴 Response not OK, handling error...');
                    await handleFailedResponse(res, 'Submit Quiz');
                }

                const data = await res.json();
                console.log('🟢 Quiz submit SUCCESS - Response data:', data);
                return data;
                
            } catch (error) {
                console.error('🔴 Quiz submit FAILED with error:', error);
                throw error;
            }
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
                return 0;
            }
            const data = await res.json();
            return data.token_balance;
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

        // 🆕 ANTI-CHEAT: Quiz Configuration Management
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

        // 🆕 ANTI-CHEAT: View suspicious attempts
        getSuspiciousAttempts: async (limit = 50) => {
            const res = await fetch(`${API_URL}/admin/suspicious-attempts?limit=${limit}`, {
                headers: getAuthHeader()
            });
            if (!res.ok) {
                await handleFailedResponse(res, 'Fetch Suspicious Attempts');
            }
            return res.json();
        },
// ═══════════════════════════════════════════════════════════════════════════
// INSTRUCTIONS: Add these methods to your api.admin object in src/services/api.js
// 
// Find the section that looks like:
//   admin: {
//     getUsers: async () => { ... },
//     promoteUser: async () => { ... },
//     ...
//   }
//
// Add these TWO new methods INSIDE that admin object, making sure to include
// a comma after the previous method.
// ═══════════════════════════════════════════════════════════════════════════

    // Send notification to users
    sendNotification: async (payload) => {
        const response = await fetch(`${API_BASE_URL}/admin/notifications/send`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getToken()}`
            },
            body: JSON.stringify(payload)
        });
        if (!response.ok) throw new Error('Failed to send notification');
        return response.json();
    },

    // Get recent notifications (optional - for showing notification history)
    getRecentNotifications: async (limit = 10) => {
        const response = await fetch(`${API_BASE_URL}/admin/notifications/recent?limit=${limit}`, {
            headers: {
                'Authorization': `Bearer ${getToken()}`
            }
        });
        if (!response.ok) throw new Error('Failed to fetch recent notifications');
        return response.json();
    },

// ═══════════════════════════════════════════════════════════════════════════
// Backend API Endpoints Required
// ═══════════════════════════════════════════════════════════════════════════

/*
POST /api/admin/notifications/send
Authorization: Bearer {admin_token}
Body:
{
  "title": "New Lessons Added!",
  "message": "Check out the new JAMB Mathematics lessons we just uploaded.",
  "type": "info",
  "recipient_type": "all",
  "recipient_ids": null
}

Response: 200 OK
{
  "success": true,
  "sent_count": 150,
  "message": "Notification sent successfully"
}

---

GET /api/admin/notifications/recent?limit=10
Authorization: Bearer {admin_token}

Response: 200 OK
[
  {
    "id": 1,
    "title": "New Lessons Added!",
    "message": "Check out the new JAMB Mathematics lessons...",
    "type": "info",
    "sent_to": "all",
    "recipient_count": 150,
    "created_at": "2025-02-16T10:30:00Z"
  },
  ...
]
*/

// ═══════════════════════════════════════════════════════════════════════════
// Database Schema Suggestions
// ═══════════════════════════════════════════════════════════════════════════

/*
notifications table:
- id (primary key)
- title (varchar)
- message (text)
- type (enum: 'info', 'success', 'warning', 'error')
- recipient_type (enum: 'all', 'specific')
- created_at (timestamp)
- created_by_admin_id (foreign key -> users.id)

notification_recipients table (for specific notifications):
- id (primary key)
- notification_id (foreign key -> notifications.id)
- user_id (foreign key -> users.id)
- is_read (boolean, default false)
- read_at (timestamp, nullable)

This allows you to:
1. Store all notifications sent
2. Track which users received specific notifications
3. Track read/unread status for each user
4. Display notification history in the admin panel
*/

        // --- 🤖 AI CONTENT ASSISTANT (Admin Only) ---
        
        aiGenerateLessonContent: async ({ topic, category, difficulty = 'intermediate', target_length = 1000 }) => {
            const res = await fetch(`${API_URL}/admin/ai/generate-lesson`, {
                method: 'POST',
                headers: getAuthHeader(),
                body: JSON.stringify({ 
                    topic, 
                    category, 
                    difficulty, 
                    target_length 
                })
            });
            
            if (!res.ok) {
                await handleFailedResponse(res, 'Generate Lesson Content');
            }
            
            return res.json();
        },

        aiGenerateQuizQuestions: async ({ lesson_content, num_questions = 10, difficulty = 'intermediate' }) => {
            const res = await fetch(`${API_URL}/admin/ai/generate-quiz`, {
                method: 'POST',
                headers: getAuthHeader(),
                body: JSON.stringify({ 
                    lesson_content, 
                    num_questions, 
                    difficulty 
                })
            });
            
            if (!res.ok) {
                await handleFailedResponse(res, 'Generate Quiz Questions');
            }
            
            return res.json();
        },

        aiImproveContent: async ({ content, instruction }) => {
            const res = await fetch(`${API_URL}/admin/ai/improve-content`, {
                method: 'POST',
                headers: getAuthHeader(),
                body: JSON.stringify({ 
                    content, 
                    instruction 
                })
            });
            
            if (!res.ok) {
                await handleFailedResponse(res, 'Improve Content');
            }
            
            return res.json();
        },

        aiSuggestRelatedTopics: async ({ topic, category, num_suggestions = 5 }) => {
            const res = await fetch(`${API_URL}/admin/ai/suggest-topics`, {
                method: 'POST',
                headers: getAuthHeader(),
                body: JSON.stringify({ 
                    topic, 
                    category, 
                    num_suggestions 
                })
            });
            
            if (!res.ok) {
                await handleFailedResponse(res, 'Suggest Related Topics');
            }
            
            return res.json();
        },

        aiQualityCheckContent: async ({ content, content_type = 'lesson' }) => {
            const res = await fetch(`${API_URL}/admin/ai/quality-check`, {
                method: 'POST',
                headers: getAuthHeader(),
                body: JSON.stringify({ 
                    content, 
                    content_type 
                })
            });
            
            if (!res.ok) {
                await handleFailedResponse(res, 'Quality Check Content');
            }
            
            return res.json();
        },
    }
};

// 🟢 Add fetchProtectedData export for WalletModule compatibility
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
//