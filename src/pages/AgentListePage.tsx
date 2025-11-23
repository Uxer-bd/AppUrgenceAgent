import React, { useState, useEffect } from 'react';
import { 
    IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonList, IonItem, 
    IonLabel, IonSpinner, IonText, useIonToast, IonIcon, IonButtons, 
    IonButton, IonNote 
} from '@ionic/react';
import { useHistory } from 'react-router-dom';
import { arrowBackOutline, checkmarkCircle, closeCircle, timeOutline, personAddOutline } from 'ionicons/icons';

// --- Interface de l'Agent (Basée sur image_ad2782.png) ---
interface Agent {
    id: number;
    name: string;
    email: string;
    phone: string;
    role: 'agent' | 'manager' | string;
    status: 'active' | 'inactive' | string; // Statut général du compte
    latitude: number | null;
    longitude: number | null;
    availability_status: 'available' | 'on_intervention' | 'on_break' | string; // Statut de travail
    created_at: string;
}

const AgentListPage: React.FC = () => {
    const history = useHistory();
    const [agents, setAgents] = useState<Agent[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [present] = useIonToast();

    // --- Configuration API ---
    // Nous supposons que GET /api/users retourne la liste de tous les utilisateurs (agents et managers)
    const API_URL = "https://intervention.tekfaso.com/api/users?role=agent&per_page=15";
    const TOKEN = localStorage.getItem('access_token');

    const fetchAgents = async () => {
        if (!TOKEN) {
            setError("Erreur d'authentification. Session expirée.");
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const response = await fetch(API_URL, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${TOKEN}`,
                    'Accept': 'application/json'
                },
            });

            if (!response.ok) {
                throw new Error(`Échec du chargement des agents: ${response.status}`);
            }

            const result = await response.json();

            // Assurez-vous que la réponse contient un tableau de données 'data'
            if (result.success && result.data && Array.isArray(result.data.users)) {
                // Filtre optionnel: ne garder que les utilisateurs ayant le rôle 'agent'
                const filteredAgents = result.data.users.filter((user: any) => user.role === 'agent');
                setAgents(filteredAgents as Agent[]);
            } else {
                setAgents([]);
                present({ message: "Aucun agent trouvé ou structure de données invalide.", duration: 3000, color: 'warning' });
            }

        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "Erreur inconnue lors de la récupération des agents.";
            setError(errorMessage);
            present({ message: errorMessage, duration: 4000, color: 'danger' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAgents();
    }, []);
    
    // Fonction utilitaire pour le style du statut de disponibilité
    const getAvailabilityStatusStyle = (status: string) => {
        switch (status.toLowerCase()) {
            case 'available':
                return { color: 'success', icon: checkmarkCircle, text: 'Disponible' };
            case 'on_intervention':
                return { color: 'warning', icon: timeOutline, text: 'En intervention' };
            case 'on_break':
                return { color: 'medium', icon: timeOutline, text: 'En pause' };
            default:
                return { color: 'light', icon: closeCircle, text: 'Non spécifié' };
        }
    };
    
    if (loading) {
        return (
            <IonPage>
                <IonHeader>
                    <IonToolbar color="primary"><IonTitle>Gestion des Agents</IonTitle></IonToolbar>
                </IonHeader>
                <IonContent className="ion-padding ion-text-center">
                    <IonSpinner name="crescent" className="ion-margin-top" />
                    <IonText color="medium"><p>Chargement des agents...</p></IonText>
                </IonContent>
            </IonPage>
        );
    }
    
    if (error) {
        return (
            <IonPage>
                <IonHeader>
                    <IonToolbar color="primary"><IonTitle>Gestion des Agents</IonTitle></IonToolbar>
                </IonHeader>
                <IonContent className="ion-padding ion-text-center">
                    <IonText color="danger"><p>Erreur: {error}</p></IonText>
                    <IonButton onClick={fetchAgents}>Réessayer</IonButton>
                </IonContent>
            </IonPage>
        );
    }

    return (
        <IonPage>
            <IonHeader>
                <IonToolbar color="primary">
                    <IonButtons slot="start">
                        <IonButton onClick={() => history.goBack()}>
                            <IonIcon slot="icon-only" icon={arrowBackOutline} />
                        </IonButton>
                    </IonButtons>
                    <IonTitle>Gestion des Agents ({agents.length})</IonTitle>
                    <IonButtons slot="end">
                        {/* Bouton pour aller à la création d'agent */}
                        <IonButton routerLink="/manager/create-agent">
                            <IonIcon icon={personAddOutline} slot="start" />
                            Ajouter
                        </IonButton>
                    </IonButtons>
                </IonToolbar>
            </IonHeader>
            <IonContent fullscreen>
                {agents.length === 0 ? (
                    <div className="ion-padding ion-text-center">
                        <IonText color="medium"><p>Aucun agent enregistré dans le système.</p></IonText>
                        <IonButton routerLink="/admin/new-agent" expand="block">Créer un agent</IonButton>
                    </div>
                ) : (
                    <IonList>
                        {agents.map((agent) => {
                            const availability = getAvailabilityStatusStyle(agent.availability_status);
                            
                            return (
                                <IonItem 
                                    key={agent.id} 
                                    detail={true} 
                                    // Vous pouvez ajouter un lien vers la page de détails de l'agent ici
                                    // routerLink={`/admin/agent/${agent.id}`}
                                >
                                    <IonLabel>
                                        <h2>{agent.name}</h2>
                                        <p>{agent.email}</p>
                                        <p>Téléphone: {agent.phone}</p>
                                        <IonNote color="medium">
                                            Membre depuis: {new Date(agent.created_at).toLocaleDateString()}
                                        </IonNote>
                                    </IonLabel>
                                    <IonIcon 
                                        slot="end" 
                                        icon={availability.icon} 
                                        color={availability.color} 
                                        className="ion-margin-end" 
                                    />
                                    <IonText slot="end" color={availability.color}>
                                        <small>{availability.text}</small>
                                    </IonText>
                                </IonItem>
                            );
                        })}
                    </IonList>
                )}
            </IonContent>
        </IonPage>
    );
};

export default AgentListPage;