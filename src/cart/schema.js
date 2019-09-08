import { gql } from 'apollo-server';

const typeDefs = gql`
  type Product {
    id: ID!
    title: String
    slug: String
    status: String
  }

  type Order {
    id: ID!
    product: [Product!]!
    orderId: String!
    createTime: String
    customer: User!
    customerNotes: String
  }

  type Coupon {
    id: ID!
    name: String
    code: String
    status: String
    details: String
    discountPercentage: Int
    expiryDate: String
  }

  type CardToken {
    id: ID!
  }

  input VerifyCardInput {
    cardNumber: String!
    expMonth: String!
    expYear: String!
    cvc: String!
  }

  input OrderInput {
    tokenId: String!
    orderId: String!
    productIds: [String!]!
    customer: UserInput!
    customerNotes: String
  }

  type Query {
    order(orderId: String!): Order
  }

  type Mutation {
    verifyCard(input: VerifyCardInput!): CardToken
    createOrder(input: OrderInput!): Order
    validateCoupon(code: String!): Coupon
  }
`;

export default typeDefs;
