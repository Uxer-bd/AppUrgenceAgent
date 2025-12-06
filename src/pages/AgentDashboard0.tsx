// src/pages/AgentDashboard.tsx

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  IonContent,
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonSegment,
  IonSegmentButton,
  IonLabel,
  IonBadge,
  IonButtons,
  IonButton,
  IonLoading,
  useIonToast,
  IonModal,
} from '@ionic/react';

import InterventionCard from '../components/InterventionCard';
import InterventionDetail from '../components/InterventionDetail';
import { Intervention } from '../type';
import { useAuth } from '../components/logout';
import { IonIcon } from '@ionic/react';
import { logOutSharp } from 'ionicons/icons';

interface ApiIntervention {
  id: number;
  description: string;
  address: string;
  created_at: string;
  client_first_name : string;
  client_phone : string;
  client: { name: string; phone: string } | null;
  latitude: number | null;
  longitude: number | null;
  status: 'assigned' | 'accepted' | 'in_progress' | 'completed';
}

interface ApiResponse {
  data: ApiIntervention[];
  message?: string;
}

const AgentDashboard: React.FC = () => {
  const [interventions, setInterventions] = useState<Intervention[]>([]);
  const [selectedTab, setSelectedTab] =
    useState<'pending' | 'accepted_group' | 'completed'>('pending');

  const [selectedIntervention, setSelectedIntervention] =
    useState<Intervention | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [present] = useIonToast();

  const API_URL = 'https://intervention.tekfaso.com/api/agent/interventions';
  const TOKEN = localStorage.getItem('access_token');

  // ------------------------ MAP API → APP ------------------------
  const mapApiToIntervention = (api: ApiIntervention): Intervention => ({
    id: api.id,
    description: api.description,
    address: api.address,
    createdAt: api.created_at,
    client_first_name: api.client_first_name ?? 'Client',
    client_phone: api.client_phone ?? '',
    coords:
      api.latitude && api.longitude
        ? { lat: api.latitude, lng: api.longitude }
        : undefined,
    status: api.status
  });

  // ------------------------ FETCH ------------------------
  const fetchInterventions = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(API_URL, {
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${TOKEN}`,
        },
      });

      const data: ApiResponse = await response.json();
      if (!response.ok) throw new Error(data.message ?? 'Erreur serveur');

      setInterventions(data.data.map(mapApiToIntervention));
    } catch (err) {
      present({ message: (err as Error).message, duration: 2000, color: 'danger' });
    } finally {
      setIsLoading(false);
    }
  }, [API_URL, TOKEN, present]);

  // ------------------------ RAFRAICHISSEMENT AUTOMATIQUE ------------------------

  useEffect(() => {
      fetchInterventions();
    }, []);

    useEffect(() => {
    if (selectedIntervention) return; // Stop refresh si l’utilisateur est en train de travailler

    fetchInterventions();

    const interval = setInterval(() => {
      fetchInterventions();
    }, 30000);

    return () => clearInterval(interval);
  }, [selectedIntervention]);

  // ------------------------ COUNTS ------------------------
  const counts = useMemo(
    () => ({
      pending: interventions.filter((i) => i.status === 'assigned').length,
      accepted_group: interventions.filter(
        (i) => i.status === 'accepted' || i.status === 'in_progress'
      ).length,
      completed: interventions.filter((i) => i.status === 'completed').length,
    }),
    [interventions]
  );

  // ------------------------ FILTERED LIST ------------------------
  const filteredInterventions = useMemo(() => {
    switch (selectedTab) {
      case 'pending':
        return interventions.filter((i) => i.status === 'assigned');

      case 'accepted_group':
        return interventions.filter(
          (i) => i.status === 'accepted' || i.status === 'in_progress'
        );

      case 'completed':
        return interventions.filter((i) => i.status === 'completed');

      default:
        return interventions;
    }
  }, [interventions, selectedTab]);

  // ------------------------ UPDATE API ------------------------
  const updateStatusOnServer = async (
    id: number,
    action: 'accept' | 'start' | 'complete',
    payload?: Record<string, unknown>
  ) => {
    try {
      const response = await fetch(
        `https://intervention.tekfaso.com/api/agent/interventions/${id}/${action}`,
        {
          method: 'POST',
          headers: {
            Accept: 'application/json',
            Authorization: `Bearer ${TOKEN}`,
            'Content-Type': 'application/json',
          },
          body: payload ? JSON.stringify(payload) : undefined,
        }
      );

      const data = await response.json();
      if (!response.ok) throw new Error(data.message ?? 'Action impossible');

      present({ message: data.message, duration: 2000, color: 'success' });
      return true;
    } catch (err) {
      present({ message: (err as Error).message, duration: 2000, color: 'danger' });
      return false;
    }
  };

  // ------------------------ UPDATE LOCAL ------------------------
  const updateInterventionLocal = (id: number, changes: Partial<Intervention>) => {
    setInterventions((prev) =>
      prev.map((i) => (i.id === id ? { ...i, ...changes } : i))
    );

    if (selectedIntervention?.id === id) {
      setSelectedIntervention({ ...selectedIntervention, ...changes });
    }
  };

  // fonction de calcul de temps estimé d'arrivée
  const computeEstimatedArrivalTime = (minutes: number): string => {
    const now = new Date();
    now.setMinutes(now.getMinutes() + minutes);

    // Format : YYYY-MM-DD HH:mm:ss
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutesStr = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');

    return `${year}-${month}-${day} ${hours}:${minutesStr}:${seconds}`;
  };

  const { logout } = useAuth();

  // ------------------------ LOGIQUE DES ACTIONS ------------------------
  const handleStatusUpdate = async (id: number, newStatus: string) => {
    let success = false;

    switch (newStatus) {
      case 'accepted':
        success = await updateStatusOnServer(id, 'accept', {
          estimated_arrival_time: computeEstimatedArrivalTime(30),
        });
        break;

      case 'in_progress':
        success = await updateStatusOnServer(id, 'start');
        break;

      case 'completed':
        success = await updateStatusOnServer(id, 'complete', {
          work_description: "string",
          resolution_notes: "string",
          parts_used: "string",
        });
        break;
    }

    if (success)
      updateInterventionLocal(id, {
        status: newStatus as 'assigned' | 'accepted' | 'in_progress' | 'completed',
      });
  };

  // ------------------------ UI ------------------------
  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          {/* <IonButtons slot="start">
            <IonButton onClick={fetchInterventions} disabled={isLoading}>
              Rafraîchir
            </IonButton>
          </IonButtons> */}
          <IonTitle>Interventions Électriques</IonTitle>
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

        <IonToolbar>
          <IonSegment
            value={selectedTab}
            onIonChange={(e) =>
              setSelectedTab(e.detail.value as 'pending' | 'accepted_group' | 'completed')
            }
          >
            <IonSegmentButton value="pending">
              <IonLabel>En attente</IonLabel>
              {counts.pending > 0 && <IonBadge color="danger">{counts.pending}</IonBadge>}
            </IonSegmentButton>

            <IonSegmentButton value="accepted_group">
              <IonLabel>Acceptées</IonLabel>
              {counts.accepted_group > 0 && (
                <IonBadge color="warning">{counts.accepted_group}</IonBadge>
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

      <IonContent fullscreen className="ion-padding">
        <IonLoading isOpen={isLoading} message="Chargement..." />

        {filteredInterventions.length === 0 && !isLoading ? (
          <div style={{ textAlign: 'center', marginTop: '40px', color: '#777' }}>
            Aucune intervention trouvée.
          </div>
        ) : (
          filteredInterventions.map((inter) => (
            <InterventionCard
              key={inter.id}
              intervention={inter}
              onViewDetails={() => setSelectedIntervention(inter)}
              onStatusChange={handleStatusUpdate}
            />
          ))
        )}
      </IonContent>

      <IonModal
        isOpen={!!selectedIntervention}
        onDidDismiss={() => setSelectedIntervention(null)}
      >
        <InterventionDetail
          intervention={selectedIntervention}
          onClose={() => setSelectedIntervention(null)}
          onStatusChange={handleStatusUpdate}
          onMarkAsTerminated={(id) => handleStatusUpdate(id, 'completed')}
        />
      </IonModal>
    </IonPage>
  );
};

export default AgentDashboard;
