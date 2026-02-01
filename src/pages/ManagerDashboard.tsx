// src/pages/ManagerDashboard.tsx
import React, { useState, useEffect} from 'react';
import {
    IonContent, IonPage, IonHeader, IonToolbar, IonTitle, IonSegment, IonSegmentButton, 
    IonLabel, IonBadge, IonButtons, IonButton, IonIcon, IonLoading, IonItem,
    IonNote,IonGrid, IonRow, IonCol, IonInfiniteScroll, IonInfiniteScrollContent, useIonToast
} from '@ionic/react';
import { useHistory } from 'react-router-dom';
import { logOutSharp, personCircleSharp, refreshOutline, listOutline } from 'ionicons/icons'; 
import { useAuth } from '../components/logout';
import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';

// Définition des types basés sur votre API Manager
type ManagerTab = 'pending' | 'assigned' | 'completed';

interface Intervention {
    id: number;
    reference: string;
    description: string;
    address: string;
    client_phone: string;
    priority_level: 'low' | 'medium' | 'high';
    // Les statuts API réels
    status: 'pending' | 'accepted' | 'in-progress' | 'completed' | 'closed' | 'refused'; 
    created_at: string;
    client_first_name: string; 
    assigned_agent?: { name: string; id: number; } | null;
}

const TAB_STATUS_MAP: Record<ManagerTab, string[]> = {
    pending: ['pending', 'refused'],
    assigned: ['accepted', 'assigned', 'in-progress'],
    completed: ['completed', 'closed'],
};

const ManagerDashboard: React.FC = () => {
    const [interventions, setInterventions] = useState<Intervention[]>([]);
    const [selectedTab, setSelectedTab] = useState<ManagerTab>('pending');
    const [isLoading, setIsLoading] = useState(true);
    const [present] = useIonToast();
    const history = useHistory();
    const [currentPage, setCurrentPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);

    
    // Constantes d'API
    const API_URL = "https://api.depannel.com/api/manager/interventions";
    const TOKEN = localStorage.getItem('access_token');
    // const USER_ROLE = localStorage.getItem('user_role');

    // --- LOGIQUE DE FILTRAGE ET COMPTEURS ---

    const [counts, setCounts] = useState({ pending: 0, assigned: 0, completed: 0 });

    const interventionsToDisplay = interventions.filter(inter =>
        TAB_STATUS_MAP[selectedTab].includes(inter.status)
    );

    // const prevPendingCount = React.useRef<number | null>(null);

    const triggerNotification = async (count: number) => {
        const title = count > 1 ? "🚨 Nouvelles demandes !" : "🚨 Nouvelle demande !";
        const body = count > 1 
            ? `${count} interventions sont en attente.` 
            : "Une nouvelle demande nécessite votre attention.";

        if (Capacitor.isNativePlatform()) {
            try {
                await LocalNotifications.schedule({
                    notifications: [{
                        title, body, id: 1,
                        smallIcon: 'ic_stat_name',
                        channelId: 'depannel-manager-v3',
                        schedule: { at: new Date(Date.now() + 500) },
                    }]
                });
            } catch (e) { console.error("Erreur Push:", e); }
        } else {
            try {
                const audio = new Audio('https://notificationsounds.com/storage/sounds/file-sounds-1150-pristine.mp3');
                audio.play().catch(() => console.warn("Cliquez sur la page pour activer le son"));
            } catch (e) { console.error("Erreur Audio PC:", e); }
        }
    };

    useEffect(() => {
        const initNotify = async () => {
            if (Capacitor.isNativePlatform()) {
                const perm = await LocalNotifications.requestPermissions();
                if (perm.display === 'granted') {
                    // Création d'un nouveau canal V3 (Android bloque les modifs sur un canal existant)
                    await LocalNotifications.createChannel({
                        id: 'depannel-manager-v3',
                        name: 'Alertes Urgentes',
                        importance: 5, // Priorité maximale (Heads-up)
                        sound: 'default',
                        vibration: true,
                        visibility: 1
                    });
                }
            }
        };
        initNotify();
    }, []);

    // État pour stocker le dernier compte connu (à mettre au début du composant)
    const [lastTotalPending, setLastTotalPending] = useState<number | null>(null);

    const checkNewInterventions = (currentPending: number) => {
        if (lastTotalPending === null) {
            setLastTotalPending(currentPending);
            return;
        }
        if (currentPending > lastTotalPending) {
            const diff = currentPending - lastTotalPending;
            triggerNotification(diff);
            present({
                message: `🔔 ${diff} nouvelle(s) demande(s) !`,
                duration: 5000,
                color: 'danger',
                position: 'top',
                buttons: [{ text: 'VOIR', handler: () => setSelectedTab('pending') }]
            });
        }
        setLastTotalPending(currentPending);
    };

    const fetchStats = async () => {
        try {
            const response = await fetch("https://api.depannel.com/api/manager/interventions/stats", {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${TOKEN}`,
                },
            });
            const result = await response.json();

            const stats = result.by_status;
            checkNewInterventions(stats.pending || 0);
            setCounts({
                pending: (stats.pending || 0),
                assigned: (stats.assigned || 0) + (stats.accepted || 0) + (stats.in_progress || 0),
                completed: (stats.completed || 0) + (stats.closed || 0)
            });
        } catch (error) {
            console.error("Erreur stats:", error);
        }
    };

    // --- FONCTIONS DE FETCH ET UTILITAIRES ---
    const fetchInterventions = async (page: number, isRefresh: boolean = false, isAutoRefresh: boolean = false) => {
        if (isRefresh) setIsLoading(true);

        let url = `${API_URL}?page=${page}`;

        if (selectedTab === 'assigned') {
            url += `&status[]=accepted&status[]=in-progress&status[]=assigned`;
        } else {
            url += `&status=${selectedTab}`;
        }

        try {
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${TOKEN}`,
                },
            });

            if (!response.ok) throw new Error('Échec du chargement');

            const responseData = await response.json();
            const newData = responseData.data || [];
            
            // Si c'est un refresh ou la page 1, on remplace tout. Sinon, on concatène.
            setInterventions(prev => {
                if (page === 1) {
                    // --- RAFRAÎCHISSEMENT SILENCIEUX (Page 1) ---
                    // On garde les éléments des pages suivantes (2, 3...)
                    // et on met à jour uniquement la page 1 sans doublons.
                    const otherPagesData = prev.filter((oldItem: Intervention) => 
                        !newData.find((newItem: Intervention) => newItem.id === oldItem.id)
                    );
                    return [...newData, ...otherPagesData];
                } else {
                    // --- PAGINATION (Pages 2, 3...) ---
                    // On ajoute les nouveaux éléments à la fin de la liste existante
                    const uniqueNewData = newData.filter((newItem: Intervention) => 
                        !prev.find((oldItem: Intervention) => oldItem.id === newItem.id)
                    );
                    return [...prev, ...uniqueNewData];
                }
            });

            // Vérification de la page suivante via l'objet de pagination de ton API
            setHasMore(responseData.next_page_url !== null);

        } catch (error) {
            console.error("Erreur API Manager:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchInterventions(1, true, false);
        fetchStats();

        const interval = setInterval(() => {
            fetchInterventions(1, false);
            fetchStats();
        }, 30000);

        return () => clearInterval(interval);
    }, [selectedTab]);

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

    return (
        <IonPage>
            <IonHeader>
                <IonToolbar color="primary" style={{ height:'40px' }}>
                    <IonButtons slot="start">
                    <IonButton onClick={() => fetchInterventions(1)}>
                        <IonIcon icon={refreshOutline} slot="icon-only" />
                    </IonButton>
                    </IonButtons>
                    
                    <IonTitle>Depannel Manager</IonTitle>
                    
                    <IonButtons slot="end" color='white'>
                        <IonButton onClick={() => logout()} style={{ '--color': 'white' }}>
                            <IonIcon icon={logOutSharp} slot="icon-only" />
                        </IonButton>
                    </IonButtons>
                </IonToolbar>

                {/* Ligne 2 : Bouton Mes Agents (plus large et cliquable) */}
                <IonToolbar color="primary" className="ion-no-border">
                    <IonGrid className="ion-no-padding">
                        <IonRow>
                        <IonCol size="6" className="ion-no-padding">
                            <IonButton 
                            fill="clear" 
                            expand="full" 
                            color="light" 
                            onClick={() => history.push('/manager/agent/liste/')}
                            style={{ fontSize: '0.85em', margin: 0 }}
                            >
                            <IonIcon icon={personCircleSharp} slot="start" />
                            Gérer les agents
                            </IonButton>
                        </IonCol>
                        
                        <IonCol size="6" className="ion-no-padding" style={{ borderLeft: '1px solid rgba(255,255,255,0.2)' }}>
                            <IonButton 
                            fill="clear" 
                            color="light" 
                            expand="full"
                            onClick={() => history.push('/manager/problem-types')}
                            style={{ fontSize: '0.85em', margin: 0 }}
                            >
                            <IonIcon icon={listOutline} slot="start" />
                            Types problèmes
                            </IonButton>
                        </IonCol>
                        </IonRow>
                    </IonGrid>
                    </IonToolbar>

                {/* --- SEGMENTS (ONGLETS) --- */}
                <IonToolbar>
                    <IonSegment
                        value={selectedTab}
                        onIonChange={(e) =>
                        setSelectedTab(e.detail.value as 'pending' | 'assigned' | 'completed')
                        }
                    >
                        <IonSegmentButton value="pending">
                        <IonLabel>En attente</IonLabel>
                        {counts.pending > 0 && <IonBadge color="danger">{counts.pending}</IonBadge>}
                        </IonSegmentButton>

                        <IonSegmentButton value="assigned">
                        <IonLabel>Assignées</IonLabel>
                        {counts.assigned > 0 && (
                            <IonBadge color="warning">{counts.assigned}</IonBadge>
                        )}
                        </IonSegmentButton>

                        <IonSegmentButton value="completed">
                        <IonLabel>Terminées</IonLabel>
                        {counts.completed > 0 && (
                            <IonBadge color="success">{counts.completed}</IonBadge>
                        )}
                        </IonSegmentButton>
                    </IonSegment>
                </IonToolbar>
            </IonHeader>

            <IonContent fullscreen className="ion-padding" style={{ '--background': '#f4f5f8' }}>
                <IonLoading isOpen={isLoading} message={'Chargement...'} />

                {interventionsToDisplay.length === 0 && !isLoading ? (
                    <div style={{ textAlign: 'center', color: '#888', marginTop: '50px' }}>
                        <p>Aucune intervention dans cette catégorie.</p>
                    </div>
                ) : (
                    <div style={{ paddingTop: '10px' }}>
                        {interventionsToDisplay.map(inter => (
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
                                    <p>Contact du client : {inter.client_phone}</p>
                                    <p>Assigné à : {inter.assigned_agent ? inter.assigned_agent.name : 'Non assigné'}</p>
                                    <p style={{ marginTop: '5px', color: '#018101ff', fontSize: '0.85em' }}>
                                        Statut : {getStatusLabel(inter.status)}
                                    </p>
                                </IonLabel>
                            </IonItem>
                        ))}
                    </div>
                )}

                <IonInfiniteScroll
                    disabled={!hasMore}
                    threshold="100px"
                    onIonInfinite={async (e) => {
                        const nextPage = currentPage + 1;
                        await fetchInterventions(nextPage, false); // false pour ne pas montrer le gros loader
                        setCurrentPage(nextPage);
                        e.target.complete();
                    }}
                >
                    <IonInfiniteScrollContent 
                        loadingSpinner="bubbles" 
                        loadingText="Chargement des interventions suivantes..." 
                    />
                </IonInfiniteScroll>
            </IonContent>
        </IonPage>
    );
};

export default ManagerDashboard;