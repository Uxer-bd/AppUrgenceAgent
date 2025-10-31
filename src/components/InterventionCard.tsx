// src/components/InterventionCard.tsx
import React from 'react';
import { IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonBadge, IonButton, IonIcon } from '@ionic/react';
import { locationSharp } from 'ionicons/icons';
import { Intervention } from '../type';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

interface InterventionCardProps {
  intervention: Intervention;
  onStatusChange: (id: number, newStatus: Intervention['status']) => void;
  onViewDetails: () => void;
}

const InterventionCard: React.FC<InterventionCardProps> = ({ intervention, onStatusChange, onViewDetails }) => {
  const timeAgo = formatDistanceToNow(new Date(intervention.createdAt), { addSuffix: true, locale: fr });

  // const handleNavigation = async () => {
  //   if (!intervention.coords) {
  //     alert("Coordonnées GPS non disponibles pour cette intervention.");
  //     return;
  //   }
  //   const { lat, lng } = intervention.coords;
  //   // URL pour lancer Google Maps
  //   const url = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;

  //   await AppLauncher.openUrl({ url });
  // };

  const getStatusLabel = () => {
    switch (intervention.status) {
      case 'en-attente': return 'En attente';
      case 'acceptee': return 'Acceptée';
      case 'terminee': return 'Terminée';
    }
  };

  const getStatusColor = () => {
    switch (intervention.status) {
      case 'en-attente': return 'danger';
      case 'acceptee': return 'success';
      case 'terminee': return 'medium';
    }
  };


  return (
    <IonCard style={{ marginBottom: '16px', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
      <IonCardHeader>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <IonCardTitle style={{ fontWeight: 'bold' }}>{intervention.clientName}</IonCardTitle>
          <IonBadge color={getStatusColor()}>{getStatusLabel()}</IonBadge>
        </div>
        <p style={{ color: '#666', margin: '4px 0 0', fontSize: '0.9em' }}>{timeAgo}</p>
      </IonCardHeader>
      <IonCardContent>
        <p>{intervention.description}</p>
        <div style={{ marginTop: '16px', display: 'flex', gap: '10px' }}>
          {intervention.status === 'en-attente' && (
            <>
              <IonButton expand="block" onClick={() => onStatusChange(intervention.id, 'acceptee')} style={{ flex: 1 }}>
                Accepter
              </IonButton>
              <IonButton expand="block" color="light" onClick={() => console.log('Refusé')} style={{ flex: 1 }}>
                Refuser
              </IonButton>
            </>
          )}

          {intervention.status === 'acceptee' && (
              <>
              <IonButton expand="block" onClick={onViewDetails} style={{ flex: 1 }}>
                <IonIcon icon={locationSharp} style={{ marginRight: '8px' }} />
                Voir les détails
              </IonButton>
              <IonButton expand="block" color="success" onClick={() => onStatusChange(intervention.id, 'terminee')} style={{ flex: 1 }}>
                Terminer
              </IonButton>
              </>
          )}
        </div>
      </IonCardContent>
    </IonCard>
  );
};

export default InterventionCard;