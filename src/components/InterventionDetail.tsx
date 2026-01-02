// src/components/InterventionDetailModal.tsx
import React from 'react';
import { IonContent, IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonIcon, IonLabel } from '@ionic/react';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { AppLauncher } from '@capacitor/app-launcher';
import { Intervention } from '../type';
import { call, location, informationCircle, close } from 'ionicons/icons';

interface ModalProps {
  intervention: Intervention | null;
  onClose: () => void;
  onStatusChange: (id: number, newStatus: 'accepted' | 'completed') => void;
  onMarkAsTerminated: (id: number, status: 'completed') => void;
}

const InterventionDetail: React.FC<ModalProps> = ({ intervention, onClose, onMarkAsTerminated, onStatusChange }) => {
  if (!intervention) return null;

  const timeAgo = formatDistanceToNow(new Date(intervention.createdAt), { addSuffix: true, locale: fr });

  const handleCall = () => {
    AppLauncher.openUrl({ url: `tel:${intervention.client_phone}` });
  };

  const handleNavigation = () => {
    if (intervention.coords) {
      const { lat, lng } = intervention.coords;
      AppLauncher.openUrl({ url: `https://www.google.com/maps/search/?api=1&query=${lat},${lng}` });
    }
  };

  return (
    <>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonIcon icon={informationCircle} style={{ marginLeft: '16px' }} />
          </IonButtons>
          <IonTitle>Détails de l'intervention</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={onClose}>
              <IonIcon icon={close} />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        {/* Header Info */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            {/* <h2 style={{ margin: '0', fontWeight: 'bold' }}>{intervention.client_first_name}</h2> */}
            <IonLabel color="primary">Priorité Normale</IonLabel>
          </div>
          <span style={{ color: '#666', fontSize: '0.9em' }}>{timeAgo}</span>
        </div>

        {/* Details List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <IonIcon icon={location} style={{ marginRight: '16px', color: '#666', fontSize: '24px' }} />
            <div>
              <strong style={{ display: 'block' }}>Adresse</strong>
              <span>{intervention.address}</span>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <IonIcon icon={call} style={{ marginRight: '16px', color: '#666', fontSize: '24px' }} />
            <div>
              <strong style={{ display: 'block' }}>Téléphone</strong>
              <span>{intervention.client_phone}</span>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <IonIcon icon={informationCircle} style={{ marginRight: '16px', color: '#666', fontSize: '24px' }} />
            <div>
              <strong style={{ display: 'block' }}>Description du problème</strong>
              <span>{intervention.title}</span>
            </div>
          </div>
        </div>
      </IonContent>

      {/* Footer Buttons */}
      { intervention.status === 'accepted' ||  intervention.status === 'in_progress' && (
        <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ display: 'flex', gap: '10px' }}>
            <IonButton expand="block" color="success" onClick={handleCall} style={{ flex: 1 }}>
              <IonIcon icon={call} style={{ marginRight: '8px', fontSize: '16px' }} />
              Appeler
            </IonButton>
            <IonButton expand="block" onClick={handleNavigation} style={{ flex: 1 }}>
              <IonIcon icon={location} style={{ marginRight: '8px', fontSize: '16px' }} />
              Se rendre sur place
            </IonButton>
          </div>
          <IonButton expand="block" color="success" onClick={() => {onMarkAsTerminated(intervention.id, 'completed'); onClose();}}>
            Marquer comme terminée
          </IonButton>
        </div>
        )}
      {intervention.status === 'assigned' && (
        <div style={{ display: 'flex', gap: '10px' }}>
          <IonButton expand="block" onClick={() => {onStatusChange(intervention.id, 'accepted'); onClose()}} style={{ flex: 1 }}>
            Accepter
          </IonButton>
        </div>
      )}
    </>
  );
};

export default InterventionDetail;