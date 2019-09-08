import Stripe from 'stripe';
import async from 'async';
import { first } from 'lodash';

import sanity from '../utils/sanity';

import config from '../utils/config';

export default {
  Mutation: {
    createOrder: async (parent, args) => {
      // get products
      const { input } = args;

      const totalCost = await new Promise(resolve => {
        let total = 0;
        async.each(
          input.productIds,
          async (productId, callback) => {
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
      const stripe = new Stripe(config.get('stripeKey'));
      try {
        const charge = await stripe.charges.create({
          amount: `${totalCost}00`,
          currency: 'gbp',
          description: `Order by ${input.customerEmail} for SejalSuits`,
          source: input.tokenId,
          receipt_email: input.customerEmail,
        });
        // console.log('charge', charge);
        input.stripeId = charge.id;
        input.status = charge.status;
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
