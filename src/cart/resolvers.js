import Stripe from 'stripe';
import async from 'async';
import { first } from 'lodash';

import sanity from '../utils/sanity';

import config from '../utils/config';

const stripe = new Stripe(config.get('stripeKey'));

export default {
  Mutation: {
    verifyCard: async (parent, args) => {
      const { input } = args;

      const result = await stripe.tokens.create({
        card: {
          number: input.cardNumber,
          exp_month: input.expMonth,
          exp_year: input.expYear,
          cvc: input.cvc,
        },
      });

      return {
        id: result.id,
      };
    },
    createOrder: async (parent, args) => {
      const { input } = args;

      // check if customer exists else create it
      const users = await sanity.fetch(
        '*[_type == "customer" && email == $email] {_id, email}',
        { email: input.customer.email.toLowerCase() },
      );
      let user = first(users);
      if (!user) {
        // user does not exists, so create a new user
        const doc = {
          _type: 'customer',
          email: input.customer.email,
          // password: hashedPassword, // TODO: auto gen password
          status: 'active',
          address: input.customer.address,
        };
        user = await sanity.create(doc);
        // TODO: send user logins
      }

      // add shipping address
      input.shippingAddress = input.customer.address;

      input.customer = {
        _type: 'reference',
        _key: user._id,
        _ref: user._id,
      };

      const totalCost = await new Promise(resolve => {
        let total = 0;
        async.each(
          input.productIds,
          async (productId, callback) => {
            // get products
            const product = await sanity.getDocument(productId);
            if (product) {
              total +=
                product.variant.discountPrice > 0
                  ? product.variant.discountPrice
                  : product.variant.price;
            }
            callback();
          },
          () => {
            resolve(total);
          },
        );
      });
      input.total = totalCost.toString();

      // process payment with stripe
      try {
        const charge = await stripe.charges.create({
          amount: `${totalCost}00`,
          currency: 'gbp',
          description: `Order by ${input.customerEmail} for SejalSuits`,
          source: input.tokenId,
          receipt_email: input.customerEmail,
        });
        // console.log('charge', charge);
        input.paymentId = charge.id;
        input.status = charge.status === 'succeeded' ? 'paid' : 'failed';
      } catch (error) {
        // console.error('payment error', error);
        throw new Error(`Payment failed: ${error.message}`);
      }

      // add to db
      // send array of products
      if (input.productIds) {
        input.products = input.productIds.map(item => ({
          _type: 'reference',
          _key: item,
          _ref: item,
        }));
      }
      delete input.tokenId;
      delete input.productIds;

      // insert order
      const doc = {
        _type: 'order',
        ...input,
        total: parseFloat(input.total),
      };
      const order = await sanity.create(doc);

      return { id: order._id, ...order };
    },
    validateCoupon: async (parent, args) => {
      const coupons = await sanity.fetch(
        '*[_type == "coupon" && code == $code] {email, password}',
        { code: args.code },
      );
      const coupon = first(coupons);
      if (!coupon) {
        throw new Error('Invalid coupon.');
      }
      return coupon;
    },
  },
};
