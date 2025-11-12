// src/pages/ManagerDashboard.tsx

import React, { useState, useEffect } from 'react';
import { 
    IonPage, IonContent, IonHeader, IonToolbar, IonTitle, IonLoading, useIonToast, 
    IonList, IonItem, IonLabel, IonNote, IonButtons, IonButton, 
    IonIcon // Importation du composant IonIcon
} from '@ionic/react';
import { useHistory } from 'react-router-dom';
import { 
    personAddOutline, // Icône pour la création d'agent
    refreshOutline
} from 'ionicons/icons';

// Définition de l'interface des interventions (vue Manager)
interface Intervention {
    id: number;
    reference: string;
    status: 'pending' | 'accepted' | 'in-progress' | 'completed' | 'closed';
    address: string;
    description: string;
    priority_level: 'low' | 'medium' | 'high';
    client: {
        name: string;
    };
    assigned_agent?: {
        name: string;
    } | null;
}

const ManagerDashboard: React.FC = () => {
    const [interventions, setInterventions] = useState<Intervention[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [present] = useIonToast();
    const history = useHistory();
    
    // Constantes d'API et de Token
    const API_URL = "https://intervention.tekfaso.com/api/interventions"; // Endpoint pour TOUTES les interventions (Manager View)
    const TOKEN = localStorage.getItem('access_token');
    const USER_ROLE = localStorage.getItem('user_role');

    // Fonction pour charger TOUTES les interventions
    const fetchAllInterventions = async () => {
        setIsLoading(true);

        // Vérification de sécurité et d'autorisation
        if (!TOKEN || USER_ROLE !== 'manager') {
            present({ message: 'Accès Manager non autorisé. Veuillez vous connecter.', duration: 3000, color: 'danger' });
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
                if (response.status === 401) {
                    throw new Error('Session expirée. Veuillez vous reconnecter.');
                }
                const errorData = await response.json();
                throw new Error(errorData.message || 'Échec du chargement des interventions.');
            }

            const responseData = await response.json();
            // On suppose que l'API renvoie la liste complète dans responseData.data (ou directement responseData)
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
    }, []);
    
    // Fonction utilitaire pour la couleur du statut
    const getStatusColor = (status: string) => {
        switch (status) {
            case 'pending': return 'warning'; // En attente (Jaune)
            case 'accepted': 
            case 'in-progress': return 'primary'; // En cours (Bleu)
            case 'completed': 
            case 'closed': return 'success'; // Terminée/Clôturée (Vert)
            default: return 'medium'; // Gris
        }
    }
    
    // Fonction utilitaire pour la couleur de la priorité
    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'high': return 'danger';
            case 'medium': return 'warning';
            default: return 'success';
        }
    };


    return (
        <IonPage>
            <IonHeader>
                <IonToolbar color="primary">
                    <IonTitle>Tableau de Bord Manager</IonTitle>
                    <IonButtons slot="end">
                        <IonButton 
                            onClick={() => history.push('/manager/create-agent')}
                            color="light"
                        >
                            <IonIcon icon={personAddOutline} slot="start" />
                            Agent
                        </IonButton>
                        <IonButton onClick={fetchAllInterventions} color="light">
                            <IonIcon icon={refreshOutline} />
                        </IonButton>
                    </IonButtons>
                </IonToolbar>
            </IonHeader>
            <IonContent fullscreen className="ion-padding">
                <IonLoading isOpen={isLoading} message={'Chargement de toutes les interventions...'} />
                
                {interventions.length === 0 && !isLoading && (
                    <p>Aucune intervention n'a été signalée pour l'instant.</p>
                )}

                <IonList>
                    {interventions.map(inter => (
                        <IonItem key={inter.id} detail={true} routerLink={`/manager/intervention/${inter.id}`}>
                            <IonLabel>
                                <h2 style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    {/* 💡 Affiche la Référence et la Priorité */}
                                    {inter.reference} 
                                    <IonNote color={getPriorityColor(inter.priority_level)} style={{ fontWeight: 'bold' }}>
                                        {inter.priority_level.toUpperCase()}
                                    </IonNote>
                                </h2>
                                {/* Affiche le nom du Client */}
                                <p>Client : {inter.client.name}</p>
                                <p>Adresse : {inter.address}</p>
                                <p>Description : {inter.description}</p>
                                {/* Affiche l'Agent assigné via assigned_agent */}
                                <p>Assigné à : {inter.assigned_agent ? inter.assigned_agent.name : 'Non assigné'} </p>
                            </IonLabel>
                            <IonNote slot="end" color={getStatusColor(inter.status)}>
                                {inter.status.toUpperCase()}
                            </IonNote>
                        </IonItem>
                    ))}
                </IonList>
            </IonContent>
        </IonPage>
    );
};

export default ManagerDashboard;