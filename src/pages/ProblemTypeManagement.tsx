import React, { useEffect, useState, useCallback } from 'react';
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonList, IonItem,
  IonLabel, IonButton, IonIcon, IonButtons, IonFab, IonFabButton,
  useIonToast, IonLoading, IonModal, IonInput, IonItemDivider, IonSelect, IonSelectOption, IonToggle,
  IonBadge, IonNote
} from '@ionic/react';
import { add, create, trash, closeOutline, saveOutline, arrowBackOutline } from 'ionicons/icons';

interface ProblemType {
  id?: number;
  name: string;
  description?: string;
  icon?: string;
  code?: string;
  color?: string;
  priority_level: 'low' | 'medium' | 'high';
  sort_order?: number;
  is_active?: boolean;
}

const ProblemTypeManagement: React.FC = () => {
  const [types, setTypes] = useState<ProblemType[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [present] = useIonToast();

  // État pour le formulaire (Création ou Édition)
  const [formData, setFormData] = useState<ProblemType>({ name: '', priority_level: 'medium', description: '', is_active: true });
  const [isEditing, setIsEditing] = useState(false);

  const API_URL = 'https://api.depannel.com/api/problem-types';
  const TOKEN = localStorage.getItem('access_token');

  const fetchTypes = useCallback(async () => {
    try {
      const response = await fetch(API_URL+`?active_only=false`, {
        headers: { 'Authorization': `Bearer ${TOKEN}`, 'Accept': 'application/json' }
      });
      const data = await response.json();
      setTypes(data.data || data);
    } catch (error) {
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

    const payload = {
        ...formData,
        code: formData.name.toUpperCase().replace(/\s+/g, '_'),
    };

    try {
      const response = await fetch(url, {
        method: method,
        headers: {
          'Authorization': `Bearer ${TOKEN}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        present({ message: `Type de problème ${isEditing ? 'modifié' : 'ajouté'}`, color: 'success', duration: 2000 });
        setShowModal(false);
        fetchTypes();
      }
    } catch{
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
    } catch{
      present({ message: "Erreur de suppression", color: 'danger', duration: 2000 });
    }
  };

  const openAddModal = () => {
    setFormData({ name: '', priority_level: 'medium' });
    setIsEditing(false);
    setShowModal(true);
  };

  const openEditModal = (type: ProblemType) => {
    setFormData(type);
    setIsEditing(true);
    setShowModal(true);
  };

  const toggleProblemStatus = async (problem: ProblemType) => {
    const newStatus = !problem.is_active;

    // 1. On prépare l'objet complet tel que demandé par le schéma PUT
    const updatedProblem = {
        ...problem,
        is_active: newStatus,
        // On s'assure que les champs obligatoires sont bien présents
        // Si 'code' est requis par votre logique backend, on le garde ou on le génère
        code: problem.code || problem.name.toUpperCase().replace(/\s+/g, '_')
    };

    // 2. Mise à jour optimiste
    setTypes(prev => 
        prev.map(p => p.id === problem.id ? updatedProblem : p)
    );

    try {
      const response = await fetch(`${API_URL}/${problem.id}`, {
          method: 'PUT', // On utilise PUT comme indiqué sur votre capture
          headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${TOKEN}`,
              'Accept': 'application/json'
          },
          body: JSON.stringify(updatedProblem) // On envoie l'objet COMPLET ici
      });

      if (!response.ok) {
          // Optionnel : logger l'erreur pour voir ce que l'API renvoie exactement
          const errorData = await response.json();
          console.error("Erreur API détaillée:", errorData);
          throw new Error();
      }

      present({ message: `Statut mis à jour !`, duration: 1500, color: 'success', position: 'bottom' });
    } catch (error) {
        // Retour en arrière si ça échoue
        setTypes(prev => 
            prev.map(p => p.id === problem.id ? { ...p, is_active: !newStatus } : p)
        );
        present({ message: 'Erreur de mise à jour', color: 'danger', duration: 2000 });
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
            <IonButtons slot="start">
                <IonButton onClick={() => history.back()}>
                    <IonIcon slot="icon-only" icon={arrowBackOutline} />
                </IonButton>
            </IonButtons>
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
              <div slot="end" style={{ display: 'flex', alignItems: 'center' }}>
                  <IonNote style={{ fontSize: '0.8em', marginRight: '8px' }}>
                      {type.is_active ? 'ACTIF' : 'INACTIF'}
                  </IonNote>
                  <IonToggle 
                      checked={type.is_active} 
                      color="success"
                      onIonChange={() => toggleProblemStatus(type)} 
                  />
              </div>
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
                value={formData.priority_level} 
                onIonChange={e => setFormData({...formData, priority_level: e.detail.value})}
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
            <IonItem>
              <IonLabel>Type de panne actif</IonLabel>
              <IonToggle 
                  slot="end" 
                  checked={formData.is_active} 
                  onIonChange={e => setFormData({ ...formData, is_active: e.detail.checked })}
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