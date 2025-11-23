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

const AgentDashboard: React.FC = () => {
  const [interventions, setInterventions] = useState<Intervention[]>([]);
  const [selectedTab, setSelectedTab] =
    useState<'en-attente' | 'acceptee' | 'terminee'>('en-attente');
  const [selectedIntervention, setSelectedIntervention] =
    useState<Intervention | null>(null);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [present] = useIonToast();

  const API_URL = 'https://intervention.tekfaso.com/api/agent/interventions';
  const TOKEN = localStorage.getItem('access_token');

  // -----------------------------------------------------------
  // 🔄 1) Convertit les données API -> format InterventionCard
  // -----------------------------------------------------------
  const mapApiToIntervention = (api: any): Intervention => ({
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

    status:
      api.status === 'pending'
        ? 'en-attente'
        : api.status === 'completed' || api.status === 'closed'
        ? 'terminee'
        : 'acceptee',

    subStatus:
      api.status === 'in-progress'
        ? 'en-route'
        : api.status === 'arrived'
        ? 'arrive'
        : undefined,
  });

  // -----------------------------------------------------------
  // 🔄 2) Récupération API
  // -----------------------------------------------------------
  const fetchInterventions = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(API_URL, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${TOKEN}`,
        },
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Erreur lors du chargement.');
      }

      const mapped = data.data.map(mapApiToIntervention);
      setInterventions(mapped);
    } catch (error: any) {
      present({ message: error.message, duration: 2000, color: 'danger' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInterventions();
  }, []);

  // -----------------------------------------------------------
  // 🧮 3) Filtrage et compteurs
  // -----------------------------------------------------------
  const counts = useMemo(
    () => ({
      'en-attente': interventions.filter((i) => i.status === 'en-attente').length,
      acceptee: interventions.filter((i) => i.status === 'acceptee').length,
      terminee: interventions.filter((i) => i.status === 'terminee').length,
    }),
    [interventions]
  );

  const filteredInterventions = useMemo(
    () => interventions.filter((i) => i.status === selectedTab),
    [interventions, selectedTab]
  );

  // -----------------------------------------------------------
  // 🔧 4) Fonction générique API pour changer le statut
  // -----------------------------------------------------------
  const updateStatusOnServer = async (
    id: number,
    action: 'accept' | 'start' | 'arrived' | 'complete',
    payload?: Record<string, any>
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

      if (!response.ok) {
        throw new Error(data.message || 'Erreur API');
      }

      present({ message: data.message, duration: 2000, color: 'success' });
      return true;
    } catch (error: any) {
      present({ message: error.message, duration: 2000, color: 'danger' });
      return false;
    }
  };

  // -----------------------------------------------------------
  // 🔧 5) Mise à jour locale (UI)
  // -----------------------------------------------------------
  const updateInterventionLocal = (
    id: number,
    changes: Partial<Intervention>
  ) => {
    setInterventions((prev) =>
      prev.map((i) => (i.id === id ? { ...i, ...changes } : i))
    );

    if (selectedIntervention?.id === id) {
      setSelectedIntervention({ ...selectedIntervention, ...changes });
    }
  };

  // -----------------------------------------------------------
  // 🟢 6) Handle Status principal (acceptée / terminée)
  // -----------------------------------------------------------
  const handleStatusUpdate = async (id: number, newStatus: Intervention['status']) => {
    let success = false;

    if (newStatus === 'acceptee') {
      success = await updateStatusOnServer(id, 'accept', {
        estimated_arrival_time: 15,
      });
    }

    if (newStatus === 'terminee') {
      success = await updateStatusOnServer(id, 'complete');
    }

    if (success) updateInterventionLocal(id, { status: newStatus });
  };

  // -----------------------------------------------------------
  // 🟠 7) Handle Sub-Status (en route / arrivé)
  // -----------------------------------------------------------
  const handleSubStatusUpdate = async (
    id: number,
    newSubStatus: NonNullable<Intervention['subStatus']>
  ) => {
    let success = false;

    if (newSubStatus === 'en-route') {
      success = await updateStatusOnServer(id, 'start');
    }

    if (newSubStatus === 'arrive') {
      success = await updateStatusOnServer(id, 'arrived');
    }

    if (success) updateInterventionLocal(id, { subStatus: newSubStatus });
  };

  // -----------------------------------------------------------
  // 🔴 8) Handle Terminé depuis le modal
  // -----------------------------------------------------------
  const handleMarkTerminated = async (id: number) => {
    const ok = await updateStatusOnServer(id, 'complete');
    if (ok) {
      updateInterventionLocal(id, { status: 'terminee', subStatus: undefined });
    }
  };

  // -----------------------------------------------------------
  // 🖥️ 9) UI
  // -----------------------------------------------------------
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
              setSelectedTab(e.detail.value as 'en-attente' | 'acceptee' | 'terminee')
            }
          >
            <IonSegmentButton value="en-attente">
              <IonLabel>En attente</IonLabel>
              {counts['en-attente'] > 0 && (
                <IonBadge color="danger">{counts['en-attente']}</IonBadge>
              )}
            </IonSegmentButton>

            <IonSegmentButton value="acceptee">
              <IonLabel>Acceptées</IonLabel>
              {counts.acceptee > 0 && (
                <IonBadge color="success">{counts.acceptee}</IonBadge>
              )}
            </IonSegmentButton>

            <IonSegmentButton value="terminee">
              <IonLabel>Terminées</IonLabel>
              {counts.terminee > 0 && (
                <IonBadge color="medium">{counts.terminee}</IonBadge>
              )}
            </IonSegmentButton>
          </IonSegment>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen className="ion-padding">
        <IonLoading isOpen={isLoading} message="Chargement..." />

        {filteredInterventions.length === 0 && !isLoading ? (
          <div style={{ textAlign: 'center', color: '#777', marginTop: '40px' }}>
            Aucune intervention trouvée.
          </div>
        ) : (
          filteredInterventions.map((inter) => (
            <InterventionCard
              key={inter.id}
              intervention={inter}
              onViewDetails={() => setSelectedIntervention(inter)}
              onStatusChange={handleStatusUpdate}
              onSubStatusChange={handleSubStatusUpdate}
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
          onMarkAsTerminated={handleMarkTerminated}
        />
      </IonModal>
    </IonPage>
  );
};

export default AgentDashboard;
