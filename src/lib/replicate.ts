import Replicate from 'replicate';

// Initialize the Replicate client with your API token
const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN as string,
});

export { replicate };