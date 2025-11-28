//! index.js

import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import AdminDashboard from './AdminDashboard';

const root = ReactDOM.createRoot(document.getElementById('root'));

// Simple routing based on URL path
const path = window.location.pathname;

// Check if user is admin
const getUser = () => {
    try {
        const userData = localStorage.getItem('user');
        return userData ? JSON.parse(userData) : null;
    } catch {
        return null;
    }
};

const user = getUser();

// Render appropriate component based on route and user
const renderApp = () => {
    if (path === '/admin') {
        // Admin route - check if user is admin
        if (user && user.isAdmin) {
            return <AdminDashboard />;
        } else {
            // Redirect to home if not admin
            window.location.href = '/';
            return null;
        }
    } else {
        // Default route - chat portal
        return <App />;
    }
};

root.render(renderApp());