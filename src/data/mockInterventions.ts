// src/data/mockInterventions.ts
import { Intervention } from '../type';

const now = new Date();

export const mockInterventions: Intervention[] = [
  {
    id: 1,
    clientName: 'Dupont Michel',
    status: 'en-attente',
    description: "Panne électrique totale dans l'appartement. Disjoncteur ne se réarme pas.",
    createdAt: new Date(now.getTime() - 5 * 60 * 1000).toISOString(), // Il y a 5 minutes
    address: '12 Rue de la Paix, 75002 Paris',
    phone: '06 12 34 56 78',
    coords: { lat: 48.8698, lng: 2.3345 },
  },
  {
    id: 2,
    clientName: 'Bernard Laurent',
    status: 'acceptee',
    description: 'Plusieurs prises ne fonctionnent plus dans le salon.',
    createdAt: new Date(now.getTime() - 25 * 60 * 1000).toISOString(), // Il y a 25 minutes
    address: '8 Avenue des Champs-Élysées, 75008 Paris',
    phone: '07 87 65 43 21',
    coords: { lat: 48.8702, lng: 2.3075 },
  },
  {
    id: 3,
    clientName: 'Martin Sophie',
    status: 'acceptee',
    description: 'Lumière de la cuisine qui clignote sans arrêt.',
    createdAt: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(), // Il y a 2 heures
    address: '1 Place du Trocadéro, 75116 Paris',
    phone: '06 55 44 33 22',
    coords: { lat: 48.8626, lng: 2.2871 },
  },
  {
    id: 4,
    clientName: 'Petit Lucas',
    status: 'terminee',
    description: "Installation d'une nouvelle prise pour la machine à laver.",
    createdAt: new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString(), // Il y a 1 jour
    address: '20 Rue du Commerce, 75015 Paris',
    phone: '07 11 22 33 44',
    coords: { lat: 48.8488, lng: 2.2885 },
  },
];