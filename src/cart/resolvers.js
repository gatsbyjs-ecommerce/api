import Stripe from 'stripe';
import async from 'async';
import randomstring from 'randomstring';
import { isEmpty, find } from 'lodash';

import config from '../utils/config';
import sanity from '../utils/sanity';
import razorpay from '../utils/razorpay';
import { sendTelegram } from '../utils/telegram';

const stripe = new Stripe(config.get('stripeKey'));

export default {
  Query: {
    order: async (parent, args) => {
      const order = await sanity.fetch(
        '*[_type == "order" && orderId == $orderId][0] {"id": _id, ...}',
        { orderId: args.orderId },
      );

      return order;
    },
  },
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
      console.log('input', input.country);
      const gateway = args.gateway || 'stripe';
      const country = input.country || 'United States of America';
      const currencyCode = input.currencyCode || 'usd';

      // check if customer exists else create it
      let user = await sanity.fetch(
        '*[_type == "customer" && email == $email][0] {"id": _id, ...}',
        { email: input.customer.email.toLowerCase() },
      );

      if (isEmpty(user)) {
        // user does not exists, so create a new user
        const doc = {
          _type: 'customer',
          email: input.customer.email,
          // password: hashedPassword, // TODO: auto gen password
          status: 'active',
          fullName: input.customer.fullName,
          address: input.customer.address,
        };
        user = await sanity.create(doc);
        // TODO: send user logins
      }

      // add shipping address
      input.shippingAddress = input.customer.address;
      input.customer = {
        _type: 'reference',
        _key: user.id,
        _ref: user.id,
      };

      const totalCosts = await new Promise(resolve => {
        let total = 0;
        let totalShipping = 0;
        async.each(
          input.products,
          async (item, callback) => {
            // get products
            const product = await sanity.getDocument(item.id);
            if (product) {
              // get selected variant
              const variant = find(product.otherVariants, { sku: item.sku });
              let price = find(variant.pricing, { country });
              let shippingPrice = find(product.shippingCost, { country });
              if (!price) {
                // if no country, use USD as default
                const defaultCountry = 'United States of America';
                price = find(variant.pricing, {
                  country: defaultCountry,
                });
                shippingPrice = find(variant.shippingCost, {
                  country: defaultCountry,
                });
              }
              total +=
                price.discountPrice > 0 ? price.discountPrice : price.price;
              // calculate total shipping
              if (shippingPrice) {
                totalShipping += shippingPrice.price;
              }
            }
            callback();
          },
          () => {
            resolve({ total, totalShipping });
          },
        );
      });
      let totalCost = totalCosts.total;
      const totalShippingCost = totalCosts.totalShipping;
      totalCost -= input.discount;
      input.shipping = totalShippingCost;
      const grandTotal = totalCost + totalShippingCost;
      input.total = grandTotal.toString();

      sendTelegram(`
      *New ${config.get('siteName')} Order: ${input.orderId}*
      - Amount: ${input.total}
      [Order Link](https://sixin.sanity.studio/desk/order)
      `);

      let charge;
      // process payment with stripe
      try {
        if (gateway === 'stripe') {
          const paymentData = {
            amount: `${grandTotal}00`,
            currency: currencyCode,
            description: `Order by ${input.customer.email} for ${config.get(
              'siteName',
            )}`,
            source: input.tokenId,
            receipt_email: input.customer.email,
          };
          // console.log('paymentData', paymentData);
          charge = await stripe.charges.create(paymentData);

          // console.log('charge', charge);
          input.paymentId = charge.id;
          input.status = charge.status === 'succeeded' ? 'paid' : 'failed';
        } else if (gateway === 'razorpay') {
          const options = {
            amount: `${grandTotal}00`,
            currency: 'INR',
            receipt: randomstring.generate(),
            payment_capture: '1',
          };
          charge = await razorpay.orders.create(options);

          // console.log('charge', charge);
          input.paymentId = charge.id;
          input.status = charge.status === 'created' ? 'pending' : 'failed';
        }
      } catch (error) {
        // console.error('payment error', error);
        throw new Error(`Payment failed: ${error.message}`);
      }

      // add to db
      // send array of products
      if (input.products) {
        input.skus = input.products.map(item => item.sku);
        input.devices = input.products.map(item => item.device);
        input.products = input.products.map(item => ({
          _type: 'reference',
          _key: item.id,
          _ref: item.id,
        }));
      }
      delete input.tokenId;

      // insert order
      // console.log('input', input);
      const doc = {
        _type: 'order',
        ...input,
        total: parseFloat(input.total),
      };
      const order = await sanity.create(doc);

      return { id: order._id, ...order };
    },
    updateOrder: async (parent, args) => {
      const { input } = args;

      const order = await sanity.fetch(
        '*[_type == "order" && orderId == $orderId][0] {"id": _id, ...}',
        { orderId: input.orderId },
      );
      if (!order) {
        throw new Error('Invalid order.');
      }

      await sanity
        .patch(order._id)
        .set({ status: input.status })
        .commit();

      return order;
    },
    validateCoupon: async (parent, args) => {
      const coupon = await sanity.fetch(
        '*[_type == "coupon" && code == $code][0] {"id": _id, ...}',
        { code: args.code.toUpperCase() },
      );
      if (isEmpty(coupon)) {
        throw new Error('Invalid coupon.');
      }

      return coupon;
    },
  },
};
