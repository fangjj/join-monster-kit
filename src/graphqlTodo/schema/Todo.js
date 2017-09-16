/**
 * Created by jm on 17/9/16.
 */
import {
  GraphQLObjectType,
  GraphQLString,
  GraphQLBoolean,
  GraphQLInt,

} from 'graphql';

import {
  globalIdField,
  connectionDefinitions,

} from 'graphql-relay';

import {nodeInterface} from './Node';

const Todo = new GraphQLObjectType({
  name: "Todo",
  description: "Todo",
  interfaces: [nodeInterface],
  sqlTable: "todos",
  uniqueKey: "id",
  fields: () => ({
    id: {
      description: "todo id",
      ...globalIdField(),
      sqlColumn: "id"
    },
    title: {
      description: "todo title",
      type: GraphQLString,
      sqlColumn: "title",
    },
    text: {
      description: "todo text",
      type: GraphQLString,
      sqlColumn: "text",
    },
    completed: {
      description: "todo completed",
      type: GraphQLBoolean,
      sqlColumn: "completed",
    }
  }),
});

//https://www.npmjs.com/package/graphql-relay
//http://join-monster.readthedocs.io/en/latest/pagination/
const {
    connectionType: TodoConnection,
    edgeType: TodoEdge,
  } = connectionDefinitions({
  nodeType: Todo,
  connectionFields: {
    total: { type: GraphQLInt }
  },
});


export {TodoConnection, TodoEdge, Todo};