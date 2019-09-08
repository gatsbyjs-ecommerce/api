import sanityClient from '@sanity/client';
import config from './config';

// https://www.sanity.io/docs/client-libraries/js-client
// https://www.sanity.io/docs/data-store/query-cheat-sheet
const client = sanityClient({
  projectId: config.get('sanity.projectId'),
  dataset: config.get('sanity.dataset'),
  token: config.get('sanity.token'), // or leave blank to be anonymous user
  useCdn: false, // `false` if you want to ensure fresh data
});

export default client;
