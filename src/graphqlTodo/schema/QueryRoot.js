import {
  GraphQLObjectType,
  GraphQLInt,
  GraphQLNonNull,
} from 'graphql';

import User from './User';
import JoinMonster from 'join-monster';
import dbCall from '../data/fetch';
import knex from '../data/database';
import {nodeField} from './Node';

const options = {dialect: 'pg'};

const QueryRootTodo = new GraphQLObjectType({
  name: "QueryRoot",
  description: "QueryRootTodo",
  fields: () => ({
    viewer: {
      type: User,
      args: {
        id: {
          type: new GraphQLNonNull(GraphQLInt),
          description: "the user id",
        }
      },
      where: (userTable, args, context) => {
        return `${userTable}.id = ${args.id}`;
      },
      resolve: (parent, args, context, resolveInfo) => {
        return JoinMonster(resolveInfo, context, (sql) => dbCall(sql, knex, context), options);
      }
    },
    node: nodeField
  }),
});

export default QueryRootTodo;