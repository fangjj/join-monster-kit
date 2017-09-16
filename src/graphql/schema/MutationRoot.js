import {
  GraphQLObjectType,
  GraphQLList,
  GraphQLNonNull,
  GraphQLString,
  GraphQLInt,
  GraphQLInputObjectType,
  GraphQLBoolean,
  GraphQLID,


} from 'graphql'

import {
  fromGlobalId,
  mutationWithClientMutationId,
  toGlobalId,

} from 'graphql-relay';

import joinMonster from 'join-monster'
import knex from '../data/database';
import dbCall from '../data/fetch';
import User from './User'
import format from 'pg-format';
import log4js from 'koa-log4';

const logger = log4js.getLogger('app')

const MutationRoot = new GraphQLObjectType({
  name: "MutationRoot",
  description: "mutations",
  fields: () => ({
    createAccount: mutationWithClientMutationId({
      name: 'createAccount',
      inputFields: {
        firstName: {
          type: new GraphQLNonNull(GraphQLString),
        },
        lastName: {
          type: new GraphQLNonNull(GraphQLString),
        },
        num_legs: {
          type: GraphQLInt
        },
      },
      outputFields: {
        user: {
          type: User,
          where: (usersTable, args, {account_id}) => {
            return `${usersTable}.id = ${account_id}`;
          },
          resolve: ({ account_id }, args, context, resolveInfo) => {
            //joinMonster的第二个参数context传递给where的第三个参数context
            //http://join-monster.readthedocs.io/en/latest/where/
            return joinMonster(resolveInfo, {account_id}, (sql) => dbCall(sql, knex, context))
          }
        },
      },
      mutateAndGetPayload: async (args, context, resolveInfo) => {
        const {firstName, lastName} =  args;
          const account_id = await knex('accounts').insert({
          first_name: firstName,
          last_name: lastName
        }).returning('id').then(r => r[0]);
        //field 的 resolve 返回值会传递给field（object）的resolve函数第一个参数
        return {account_id};
      },
    }),
    
    delAccount: mutationWithClientMutationId({
      name: 'delAccount',
      inputFields: {
        id: {
          type: new GraphQLNonNull(GraphQLInt),
        }
      },
      outputFields: {
        status: {
          type: GraphQLBoolean,
          resolve: async (parent, args, { status }, resolveInfo) => {
            return status;
          }
        }
      },
      mutateAndGetPayload: async (args, context, resolveInfo) => {
        const {id} =  args;
        await knex.transaction(async (t) => {
          if(!id) throw new GraphQLError('No input supplied');
          await knex('accounts').where({id}).delete();

        });
        //field 的 resolve 返回值会传递给field（object）的resolve函数第一个参数
        return {status:true};
      },
    }),
    delAccount2: mutationWithClientMutationId({
      name: 'delAccount2',
      inputFields: {
        id: {
          type: new GraphQLNonNull(GraphQLID),
        }
      },
      outputFields: {
        id: {
          type: GraphQLID,
          resolve: async (parent, args, { id }, resolveInfo) => {
            return id;
          }
        }
      },
      mutateAndGetPayload: async (args, context, resolveInfo) => {
        let {id} =  args;
        id = fromGlobalId(id).id;
        await knex.transaction(async (t) => {
          if(!id) throw new GraphQLError('No input supplied');
          await knex('accounts').where({id}).delete();
        });
        //field 的 resolve 返回值会传递给field（object）的resolve函数第一个参数
        return {id: args.id};
      },
    }),
    updateAccount: mutationWithClientMutationId({
      name: 'updateAccount',
      inputFields: {
        id: {
          type: new GraphQLNonNull(GraphQLInt),
        },
        firstName: {
          type: new GraphQLNonNull(GraphQLString),
        },
        lastName: {
          type: new GraphQLNonNull(GraphQLString),
        },
        num_legs: {
          type: GraphQLInt
        },
      },
      outputFields: {
        user: {
          type: User,
          where: (usersTable, args, {account_id}) => {
            return `${usersTable}.id = ${account_id}`;
          },
          resolve: ({ account_id }, args, context, resolveInfo) => {
            //joinMonster的第二个参数context传递给where的第三个参数context
            //http://join-monster.readthedocs.io/en/latest/where/
            return joinMonster(resolveInfo, {account_id}, (sql) => dbCall(sql, knex, context))
          }
        },
      },
      mutateAndGetPayload: async (args, context, resolveInfo) => {
        const {id, firstName, lastName} =  args;
          const account_id = await knex('accounts').update({
          first_name: firstName,
          last_name: lastName
        }).where({id}).returning('id').then(r => r[0]);
        //field 的 resolve 返回值会传递给field（object）的resolve函数第一个参数
        return {account_id};
      },
    }),


    updateAccount2: mutationWithClientMutationId({
      name: 'updateAccount2',
      inputFields: {
        id: {
          type: new GraphQLNonNull(GraphQLID),
        },
        firstName: {
          type: new GraphQLNonNull(GraphQLString),
        },
        lastName: {
          type: new GraphQLNonNull(GraphQLString),
        },
        num_legs: {
          type: GraphQLInt
        },
      },
      outputFields: {
        user: {
          type: User,
          where: (usersTable, args, {account_id}) => {
            return `${usersTable}.id = ${account_id}`;
          },
          resolve: ({ account_id }, args, context, resolveInfo) => {
            //joinMonster的第二个参数context传递给where的第三个参数context
            //http://join-monster.readthedocs.io/en/latest/where/
            return joinMonster(resolveInfo, {account_id}, (sql) => dbCall(sql, knex, context))
          }
        },
      },
      mutateAndGetPayload: async (args, context, resolveInfo) => {
        let {id, firstName, lastName} =  args;
        id = fromGlobalId(id).id;
        const account_id = await knex('accounts').update({
          first_name: firstName,
          last_name: lastName
        }).where({id}).returning('id').then(r => r[0]);
        //field 的 resolve 返回值会传递给field（object）的resolve函数第一个参数
        return {account_id};
      },
    }),

    updateUserComment: mutationWithClientMutationId({
      name: 'updateUserComment',
      inputFields: {
        id: {
          type: new GraphQLNonNull(GraphQLID),
        },
      },
      outputFields: {
        updateCommentIds: {
          type: new GraphQLList(GraphQLString),
          resolve: ({updateCommentIds}) => updateCommentIds,
        }
      },
      mutateAndGetPayload: async (args, context, resolveInfo) => {
        let {id, firstName, lastName} =  args;
        id = fromGlobalId(id).id;

        /*
          const account_id = await knex('comments').update({
            account_id: id,
          }).where({id}).returning('id').then(r => r[0]);
        */

        let updateCommentIds = [1,2,3];
        console.log(updateCommentIds.map(item => toGlobalId('Comment', item)));
        updateCommentIds = updateCommentIds.map(toGlobalId.bind(null, 'Comment'));
        return {updateCommentIds};
      },
    }),


  })
});



export default MutationRoot;