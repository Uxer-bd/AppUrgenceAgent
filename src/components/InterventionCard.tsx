// src/components/InterventionCard.tsx
import React from 'react';
import { IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonBadge, IonButton, IonIcon } from '@ionic/react';
import { locationSharp } from 'ionicons/icons';
import { Intervention } from '../type';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
// import { MapPin, MapPinOff, Navigation } from 'lucide-react';

interface InterventionCardProps {
  intervention: Intervention;
  // onStatusChange: (id: number, newStatus: Intervention['status']) => void;
  onStatusChange: (id: number, newStatus: 'acceptee' | 'terminee') => void;
  onViewDetails: () => void;
  onSubStatusChange: (id: number, newSubStatus: NonNullable<Intervention['subStatus']>) => void;
}

const InterventionCard: React.FC<InterventionCardProps> = ({ intervention, onStatusChange, onViewDetails, onSubStatusChange }) => {
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
    if (intervention.subStatus === 'en-route') return 'En route';
    if (intervention.subStatus === 'arrive') return 'Arrivé sur place';
    switch (intervention.status) {
      case 'en-attente': return 'En attente';
      case 'acceptee': return 'Acceptée';
      case 'terminee': return 'Terminée';
    }
  };

  const getStatusColor = () => {
    if (intervention.subStatus === 'en-route') return 'warning';
    if (intervention.subStatus === 'arrive') return 'secondary';
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
          {intervention.status === 'acceptee' && (
            <>
              {/* Cas 1 : Juste acceptée, pas de sous-état */}
              {!intervention.subStatus && (
                <div style={{ display: 'flex', gap: '10px' }}>
                  <IonButton expand="block" color="warning" onClick={() => onSubStatusChange(intervention.id, 'en-route')} style={{ flex: 1 }}>
                    {/* <Navigation size={16} style={{ marginRight: '8px' }} /> */}
                    Démarrer la route
                  </IonButton>
                </div>
              )}
              {/* Cas 2 : L'agent est en route */}
              {intervention.subStatus === 'en-route' && (
                <IonButton expand="block" color="secondary" onClick={() => onSubStatusChange(intervention.id, 'arrive')}>
                  {/* <MapPinOff size={16} style={{ marginRight: '8px' }} /> */}
                  Arrivé sur place
                </IonButton>
              )}

              {/* Cas 3 : L'agent est arrivé */}
              {intervention.subStatus === 'arrive' && (
                <IonButton expand="block" color="success" onClick={() => {onStatusChange(intervention.id, 'terminee'); onSubStatusChange(intervention.id, 'terminee');}}>
                  Marquer comme terminée
                </IonButton>
              )}
            </>
          )}

          {intervention.status === 'acceptee' && (
              <>
              <IonButton expand="block" onClick={onViewDetails} style={{ flex: 1 }}>
                <IonIcon icon={locationSharp} style={{ marginRight: '8px' }} />
                Voir les détails
              </IonButton>
              </>
          )}

          {intervention.status === 'en-attente' && (
            <div style={{ display: 'flex', gap: '10px' }}>
              <IonButton expand="block" onClick={onViewDetails} style={{ flex: 1 }}>
                <IonIcon icon={locationSharp} style={{ marginRight: '8px' }} />
                Voir les détails
              </IonButton>
              <IonButton expand="block" onClick={() => onStatusChange(intervention.id, 'acceptee')} style={{ flex: 1 }}>
                Accepter
              </IonButton>
            </div>
          )}
        </div>
      </IonCardContent>
    </IonCard>
  );
};

export default InterventionCard;