// src/pages/ManagerInterventionDetails.tsx

import React, { useState, useEffect } from 'react';
import { 
    IonPage, IonContent, IonHeader, IonToolbar, IonTitle, IonBackButton, IonButtons, 
    IonLoading, useIonToast, IonCard, IonCardHeader, IonCardContent, 
    IonItem, IonLabel, IonNote, IonButton, IonIcon, 
    IonModal, IonList, IonRadioGroup, IonRadio, 
    IonSelect, IonSelectOption, IonInput,
} from '@ionic/react';
import { useHistory, useParams } from 'react-router-dom';
import {
    refreshOutline,
    personAddOutline,
    closeCircleOutline,
    alertCircleOutline,
    callOutline, createOutline, trashOutline,
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
    client_first_name : string;
    client_phone : string;
    agent_id: number;
    status: 'pending' | 'accepted' | 'in_progress' | 'completed' | 'closed' | 'assigned';
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

// Interface pour les items d'un devis
interface QuoteItem {
    name: string;
    quantity: number;
    unit_price: number;
    total: number;
}

// Interface pour le Devis
interface Quote {
    id: number;
    intervention_id: number;
    amount: number;
    description: string;
    items: QuoteItem[];
    valid_until: string;
    created_at?: string;
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

    // etat pour le devis
    const [quotes, setQuotes] = useState<Quote[]>([]);
    const [showQuoteModal, setShowQuoteModal] = useState(false);
    const [isEditingQuote, setIsEditingQuote] = useState(false);

    // État pour le formulaire de devis
    const [currentQuote, setCurrentQuote] = useState<Partial<Quote>>({
        description: '',
        amount: 0,
        valid_until: new Date().toISOString().split('T')[0],
        items: [{ name: '', quantity: 1, unit_price: 0, total: 0 }]
    });

    // api pour la gestion des devis
    const QUOTE_API_BASE_URL = "https://api.depannel.com/api/manager/quotes";

    const API_BASE_URL = "https://api.depannel.com/api/manager/interventions";
    // prendre un utilisateur unique
    const USER_DETAIL_API_BASE_URL = "https://api.depannel.com/api/users";
    // CORRECTION 1: Nouvelle URL pour les agents disponibles
    const AGENT_LIST_API_URL = "https://api.depannel.com/api/users?role=agent&availability_status=available&per_page=15";
    // const AGENT_LIST_API_URL = "https://intervention.tekfaso.com/api/manager/agents/available";

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
            const quotesResponse = await fetch(`https://api.depannel.com/api/manager/interventions/${id}/quotes`, {
            headers: { 'Authorization': `Bearer ${TOKEN}` }});

            if (!response.ok) throw new Error("Échec du chargement de l'agent.");
            if (quotesResponse.ok) {
                const quotesData = await quotesResponse.json();
                setQuotes(quotesData.data || []);
            }

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

    // Modification de la fonction de récupération (Point 2)
    const fetchQuotes = async (interventionId: string, clientPhone: string) => {
        try {
            // L'API attend le téléphone dans la query string : ?phone=...
            const url = `https://api.depannel.com/api/manager/interventions/${interventionId}/quotes?phone=${clientPhone}`;
            
            const response = await fetch(url, {
                headers: {
                    'Authorization': `Bearer ${TOKEN}`,
                    'Accept': 'application/json'
                }
            });

            if (response.ok) {
                const responseData = await response.json();
                // Selon le format habituel de votre API, les données sont dans .data ou .quotes
                setQuotes(responseData.data || responseData.quotes || []);
            } else {
                console.error("Erreur lors de la récupération des devis");
            }
        } catch (error) {
            console.error("Erreur réseau pour les devis:", error);
        }
    };

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

            // Extraction du téléphone pour l'appel suivant
            const clientPhone = rawData.client_phone || (rawData.client && rawData.client.phone);

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

            //Charger les devis avec l'ID et le téléphone
            if (clientPhone) {
                await fetchQuotes(id, clientPhone);
            }

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
            const endpoint = intervention?.agent ? 'assign' : 'assign';
            const method = intervention?.agent ? 'POST' : 'POST';

            const response = await fetch(`${API_BASE_URL}/${id}/${endpoint}`, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${TOKEN}`
                },
                body: JSON.stringify({ agent_id: selectedAgentId })
            });


            if (!response.ok) throw new Error('Échec de l\'affectation de l\'agent.');

            present({ message: `Agent ${endpoint === 'assign' ? 'réaffecté' : 'affecté'} avec succès !`, duration: 2000, color: 'success' });
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

            const requestBody = {
                // Ces valeurs sont nécessaires car l'API les attend
                closure_reason: "Clôturé manuellement par le manager.",
                manager_notes: "Vérification et validation de l'état de l'intervention."
            };

            const response = await fetch(`${API_BASE_URL}/${id}/close`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${TOKEN}`,
                },
                body: JSON.stringify(requestBody),
            });

            // if (!response.ok) throw new Error('Échec de la fermeture de l\'intervention.');
            if (!response.ok) {
            // Lecture détaillée de la réponse d'erreur
            let errorMessage = 'Échec de la fermeture de l\'intervention.';
            try {
                const errorData = await response.json();
                errorMessage = errorData.message || errorData.errors?.closure_reason?.[0] || 'Erreur inconnue de l\'API.';
            } catch {
                // Si la lecture JSON échoue (ex: 500 Internal Server Error)
                errorMessage = `Erreur Serveur: ${response.status} ${response.statusText}`;
            }
            throw new Error(errorMessage);
        }

            present({ message: 'Intervention clôturée avec succès !', duration: 2000, color: 'success' });
            fetchData(true);

        } catch (error: unknown) {
            const message = (error as Error).message; // Utilisation de const pour la variable message
            present({ message, duration: 3000, color: 'danger' });
        } finally {
            setIsLoading(false);
        }
    };

    // Calculer le montant total automatiquement
    const calculateTotal = (items: QuoteItem[]) => {
        return items.reduce((acc, item) => acc + (item.quantity * item.unit_price), 0);
    };

    const handleSaveQuote = async () => {
        setIsLoading(true);
        const method = isEditingQuote ? 'PUT' : 'POST';
        const url = isEditingQuote ? `${QUOTE_API_BASE_URL}/${currentQuote.id}` : QUOTE_API_BASE_URL;

        const payload = {
            intervention_id: parseInt(id),
            amount: calculateTotal(currentQuote.items || []),
            description: currentQuote.description || '',
            items: (currentQuote.items || []).map(item => ({
                name: item.name || 'Service sans nom',
                quantity: Number(item.quantity),
                unit_price: Number(item.unit_price),
                total: Number(item.quantity) * Number(item.unit_price)
            })),
            valid_until: "2025-12-31"
        };

        try {
            const response = await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${TOKEN}` },
                body: JSON.stringify(payload)
            });

            if (!response.ok) throw new Error("Erreur lors de l'enregistrement du devis");

            present({ message: 'Devis enregistré avec succès !', duration: 2000, color: 'success' });
            setShowQuoteModal(false);
            fetchData(true);
        } catch (error: any) {
            present({ message: error.message, duration: 3000, color: 'danger' });
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteQuote = async (quoteId: number) => {
        if (!window.confirm("Supprimer ce devis ?")) return;
        try {
            const response = await fetch(`${QUOTE_API_BASE_URL}/${quoteId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${TOKEN}` }
            });
            if (response.ok) {
                present({ message: 'Devis supprimé', duration: 2000, color: 'success' });
                fetchData(true);
            }
        } catch (error) {
            present({ message: "Erreur de suppression", duration: 2000, color: 'danger' });
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
    
    const isClosed = intervention.status === 'completed' || intervention.status === 'closed' || intervention.status === 'in_progress';
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
                        <IonItem lines="none"><IonLabel>Client : {intervention.client_first_name}</IonLabel></IonItem>
                        <IonItem lines="none"><IonLabel>Téléphone : {intervention.client_phone}</IonLabel></IonItem>
                        <IonItem lines="none"><IonLabel>Lieu Intervention : {intervention.address}</IonLabel></IonItem>
                        <IonItem lines="none"><IonLabel>Description du problème : {intervention.description}</IonLabel></IonItem>
                        {/* <p className="ion-padding-start">{intervention.description}</p> */}
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
                                <p style={{ margin: 0 }}>Tél : {assignedAgent.phone}</p>
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

               

                {/* --- Section Devis (Quotes) --- */}
                {/* --- Section Devis --- */}
                <IonCard>
                    <IonCardContent>
                        {quotes.length === 0 && <p>Aucun devis pour cette intervention.</p>}
                        {quotes.map((q) => (
                            <IonItem key={q.id} lines="full">
                                <IonLabel>
                                    <h2>{q.description}</h2>
                                    <p>Total: <strong>{q.amount} FCFA</strong></p>
                                </IonLabel>
                                <IonButton fill="clear" onClick={() => {
                                    setCurrentQuote({
                                        id: q.id,
                                        description: q.description,
                                        amount: q.amount,
                                        valid_until: q.valid_until,
                                        items: q.items || [{ name: '', quantity: 1, unit_price: 0, total: 0 }]
                                    });
                                    setIsEditingQuote(true);
                                    setShowQuoteModal(true);
                                }}><IonIcon icon={createOutline} /></IonButton>
                                <IonButton fill="clear" color="danger" onClick={() => handleDeleteQuote(q.id!)}>
                                    <IonIcon icon={trashOutline} />
                                </IonButton>
                            </IonItem>
                        ))}
                    </IonCardContent>
                    <IonCardHeader style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <IonTitle>Devis de l'intervention</IonTitle>
                        <IonButton size="small" onClick={() => {
                            setCurrentQuote({
                                description: '',
                                amount: 0,
                                valid_until: new Date().toISOString().split('T')[0],
                                items: [{ name: '', quantity: 1, unit_price: 0, total: 0 }]
                            });
                            setIsEditingQuote(false);
                            setShowQuoteModal(true);
                        }}>Ajouter</IonButton>
                    </IonCardHeader>
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
                        Cette intervention est Clôturée.
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

            {/* --- Modale Devis --- */}
            <IonModal isOpen={showQuoteModal} onDidDismiss={() => setShowQuoteModal(false)}>
                <IonHeader>
                    <IonToolbar>
                        <IonTitle>{isEditingQuote ? 'Modifier' : 'Créer'} un devis</IonTitle>
                        <IonButtons slot="end">
                            <IonButton onClick={() => setShowQuoteModal(false)}>Annuler</IonButton>
                        </IonButtons>
                    </IonToolbar>
                </IonHeader>
                <IonContent className="ion-padding">
                    <IonItem>
                        <IonLabel position="stacked">Description générale</IonLabel>
                        <IonInput value={currentQuote.description} onIonInput={e => setCurrentQuote({...currentQuote, description: e.detail.value!})} placeholder="ex: Remplacement tableau" />
                    </IonItem>
                    <IonItem>
                        <IonLabel position="stacked">Valide jusqu'au</IonLabel>
                        <IonInput type="date" value={currentQuote.valid_until} onIonChange={e => setCurrentQuote({...currentQuote, valid_until: e.detail.value!})} />
                    </IonItem>

                    <h3 className="ion-padding-top">Éléments du devis</h3>
                    {currentQuote.items?.map((item, index) => (
                        <IonCard key={index} style={{margin: '10px 0', border: '1px solid #ddd'}}>
                            <IonCardContent>
                                <IonItem lines="none">
                                    <IonInput placeholder="Nom de l'article" value={item.name} onIonInput={e => {
                                        const newItems = [...currentQuote.items!];
                                        newItems[index].name = e.detail.value!;
                                        setCurrentQuote({...currentQuote, items: newItems});
                                    }} />
                                </IonItem>
                                <div style={{display: 'flex'}}>
                                    <IonItem lines="none" style={{flex: 1}}>
                                        <IonLabel position="stacked">Qté</IonLabel>
                                        <IonInput type="number" value={item.quantity} onIonInput={e => {
                                            const newItems = [...currentQuote.items!];
                                            newItems[index].quantity = parseInt(e.detail.value!);
                                            setCurrentQuote({...currentQuote, items: newItems});
                                        }} />
                                    </IonItem>
                                    <IonItem lines="none" style={{flex: 2}}>
                                        <IonLabel position="stacked">Prix Unitaire</IonLabel>
                                        <IonInput type="number" value={item.unit_price} onIonInput={e => {
                                            const newItems = [...currentQuote.items!];
                                            newItems[index].unit_price = parseFloat(e.detail.value!);
                                            setCurrentQuote({...currentQuote, items: newItems});
                                        }} />
                                    </IonItem>
                                </div>
                            </IonCardContent>
                        </IonCard>
                    ))}
                    
                    <IonButton fill="outline" expand="block" size="small" onClick={() => {
                        setCurrentQuote({...currentQuote, items: [...currentQuote.items!, {name: '', quantity: 1, unit_price: 0, total: 0}]});
                    }}>
                        + Ajouter un article
                    </IonButton>

                    <IonButton expand="block" className="ion-margin-top" onClick={handleSaveQuote} disabled={isLoading}>
                        Enregistrer le devis ({calculateTotal(currentQuote.items || [])} FCFA)
                    </IonButton>
                </IonContent>
            </IonModal>

        </IonPage>
    );
};

export default ManagerInterventionDetails;