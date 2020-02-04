import convict from 'convict';
import fs from 'fs';
import dotenv from 'dotenv';

// to load .env file
dotenv.config();

const conf = convict({
  siteName: {
    doc: 'Site name.',
    default: 'GatsbyJS Ecommerce',
    env: 'SITE_NAME',
  },
  env: {
    doc: 'The application environment.',
    format: ['production', 'development', 'test'],
    default: 'development',
    env: 'NODE_ENV',
  },
  port: {
    doc: 'The port to bind.',
    format: 'port',
    default: 4000,
    env: 'PORT',
  },
  webAppUrl: {
    doc: 'Web app url',
    format: String,
    default: 'http://www.site.com',
    env: 'WEB_APP_URL',
  },
  adminEmail: {
    doc: 'Admin email ',
    format: String,
    default: 'no-reply@site.com',
    env: 'ADMIN_EMAIL',
  },
  jwtSecret: {
    doc: 'JWT secret.',
    format: String,
    default: 'abcabc123',
    env: 'JWTSECRET',
  },
  mailer: {
    user: {
      doc: 'Mailer user.',
      format: String,
      default: '',
    },
    password: {
      doc: 'Mailer password.',
      format: String,
      default: '',
    },
  },
  sanity: {
    projectId: {
      doc: 'Sanity Project ID.',
      format: String,
      default: '2jkk6tlv',
      env: 'SANITY_PROJECT_ID',
    },
    token: {
      doc: 'Sanity token.',
      format: String,
      default: '',
      env: 'SANITY_TOKEN',
    },
    dataset: {
      doc: 'Sanity dataset.',
      format: String,
      default: 'production',
      env: 'SANITY_DATASET',
    },
  },
  stripeKey: {
    doc: 'Stripe key',
    format: String,
    default: '',
    env: 'STRIPE_KEY',
  },
  razorpay: {
    id: {
      doc: 'Razorpay ID',
      format: String,
      default: 'key-here',
      env: 'RAZORPAY_ID',
    },
    secret: {
      doc: 'Razorpay Secret',
      format: String,
      default: 'secret-here',
      env: 'RAZORPAY_SECRET',
    },
  },
  telegram: {
    url: {
      doc: 'Telegram bot URL key',
      format: String,
      default: '',
      env: 'TELEGRAM_BOT',
    },
    chatId: {
      doc: 'Telegram ChatID',
      format: String,
      default: '',
      env: 'TELEGRAM_CHAT_ID',
    },
  },
});

const env = conf.get('env');
try {
  const path = `${__dirname}/${env}.json`;

  console.log('trying to access %s', path);
  fs.accessSync(path, fs.F_OK);

  conf.loadFile(path);
} catch (error) {
  console.log("file doesn't exist, loading defaults");
}

conf.validate({ allowed: 'strict' });

export default conf;
