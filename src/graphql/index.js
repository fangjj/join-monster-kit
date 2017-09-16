import { GraphQLSchema } from 'graphql'

import QueryRoot from './schema/QueryRoot'
import MutationRoot from './schema/MutationRoot';

export default new GraphQLSchema({
  description: 'a test schema',
  query: QueryRoot,
  mutation: MutationRoot
})


