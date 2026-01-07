// // src/data/mockInterventions.ts
// import { Intervention } from '../type';

// const now = new Date();

// export const mockInterventions: Intervention[] = [
//   {
//     id: 1,
//     client_first_name: 'Dupont Michel',
//     status: 'assigned',
//     description: "Panne électrique totale dans l'appartement. Disjoncteur ne se réarme pas.",
//     createdAt: new Date(now.getTime() - 5 * 60 * 1000).toISOString(), // Il y a 5 minutes
//     address: '12 Rue de la Paix, 75002 Paris',
//     client_phone: '06 12 34 56 78',
//     coords: { lat: 48.8698, lng: 2.3345 },
//   },
//   {
//     id: 2,
//     client_first_name: 'Bernard Laurent',
//     status: 'assigned',
//     description: 'Plusieurs prises ne fonctionnent plus dans le salon.',
//     createdAt: new Date(now.getTime() - 25 * 60 * 1000).toISOString(), // Il y a 25 minutes
//     address: '8 Avenue des Champs-Élysées, 75008 Paris',
//     client_phone: '07 87 65 43 21',
//     coords: { lat: 48.8702, lng: 2.3075 },
//   },
//   {
//     id: 3,
//     client_first_name: 'Martin Sophie',
//     status: 'accepted',
//     description: 'Lumière de la cuisine qui clignote sans arrêt.',
//     createdAt: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(), // Il y a 2 heures
//     address: '1 Place du Trocadéro, 75116 Paris',
//     client_phone: '06 55 44 33 22',
//     coords: { lat: 48.8626, lng: 2.2871 },
//   },
//   {
//     id: 4,
//     client_first_name: 'Petit Lucas',
//     status: 'completed',
//     description: "Installation d'une nouvelle prise pour la machine à laver.",
//     createdAt: new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString(), // Il y a 1 jour
//     address: '20 Rue du Commerce, 75015 Paris',
//     client_phone: '07 11 22 33 44',
//     coords: { lat: 48.8488, lng: 2.2885 },
//   },
//   {
//     id: 5,
//     client_first_name: 'Garcia Chloe',
//     status: 'accepted',
//     subStatus: 'arrived',
//     description: 'Le tableau électrique fait un bruit étrange.',
//     createdAt: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(),
//     address: '55 Boulevard de la Villette, 75010 Paris',
//     client_phone: '06 11 22 44 55',
//     coords: { lat: 48.8784, lng: 2.3695 },
//   },
// ];