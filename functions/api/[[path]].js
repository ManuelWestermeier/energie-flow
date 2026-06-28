import { err } from '../_lib/http.js';
export const onRequest = () => err('Nicht gefunden.', 404);
