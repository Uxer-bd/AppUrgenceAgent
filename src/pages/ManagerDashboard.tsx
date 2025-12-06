// src/pages/ManagerDashboard.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { 
    IonContent, IonPage, IonHeader, IonToolbar, IonTitle, IonSegment, IonSegmentButton, 
    IonLabel, IonBadge, IonButtons, IonButton, IonIcon, IonLoading, useIonToast, IonItem,
    IonNote,
} from '@ionic/react';
import { useHistory } from 'react-router-dom';
import { logOutSharp, personCircleSharp, refreshOutline } from 'ionicons/icons'; 
import { useAuth } from '../components/logout';

// Définition des types basés sur votre API Manager
type ManagerTab = 'pending' | 'assigned' | 'completed';

interface Intervention {
    id: number;
    reference: string;
    description: string;
    address: string;
    priority_level: 'low' | 'medium' | 'high';
    // Les statuts API réels
    status: 'pending' | 'accepted' | 'in-progress' | 'completed' | 'closed'; 
    created_at: string;
    client_first_name: string; 
    assigned_agent?: { name: string; id: number; } | null;
}

const ManagerDashboard: React.FC = () => {
    const [interventions, setInterventions] = useState<Intervention[]>([]);
    const [selectedTab, setSelectedTab] = useState<ManagerTab>('pending');
    const [isLoading, setIsLoading] = useState(true);
    const [present] = useIonToast();
    const history = useHistory();
    
    // Constantes d'API
    const API_URL = "https://intervention.tekfaso.com/api/manager/interventions";
    const TOKEN = localStorage.getItem('access_token');
    const USER_ROLE = localStorage.getItem('user_role');

    // --- LOGIQUE DE FILTRAGE ET COMPTEURS ---

    // Fonction pour mapper les statuts API aux onglets Manager
    const mapStatusToTab = (status: Intervention['status']): ManagerTab => {
        if (status === 'pending') return 'pending';
        if (status === 'completed' || status === 'closed') return 'completed';
        // accepted, in-progress, started, arrived
        return 'assigned';
    };

    const counts = useMemo(() => {
        const initial = { 'pending': 0, 'assigned': 0, 'completed': 0 };
        return interventions.reduce((acc, inter) => {
            const tab = mapStatusToTab(inter.status);
            acc[tab]++;
            return acc;
        }, initial);
    }, [interventions]);

    const filteredInterventions = useMemo(() =>
        interventions.filter(inter => mapStatusToTab(inter.status) === selectedTab),
        [interventions, selectedTab]
    );

    // --- FONCTIONS DE FETCH ET UTILITAIRES ---
    
    const fetchAllInterventions = async () => {
        setIsLoading(true);
        if (!TOKEN || USER_ROLE !== 'manager') {
            present({ message: 'Accès Manager non autorisé.', duration: 3000, color: 'danger' });
            history.replace('/login');
            setIsLoading(false);
            return;
        }

        try {
            const response = await fetch(API_URL, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${TOKEN}`,
                },
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Échec du chargement des interventions.');
            }

            const responseData = await response.json();
            setInterventions(responseData.data || responseData || []); 

        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Erreur de connexion au serveur.';
            present({ message, duration: 3000, color: 'danger' });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchAllInterventions();

        const interval = setInterval(() => {
            fetchAllInterventions();
        }, 30000); // 30 secondes

        return () => clearInterval(interval);
    }, []);
    
    // Fonction utilitaire pour la couleur
    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'high': return 'danger';
            case 'medium': return 'warning';
            default: return 'success';
        }
    };

    const { logout } = useAuth();

    const getStatusLabel = (status:string) => {
        switch (status) {
        case 'assigned': return 'Assignée';
        case 'pending': return 'Non Assignée';
        case 'accepted': return 'Acceptée';
        case 'in_progress': return 'En intervention';
        case 'completed': return 'Terminée';
        default: return status;
        }
    };

    // const getStatusColor = (status:string) => {
    //     switch (status) {
    //     case 'assigned': return 'danger';
    //     case 'accepted': return 'warning';
    //     case 'in_progress': return 'secondary';
    //     case 'completed': return 'success';
    //     }
    // };

    return (
        <IonPage>
            <IonHeader>
                <IonToolbar color="primary" style={{ '--background': '#3880ff' }}>
                    <IonButtons slot="start">
                        <IonButton onClick={fetchAllInterventions} disabled={isLoading}>
                            <IonIcon icon={refreshOutline} slot="icon-only" />
                        </IonButton>
                    </IonButtons>
                    <div style={{ paddingLeft: '10px' }}>
                        <IonTitle style={{ fontSize: '1.2em', padding: 0 }}>Gestion des Interventions</IonTitle>
                        <p style={{ margin: '0', fontSize: '0.9em', color: 'rgba(255,255,255,0.8)' }}>Tableau de Bord Manager</p>
                    </div>
                    <IonButtons slot="end"  style={{ border : '#ffff' }}>
                        <IonButton 
                            onClick={() => history.push('/manager/agent/liste/')}
                            color="light"
                        >
                            <IonIcon icon={personCircleSharp} slot="start" />
                            Mes Agents
                        </IonButton>
                    </IonButtons>
                    <IonButtons slot="end" style={{ background : '#c40000ff' }}>
                        <IonButton 
                            onClick={() => logout()}
                            color="light"
                        >
                            <IonIcon icon={ logOutSharp } slot="start" />
                            Deconnexion
                        </IonButton>
                    </IonButtons>
                </IonToolbar>
                
                {/* --- SEGMENTS (ONGLETS) --- */}
                <IonToolbar>
                    <IonSegment value={selectedTab} onIonChange={e => setSelectedTab(e.detail.value as ManagerTab)}>
                        
                        <IonSegmentButton value="pending">
                            <IonLabel>En attente</IonLabel>
                            {counts['pending'] > 0 && <IonBadge color="danger">{counts['pending']}</IonBadge>}
                        </IonSegmentButton>
                        
                        <IonSegmentButton value="assigned">
                            <IonLabel>Assignées</IonLabel>
                            {counts['assigned'] > 0 && <IonBadge color="success">{counts['assigned']}</IonBadge>}
                        </IonSegmentButton>
                        
                        <IonSegmentButton value="completed">
                            <IonLabel>Terminées</IonLabel>
                            {counts['completed'] > 0 && <IonBadge color="medium">{counts['completed']}</IonBadge>}
                        </IonSegmentButton>
                        
                    </IonSegment>
                </IonToolbar>
            </IonHeader>

            <IonContent fullscreen className="ion-padding" style={{ '--background': '#f4f5f8' }}>
                <IonLoading isOpen={isLoading} message={'Chargement...'} />

                {filteredInterventions.length === 0 && !isLoading ? (
                    <div style={{ textAlign: 'center', color: '#888', marginTop: '50px' }}>
                        <p>Aucune intervention dans cette catégorie.</p>
                    </div>
                ) : (
                    <div style={{ paddingTop: '10px' }}>
                        {filteredInterventions.map(inter => (
                            // Utilisation de IonItem pour une navigation simple vers les détails
                            <IonItem 
                                key={inter.id} 
                                detail={true} 
                                routerLink={`/manager/intervention/${inter.id}`}
                                style={{ marginBottom: '10px', borderRadius: '8px' }}
                            >
                                <IonLabel>
                                    <h2 style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        {inter.reference} 
                                        <IonNote color={getPriorityColor(inter.priority_level)} style={{ fontWeight: 'bold' }}>
                                            {inter.priority_level.toUpperCase()}
                                        </IonNote>
                                    </h2>
                                    <p>Client : {inter.client_first_name}</p> 
                                    <p>Assigné à : {inter.assigned_agent ? inter.assigned_agent.name : 'Non assigné'}</p>
                                    <p style={{ marginTop: '5px', color: '#018101ff', fontSize: '0.85em' }}>
                                        Statut : {getStatusLabel(inter.status)}
                                    </p>
                                </IonLabel>
                                
                            </IonItem>
                        ))}
                    </div>
                )}
            </IonContent>
        </IonPage>
    );
};

export default ManagerDashboard;