/* eslint-disable */
// 212. Processing Payments on the Front-End
import axios from 'axios';
import { showAlert } from './alert';

export const bookTour = async tourId => {
  const stripe = Stripe(String(process.env.STRIPE_PUBLIC_KEY));

  try {
    // 1) Get checkout session from API
    const session = await axios(`/api/v1/bookings/checkout-session/${tourId}`);
    // console.log(session);

    // 2) Create checout form + charge credit card
    // await stripe.redirectToCheckout({
    //   sessionId: session.id,
    // });
    window.location.replace(session.data.session.url);
  } catch (err) {
    console.log(err);
    showAlert('error', err);
  }
};
