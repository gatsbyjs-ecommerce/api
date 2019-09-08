import { isEmpty } from 'lodash';
import randomstring from 'randomstring';

import { generateToken, hashPassword, comparePassword } from '../utils/auth';
import mailer, { renderTemplate } from '../utils/mailer';
import config from '../utils/config';
import sanity from '../utils/sanity';

export default {
  Query: {
    me: async (root, args, ctx) => {
      if (!ctx.user) {
        throw new Error('Not logged in');
      }

      const user = await sanity.getDocument(ctx.user.id);
      return user;
    },
  },
  Mutation: {
    register: async (root, args) => {
      const { email, password } = args.input;

      // check if user already exists
      let user = await sanity.fetch(
        '*[_type == "customer" && email == $email][0] {"id": _id, ...}',
        { email: email.toLowerCase() },
      );

      if (user) {
        throw new Error('E-mail already registered.');
      }

      const hashedPassword = await hashPassword(password);

      // create customer

      const doc = {
        _type: 'customer',
        email,
        password: hashedPassword,
        status: 'active',
      };
      user = await sanity.create(doc);
      user.id = user._id;

      // send welcome email
      // const [html, subject] = await renderTemplate('welcome', {
      //   user,
      // });
      // const mailOptions = {
      //   to: `"Site User" <${user.email}>`,
      //   from: config.get('adminEmail'),
      //   subject,
      //   html,
      // };
      // await mailer.sendMail(mailOptions);

      const token = generateToken(user);
      return { user, jwt: token };
    },
    login: async (root, args) => {
      const { email, password } = args.input;

      // check if user  exists
      const user = await sanity.fetch(
        '*[_type == "customer" && email == $email][0] {"id": _id, ...}',
        { email: email.toLowerCase() },
      );

      if (!user) {
        throw new Error('Invalid username or password.');
      }
      const isPasswordValid = await comparePassword(password, user.password);
      if (!isPasswordValid) {
        throw new Error('Invalid username or password.');
      }

      const token = generateToken(user);
      return { user, jwt: token };
    },
    updateMe: async (root, { input }, ctx) => {
      if (!ctx.user) {
        throw new Error('Not logged in');
      }

      const objUpdate = {};
      const objFind = { _id: ctx.user.id };

      // update user
      if (input.email) {
        objUpdate.email = input.email;
      }

      // if user obj not empty
      if (!isEmpty(objUpdate)) {
        // TODO:
        // await User.updateOne(objFind, objUpdate);
      }

      // TODO:
      return {};
      // return User.findOne({ _id: ctx.user.id });
    },
    forgotPassword: async (root, { input }) => {
      const resetPasswordToken = randomstring.generate();
      const webAppUrl = config.get('webAppUrl');

      // TODO:
      // await User.updateOne({ email: input.email }, { resetPasswordToken });

      const [html, subject] = await renderTemplate('forgot-password', {
        resetPasswordLink: `${webAppUrl}/set-password/${resetPasswordToken}`,
      });
      const mailOptions = {
        to: `"Site User" <${input.email}>`,
        from: config.get('adminEmail'),
        subject,
        html,
      };
      await mailer.sendMail(mailOptions);

      return { success: true };
    },
    setNewPassword: async (root, { input }) => {
      // TODO:
      const user = {};
      // const user = await User.findOne({ resetPasswordToken: input.token });

      if (!user) {
        throw new Error('Invalid password reset token provided.');
      }

      user.password = input.password;
      user.resetPasswordToken = null;
      await user.save();

      return { success: true };
    },
  },
};
