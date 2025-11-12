// src/pages/AgentDashboard.tsx
import React, { useState, useMemo } from 'react';
import { IonContent, IonPage, IonModal, IonHeader, IonToolbar, IonTitle, IonSegment, IonSegmentButton, IonLabel, IonBadge, IonButtons, IonButton, } from '@ionic/react';
import { mockInterventions } from '../data/mockInterventions';
import { Intervention } from '../type';
import InterventionCard from '../components/InterventionCard';
import InterventionDetail from '../components/InterventionDetail';

const AgentDashboard: React.FC = () => {
  const [interventions, setInterventions] = useState<Intervention[]>(mockInterventions);
  const [selectedTab, setSelectedTab] = useState<'en-attente' | 'acceptee' | 'terminee'>('en-attente');
  const [selectedIntervention, setSelectedIntervention] = useState<Intervention | null>(null);

  const counts = useMemo(() => ({
    'en-attente': interventions.filter(i => i.status === 'en-attente').length,
    'acceptee': interventions.filter(i => i.status === 'acceptee').length,
    'terminee': interventions.filter(i => i.status === 'terminee').length
  }), [interventions]);

  const filteredInterventions = useMemo(() =>
    interventions.filter(inter => inter.status === selectedTab),
    [interventions, selectedTab]
  );

  const handleStatusChange = (id: number, newStatus: Intervention['status']) => {
    setInterventions(prev =>
      prev.map(inter =>
        inter.id === id ? { ...inter, status: newStatus } : inter
      )
    );
    if (selectedIntervention && selectedIntervention.id === id) {
      setSelectedIntervention({ ...selectedIntervention, status: newStatus });
    }
  };

  const handleSubStatusChange = (id: number, newSubStatus: NonNullable<Intervention['subStatus']>) => {
    setInterventions(prev =>
      prev.map(inter =>
        inter.id === id ? { ...inter, subStatus: newSubStatus } : inter
      )
    );
    // Message de confirmation
    // const message = newSubStatus === 'en-route' ? 'Déplacement en cours.' : 'Arrivée sur site confirmée.';
    // present({ message, duration: 2000, color: 'primary' });
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary" style={{ '--background': '#3880ff' }}>
          <IonButtons slot="start">
            <IonButton>
              {/* <MapPin size={20} /> */}
            </IonButton>
          </IonButtons>
          <div style={{ paddingLeft: '10px' }}>
            <IonTitle style={{ fontSize: '1.2em', padding: 0 }}>Interventions Électriques</IonTitle>
            <p style={{ margin: '0', fontSize: '0.9em', color: 'rgba(255,255,255,0.8)' }}>Agent de terrain</p>
          </div>
          {/*<IonButtons slot="end">
            <IonButton shape="round" style={{ '--background': '#eb445a', fontSize: '0.8em', height: '30px', marginRight: '10px' }}>
              1 nouvelle
            </IonButton>
          </IonButtons>*/}
        </IonToolbar>
        <IonToolbar>
          <IonSegment value={selectedTab} onIonChange={e => setSelectedTab(e.detail.value as 'en-attente' | 'acceptee' | 'terminee')}>
            <IonSegmentButton value="en-attente">
              <IonLabel>En attente</IonLabel>
              {counts['en-attente'] > 0 && <IonBadge color="danger">{counts['en-attente']}</IonBadge>}
            </IonSegmentButton>
            <IonSegmentButton value="acceptee">
              <IonLabel>Acceptées</IonLabel>
              {counts['acceptee'] > 0 && <IonBadge color="success">{counts['acceptee']}</IonBadge>}
            </IonSegmentButton>
            <IonSegmentButton value="terminee">
              <IonLabel>Terminées</IonLabel>
              {counts['terminee'] > 0 && <IonBadge color="medium">{counts['terminee']}</IonBadge>}
            </IonSegmentButton>
          </IonSegment>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen className="ion-padding" style={{ '--background': '#f4f5f8' }}>
        {filteredInterventions.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#888', marginTop: '50px' }}>
                <p>Aucune intervention dans cette catégorie.</p>
            </div>
        ) : (
            filteredInterventions.map(intervention => (
              <InterventionCard
                key={intervention.id}
                intervention={intervention}
                onStatusChange={handleStatusChange}
                onSubStatusChange={handleSubStatusChange}
                onViewDetails={() => setSelectedIntervention(intervention)}
              />
            ))
        )}
      </IonContent>
      <IonModal isOpen={!!selectedIntervention} onDidDismiss={() => setSelectedIntervention(null)}>
        <InterventionDetail
          intervention={selectedIntervention}
          onStatusChange={handleStatusChange}
          onClose={() => setSelectedIntervention(null)}
          onMarkAsTerminated={handleStatusChange}
        />
      </IonModal>
    </IonPage>
  );
};

export default AgentDashboard;