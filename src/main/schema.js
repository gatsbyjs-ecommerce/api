import { gql } from 'apollo-server-micro';

const typeDefs = gql`
  type Query {
    hello: String
  }

  type Subscriber {
    email: String
  }

  type Mutation {
    contact(email: String!, name: String!, message: String!): Subscriber
  }
`;

export default typeDefs;
