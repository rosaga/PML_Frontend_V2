"use client";
import React, { useEffect } from 'react';
import { clearToken } from '@/utils/auth';

const LogoutPage: React.FC = () => {

    useEffect(() => {
        // Call cleartoken function to clear the token
        clearToken();
        window.location.href = '/signin';
    }, []);

    return (
        <div>
            <h1>Logging out...</h1>
            {/* Add any additional logout-related UI here */}
        </div>
    );
};

export default LogoutPage;