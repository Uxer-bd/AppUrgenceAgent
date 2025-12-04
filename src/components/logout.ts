import { useState, useCallback } from 'react';
import { useIonRouter, useIonToast } from '@ionic/react';

declare const TOKEN: string; 
const LOGOUT_URL = 'https://intervention.tekfaso.com/api/auth/logout';

// Ce hook expose la fonction de déconnexion et l'état de chargement
export const useAuth = () => {
    const [isLoading, setIsLoading] = useState(false);
    const router = useIonRouter();
    const [present] = useIonToast();

    const logout = useCallback(async () => {
        setIsLoading(true);

        try {
            // 1. Appel API pour invalider le jeton côté serveur
            const response = await fetch(LOGOUT_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${TOKEN}`
                }
            });

            if (!response.ok) {
                console.error('Logout API call failed, but proceeding with local logout:', response.statusText);
            }

        } catch (error) {
            console.error('Error during logout API call:', error);
            // Nous continuons la déconnexion locale même en cas d'erreur réseau
        } finally {
            // 2. Supprimer le token d'authentification du stockage local
            localStorage.removeItem('auth_token');
            
            // 3. Rediriger l'utilisateur vers la page de connexion
            router.push('/login', 'root');
            
            // Afficher un toast de confirmation
            present({
                message: 'Vous avez été déconnecté.',
                duration: 2000,
                color: 'success'
            });

            setIsLoading(false);
        }
    }, [router, present]); // Les dépendances assurent que le hook est stable

    return { logout, isLoading };
};