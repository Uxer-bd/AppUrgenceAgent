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
  IonModal,useIonAlert,
} from '@ionic/react';

import InterventionCard from '../components/InterventionCard';
import InterventionDetail from '../components/InterventionDetail';
import { Intervention } from '../type';
import { useAuth } from '../components/logout';
import { IonIcon } from '@ionic/react';
import { logOutSharp } from 'ionicons/icons';
import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';

interface ApiIntervention {
  id: number;
  description: string;
  address: string;
  created_at: string;
  client_first_name : string;
  title: string;
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
  const [presentAlert] = useIonAlert();

  const [selectedIntervention, setSelectedIntervention] =
    useState<Intervention | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [present] = useIonToast();

  const API_URL = 'https://api.depannel.com/api/agent/interventions';
  const TOKEN = localStorage.getItem('access_token');

  // ------------------------ MAP API → APP ------------------------
  const mapApiToIntervention = (api: ApiIntervention): Intervention => ({
    id: api.id,
    description: api.description,
    address: api.address,
    createdAt: api.created_at,
    title: api.title,
    client_first_name: api.client_first_name ?? 'Client',
    client_phone: api.client_phone ?? '',
    coords:
      api.latitude && api.longitude
        ? { lat: api.latitude, lng: api.longitude }
        : undefined,
    status: api.status
  });

  // ------------------------ FETCH ------------------------
  const prevPendingCount = React.useRef<number | null>(null);

  const fetchInterventions = useCallback(async (isBackground = false) => {
    if (!isBackground) setIsLoading(true);
    
    try {
      const response = await fetch(API_URL, {
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${TOKEN}`,
        },
      });

      const data: ApiResponse = await response.json();
      if (!response.ok) throw new Error(data.message ?? 'Erreur serveur');

      const newInterventions = data.data.map(mapApiToIntervention);
      const newPendingCount = newInterventions.filter(i => i.status === 'assigned').length;
      // --- NOTIFICATIONS NOUVELLES MISSIONS ---
      if (prevPendingCount.current !== null && newPendingCount > prevPendingCount.current) {
        
        const title = "Nouvelle mission !";
        const body = `Vous avez une nouvelle intervention en attente.`;

        // Signal sonore
        const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
        audio.play().catch(() => console.warn("Audio bloqué par le navigateur"));

        // Notification selon la plateforme
        if (Capacitor.isNativePlatform()) {
          await LocalNotifications.schedule({
            notifications: [{ title, body, id: Date.now(), schedule: { at: new Date(Date.now() + 500) } }]
          });
        } else if ("Notification" in window && Notification.permission === "granted") {
          new Notification(title, { body });
        }

        present({ message: `🔔 ${title}`, duration: 5000, color: 'secondary' });
      }

      prevPendingCount.current = newPendingCount;
      
      setInterventions(newInterventions);
      
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [TOKEN, present]);

  // ------------------------ RAFRAICHISSEMENT AUTOMATIQUE ------------------------
    useEffect(() => {
    const requestAllPermissions = async () => {
      // Permission Mobile
      if (Capacitor.isNativePlatform()) {
        await LocalNotifications.requestPermissions();
      }
      // Permission Web
      else if ("Notification" in window && Notification.permission === "granted") {
        // Optionnel : un petit son pour le Web
        const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
        audio.play().catch(() => {});

        // Création de la notification
        const notification = new Notification("Nouvelle Intervention", {
          body: "Une mission en attente est disponible !",
          icon: "/assets/icon/favicon.png" // Assurez-vous que le chemin est correct
        });

        // Action au clic sur la notification
        notification.onclick = () => {
          window.focus();
          setSelectedTab('pending');
        };
      }
    };
    requestAllPermissions();
  }, []);
  
  useEffect(() => {
      fetchInterventions();
    }, []);

    useEffect(() => {
    if (selectedIntervention) return; // Stop refresh si l’utilisateur est en train de travailler

    fetchInterventions();

    const interval = setInterval(() => {
      fetchInterventions();
    }, 60000);

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
    action: 'accept' | 'start' | 'complete' | 'refuse',
    payload?: Record<string, unknown>
  ) => {
    try {
      const response = await fetch(
        `https://api.depannel.com/api/agent/interventions/${id}/${action}`,
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

    if (newStatus === 'refuse') {
      presentAlert({
        header: 'Refuser l\'intervention',
        subHeader: 'Veuillez saisir la raison du refus',
        inputs: [
          {
            name: 'reason',
            type: 'textarea',
            placeholder: 'Ex: Trop loin, matériel manquant...',
          },
        ],
        buttons: [
          { text: 'Annuler', role: 'cancel' },
          {
            text: 'Confirmer le refus',
            handler: async (alertData) => {
              if (!alertData.reason || alertData.reason.trim() === '') {
                present({ message: "La raison est obligatoire", color: 'warning', duration: 2000 });
                return false; // Empêche la fermeture si vide
              }

              const ok = await updateStatusOnServer(id, 'refuse', {
                reason: alertData.reason,
              });

              if (ok) {
                // On rafraîchit la liste pour faire disparaître l'intervention refusée
                fetchInterventions();
                if (selectedIntervention?.id === id) setSelectedIntervention(null);
              }
            },
          },
        ],
      });
      return; // On sort de la fonction car l'alerte gère la suite
    }

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
