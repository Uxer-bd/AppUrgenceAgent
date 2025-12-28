import React, { useState } from 'react';
import { 
    IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonInput, IonButton, 
    IonItem, IonLabel, IonList, IonLoading, useIonToast, IonNote, IonButtons, IonIcon
} from '@ionic/react';
import { useHistory } from 'react-router-dom';
import { arrowBackOutline } from 'ionicons/icons';

const AgentCreationForm: React.FC = () => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [phone, setPhone] = useState('');
    const history = useHistory();
    
    // Nouveaux champs requis par le schéma API (image_494ebc.png)
    const [latitude, setLatitude] = useState('');
    const [longitude, setLongitude] = useState('');

    const [loading, setLoading] = useState(false);
    const [present] = useIonToast();

    // --- Configuration API ---
    // Nous supposons un endpoint de création d'utilisateur/enregistrement.
    // Si votre API a un endpoint spécifique pour les administrateurs, ajustez cette URL.
    const API_URL = "https://api.depannel.com/api/users"; // Hypothèse d'un endpoint plus générique
    const TOKEN = localStorage.getItem('access_token'); // Requis pour l'authentification admin

    const handleCreateAgent = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        // Validation simple
        if (!name || !email || !password || !phone || !latitude || !longitude) {
            present({ message: "Veuillez remplir tous les champs.", duration: 3000, color: 'danger' });
            setLoading(false);
            return;
        }

        const newAgentData = {
            name,
            email,
            password,
            phone,
            role: 'agent', // Fixe
            status: 'active', // Fixe selon le schéma
            latitude: parseFloat(latitude), // Conversion nécessaire
            longitude: parseFloat(longitude), // Conversion nécessaire
            availability_status: 'available', // Fixe selon le schéma
        };

        if (!TOKEN) {
            present({ message: "Erreur d'authentification. Session expirée.", duration: 3000, color: 'danger' });
            setLoading(false);
            return;
        }

        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${TOKEN}`,
                },
                body: JSON.stringify(newAgentData),
            });

            if (!response.ok) {
                const errorData = await response.json();
                // Afficher des messages d'erreur détaillés (ex: email déjà pris)
                const errorMessage = errorData.message || (errorData.errors && Object.values(errorData.errors).flat().join(', ')) || `Échec de la création de l'agent: ${response.status}`;
                throw new Error(errorMessage);
            }

            // Succès
            present({ message: `${name} a été créé(e) et est actif(ve) !`, duration: 3000, color: 'success' });
            
            // Réinitialiser le formulaire
            setName('');
            setEmail('');
            setPassword('');
            setPhone('');
            setLatitude('');
            setLongitude('');
            history.goBack();

        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : "Erreur inconnue lors de la création de l'agent.";
            present({ message, duration: 4000, color: 'danger' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <IonPage>
            <IonHeader>
                <IonToolbar color="primary">
                    <IonButtons slot="start">
                        {/* Option 1: Bouton de retour manuel (recommandé pour un contrôle précis) */}
                        <IonButton onClick={() => history.goBack()}>
                            <IonIcon slot="icon-only" icon={arrowBackOutline} />
                        </IonButton>
                    </IonButtons>
                    <IonTitle>Créer un Nouvel Agent</IonTitle>
                </IonToolbar>
            </IonHeader>
            <IonContent fullscreen className="ion-padding">
                <form onSubmit={handleCreateAgent}>
                    <IonList>
                        <IonItem>
                            <IonLabel position="floating">Nom et Prénoms</IonLabel>
                            <IonInput 
                                type="text" 
                                value={name} 
                                onIonChange={(e) => setName(e.detail.value!)} 
                                required
                            />
                        </IonItem>
                        <IonItem>
                            <IonLabel position="floating">Email</IonLabel>
                            <IonInput 
                                type="email" 
                                value={email} 
                                onIonChange={(e) => setEmail(e.detail.value!)} 
                                required
                            />
                        </IonItem>
                        <IonItem>
                            <IonLabel position="floating">Mot de Passe</IonLabel>
                            <IonInput 
                                type="password" 
                                value={password} 
                                onIonChange={(e) => setPassword(e.detail.value!)} 
                                required
                            />
                        </IonItem>
                        <IonItem>
                            <IonLabel position="floating">Téléphone</IonLabel>
                            <IonInput 
                                type="tel" 
                                value={phone} 
                                onIonChange={(e) => setPhone(e.detail.value!)} 
                                required
                            />
                        </IonItem>
                        
                        {/* Champs de Localisation Initiale */}
                        <IonItem lines="none" className="ion-margin-top">
                            <IonLabel color="medium">Localisation Initiale (Coordonnées)</IonLabel>
                        </IonItem>
                        <IonItem>
                            <IonLabel position="floating">Latitude</IonLabel>
                            <IonInput 
                                type="number" 
                                value={latitude} 
                                onIonChange={(e) => setLatitude(e.detail.value!)} 
                                inputmode="decimal"
                                required
                            />
                        </IonItem>
                        <IonItem>
                            <IonLabel position="floating">Longitude</IonLabel>
                            <IonInput 
                                type="number" 
                                value={longitude} 
                                onIonChange={(e) => setLongitude(e.detail.value!)} 
                                inputmode="decimal"
                                required
                            />
                        </IonItem>
                        <IonNote slot="end" className="ion-margin-top">
                            L'agent sera créé avec le rôle 'agent', statut 'active' et disponibilité 'available'.
                        </IonNote>
                        
                    </IonList>

                    <IonButton 
                        expand="block" 
                        type="submit" 
                        className="ion-margin-top"
                        disabled={loading || !name || !email || !password || !phone || !latitude || !longitude}
                    >
                        {loading ? 'Création...' : 'Ajouter l\'Agent'}
                    </IonButton>
                </form>
                
                <IonLoading isOpen={loading} message={'Création de l\'agent...'} />
            </IonContent>
        </IonPage>
    );
};

export default AgentCreationForm;