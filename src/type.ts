// src/types.ts
// Définition des types pour les interventions
export interface Intervention {
  id: number;
  clientName: string;
  status: 'assigned'|'accepted' | 'in_progress'|'completed';
  subStatus?: 'en-route' | 'arrived'| 'terminee';
  description: string;
  createdAt: string; // Format ISO: "2025-10-27T21:10:00Z"
  address: string;
  phone: string;
  coords?: {
    lat: number;
    lng: number;
  };
}