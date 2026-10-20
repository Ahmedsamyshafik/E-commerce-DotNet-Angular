// Production environment.
//
// Deployment note: `BASEURL` and `BASEURLFROMIMGS` are intentionally relative so a
// production build never points at a developer machine. Override them (and the Stripe
// publishable key, if the frontend ever loads Stripe.js) per deployment.
//
// Never place Stripe secret keys, API tokens, or other private credentials in this file.
// Stripe publishable keys (pk_...) are public and are the only Stripe key allowed here.
export const environment = {
  BASEURL: '/api/v1',
  BASEURLFROMIMGS: '',
  stripe: {
    publishableKey: '',
  },
  stripeSuccessUrl: '/Success',
  stripeCancelUrl: '/Shop',
};
