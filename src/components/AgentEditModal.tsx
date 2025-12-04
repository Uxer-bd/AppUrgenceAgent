import React, { useState } from 'react';
import { 
    IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonInput, IonButton, 
    IonItem, IonLabel, IonList, IonLoading, useIonToast, IonButtons, 
    IonIcon, IonSegment, IonSegmentButton
} from '@ionic/react';
import { closeOutline } from 'ionicons/icons';

// --- Interface de l'Agent (Doit correspondre à celle de AgentListPage) ---
interface Agent {
    id: number;
    name: string;
    email: string;
    phone: string;
    role: 'agent' | 'manager' | string;
    status: 'active' | 'inactive' | string;
    latitude: number | null;
    longitude: number | null;
    availability_status: 'available' | 'on_intervention' | 'on_break' | string;
    created_at: string;
}

interface AgentEditModalProps {
    agent: Agent;
    onClose: () => void;
    onAgentUpdated: (agent: Agent) => void;
}

const AgentEditModal: React.FC<AgentEditModalProps> = ({ agent, onClose, onAgentUpdated }) => {
    
    // Initialisation du formulaire avec les données de l'agent
    const [name, setName] = useState(agent.name);
    const [email, setEmail] = useState(agent.email);
    const [phone, setPhone] = useState(agent.phone);
    const [latitude, setLatitude] = useState(agent.latitude?.toString() || '');
    const [longitude, setLongitude] = useState(agent.longitude?.toString() || '');
    const [status, setStatus] = useState(agent.status);
    const [availability, setAvailability] = useState(agent.availability_status);
    
    const [loading, setLoading] = useState(false);
    const [present] = useIonToast();

    // --- Configuration API ---
    // Endpoint supposé pour la mise à jour (souvent PUT /api/users/{id})
    const API_URL = `https://intervention.tekfaso.com/api/users/${agent.id}`; 
    const TOKEN = localStorage.getItem('access_token');

    const handleUpdateAgent = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const updatedData = {
            name,
            email,
            phone,
            status,
            availability_status: availability,
            latitude: latitude ? parseFloat(latitude) : null,
            longitude: longitude ? parseFloat(longitude) : null,
            // Remarque : Le mot de passe n'est PAS inclus ici. Il nécessiterait un champ séparé.
        };

        if (!TOKEN) {
            setLoading(false);
            present({ message: "Session expirée.", duration: 3000, color: 'danger' });
            return;
        }
        
        try {
            const response = await fetch(API_URL, {
                method: 'PUT', // Assumer PUT ou PATCH pour la mise à jour
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${TOKEN}`,
                },
                body: JSON.stringify(updatedData),
            });

            if (!response.ok) {
                const errorData = await response.json();
                const errorMessage = errorData.message || `Échec de la mise à jour: ${response.status}`;
                throw new Error(errorMessage);
            }

            const result = await response.json();

            // S'assurer que les données retournées par l'API sont mises à jour dans la liste mère
            const fullUpdatedAgent: Agent = { ...agent, ...updatedData, ...result.data }; 
            onAgentUpdated(fullUpdatedAgent);

        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : "Erreur inconnue lors de la mise à jour.";
            present({ message, duration: 4000, color: 'danger' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <IonPage>
            <IonHeader>
                <IonToolbar color="primary">
                    <IonTitle>Éditer : {agent.name}</IonTitle>
                    <IonButtons slot="end">
                        <IonButton onClick={onClose}>
                            <IonIcon slot="icon-only" icon={closeOutline} />
                        </IonButton>
                    </IonButtons>
                </IonToolbar>
            </IonHeader>
            <IonContent fullscreen className="ion-padding">
                <form onSubmit={handleUpdateAgent}>
                    <IonList>
                        {/* 1. Infos Générales */}
                        <IonItem>
                            <IonLabel position="floating">Nom et Prénoms</IonLabel>
                            <IonInput type="text" value={name} onIonChange={(e) => setName(e.detail.value!)} required />
                        </IonItem>
                        <IonItem>
                            <IonLabel position="floating">Email</IonLabel>
                            <IonInput type="email" value={email} onIonChange={(e) => setEmail(e.detail.value!)} required />
                        </IonItem>
                        <IonItem>
                            <IonLabel position="floating">Téléphone</IonLabel>
                            <IonInput type="tel" value={phone} onIonChange={(e) => setPhone(e.detail.value!)} required />
                        </IonItem>

                        {/* 2. Statut du Compte (Active/Inactive) */}
                        <IonItem lines="none" className="ion-margin-top">
                            <IonLabel>Statut du Compte</IonLabel>
                        </IonItem>
                        <IonSegment 
                            value={status} 
                            onIonChange={(e) => setStatus(e.detail.value as string)}
                            color="tertiary"
                        >
                            <IonSegmentButton value="active">
                                <IonLabel>Actif</IonLabel>
                            </IonSegmentButton>
                            <IonSegmentButton value="inactive">
                                <IonLabel>Inactif</IonLabel>
                            </IonSegmentButton>
                        </IonSegment>

                        {/* 3. Statut de Disponibilité */}
                        <IonItem lines="none" className="ion-margin-top">
                            <IonLabel>Disponibilité Terrain</IonLabel>
                        </IonItem>
                        <IonSegment 
                            value={availability} 
                            onIonChange={(e) => setAvailability(e.detail.value as string)}
                            color="secondary"
                        >
                            <IonSegmentButton value="available">
                                <IonLabel>Disponible</IonLabel>
                            </IonSegmentButton>
                            <IonSegmentButton value="on_intervention">
                                <IonLabel>En Intervention</IonLabel>
                            </IonSegmentButton>
                            <IonSegmentButton value="on_break">
                                <IonLabel>En Pause</IonLabel>
                            </IonSegmentButton>
                        </IonSegment>

                        {/* 4. Coordonnées GPS */}
                        <IonItem lines="none" className="ion-margin-top">
                            <IonLabel>Localisation (pour le suivi)</IonLabel>
                        </IonItem>
                        <IonItem>
                            <IonLabel position="floating">Latitude</IonLabel>
                            <IonInput type="number" value={latitude} onIonChange={(e) => setLatitude(e.detail.value!)} inputmode="decimal" />
                        </IonItem>
                        <IonItem>
                            <IonLabel position="floating">Longitude</IonLabel>
                            <IonInput type="number" value={longitude} onIonChange={(e) => setLongitude(e.detail.value!)} inputmode="decimal" />
                        </IonItem>

                    </IonList>

                    <IonButton 
                        expand="block" 
                        type="submit" 
                        className="ion-margin-top"
                        disabled={loading}
                    >
                        {loading ? 'Sauvegarde...' : 'Sauvegarder les Modifications'}
                    </IonButton>
                </form>
                
                <IonLoading isOpen={loading} message={'Mise à jour de l\'agent...'} />
            </IonContent>
        </IonPage>
    );
};

export default AgentEditModal;