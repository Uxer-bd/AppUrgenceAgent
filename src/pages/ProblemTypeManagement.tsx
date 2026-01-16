import React, { useEffect, useState, useCallback } from 'react';
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonList, IonItem,
  IonLabel, IonButton, IonIcon, IonButtons, IonFab, IonFabButton,
  useIonToast, IonLoading, IonModal, IonInput, IonItemDivider, IonSelect, IonSelectOption
} from '@ionic/react';
import { add, create, trash, listOutline, closeOutline, saveOutline } from 'ionicons/icons';

interface ProblemType {
  id?: number;
  name: string;
  description?: string;
  priority: 'low' | 'medium' | 'high';
}

const ProblemTypeManagement: React.FC = () => {
  const [types, setTypes] = useState<ProblemType[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [present] = useIonToast();

  // État pour le formulaire (Création ou Édition)
  const [formData, setFormData] = useState<ProblemType>({ name: '', priority: 'medium', description: '' });
  const [isEditing, setIsEditing] = useState(false);

  const API_URL = 'https://api.depannel.com/api/problem-types';
  const TOKEN = localStorage.getItem('access_token');

  const fetchTypes = useCallback(async () => {
    try {
      const response = await fetch(API_URL, {
        headers: { 'Authorization': `Bearer ${TOKEN}`, 'Accept': 'application/json' }
      });
      const data = await response.json();
      setTypes(data.data || data);
    } catch (e) {
      present({ message: "Erreur de chargement", color: 'danger', duration: 2000 });
    } finally {
      setLoading(false);
    }
  }, [TOKEN, present]);

  useEffect(() => { fetchTypes(); }, [fetchTypes]);

  // Sauvegarde (Create ou Update)
  const handleSave = async () => {
    if (!formData.name) return;
    setLoading(true);

    const url = isEditing ? `${API_URL}/${formData.id}` : API_URL;
    const method = isEditing ? 'PUT' : 'POST';

    try {
      const response = await fetch(url, {
        method: method,
        headers: {
          'Authorization': `Bearer ${TOKEN}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        present({ message: `Type de problème ${isEditing ? 'modifié' : 'ajouté'}`, color: 'success', duration: 2000 });
        setShowModal(false);
        fetchTypes();
      }
    } catch (e) {
      present({ message: "Erreur lors de l'enregistrement", color: 'danger', duration: 2000 });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Supprimer ce type de problème ?")) return;
    try {
      const response = await fetch(`${API_URL}/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${TOKEN}` }
      });
      if (response.ok) {
        setTypes(types.filter(t => t.id !== id));
        present({ message: "Supprimé avec succès", color: 'success', duration: 2000 });
      }
    } catch (e) {
      present({ message: "Erreur de suppression", color: 'danger', duration: 2000 });
    }
  };

  const openAddModal = () => {
    setFormData({ name: '', priority: 'medium' });
    setIsEditing(false);
    setShowModal(true);
  };

  const openEditModal = (type: ProblemType) => {
    setFormData(type);
    setIsEditing(true);
    setShowModal(true);
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonTitle>Gestion des Problèmes</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent>
        <IonLoading isOpen={loading} />
        
        <IonList>
          <IonItemDivider>Liste des types de pannes</IonItemDivider>
          {types.map((type) => (
            <IonItem key={type.id}>
              <IonLabel>
                <h2>{type.name}</h2>
                <p>{type.description}</p>
              </IonLabel>
              <IonButtons slot="end">
                <IonButton color="primary" onClick={() => openEditModal(type)}>
                  <IonIcon icon={create} slot="icon-only" />
                </IonButton>
                <IonButton color="danger" onClick={() => handleDelete(type.id!)}>
                  <IonIcon icon={trash} slot="icon-only" />
                </IonButton>
              </IonButtons>
            </IonItem>
          ))}
        </IonList>

        <IonFab vertical="bottom" horizontal="end" slot="fixed">
          <IonFabButton onClick={openAddModal}>
            <IonIcon icon={add} />
          </IonFabButton>
        </IonFab>

        {/* Modal de Formulaire */}
        <IonModal isOpen={showModal} onDidDismiss={() => setShowModal(false)}>
          <IonHeader>
            <IonToolbar>
              <IonTitle>{isEditing ? 'Modifier' : 'Nouveau'} Type</IonTitle>
              <IonButtons slot="end">
                <IonButton onClick={() => setShowModal(false)}>
                  <IonIcon icon={closeOutline} />
                </IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>
          <IonContent className="ion-padding">
            <IonItem className="ion-margin-bottom">
              <IonLabel position="floating" style={{ marginBottom:"20px" }}>Nom du problème</IonLabel>
              <IonInput 
                value={formData.name} 
                onIonChange={e => setFormData({...formData, name: e.detail.value!})} 
                placeholder="Ex: Panne de disjoncteur"
              />
            </IonItem>

            <IonItem className="ion-margin-bottom">
              <IonLabel position="floating" style={{ marginBottom:"20px" }}>Niveau de Priorité</IonLabel>
              <IonSelect 
                value={formData.priority} 
                onIonChange={e => setFormData({...formData, priority: e.detail.value})}
              >
                <IonSelectOption value="low">Faible</IonSelectOption>
                <IonSelectOption value="medium">Moyenne</IonSelectOption>
                <IonSelectOption value="high">Haute</IonSelectOption>
              </IonSelect>
            </IonItem>
            <IonItem className="ion-margin-bottom">
              <IonLabel position="floating" style={{ marginBottom:"20px" }}>Description</IonLabel>
              <IonInput 
                value={formData.description} 
                onIonChange={e => setFormData({...formData, description: e.detail.value!})} 
                placeholder="Ex: Panne de disjoncteur"
              />
            </IonItem>

            <IonButton expand="block" onClick={handleSave} className="ion-margin-top" slot='' style={{ margin:'20px' }}>
              <IonIcon icon={saveOutline} slot="start" />
              {isEditing ? 'Mettre à jour' : 'Enregistrer'}
            </IonButton>
          </IonContent>
        </IonModal>
      </IonContent>
    </IonPage>
  );
};

export default ProblemTypeManagement;