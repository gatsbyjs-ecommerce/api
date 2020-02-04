import { gql } from 'apollo-server-micro';

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
    paymentId: String
    total: Int
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

  input OrderProductInput {
    id: ID!
    sku: String!
    device: String!
  }

  input OrderInput {
    id: String
    tokenId: String!
    orderId: String!
    products: [OrderProductInput!]!
    customer: UserInput!
    customerNotes: String
    status: String
    discount: Int
    country: String
    currencyCode: String
  }

  input OrderUpdateInput {
    orderId: String
    status: String
  }

  type Query {
    order(orderId: String!): Order
  }

  type Mutation {
    verifyCard(input: VerifyCardInput!): CardToken
    createOrder(input: OrderInput!, gateway: String): Order
    updateOrder(input: OrderUpdateInput!): Order
    validateCoupon(code: String!): Coupon
  }
`;

export default typeDefs;
