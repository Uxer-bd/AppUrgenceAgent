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

const ManagerDashboard: React.FC = () => {
    const [interventions, setInterventions] = useState<Intervention[]>([]);
    const [selectedTab, setSelectedTab] = useState<ManagerTab>('pending');
    const [isLoading, setIsLoading] = useState(true);
    const [present] = useIonToast();
    const history = useHistory();
    
    // Constantes d'API
    const API_URL = "https://api.depannel.com/api/manager/interventions";
    const TOKEN = localStorage.getItem('access_token');
    // const USER_ROLE = localStorage.getItem('user_role');

    // --- LOGIQUE DE FILTRAGE ET COMPTEURS ---

    // Fonction pour mapper les statuts API aux onglets Manager
    const mapStatusToTab = (status: Intervention['status']): ManagerTab => {
        if (status === 'pending' || status === 'refused') return 'pending';
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

    const prevPendingCount = React.useRef<number | null>(null);

    // --- FONCTIONS DE FETCH ET UTILITAIRES ---
    const fetchAllInterventions = async (isBackground = false) => {
        if (!isBackground) setIsLoading(true);
        try {
            const response = await fetch(API_URL, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${TOKEN}`,
                },
            });

            if (!response.ok) throw new Error('Échec du chargement');

            const responseData = await response.json();
            const newData = responseData.data || responseData || [];

            // 1. On filtre pour ne compter QUE les interventions "pending" (en attente d'assignation)
            const currentPendingCount = newData.filter((i: Intervention) => i.status === 'pending' || i.status === 'refused').length;

            // 2. LOGIQUE D'ALERTE : Uniquement si le nombre de "pending" augmente
            if (prevPendingCount.current !== null && currentPendingCount > prevPendingCount.current) {

                const title = "Action requise !";
                const body = `Il y a ${currentPendingCount} intervention(s) en attente d'assignation.`;

                // Signal Sonore
                const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
                audio.play().catch(() => console.log("Audio bloqué"));

                // Notification Mobile
                if (Capacitor.isNativePlatform()) {
                    await LocalNotifications.schedule({
                        notifications: [{ title, body, id: Date.now(), schedule: { at: new Date(Date.now() + 500) } }]
                    });
                }
                // Notification Web
                else if ("Notification" in window && Notification.permission === "granted") {
                    new Notification(title, { body, icon: '/assets/icon/favicon.png' });
                }

                present({ message: `🔔 ${title}`, duration: 5000, color: 'success' });
            }

            // 3. IMPORTANT : On met à jour la référence avec le nouveau nombre
            prevPendingCount.current = currentPendingCount;
            setInterventions(newData);

        } catch (error: unknown) {
            if (!isBackground) {
                const errorMessage = error instanceof Error ? error.message : 'Une erreur est survenue';
                present({ message: errorMessage, duration: 3000, color: 'danger' });
            }
        } finally {
            setIsLoading(false);
        }
    };

        useEffect(() => {
        // Premier chargement
        fetchAllInterventions();

        const interval = setInterval(() => {
            fetchAllInterventions(true); // true = pas de loader visuel
        }, 30000); // 30 secondes pour les managers

        return () => clearInterval(interval);
    }, []);


    useEffect(() => {
        const askPerms = async () => {
            if (Capacitor.isNativePlatform()) {
                await LocalNotifications.requestPermissions();
            } else if ("Notification" in window) {
                await Notification.requestPermission();
            }
        };
        askPerms();
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

    return (
        <IonPage>
            <IonHeader>
                <IonToolbar color="primary">
                    <IonButtons slot="start">
                    <IonButton onClick={() => fetchAllInterventions()}>
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
                    <IonButton 
                    fill="clear" 
                    expand="full" 
                    color="light" 
                    onClick={() => history.push('/manager/agent/liste/')}
                    style={{ fontSize: '0.9em' }}
                    >
                    <IonIcon icon={personCircleSharp} slot="start" />
                    Gérer mes agents
                    </IonButton>
                </IonToolbar>

                {/* --- SEGMENTS (ONGLETS) --- */}
                <IonToolbar>
                    <IonSegment value={selectedTab} onIonChange={e => setSelectedTab(e.detail.value as ManagerTab)}>
                        <IonSegmentButton value="pending">
                            <IonLabel>En attente</IonLabel>
                            {counts['pending'] >= 0 && <IonBadge color="danger">{counts['pending'] || 0}</IonBadge>}
                        </IonSegmentButton>
                        <IonSegmentButton value="assigned">
                            <IonLabel>Assignées</IonLabel>
                            {counts['assigned'] >= 0 && <IonBadge color="success">{counts['assigned'] || 0}</IonBadge>}
                        </IonSegmentButton>
                        <IonSegmentButton value="completed">
                            <IonLabel>Terminées</IonLabel>
                            {counts['completed'] >= 0 && <IonBadge color="medium">{counts['completed'] || 0}</IonBadge>}
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
            </IonContent>
        </IonPage>
    );
};

export default ManagerDashboard;