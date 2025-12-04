// src/components/InterventionCard.tsx
import React from 'react';
import {
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonBadge,
  IonButton,
  IonIcon
} from '@ionic/react';
import { locationSharp } from 'ionicons/icons';
import { Intervention } from '../type';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

interface InterventionCardProps {
  intervention: Intervention;
  onStatusChange: (id: number, newStatus: 'accepted' | 'in_progress' | 'completed') => void;
  onViewDetails: () => void;
}

const InterventionCard: React.FC<InterventionCardProps> = ({
  intervention,
  onStatusChange,
  onViewDetails
}) => {
  const timeAgo = formatDistanceToNow(new Date(intervention.createdAt), {
    addSuffix: true,
    locale: fr
  });

  const getStatusLabel = () => {
    switch (intervention.status) {
      case 'assigned': return 'Assignée';
      case 'accepted': return 'Acceptée';
      case 'in_progress': return 'En intervention';
      case 'completed': return 'Terminée';
      default: return intervention.status;
    }
  };

  const getStatusColor = () => {
    switch (intervention.status) {
      case 'assigned': return 'danger';
      case 'accepted': return 'warning';
      case 'in_progress': return 'secondary';
      case 'completed': return 'success';
    }
  };

  return (
    <IonCard
      style={{
        marginBottom: '16px',
        borderRadius: '12px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
      }}
    >
      <IonCardHeader>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <IonCardTitle style={{ fontWeight: 'bold' }}>
            {intervention.clientName}
          </IonCardTitle>

          <IonBadge color={getStatusColor()}>
            {getStatusLabel()}
          </IonBadge>
        </div>

        <p style={{ color: '#666', margin: '4px 0 0', fontSize: '0.9em' }}>
          {timeAgo}
        </p>
      </IonCardHeader>

      <IonCardContent>
        <p>{intervention.description}</p>

        <div style={{ marginTop: '16px', display: 'flex', gap: '10px' }}>

          {/* ---- ÉTAPE 1 : assigned → accepted ---- */}
          {intervention.status === 'assigned' && (
            <IonButton
              expand="block"
              color="primary"
              onClick={() => onStatusChange(intervention.id, 'accepted')}
              style={{ flex: 1 }}
            >
              Accepter
            </IonButton>
          )}

          {/* ---- ÉTAPE 2 : accepted → in_progress ---- */}
          {intervention.status === 'accepted' && (
            <IonButton
              expand="block"
              color="warning"
              onClick={() => onStatusChange(intervention.id, 'in_progress')}
              style={{ flex: 1 }}
            >
              Démarrer l’intervention
            </IonButton>
          )}

          {/* ---- ÉTAPE 3 : in_progress → completed ---- */}
          {intervention.status === 'in_progress' && (
            <IonButton
              expand="block"
              color="success"
              onClick={() => onStatusChange(intervention.id, 'completed')}
              style={{ flex: 1 }}
            >
              Marquer comme terminé
            </IonButton>
          )}

          {/* ---- VOIR DÉTAILS ---- */}
          <IonButton
            expand="block"
            onClick={onViewDetails}
            style={{ flex: 1 }}
          >
            <IonIcon icon={locationSharp} style={{ marginRight: '8px' }} />
            Voir les détails
          </IonButton>

        </div>
      </IonCardContent>
    </IonCard>
  );
};

export default InterventionCard;
