import { useState, useCallback } from 'react';
import { useIonToast } from '@ionic/react';
import { clearAuthData } from '../pages/AuthService'; // Importez votre service

const LOGOUT_URL = 'https://api.depannel.com/api/auth/logout';

export const useAuth = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [present] = useIonToast();

    const logout = useCallback(async () => {
        setIsLoading(true);
        // Récupérer le token juste avant l'appel
        const token = localStorage.getItem('access_token');

        try {
            if (token) {
                await fetch(LOGOUT_URL, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    }
                });
            }
        } catch (error) {
            console.error('Erreur API Logout:', error);
        } finally {
            // 1. Nettoyer TOUT (Preferences + LocalStorage)
            await clearAuthData();
            
            // 2. Redirection brute pour réinitialiser l'état de App.tsx
            window.location.href = '/login';
            
            present({
                message: 'Déconnexion réussie',
                duration: 2000,
                color: 'success'
            });
            setIsLoading(false);
        }
    }, [present]);

    return { logout, isLoading };
};