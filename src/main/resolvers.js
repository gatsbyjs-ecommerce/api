import mailer from '../utils/mailer';
import config from '../utils/config';

export default {
  Query: {
    hello: () => 'Hello world!',
  },
  Mutation: {
    contact: async (parent, args) => {
      const { name, email, message } = args;

      const mailOptions = {
        to: config.get('adminEmail'),
        from: `${name} <${email}>`,
        subject: `${config.get('siteName')} Contact Form`,
        text: message,
      };

      try {
        await mailer.sendMail(mailOptions);
        return {
          status: 'success',
          message: 'Contact information sent successfully',
        };
      } catch (err) {
        return { status: 'error', message: err.message };
      }
    },
  },
};
