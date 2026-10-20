// Local development environment.
//
// Never place Stripe secret keys, API tokens, or other private credentials in this file.
// The value below is a Stripe test *publishable* key (pk_test_...), which is public by design.
export const environment = {
  BASEURL: 'http://localhost:5090/api/v1',
  BASEURLFROMIMGS: 'http://localhost:5090/',
  stripe: {
    publishableKey:
      'pk_test_51PYQEvDRgggVGKhucLyEDCXWriwLFv0yiR6gVwYagHHtrZ8VfswivS7spSkFjyvsI7OpRXWn4BCWo7kCCuwHCNbZ00jXgNZTb9',
  },
  stripeSuccessUrl: 'http://localhost:4200/Success',
  stripeCancelUrl: 'http://localhost:4200/Shop',
};
