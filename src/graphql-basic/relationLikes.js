import {
  GraphQLObjectType,
  GraphQLList,
  GraphQLString,
  GraphQLInt
} from 'graphql'
import Comment from './Comment'
import User from './User'

const RelationLikes = new GraphQLObjectType({
  description: 'a likes',
  name: "RelationLikes1",
  sqlTable: 'likes',
  uniqueKey: ['account_id', 'comment_id'],
  fields: () => ({
    
    user: {
      type: User,
      sqlJoin: (likesTable, userTable) => `${likesTable}.account_id = ${userTable}.id`
    },
    
    comment: {
      type: Comment,
      sqlJoin: (likesTable, commentTable) => `${likesTable}.comment_id = ${commentTable}.id`
    },
    account_id: {
      type: GraphQLInt,
      sqlColumn: 'account_id'
    },
    comment_id: {
      type: GraphQLInt,
      sqlColumn: 'comment_id'
    },
    created_at: {
      type: GraphQLString,
      sqlColumn: 'created_at'
    },
  })
});

export default RelationLikes;