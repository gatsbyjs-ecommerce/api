import Razorpay from 'razorpay';

import config from './config';

const instance = new Razorpay({
  key_id: config.get('razorpay.id'),
  key_secret: config.get('razorpay.secret'),
});

export default instance;
