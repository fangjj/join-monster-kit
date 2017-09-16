import {
  GraphQLObjectType,
  GraphQLNonNull,
  GraphQLString,
  GraphQLID,
  GraphQLBoolean,
  GraphQLList,

} from 'graphql';

import {
  mutationWithClientMutationId,
  fromGlobalId,
  toGlobalId,
  cursorForObjectInConnection,
  offsetToCursor,
} from 'graphql-relay';

import {TodoEdge, Todo} from './Todo';
import knex from '../data/database';
import User from './User';
import JoinMonster from 'join-monster';
import dbCall from '../data/fetch';

import format from 'pg-format';
//https://www.npmjs.com/package/graphql-relay

const options = {dialect: 'pg'};

const addTodoMutation = mutationWithClientMutationId({
  name: "addTodoMutation",
  inputFields: {
    title: {
      description: "todo title",
      type: new GraphQLNonNull(GraphQLString),
    },
    text: {
      description: "todo text",
      type: GraphQLString,
    },
  },
  outputFields: {
    todoEdge: {
      description: "TodoEdge",
      type: TodoEdge,
      resolve: async ({localTodoId}, args, context, resolveInfo) => {
        const todo = await knex('todos').select().where({id: localTodoId}).then(r => r[0]);
        const allTodoIds = await knex('todos').select('id').then(r => r).map(r => r.id);
        const cursor = offsetToCursor(allTodoIds.indexOf(localTodoId));
        return {
          node: todo,
          cursor,
        };
      }
    },
    viewer: {
      description: "viewer",
      type: User,
      where: (userTable, args, {user_id}) => {
        return `${userTable}.id = ${user_id}`;
      },
      resolve: (parent, args, context, resolveInfo) => {
        return JoinMonster(resolveInfo, {user_id: 1}, (sql) => dbCall(sql, knex, context), options);
      }
    }
  },
  mutateAndGetPayload: async (args, context, resolveInfo) => {
    const {title, text} = args;
    const localTodoId = await knex('todos').insert({
      completed: false,
      title,
      text,
      user_id: 1,
      id: 100 + Math.floor(Math.random()* 100),
    }).returning('id').then(r => r[0]);
    return {localTodoId};
  }
});


const changeTodoStatusMutation = mutationWithClientMutationId({
  name: 'changeTodoStatusMutation',
  inputFields: {
    id: {
      description: "todo id",
      type: new GraphQLNonNull(GraphQLID),
    },
    completed: {
      description: "todo completed",
      type: new GraphQLNonNull(GraphQLBoolean)
    },
  },
  outputFields: {
    todo: {
      description: "todo",
      type: Todo,
      where: (todoTable, args, {localTodoId}) => {
        return `${todoTable}.id = ${localTodoId}`;
      },
      resolve: ({localTodoId}, args, context, resolveInfo) => {
        return JoinMonster(resolveInfo, {localTodoId}, (sql) => dbCall(sql, knex, context), options);
      }
    },
    viewer: {
      description: "viewer",
      type: User,
      where: (userTable, args, {user_id}) => {
        return `${userTable}.id = ${user_id}`;
      },
      resolve: (parent, args, context, resolveInfo) => {
        return JoinMonster(resolveInfo, {user_id: 1}, (sql) => dbCall(sql, knex, context), options);
      }
    }
  },
  mutateAndGetPayload: async (args, context, resolveInfo) => {
    let {id, completed} = args;
    id = fromGlobalId(id).id;
    const localTodoId = await knex('todos').update({
      completed,
    }).where({id}).returning('id').then(r => r[0]);
    return {localTodoId};
  }
});


const renameTodoMutation = mutationWithClientMutationId({
  name: 'renameTodoMutation',
  inputFields: {
    id: {
      description: "todo id",
      type: new GraphQLNonNull(GraphQLID),
    },
    title: {
      description: "todo title",
      type: new GraphQLNonNull(GraphQLString)
    },
    text: {
      description: "todo text",
      type: GraphQLString
    },
  },
  outputFields: {
    todo: {
      description: "todo",
      type: Todo,
      where: (todoTable, args, {localTodoId}) => {
        return `${todoTable}.id = ${localTodoId}`;
      },
      resolve: ({localTodoId}, args, context, resolveInfo) => {
        return JoinMonster(resolveInfo, {localTodoId}, (sql) => dbCall(sql, knex, context), options);
      }
    },
    viewer: {
      description: "viewer",
      type: User,
      where: (userTable, args, {user_id}) => {
        return `${userTable}.id = ${user_id}`;
      },
      resolve: (parent, args, context, resolveInfo) => {
        return JoinMonster(resolveInfo, {user_id: 1}, (sql) => dbCall(sql, knex, context), options);
      }
    }
  },
  mutateAndGetPayload: async (args, context, resolveInfo) => {
    let {id, text, title} = args;
    id = fromGlobalId(id).id;
    const localTodoId = await knex('todos').update({
      text,
      title,
    }).where({id}).returning('id').then(r => r[0]);
    return {localTodoId};
  }
});


const removeTodoMutation = mutationWithClientMutationId({
  name: "removeTodoMutation",
  inputFields: {
    id: {
      description: "todo id",
      type: new GraphQLNonNull(GraphQLID),
    },
  },
  outputFields: {
    deletedTodoId: {
      description: "deltedTodoId",
      type: GraphQLID,
      resolve: ({id}, args, context, resolveInfo) => {
        return id;
      }
    },
    viewer: {
      description: "viewer",
      type: User,
      where: (userTable, args, {user_id}) => {
        return `${userTable}.id = ${user_id}`;
      },
      resolve: (parent, args, context, resolveInfo) => {
        return JoinMonster(resolveInfo, {user_id: 1}, (sql) => dbCall(sql, knex, context), options);
      }
    }
  },
  mutateAndGetPayload: async (args, context, resolveInfo) => {
    const {id} = args;
    const localTodoId = fromGlobalId(id).id;
    await knex('todos').delete().where({id: localTodoId});
    return {id};
  }
});

const removeCompletedTodosMutation = mutationWithClientMutationId({
  name: "removeCompletedTodosMutation",
  inputFields: {},
  outputFields: {
    deletedTodoIds: {
      description: "deltedTodoId",
      type: new GraphQLList(GraphQLID),
      resolve: ({deletedTodoIds}, args, context, resolveInfo) => {
        return deletedTodoIds;
      }
    },
    viewer: {
      description: "viewer",
      type: User,
      where: (userTable, args, {user_id}) => {
        return `${userTable}.id = ${user_id}`;
      },
      resolve: (parent, args, context, resolveInfo) => {
        return JoinMonster(resolveInfo, {user_id: 1}, (sql) => dbCall(sql, knex, context), options);
      }
    }
  },
  mutateAndGetPayload: async (args, context, resolveInfo) => {
    const deletedTodoLocalIds = await knex('todos').delete().where({completed:true}).returning('id').then(r => r);
    const deletedTodoIds = deletedTodoLocalIds.map(deletedTodoId => toGlobalId('Todo', deletedTodoId));
    return {deletedTodoIds};
  }
});

const markAllTodosMutation = mutationWithClientMutationId({
  name: "markAllTodosMutation",
  inputFields: {
    completed: {
      description: "todo completed",
      type: new GraphQLNonNull(GraphQLBoolean)
    },
  },
  outputFields: {
    changedTodos: {
      description: "changedTodos",
      type: new GraphQLList(Todo),
      where: (todoTable, args, {changedTodoLocalIds}) => {
        return format(`${todoTable}.id in (%L)`, changedTodoLocalIds);
      },
      resolve: ({changedTodoLocalIds}, args, context, resolveInfo) => {
        return JoinMonster(resolveInfo, {changedTodoLocalIds}, (sql) => dbCall(sql, knex, context), options);
      }
    },
    viewer: {
      description: "viewer",
      type: User,
      where: (userTable, args, {user_id}) => {
        return `${userTable}.id = ${user_id}`;
      },
      resolve: (parent, args, context, resolveInfo) => {
        return JoinMonster(resolveInfo, {user_id: 1}, (sql) => dbCall(sql, knex, context), options);
      }
    }
  },
  mutateAndGetPayload: async (args, context, resolveInfo) => {
    const {completed} = args;
    const changedTodoLocalIds = await knex('todos').update({completed}).returning('id').then(r => r);
    return {changedTodoLocalIds};
  }
});

const MutationRoot = new GraphQLObjectType({
  name: "MutationRoot",
  description: "MutationRoot",
  fields: () => ({
    addTodo: addTodoMutation,
    changeTodoStatus: changeTodoStatusMutation,
    renameTodo: renameTodoMutation,
    removeTodo: removeTodoMutation,
    removeCompletedTodos: removeCompletedTodosMutation,
    markAllTodos: markAllTodosMutation,
  }),
});


export default MutationRoot;