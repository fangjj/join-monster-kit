/**
 * Created by jm on 17/9/16.
 */

import {
  nodeDefinitions,
  fromGlobalId,

} from 'graphql-relay';

import JoinMonster from 'join-monster';
import dbCall from '../data/fetch';
import knex from '../data/database';

//https://www.npmjs.com/package/graphql-relay
//https://www.npmjs.com/package/graphql-relay
//http://join-monster.readthedocs.io/en/latest/relay/
const options = {dialect: 'pg'};

const {nodeInterface, nodeField} = nodeDefinitions(
  (globalId, context, resolveInfo) => {
    const {type, id} = fromGlobalId(globalId);
    return JoinMonster.getNode(type, resolveInfo, context, parseInt(id), (sql) => dbCall(sql, knex, context), options);
  },
  (obj) => obj.__type__
);

export {nodeInterface, nodeField};