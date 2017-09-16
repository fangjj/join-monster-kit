import {
  GraphQLObjectType,
  GraphQLList,
  GraphQLNonNull,
  GraphQLString,
  GraphQLInt,
  GraphQLInputObjectType,

} from 'graphql'

import joinMonster from 'join-monster'
import knex from './database'
import dbCall from '../data/fetch'
import User from './User'
import format from 'pg-format';
import log4js from 'koa-log4';

const logger = log4js.getLogger('app')


const createUserInput = new GraphQLInputObjectType({
  name: 'createUserInput',
  fields: () => ({
    firstName: {
      type: new GraphQLNonNull(GraphQLString),
    },
    lastName: {
      type: new GraphQLNonNull(GraphQLString),
    },
    num_legs: {
      type: GraphQLInt
    },
  })
});

const MutationRoot = new GraphQLObjectType({
  name: "MutationRoot",
  description: "mutations",
  fields: () => ({
    createAccount: {
      type: new GraphQLObjectType({
      	name: 'createAccountPalyload',
      	fields: () => ({
      		createAccount: {
      			type: User,
      			where: (usersTable, args, {account_id}) => {
      				return `${usersTable}.id = ${account_id}`;
      			},
      			resolve: ({ account_id }, args, context, resolveInfo) => {
      				//joinMonster的第二个参数context传递给where的第三个参数context
      				//http://join-monster.readthedocs.io/en/latest/where/
      				return joinMonster(resolveInfo, {account_id}, (sql) => dbCall(sql, knex, context))
      			}
      		}
      	})
      }),
      description: "create a account",
      args: {
      	input: {
      		type: new GraphQLInputObjectType({
      			name: 'createAccountInput',
      			fields: () => ({
      				firstName: {
      					type: new GraphQLNonNull(GraphQLString),
      				},
      				lastName: {
      					type: new GraphQLNonNull(GraphQLString),
      				},
      				num_legs: {
      					type: GraphQLInt
      				},
      			})
      		})
      	}
      },
      resolve: async (parent, args, ctx, resolveInfo) => {
      	const {input: {firstName, lastName}} =  args;
      	const account_id = await knex('accounts').insert({
      		first_name: firstName,
      		last_name: lastName
      	}).returning('id').then(r => r[0]);
      	//field 的 resolve 返回值会传递给field（object）的resolve函数第一个参数
      	return {account_id};
      }
    },

    createUser: {
      type: User,
      args: {
        input: {
          type: createUserInput
        }
      },
      where: async (usersTable, args, context) => {
        const {input: {firstName, lastName}} =  args;
        const user_id = await knex('accounts').insert({
          first_name: firstName,
          last_name: lastName
        }).returning('id').then(r => r[0]);
        return `${usersTable}.id = ${user_id}`;
      },
      resolve: (parent, args, context, resolveInfo) => {
        return joinMonster(resolveInfo, {}, (sql) => dbCall(sql, knex, context))
      }
    },

    createUser2: {
      type: User,
      args: {
        input: {
          type: createUserInput
        }
      },
      where: (usersTable, args, {user_id}) => {
        return `${usersTable}.id = ${user_id}`;
      },
      resolve: async (parent, args, context, resolveInfo) => {
        /*
        return await new Promise((resolve, rejet) => {
          setTimeout(resolve, 5000, 'done');
        })
        */
        const {input: {firstName, lastName}} =  args;

        logger.info('%s - %s', firstName, lastName);
        const user_id = await knex('accounts').insert({
          first_name: firstName,
          last_name: lastName
        }).returning('id').then(r => r[0]);
        return joinMonster(resolveInfo, {user_id}, (sql) => dbCall(sql, knex, context))
        
      }
    }

  })
});



export default MutationRoot;