import React, { useState, useEffect, useCallback } from 'react';
import { 
    IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonList, IonItem,
    IonLabel, IonSpinner, IonText, useIonToast, IonIcon, IonButtons,
    IonButton, IonNote, IonModal, IonAlert, IonRefresher, IonRefresherContent
} from '@ionic/react';
import { useHistory } from 'react-router-dom';
import { arrowBackOutline, checkmarkCircle, closeCircle, timeOutline, personAddOutline, createOutline, trashOutline, refreshOutline } from 'ionicons/icons';

import AgentEditModal from '../components/AgentEditModal';

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

interface User {
    role: string;
    [key: string]: unknown;
}

const AgentListPage: React.FC = () => {
    const history = useHistory();
    const [agents, setAgents] = useState<Agent[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [present] = useIonToast();
    const [isRefreshing, setIsRefreshing] = useState(false);

    const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
    const [showDeleteAlert, setShowDeleteAlert] = useState<Agent | null>(null);

    // --- Configuration API ---
    // Nous supposons que GET /api/users retourne la liste de tous les utilisateurs (agents et managers)
    const API_URL = "https://api.depannel.com/api/users?role=agent&per_page=15";
    const API_URL_1 = "https://api.depannel.com/api/users";
    const TOKEN = localStorage.getItem('access_token');

const fetchAgents = useCallback(async (refresh = false) => {

    if (!refresh) setLoading(true); else setIsRefreshing(true);
    setError(null);

    if (!TOKEN) {
        setError("Erreur d'authentification. Session expirée.");
        setLoading(false);
        setIsRefreshing(false);
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
            const filteredAgents = result.data.users.filter((user: User) => user.role === 'agent');
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

}, [API_URL, TOKEN, present]);

    useEffect(() => {
        fetchAgents();
    }, []);

    const handleRefresh = (event: CustomEvent) => {
    fetchAgents(true).then(() => event.detail.complete());
    };
    
    
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

    const handleDeleteAgent = async (agentId: number) => {
        // Endpoint supposé pour la suppression (souvent DELETE /api/users/{id})
        const deleteEndpoint = `${API_URL_1}/${agentId}`; 
        
        try {
            const response = await fetch(deleteEndpoint, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${TOKEN}` },
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `Échec de la suppression: ${response.status}`);
            }

            present({ message: "Agent supprimé avec succès !", duration: 2000, color: 'success' });
            fetchAgents(true); // Rafraîchir la liste
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : "Erreur inconnue lors de la suppression.";
            present({ message, duration: 3000, color: 'danger' });
        }
    };

    const handleAgentUpdated = (updatedAgent: Agent) => {
        setAgents(prevAgents => 
            prevAgents.map(agent => (agent.id === updatedAgent.id ? updatedAgent : agent))
        );
        setSelectedAgent(null); // Fermer la modale
        present({ message: `${updatedAgent.name} mis à jour.`, duration: 2000, color: 'success' });
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
                    <IonButton onClick={() => { void fetchAgents(); }}>Réessayer</IonButton>
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
                        <IonButton onClick={() => fetchAgents(true)} disabled={isRefreshing}>
                            <IonIcon icon={refreshOutline} />
                        </IonButton>
                        {/* Bouton pour aller à la création d'agent */}
                        <IonButton routerLink="/manager/create-agent">
                            <IonIcon icon={personAddOutline} slot="start" />
                            Ajouter
                        </IonButton>
                    </IonButtons>
                </IonToolbar>
            </IonHeader>
            <IonContent fullscreen>
                <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
                    <IonRefresherContent></IonRefresherContent>
                </IonRefresher>

                { error && (
                    <div className="ion-padding ion-text-center">
                        <IonText color="danger"><p>Erreur de chargement: {error}</p></IonText>
                        <IonButton onClick={() => fetchAgents(true)}>Réessayer</IonButton>
                    </div>
                )}

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
                                    lines='full'
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

                                    <IonButtons slot="end">
                                        <IonButton
                                            color="primary"
                                            onClick={() => setSelectedAgent(agent)}
                                        >
                                            <IonIcon icon={createOutline} slot="icon-only" />
                                        </IonButton>

                                        <IonButton
                                            color="danger"
                                            onClick={() => setShowDeleteAlert(agent)}
                                        >
                                            <IonIcon icon={trashOutline} slot="icon-only" />
                                        </IonButton>
                                    </IonButtons>

                                </IonItem>
                            );
                        })}
                    </IonList>
                )}
            </IonContent>

            {/* Modale d'édition */}
            <IonModal
                isOpen={!!selectedAgent}
                onDidDismiss={() => setSelectedAgent(null)}
            >
                {selectedAgent && (
                    <AgentEditModal
                        agent={selectedAgent}
                        onClose={() => setSelectedAgent(null)}
                        onAgentUpdated={handleAgentUpdated}
                    />
                )}
            </IonModal>

            <IonAlert
                isOpen={!!showDeleteAlert}
                onDidDismiss={() => setShowDeleteAlert(null)}
                header={`Supprimer ${showDeleteAlert?.name}?`}
                message="Êtes-vous sûr de vouloir supprimer cet agent ? Cette action est irréversible."
                buttons={[
                    { text: 'Annuler', role: 'cancel' },
                    { 
                        text: 'Supprimer', 
                        handler: () => {
                            if (showDeleteAlert) {
                                handleDeleteAgent(showDeleteAlert.id);
                            }
                        },
                        cssClass: 'alert-button-danger'
                    }
                ]}
            />
        </IonPage>
    );
};

export default AgentListPage;