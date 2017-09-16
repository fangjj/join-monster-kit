import path from 'path'
import knex from 'knex';

export default knex({
  client: 'pg',
  //versions: '7.2',
  connection: {
  	host : '127.0.0.1',
    user : 'jm',
    password : '123456',
    database : 'test'
  },
  pool: { min: 0, max: 7 },
  acquireConnectionTimeout: 10000,
  searchPath: 'knex,public',
  useNullAsDefault: true
});
