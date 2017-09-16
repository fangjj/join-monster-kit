/**
 * Created by jm on 17/9/16.
 */
import {
  GraphQLObjectType,
  GraphQLInt,
  GraphQLString,

} from 'graphql';

import {
  globalIdField,
  connectionArgs,
  forwardConnectionArgs,

} from 'graphql-relay';

import {nodeInterface} from './Node';
import {TodoConnection} from './Todo';
import knex from '../data/database';

const User = new GraphQLObjectType({
  name: "User",
  description: "User",
  interfaces: [nodeInterface],
  sqlTable: "users",
  uniqueKey: "id",
  fields: () => ({
    id: {
      description: "user id",
      ...globalIdField(),
      sqlColumn: "id",

    },
    todos: {
      description: "user's todos",
      type: TodoConnection,
      args: {
        status: {
          description: "todo's status",
          type: GraphQLString,
          defaultValue: "any",
        },
        ...connectionArgs,
      },
      sqlPaginate: true,
      sortKey: {
        key: "id",
        order: "desc",
      },
      where: (table, args, context) => {
        let where = '';
        if(args.status == 'true'){
          where = `${table}.completed = true`;
        }else if(args.status == 'false'){
          where = `${table}.completed = false`;
        }
        return where;
      },
      sqlJoin: (parentTable, childTable, args, context) => `${parentTable}.id = ${childTable}.user_id`
    },
    todos2: {
      description: "user's toods2",
      type: TodoConnection,
      args: {
        status: {
          description: "todo's status",
          type: GraphQLString,
          defaultValue: "any",
        },
        ...forwardConnectionArgs,
      },
      sqlPaginate: true,
      orderBy: {
        id: "desc",
      },
      where: (table, args, context) => {
        let where = '';
        if(args.status == 'true'){
          where = `${table}.completed = true`;
        }else if(args.status == 'false'){
          where = `${table}.completed = false`;
        }
        return where;
      },
      sqlJoin: (userTable, todoTable, args, context) => `${userTable}.id = ${todoTable}.user_id`
    },
    //http://join-monster.readthedocs.io/en/latest/API/#sqlExpr
    totalCount: {
      description: "all todos count",
      type: GraphQLInt,
      sqlExpr: (userTable, args, context) => `(select count(*) from todos where ${userTable}.id = todos.user_id)`
    },

    completedCount: {
      description: "completed todos count",
      type: GraphQLInt,
      sqlExpr: (userTable, args, context) => `(select count(*) from todos where ${userTable}.id = todos.user_id and todos.completed = true)`
    }
    /*
    //http://join-monster.readthedocs.io/en/latest/API/#sqlExpr
    totalCount2: {
      description: "all todos count",
      type: new GraphQLObjectType({
        name: "totalCount2",
        fields: () => ({
          value: {
            type: GraphQLInt
          }
        }),
      }),
      resolve: (parent, args, context, resolveInfo) => {
        return knex.raw('SELECT count(*) AS num from todos where todos.user_id = ').then(num => ({ value: num.rows[0].num }))
      }
    },
     */




  })
});


export default User;