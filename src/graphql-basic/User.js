import {
  GraphQLObjectType,
  GraphQLList,
  GraphQLString,
  GraphQLInt,
  GraphQLFloat
} from 'graphql'

import knex from './database'
import Comment from './Comment'
import Post from './Post'
import Authored from './Authored'
import RelationLikes from './relationLikes'


const User = new GraphQLObjectType({
  description: 'a stem contract account',
  name: 'User',
  // tell join monster the expression for the table
  //sqlTable: 'accounts',
  sqlTable: 'accounts',
  // one of the columns must be unique for deduplication purposes
  uniqueKey: 'id',
  fields: () => ({
    id: {
      // no `sqlColumn` and no `resolve`. assumed that the column name is the same as the field name: id
      type: GraphQLInt,
      // Some external libraries add resolvers to your schema, such as Optics, or the logger option in graphql-tools. If using one of these, sqlColumn cannot be omitted.
      sqlColumn: 'id'
    },
    email_address: {
      type: GraphQLString,
      // specify the SQL column
      sqlColumn: 'email_address'
    },
    email: {
      type: GraphQLString,
      // specify the SQL column
      sqlColumn: 'email_address'
    },

    idEncoded: {
      description: 'The ID base-64 encoded',
      type: GraphQLString,
      sqlColumn: 'id',
      // specifies SQL column and applies a custom resolver
      resolve: user => toBase64(user.idEncoded)
    },

    fullName: {
      description: 'A user\'s first and last name',
      type: GraphQLString,
      // depends on multiple SQL columns
      sqlDeps: [ 'first_name', 'last_name' ],
      resolve: user => `${user.first_name} ${user.last_name}`
    },

    fullNameAnotherWay: {
      type: GraphQLString,
      // or you could use a raw SQL expression
      sqlExpr: table => `${table}.first_name || ' ' || ${table}.last_name`
    },
    
    numComments: {
      type: GraphQLInt,
      sqlExpr: (table, args, context) => `(SELECT count(*) FROM comments WHERE author_id = ${table}.id)`
    },
    
    
    posts: {
      description: 'A list of Posts the user has written',
      // has another GraphQLObjectType as a field
      type: new GraphQLList(Post),
      // this is a one-to-many relation
      // this function tells join monster how to join these tables
      sqlJoin: (userTable, postTable) => `${userTable}.id = ${postTable}.author_id`,
      orderBy: 'id'
    },
    
    comments: {
      description: 'Comments the user has written on people\'s posts',
      // another one-to-many relation
      type: new GraphQLList(Comment),
      // only JOIN comments that are not archived
      sqlJoin: (userTable, commentTable) => `${userTable}.id = ${commentTable}.author_id AND ${commentTable}.archived = (0 = 1)`,
      orderBy: { id: 'DESC' }
    },
    // add the closeness to the User instead
    closeness: {
      type: GraphQLString
    },
    following: {
      description: 'Users that this user is following',
      type: new GraphQLList(User),
      // many-to-many is supported too, via an intermediate join table
      junction: {
        sqlTable: 'relationships',
        uniqueKey: ['follower_id','followee_id'],
        include: {
          closeness: {
            sqlColumn: 'closeness'
          }
        },
        include: {
          closeness: {
            sqlColumn: 'closeness'
          }
        },
        sqlJoins: [
          (followerTable, relationTable) => `${followerTable}.id = ${relationTable}.follower_id`,
          (relationTable, followeeTable) => `${relationTable}.followee_id = ${followeeTable}.id`
        ]
      }
    },
    followed: {
      description: 'Users that this user is followed',
      type: new GraphQLList(User),
      // many-to-many is supported too, via an intermediate join table
      junction: {
        sqlTable: 'relationships',
        uniqueKey: ['follower_id','followee_id'],
        include: {
          closeness: {
            sqlColumn: 'closeness'
          }
        },
        include: {
          closeness: {
            sqlColumn: 'closeness'
          }
        },
        sqlJoins: [
          (followeeTable, relationTable) => `${followeeTable}.id = ${relationTable}.follower_id`,
          (relationTable, followerTable) => `${relationTable}.followee_id = ${followerTable}.id`
        ]
      }
    },
    likers: {
      description: 'Users who liked this comment',
      type: new GraphQLList(Comment),
      junction: {
        sqlTable: 'likes',
        sqlJoins: [
          (accountTable, likeTable) => `${accountTable}.id = ${likeTable}.account_id`,
          (likeTable, commentTable) => `${likeTable}.comment_id = ${commentTable}.id`
        ]
      }
    },
    likersNum: {
      description: 'users like how many likes',
      type: GraphQLInt,
      sqlExpr: (tableName, args, contex) => {
        return `(select count(*) from likes where comment_id > 5 and account_id = ${tableName}.id)`;
      }
    },
    relationLikes: {
      description: "RelationLikes",
      type: new GraphQLList(RelationLikes),
      sqlJoin: (userTable, likesTable) => `${userTable}.id = ${likesTable}.account_id`
    },
    
    
    followerRelation: {
      description: "follower",
      type: new GraphQLList(Relationships),
      sqlJoin: (userTable, relationshipsTable) => `${userTable}.id = ${relationshipsTable}.follower_id`
    },
    followeeRelation: {
      description: "followee",
      type: new GraphQLList(Relationships),
      sqlJoin: (userTable, relationshipsTable) => `${userTable}.id = ${relationshipsTable}.followee_id`
    },
    
    favNums: {
      type: new GraphQLList(GraphQLInt),
      // you can still have resolvers that get data from other sources. simply omit the `sqlColumn` and define a resolver
      resolve: () => [1, 2, 3]
    },
    num: {
      type: GraphQLInt,
      resolve: () => knex.raw(`select count(*) as num from accounts`).then(num => num[0].num)
    },
    num2: {
      type: GraphQLInt,
      //sqlExpr: (table) => `(select count(*) from ${table})`, //error
      sqlExpr: (table) => `(select count(*) from accounts)`
    },
    numLegs: {
      description: 'How many legs this user has',
      type: GraphQLInt,
      sqlColumn: 'num_legs'
    },

    // object types without a `sqlTable` are a no-op. Join Monster will ignore it and let you resolve it another way!
    luckyNumber: {
      type: new GraphQLObjectType({
        name: 'LuckyNumber',
        fields: {
          value: { type: GraphQLFloat }
        }
      }),
      resolve: () => {
        return knex.raw('SELECT random() AS num').then(num => ({ value: num[0].num }))
      }
    },
    luckyNumber2: {
      type: GraphQLFloat,
      resolve: () => {
        return knex.raw('SELECT random() AS num').then(num => (num[0].num))
      }
    },
    
    writtenMaterial: {
      // use an interface type
      type: new GraphQLList(Authored),
      orderBy: 'id',
      sqlJoin: (userTable, unionTable) => `${userTable}.id = ${unionTable}.author_id`
    }
    
  })
})




const Relationships = new GraphQLObjectType({
  description: 'a relationships',
  name: "relationships",
  sqlTable: 'relationships',
  uniqueKey: ['follower_id','followee_id'],
  fields: () => ({
    followee: {
      type: User,
      sqlJoin: (relationTable, followeeTable) => `${relationTable}.followee_id = ${followeeTable}.id`
    },
    follower: {
      type: User,
      sqlJoin: (relationTable, followerTable) => `${relationTable}.follower_id = ${followerTable}.id`
    },
    created_at: {
      type: GraphQLString
    },
    closeness: {
      type: GraphQLString
    }
  })
});


export default User 

function toBase64(clear) {
  return Buffer.from(String(clear)).toString('base64')
}
