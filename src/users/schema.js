import { gql } from 'apollo-server-micro';

const typeDefs = gql`
  enum UserStatus {
    active
    notActive
    banned
  }

  type Success {
    success: Boolean
  }

  type Address {
    addressLine1: String!
    addressLine2: String
    city: String!
    state: String!
    postcode: String!
    country: String
    telephone: String!
  }

  type User {
    id: ID!
    email: String
    status: UserStatus
    fullName: String
    address: Address
  }

  type JwtUser {
    jwt: String
    user: User
  }

  input AddressInput {
    addressLine1: String!
    addressLine2: String
    city: String!
    state: String!
    postcode: String!
    country: String
    telephone: String
  }

  input UserInput {
    email: String!
    fullName: String!
    address: AddressInput
  }

  input RegisterInput {
    email: String!
    password: String!
  }
  input UpdateUserInput {
    email: String
    oldPassword: String
    newPassword: String
  }
  input LoginInput {
    email: String!
    password: String!
  }
  input ForgotPasswordInput {
    email: String!
  }
  input SetNewPassword {
    token: String!
    password: String!
  }

  # This type specifies the entry points into our API. In this case
  # there is only one - "me" - which returns a current user.
  type Query {
    me: User # returns a current user
  }

  # The mutation root type, used to define all mutations.
  type Mutation {
    register(input: RegisterInput): JwtUser
    login(input: LoginInput): JwtUser
    updateMe(input: UpdateUserInput): User
    forgotPassword(input: ForgotPasswordInput): Success
    setNewPassword(input: SetNewPassword): Success
  }
`;

export default typeDefs;
