// src/pages/AgentDashboard.tsx

import React, { useState, useEffect, useMemo } from 'react';
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

interface ApiIntervention {
  id: number;
  description: string;
  address: string;
  created_at: string;
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
    clientName: api.client?.name ?? 'Client',
    phone: api.client?.phone ?? '',
    coords:
      api.latitude && api.longitude
        ? { lat: api.latitude, lng: api.longitude }
        : undefined,
    status: api.status
  });

  // ------------------------ FETCH ------------------------
  const fetchInterventions = async () => {
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
  };

  useEffect(() => {
    fetchInterventions();
  }, []);

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

  // ------------------------ LOGIQUE DES ACTIONS ------------------------
  const handleStatusUpdate = async (id: number, newStatus: string) => {
    let success = false;

    switch (newStatus) {
      case 'accepted':
        success = await updateStatusOnServer(id, 'accept', {
          estimated_arrival_time: 15,
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
          <IonButtons slot="start">
            <IonButton onClick={fetchInterventions} disabled={isLoading}>
              Rafraîchir
            </IonButton>
          </IonButtons>
          <IonTitle>Interventions Électriques</IonTitle>
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
