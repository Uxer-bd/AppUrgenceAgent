// src/types.ts
// Définition des types pour les interventions
export interface Intervention {
  id: number;
  clientName: string;
  status: 'en-attente' | 'acceptee' | 'terminee';
  description: string;
  createdAt: string; // Format ISO: "2025-10-27T21:10:00Z"
  address: string;
  phone: string;
  coords?: {
    lat: number;
    lng: number;
  };
}