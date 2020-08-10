/* eslint-disable */
import axios from 'axios';

import { showAlert } from './alerts';

const stripe = Stripe(
   'pk_test_51HEAamGOlf2RKIZIo7qF2mnhDa4iTnue4naXIRcChcocKdgZK3rRy42dl0tpvtiLWVkiHVEnTJ6tHai0RCpIxtuK0030egoDQ2'
);

export const bookTour = async (tourId) => {
   try {
      // 1) Get checkout session from api
      const session = await axios({
         method: 'get',
         url: `http://localhost:5000/api/v1/bookings/checkout-session/${tourId}`,
      });
      console.log(session);

      // 2) Create checkout from + charge credit card
      await stripe.redirectToCheckout({
         sessionId: session.data.session.id,
      });
   } catch (err) {
      console.log(err);
      showAlert('error', err);
   }
};
