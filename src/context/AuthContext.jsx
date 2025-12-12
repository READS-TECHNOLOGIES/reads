import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../services/api'; // Assuming correct path to api object

// 1. Define the Context
const AuthContext = createContext(null);

// 2. Define the Custom Hook for consumption
export const useAuth = () => useContext(AuthContext);

// 3. Define the Provider Component
export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Function to load user from token in localStorage
    const loadUser = useCallback(async (token) => {
        if (!token) {
            setUser(null);
            setLoading(false);
            return;
        }

        try {
            // api.auth.me handles fetching profile data and returns null on 401
            const profile = await api.auth.me(); 
            setUser(profile);
            
        } catch (e) {
            // Log out if there's a serious error during profile fetch
            console.error("Failed to load user profile:", e);
            localStorage.removeItem('access_token');
            setUser(null);
        } finally {
            setLoading(false);
        }
    }, []);

    // Initial check: runs once on component mount
    useEffect(() => {
        const token = localStorage.getItem('access_token');
        loadUser(token);
    }, [loadUser]);
    
    // --- Auth Actions ---

    const login = async (email, password) => {
        setError(null);
        setLoading(true);
        try {
            await api.auth.login(email, password); // Sets token in localStorage
            await loadUser(localStorage.getItem('access_token')); // Loads user profile
        } catch (e) {
            setError(e.message);
            throw e; // Re-throw for component to handle
        } finally {
            setLoading(false);
        }
    };

    const signup = async (name, email, password) => {
        setError(null);
        setLoading(true);
        try {
            await api.auth.signup(name, email, password); // Sets token in localStorage
            await loadUser(localStorage.getItem('access_token')); // Loads user profile
        } catch (e) {
            setError(e.message);
            throw e; 
        } finally {
            setLoading(false);
        }
    };

    const logout = () => {
        localStorage.removeItem('access_token');
        setUser(null);
    };

    // Value exposed to consuming components
    const contextValue = {
        user,
        token: localStorage.getItem('access_token'), // Get current token
        isAuthenticated: !!user,
        loading,
        error,
        login,
        signup,
        logout,
    };

    return (
        <AuthContext.Provider value={contextValue}>
            {/* ⚠️ NOTE: You should wrap your entire app (or the relevant part) with this context. */}
            {children}
        </AuthContext.Provider>
    );
};

// You will also need to add this to your main app component (e.g., App.jsx or main.jsx)
/*
// Example usage in your main entry point (e.g., App.jsx or main.jsx):
<AuthProvider>
    <YourRouterComponent />
</AuthProvider>
*/
