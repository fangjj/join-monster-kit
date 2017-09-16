import path from 'path'

// connect to our database file
const dataFilePath = path.join(__dirname, '../data/demo-data.sl3')

// knex is a convenient library that can connect to various SQL databases
// you can use any library you wish


export default require('knex')({
  client: 'sqlite3',
  connection: {
    filename: dataFilePath
  },
  useNullAsDefault: true
})


/*
export default require('knex')({
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
  searchPath: 'knex,public'
});
*/