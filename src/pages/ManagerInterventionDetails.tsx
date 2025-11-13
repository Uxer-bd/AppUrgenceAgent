// src/pages/ManagerInterventionDetails.tsx

import React, { useState, useEffect } from 'react';
import { 
    IonPage, IonContent, IonHeader, IonToolbar, IonTitle, IonBackButton, IonButtons, 
    IonLoading, useIonToast, IonCard, IonCardHeader, IonCardContent, 
    IonItem, IonLabel, IonNote, IonButton, IonIcon, 
    IonModal, IonList, IonRadioGroup, IonRadio, 
    IonSelect, IonSelectOption
} from '@ionic/react';
import { useHistory, useParams } from 'react-router-dom';
import {
    refreshOutline,
    personAddOutline,
    closeCircleOutline,
    alertCircleOutline,
    callOutline
} from 'ionicons/icons';

// Interface pour les données de l'AGENT assigné
interface AssignedAgent {
    id: number;
    name: string;
    phone: string;
}

// Interface pour les données du CLIENT (imbriquées)
interface ClientData {
    name: string;
    phone: string;
    address: string;
}

// Interface pour les données de l'intervention (Manager View)
interface Intervention {
    id: number;
    reference: string;
    description: string;
    address: string;
    client: ClientData;
    agent_id: number;
    status: 'pending' | 'accepted' | 'in-progress' | 'completed' | 'closed';
    priority_level: 'low' | 'medium' | 'high';
    created_at: string;
    agent?: AssignedAgent | null;
}

// Interface pour les Agents disponibles (doit correspondre à AssignedAgent)
interface AvailableAgent {
    id: number;
    name: string;
    phone: string;
}

const ManagerInterventionDetails: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const history = useHistory();
    const [present] = useIonToast();

    const [intervention, setIntervention] = useState<Intervention | null>(null);
    const [availableAgents, setAvailableAgents] = useState<AvailableAgent[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const [showAssignModal, setShowAssignModal] = useState(false);
    const [showPriorityModal, setShowPriorityModal] = useState(false);
    const [selectedAgentId, setSelectedAgentId] = useState<number | null>(null);
    const [newPriority, setNewPriority] = useState<'low' | 'medium' | 'high'>('low');

    const API_BASE_URL = "https://intervention.tekfaso.com/api/manager/interventions";
    // prendre un utilisateur unique
    const USER_DETAIL_API_BASE_URL = "https://intervention.tekfaso.com/api/users";
    // CORRECTION 1: Nouvelle URL pour les agents disponibles
    const AGENT_LIST_API_URL = "https://intervention.tekfaso.com/api/users?role=agent&status=active";
    
    const TOKEN = localStorage.getItem('access_token');
    const USER_ROLE = localStorage.getItem('user_role');

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'high': return 'danger';
            case 'medium': return 'warning';
            default: return 'success';
        }
    };

    // Fonction pour récupérer les détails de l'agent si l'objet 'assigned_agent' est null
    const fetchAgentDetails = async (agentId: number): Promise<AssignedAgent | null> => {
        try {
            const response = await fetch(`${USER_DETAIL_API_BASE_URL}/${agentId}`, {
                headers: { 'Authorization': `Bearer ${TOKEN}` }
            });
            if (!response.ok) throw new Error("Échec du chargement de l'agent.");

            const data = await response.json();
            const userData = data.data || data; // L'objet utilisateur complet
            return {
                id: userData.id,
                name: userData.name || `${userData.first_name} ${userData.last_name}`.trim(),
                phone: userData.phone || 'N/A'
            };

        } catch (error) {
            console.error("Erreur lors de la récupération de l'agent:", error);
            return null;
        }
    }

    // --- Fonctions de chargement des données ---

   const fetchData = async (refresh = false) => {
        if (!refresh) setIsLoading(true); else setIsRefreshing(true);

        if (USER_ROLE !== 'manager' || !TOKEN) {
            const message = 'Accès non autorisé ou session expirée.';
            present({ message, duration: 3000, color: 'danger' });
            history.replace('/login');
            return;
        }

        try {
            // 1. Charger les détails de l'intervention
            const interventionResponse = await fetch(`${API_BASE_URL}/${id}`, {
                headers: { 'Authorization': `Bearer ${TOKEN}` }
            });

            if (interventionResponse.status === 401) throw new Error('Session expirée.');
            if (!interventionResponse.ok) throw new Error("Échec du chargement des détails.");

            const responseData = await interventionResponse.json();
            const rawData = responseData.intervention || responseData.data || responseData; 
            
            // Déterminer l'objet agent initial
            let assignedAgentData: AssignedAgent | null = rawData.assigned_agent || rawData.agent || null;
            
            // VÉRIFICATION CRITIQUE: Si assigned_agent est null mais agent_id est présent
            if (rawData.agent_id && assignedAgentData === null) {
                // Effectuer l'appel API pour obtenir les détails de l'agent
                assignedAgentData = await fetchAgentDetails(rawData.agent_id);
            }

            // Mapper les données
            const interventionData: Intervention = {
                ...rawData,
                client: rawData.client, 
                agent_id: rawData.agent_id || null,
                agent: assignedAgentData, // Utiliser l'objet agent complet (soit inclus, soit récupéré)
            };

            setIntervention(interventionData); 
            setNewPriority(interventionData.priority_level || 'low');

            // 2. Charger la liste des agents disponibles (pour la modale)
            const agentsResponse = await fetch(AGENT_LIST_API_URL, {
                headers: { 'Authorization': `Bearer ${TOKEN}` }
            });

            if (!agentsResponse.ok) throw new Error("Échec du chargement des agents.");

            const agentsData = await agentsResponse.json();
            // Accéder à la liste via data.users (correction précédente)
            setAvailableAgents(agentsData.data?.users || []);

        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Erreur réseau ou d\'autorisation.';
            present({ message, duration: 3000, color: 'danger' });
            if (message.includes('Session expirée')) history.replace('/login');

        } finally {
            if (!refresh) setIsLoading(false); else setIsRefreshing(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [id]);

    // --- Fonctions d'action (Assigner, Changer Priorité, Fermer) ---

    const handleAssign = async () => {
        if (!selectedAgentId) return present({ message: 'Veuillez sélectionner un agent.', duration: 2000, color: 'warning' });

        setIsLoading(true);
        try {
            const endpoint = intervention?.agent ? 'reassign' : 'assign';
            const method = intervention?.agent ? 'PUT' : 'POST';

            const response = await fetch(`${API_BASE_URL}/${id}/${endpoint}`, {
                method: method,
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${TOKEN}` 
                },
                body: JSON.stringify({ agent_id: selectedAgentId })
            });

            if (!response.ok) throw new Error('Échec de l\'affectation de l\'agent.');

            present({ message: `Agent ${endpoint === 'reassign' ? 'réaffecté' : 'affecté'} avec succès !`, duration: 2000, color: 'success' });
            setShowAssignModal(false);
            fetchData(true); 

        } catch (error: unknown) {
            const message = (error as Error).message; // Utilisation de const pour la variable message
            present({ message, duration: 3000, color: 'danger' });
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleSetPriority = async () => {
        if (!newPriority) return;

        setIsLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/${id}/priority`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${TOKEN}` 
                },
                body: JSON.stringify({ priority_level: newPriority })
            });

            if (!response.ok) throw new Error('Échec du changement de priorité.');
            
            present({ message: 'Priorité mise à jour !', duration: 2000, color: 'success' });
            setShowPriorityModal(false);
            fetchData(true); 

        } catch (error: unknown) {
            const message = (error as Error).message; // Utilisation de const pour la variable message
            present({ message, duration: 3000, color: 'danger' });
        } finally {
            setIsLoading(false);
        }
    };

    const handleCloseIntervention = async () => {
        if (!window.confirm("Êtes-vous sûr de vouloir CLÔTURER cette intervention ? Cette action est irréversible.")) return;
        
        setIsLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/${id}/close`, {
                method: 'POST', 
                headers: { 
                    'Authorization': `Bearer ${TOKEN}` 
                }
            });

            if (!response.ok) throw new Error('Échec de la fermeture de l\'intervention.');
            
            present({ message: 'Intervention clôturée avec succès !', duration: 2000, color: 'success' });
            fetchData(true); 

        } catch (error: unknown) {
            const message = (error as Error).message; // Utilisation de const pour la variable message
            present({ message, duration: 3000, color: 'danger' });
        } finally {
            setIsLoading(false);
        }
    };

    // --- Rendu conditionnel et Utilitaires ---
    if (isLoading || !intervention) {
        return (
            <IonPage>
                <IonHeader><IonToolbar color="primary"><IonTitle>Détails</IonTitle></IonToolbar></IonHeader>
                <IonContent><IonLoading isOpen={isLoading} message="Chargement..." /></IonContent>
            </IonPage>
        );
    }
    
    const isClosed = intervention.status === 'completed' || intervention.status === 'closed';
    const assignedAgent = intervention.agent;
    
    return (
        <IonPage>
            <IonHeader>
                <IonToolbar color="primary">
                    <IonButtons slot="start"><IonBackButton defaultHref="/manager-dashboard" /></IonButtons>
                    <IonTitle>Intervention #{intervention.id}</IonTitle>
                    <IonButtons slot="end">
                        <IonButton onClick={() => fetchData(true)} disabled={isRefreshing}>
                            <IonIcon icon={refreshOutline} />
                        </IonButton>
                    </IonButtons>
                </IonToolbar>
            </IonHeader>

            <IonContent fullscreen className="ion-padding">
                <IonLoading isOpen={isRefreshing} message="Actualisation..." duration={500} />

                {/* --- Résumé Statut / Priorité --- */}
                <IonCard style={{ marginBottom: '20px' }}>
                    <IonCardContent>
                        <IonLabel style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h2 style={{ fontSize: '1.4em', fontWeight: 'bold' }}>Statut: <IonNote color='primary'>{intervention.status.toUpperCase()}</IonNote></h2>
                            
                            <IonButton 
                                color={getPriorityColor(intervention.priority_level)} 
                                size="small" 
                                onClick={() => setShowPriorityModal(true)}
                                disabled={isClosed}
                            >
                                <IonIcon icon={alertCircleOutline} slot="start" />
                                {intervention.priority_level.toUpperCase()}
                            </IonButton>
                        </IonLabel>
                        <hr style={{ margin: '10px 0' }} />
                        <p>Créée le: {new Date(intervention.created_at).toLocaleString()}</p>
                    </IonCardContent>
                </IonCard>

                {/* --- Détails Client et Problème --- */}
                <IonCard style={{ marginBottom: '5px' }}>
                    <IonCardHeader><IonTitle size="large">Détails de l'intervention</IonTitle></IonCardHeader>
                    <IonCardContent>
                        <IonItem lines="none"><IonLabel>Client : {intervention.client.name}</IonLabel></IonItem>
                        <IonItem lines="none"><IonLabel>Téléphone : {intervention.client.phone}</IonLabel></IonItem>
                        <IonItem lines="none"><IonLabel>Adresse Client : {intervention.client.address}</IonLabel></IonItem>
                        <IonItem lines="none"><IonLabel>Lieu Intervention : {intervention.address}</IonLabel></IonItem>
                        <IonItem lines="none" className="ion-margin-top"><IonLabel position="stacked">Description du problème:</IonLabel></IonItem>
                        <p className="ion-padding-start">{intervention.description}</p>
                    </IonCardContent>
                </IonCard>
                {/* --- Section Affectation --- */}
                <IonCard color={assignedAgent ? 'success' : 'warning'} style={{ marginBottom: '20px' }}>
                    <IonCardHeader style={{ color: 'white' }}>
                        <IonTitle size="large" style={{ color: 'white' }}>Technicien Assigné</IonTitle>
                    </IonCardHeader>
                    <IonCardContent style={{ color: 'white' }}>
                        <IonLabel style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                            <h2 style={{ fontSize: '1.2em' }}>{assignedAgent ? assignedAgent.name : 'Aucun agent assigné'}</h2>

                            <IonButton
                                onClick={() => setShowAssignModal(true)}
                                color="light"
                                disabled={isClosed}
                            >
                                <IonIcon icon={personAddOutline} slot="start" />
                                {assignedAgent ? 'Ré-affecter' : 'Affecter'}
                            </IonButton>
                        </IonLabel>

                        {/* Détails supplémentaires de l'agent : Téléphone */}
                        {assignedAgent && (
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <p style={{ margin: 0 }}>Tél: **{assignedAgent.phone}**</p>
                                <IonButton
                                    color="light"
                                    fill="clear"
                                    size="small"
                                    href={`tel:${assignedAgent.phone}`}
                                >
                                    <IonIcon icon={callOutline} slot="icon-only" />
                                </IonButton>
                            </div>
                        )}

                    </IonCardContent>
                </IonCard>

                {/* --- Bouton Clôturer l'Intervention --- */}
                {!isClosed && (
                    <IonButton
                        expand="block"
                        color="danger"
                        onClick={handleCloseIntervention}
                        className="ion-margin-top"
                    >
                        <IonIcon icon={closeCircleOutline} slot="start" />
                        Clôturer l'Intervention
                    </IonButton>
                )}
                {isClosed && (
                    <IonNote color="success" style={{ display: 'block', textAlign: 'center', fontSize: '1.2em' }}>
                        Cette intervention est **Clôturée** (ou {intervention.status.toUpperCase()}).
                    </IonNote>
                )}
            </IonContent>

            {/* --- Modale d'Affectation --- */}
            <IonModal isOpen={showAssignModal} onDidDismiss={() => setShowAssignModal(false)}>
                <IonHeader>
                    <IonToolbar><IonTitle>Affecter un agent</IonTitle><IonButtons slot="end"><IonButton onClick={() => setShowAssignModal(false)}>Fermer</IonButton></IonButtons></IonToolbar>
                </IonHeader>
                <IonContent className="ion-padding">
                    {availableAgents.length > 0 ? (
                        <IonList>
                            <IonRadioGroup value={selectedAgentId} onIonChange={e => setSelectedAgentId(e.detail.value)}>
                                {availableAgents.map(agent => (
                                    <IonItem key={agent.id}>
                                        <IonLabel>{agent.name} - ({agent.phone})</IonLabel>
                                        <IonRadio slot="start" value={agent.id} />
                                    </IonItem>
                                ))}
                            </IonRadioGroup>
                        </IonList>
                    ) : (<p>Aucun agent disponible pour l'instant.</p>)}

                    <IonButton expand="block" onClick={handleAssign} className="ion-margin-top" disabled={!selectedAgentId || isLoading}>
                        Confirmer l'Affectation
                    </IonButton>
                </IonContent>
            </IonModal>
            {/* --- Modale de Priorité --- */}
            <IonModal isOpen={showPriorityModal} onDidDismiss={() => setShowPriorityModal(false)}>
                <IonHeader>
                    <IonToolbar><IonTitle>Changer la Priorité</IonTitle><IonButtons slot="end"><IonButton onClick={() => setShowPriorityModal(false)}>Fermer</IonButton></IonButtons></IonToolbar>
                </IonHeader>
                <IonContent className="ion-padding">
                    <IonItem>
                        <IonLabel>Nouveau Niveau de Priorité</IonLabel>
                        <IonSelect value={newPriority} onIonChange={e => setNewPriority(e.detail.value)}>
                            <IonSelectOption value="low">faible</IonSelectOption>
                            <IonSelectOption value="medium">Moyenne</IonSelectOption>
                            <IonSelectOption value="high">Élevée</IonSelectOption>
                        </IonSelect>
                    </IonItem>

                    <IonButton expand="block" onClick={handleSetPriority} className="ion-margin-top" disabled={isLoading}>
                        Appliquer la Priorité
                    </IonButton>
                </IonContent>
            </IonModal>

        </IonPage>
    );
};

export default ManagerInterventionDetails;