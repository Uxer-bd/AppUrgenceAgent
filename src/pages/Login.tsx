// src/pages/LoginPage.tsx

import React, { useState } from 'react';
import {
  IonPage, IonContent, IonHeader, IonToolbar, IonTitle,
  IonItem, IonLabel, IonInput, IonButton, IonLoading,
  useIonToast,
} from '@ionic/react';
import { useHistory } from 'react-router-dom';
// import { LogIn } from 'lucide-react'; // Icône pour le bouton

// Définition de l'interface attendue de l'API après un succès
interface LoginResponseData {
  access_token: string;
  user: {
    id: number;
    name: string;
    email: string;
    role: 'agent' | 'manager' | string; // Le rôle est crucial
  };
}

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [present] = useIonToast();
  const history = useHistory();

  const handleLogin = async () => {
    setIsLoading(true);

    try {
      const response = await fetch('https://intervention.tekfaso.com/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (response.ok && data.success && data.data.access_token) {

        const responseData: LoginResponseData = data.data;
        const { access_token, user } = responseData;

        // 1. Stocker les informations cruciales dans le LocalStorage
        localStorage.setItem('access_token', access_token);
        localStorage.setItem('user_role', user.role);
        localStorage.setItem('user_id', String(user.id));

        present({
          message: `Connexion réussie en tant que ${user.role}!`,
          duration: 2000,
          color: 'success'
        });

        // 2. Redirection basée sur le rôle
        if (user.role === 'manager') {
          history.replace('/dashboard/manager');
        } else if (user.role === 'agent') {
          history.replace('/dashboard');
        } else {
          // Gérer le rôle client (ou tout autre rôle non Manager/Agent)
          history.replace('/'); // Redirection vers la page d'accueil ou de signalement
        }

      } else {
        // Le serveur a répondu, mais l'authentification a échoué (ex: 401 Unauthorized)
        throw new Error(data.message || 'Email ou mot de passe incorrect.');
      }

    } catch (error: unknown) {
      // Gestion des erreurs TypeScript-friendly
      let message: string;
      if (error instanceof Error) {
        message = error.message;
      } else if (typeof error === 'string') {
        message = error;
      } else {
        message = 'Erreur de connexion au serveur.';
      }

      present({
        message: message,
        duration: 3000,
        color: 'danger'
      });
      // En cas d'échec de login, on s'assure que rien n'est stocké
      localStorage.removeItem('access_token');
      localStorage.removeItem('user_role');
      localStorage.removeItem('user_id');

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