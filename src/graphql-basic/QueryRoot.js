import {
  GraphQLObjectType,
  GraphQLList,
  GraphQLNonNull,
  GraphQLString,
  GraphQLInt
} from 'graphql'


import joinMonster from 'join-monster'
import knex from './database'
import dbCall from '../data/fetch'
import User from './User'
import format from 'pg-format';



const Product = new GraphQLObjectType({
  name: 'Product',
  // 自引用需要写成thunk形式
  fields: () => ({
    id: {
      type: GraphQLInt,
    },
    name: {
      type: GraphQLString,
    },
    description: {
      type: GraphQLString,
    },
    price: {
      type: GraphQLString
    },
    image_url: {
      type: GraphQLString,
    },
    created_at: {
      type: GraphQLString
    },
    updatedAt: {
      type: GraphQLString,
      resolve: (product) => product.updated_at
    },
    nextProduct: {
      type: Product,
      resolve: (product, args, {loaders}) => {
        return loaders.person.load((product.id || 0) + 1);
      }
    },
    relatedProduct: {
      type: new GraphQLList(Product),
      resolve: (product, args, {loaders}) => {
        const relatedProduct = [1,2,3,4,5,6,7,8,9];
        return loaders.person.loadMany(relatedProduct);      
      }
    }
  })
});

const queryRoot = new GraphQLObjectType({
  description: 'global query object',
  name: 'Query',
  fields: () => ({
    version: {
      type: GraphQLString,
      resolve: () => joinMonster.version
    },
    users: {
      type: new GraphQLList(User),
      args: {
        id: {
          description: 'The users ID number',
          type: new GraphQLList(GraphQLInt)
        },
        name: {
          type: GraphQLString
        }
      },
      // this function generates the WHERE condition
      where: (usersTable, args, context) => { // eslint-disable-line no-unused-vars
        return format(`${usersTable}.id in (%L) or (first_name = %L or last_name = %L)`, args.id, args.name, args.name)
      },
      orderBy: {
        id: "desc"
      },
      resolve: (parent, args, context, resolveInfo) => {
        // joinMonster with handle batching all the data fetching for the users and it's children. Determines everything it needs to from the "resolveInfo", which includes the parsed GraphQL query AST and your schema definition
        return joinMonster(resolveInfo, context, sql => dbCall(sql, knex, context))
      }
    },
    user: {
      type: User,
      args: {
        id: {
          description: 'The users ID number',
          type: new GraphQLNonNull(GraphQLInt)
        }
      },
      // this function generates the WHERE condition
      where: (usersTable, args, context) => { // eslint-disable-line no-unused-vars
        return `${usersTable}.id = ${args.id}`
      },
      resolve: (parent, args, context, resolveInfo) => {
        return joinMonster(resolveInfo, context, sql => dbCall(sql, knex, context))
      }
    },
    product: {
        type: Product,
        args: {
          id: {
            type: GraphQLInt
          }
        },
        resolve: (parent, args, {loaders}) => {
            return loaders.person.load(args.id);
        }
    },

    groupNum: {
      type: new GraphQLList(groupLikeNum),
      args: {
        minNum: {
          description: 'the min num',
          type: GraphQLInt
        }
      },
      // this function generates the WHERE condition
      
      where: (groupTable, args, context) => { // eslint-disable-line no-unused-vars
        const minNum = args.minNum || 0;
        return `${groupTable}.numComment > ${minNum}`;
      },
      
      orderBy: {
        numComment: "desc"
      },
      
      resolve: (parent, args, context, resolveInfo) => {
        // joinMonster with handle batching all the data fetching for the users and it's children. Determines everything it needs to from the "resolveInfo", which includes the parsed GraphQL query AST and your schema definition
        
        return joinMonster(resolveInfo, context, sql => dbCall(sql, knex, context))
      }
    },
  })
})

// select account_id, count(comment_id) as numComment from likes where comment_id > 5 group by account_id having count(comment_id) > 10
const groupLikeNum = new GraphQLObjectType({
  name: "groupLikeNum",
  sqlTable: `(select account_id, count(*) as numComment from likes group by account_id)`,
  uniqueKey: 'account_id',
  fields: () => ({
    account_id: {
      type: GraphQLInt,
      sqlColumn: 'account_id'
    },
    numComment: {
      type: GraphQLInt,
      sqlColumn: 'numComment'
    },
    user: {
      type: User,
      sqlJoin: (groupTable, userTable) => `${groupTable}.account_id = ${userTable}.id`,
    }
  }),
});

export default queryRoot;