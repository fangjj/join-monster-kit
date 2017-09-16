import knex from '../data/database';
import Acl from 'acl';
import AclKnexBackend from 'acl-knex';

knex.schema.hasTable('acl_users').then(exists =>{
    if(!exists){
        let args = [null, null, null, 'acl_', null, null, null, knex];
        AclKnexBackend.setup(args);
    }
});


const acl = new Acl(new AclKnexBackend(knex, 'postgres', 'acl_'));

//console.log(acl);
/*
// guest is allowed to view blogs
acl.allow('guest', 'posts', 'view')

// allow function accepts arrays as any parameter
acl.allow('member', 'posts', ['edit', 'view', 'delete'])

acl.addUserRoles('joed', 'guest')
*/


export default acl;