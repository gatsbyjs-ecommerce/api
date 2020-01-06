import { ApolloServer } from 'apollo-server-micro';
import { typeDefs, resolvers } from './utils/graphql';
import { isAuthenticated } from './utils/auth';

const cors = require('micro-cors')();

const server = new ApolloServer({
  typeDefs,
  resolvers,
  introspection: true,
  playground: true,
  context: async ({ req }) => ({
    user: await isAuthenticated(req),
  }),
});

const optionsHandler = (req, res) => {
  if (req.method === 'OPTIONS') {
    res.end();
    return;
  }
  return server.createHandler({ path: '/api' })(req, res);
};

module.exports = cors(optionsHandler);
