// src/pages/LoginPage.tsx

import React, { useState } from 'react';
import {
  IonPage, IonContent, IonHeader, IonToolbar, IonTitle,
  IonItem, IonLabel, IonInput, IonButton, IonLoading,
  useIonToast,
} from '@ionic/react';
// import { useHistory } from 'react-router-dom';
import { saveAuthData } from './AuthService';
// import { LogIn } from 'lucide-react'; // Icône pour le bouton

// Définition de l'interface attendue de l'API après un succès
// interface LoginResponseData {
//   access_token: string;
//   user: {
//     id: number;
//     name: string;
//     email: string;
//     role: 'agent' | 'manager' | string; // Le rôle est crucial
//   };
// }

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [present] = useIonToast();
  // const history = useHistory();

  const handleLogin = async () => {
    setIsLoading(true);
    try {
        const response = await fetch('https://api.depannel.com/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (response.ok && data.success) {
            const { access_token, user } = data.data;

            // Sauvegarde dans Capacitor Preferences
            await saveAuthData(access_token, user);
            
            // On met aussi dans localStorage pour vos composants actuels qui l'utilisent
            localStorage.setItem('access_token', access_token);
            localStorage.setItem('user_role', user.role);

            present({ message: `Bienvenue ${user.name}`, duration: 2000, color: 'success' });

            // OPTIMAL: Forcer un rechargement pour que App.tsx lise la nouvelle session
            window.location.href = user.role === 'manager' ? '/dashboard/manager' : '/dashboard';
        } else {
            throw new Error(data.message || 'Identifiants invalides');
        }
    } catch (error: any) {
        present({ message: error.message, duration: 3000, color: 'danger' });
    } finally {
        setIsLoading(false);
    }
};

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonTitle>Connexion Agent/Manager</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen className="ion-padding">
        
        <IonLoading isOpen={isLoading} message={'Connexion en cours...'} />

        <div style={{ marginTop: '50px' }}>
          <h1 style={{ textAlign: 'center' }}>Connectez-vous</h1>

          <IonItem className="ion-margin-top">
            <IonLabel position="floating">Email</IonLabel>
            <IonInput 
              type="email" 
              value={email} 
              onIonChange={e => setEmail(e.detail.value!)} 
              required
            />
          </IonItem>
          
          <IonItem className="ion-margin-bottom">
            <IonLabel position="floating">Mot de passe</IonLabel>
            <IonInput
              type="password"
              value={password}
              onIonChange={e => setPassword(e.detail.value!)}
              required
            />
          </IonItem>

          <IonButton
            expand="block"
            onClick={handleLogin}
            className="ion-margin-top"
            disabled={isLoading}
            style={{ marginTop: '20px' }}
          >
            {/* <LogIn size={20} style={{ marginRight: '8px' }} /> */}
            Se connecter
          </IonButton>
        </div>
        
      </IonContent>
    </IonPage>
  );
};

export default LoginPage;