import client from './client';
export const listClubs = () => client.get('/clubs');