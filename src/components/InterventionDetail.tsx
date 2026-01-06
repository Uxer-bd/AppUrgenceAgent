// src/components/InterventionDetailModal.tsx
import React, { useState, useEffect } from 'react';
import { IonContent, IonHeader, IonToolbar, IonTitle,
  IonButtons, IonButton, IonIcon, IonLabel, IonBadge, IonSpinner, } from '@ionic/react';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { AppLauncher } from '@capacitor/app-launcher';
import { Intervention } from '../type';
import { call, location, informationCircle, close, checkmarkCircleOutline, receiptOutline, closeCircleOutline, timeOutline  } from 'ionicons/icons';

interface ModalProps {
  intervention: Intervention | null;
  onClose: () => void;
  onStatusChange: (id: number, newStatus: 'accepted' | 'completed') => void;
  onMarkAsTerminated: (id: number, status: 'completed') => void;
}

const InterventionDetail: React.FC<ModalProps> = ({ intervention, onClose,}) => {

  const [quote, setQuote] = useState<any>(null);
  const [loadingQuote, setLoadingQuote] = useState(false);

  useEffect(() => {
    if (intervention?.id) {
      fetchQuote();
    }
  }, [intervention?.id]);

  const fetchQuote = async () => {
    setLoadingQuote(true);
    try {
      // Utilisation de l'URL de votre doc : /interventions/{id}/quotes
      const response = await fetch(
        `https://api.depannel.com/api/interventions/${intervention?.id}/quotes?phone=${intervention?.client_phone}`,
        {
          headers: {
            'Accept': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`
          }
        }
      );
      if (response.ok) {
        const json = await response.json();
        // L'API renvoie souvent une liste, on prend le premier devis
        const quoteData = Array.isArray(json) ? json[0] : (json.data?.[0] || json.data);
        setQuote(quoteData);
      }
    } catch (error) {
      console.error("Erreur lors de la récupération du devis", error);
    } finally {
      setLoadingQuote(false);
    }
  };

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

      <div style={{ marginTop: '24px', paddingTop: '20px', borderTop: '1px solid #eee' }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '15px' }}>
          <IonIcon icon={receiptOutline} style={{ marginRight: '12px', color: '#3880ff', fontSize: '20px' }} />
          <strong style={{ fontSize: '1.1em' }}>État du Devis</strong>
        </div>

        {loadingQuote ? (
          <div className="ion-text-center"><IonSpinner name="crescent" /></div>
        ) : quote ? (
          <div style={{ 
            padding: '15px', 
            borderRadius: '10px', 
            background: quote.status === 'rejected' ? '#fff1f0' : '#f4faff',
            border: `1px solid ${quote.status === 'rejected' ? '#ffa39e' : '#91d5ff'}`
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontSize: '1.2em', fontWeight: 'bold', display: 'block' }}>
                  {quote.amount} FCFA
                </span>
                <span style={{ fontSize: '0.85em', color: '#666' }}>Réf: {quote.id}</span>
              </div>
              
              {/* Badge de statut basé sur l'API */}
              <IonBadge color={
                quote.status === 'accepted' ? 'success' : 
                quote.status === 'rejected' ? 'danger' : 'warning'
              } style={{ padding: '6px 10px', borderRadius: '4px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <IonIcon icon={
                    quote.status === 'accepted' ? checkmarkCircleOutline : 
                    quote.status === 'rejected' ? closeCircleOutline : timeOutline
                  } />
                  {quote.status === 'accepted' ? 'Accepté' : 
                  quote.status === 'rejected' ? 'Refusé' : 'En attente'}
                </div>
              </IonBadge>
            </div>
          </div>
        ) : (
          <div style={{ padding: '10px', color: '#999', fontStyle: 'italic', fontSize: '0.9em' }}>
            Aucun devis généré pour cette intervention.
          </div>
        )}
      </div>

      {/* Footer Buttons */}
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
      </div>
    </>
  );
};

export default InterventionDetail;