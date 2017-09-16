/**
 * Created by jm on 17/9/16.
 */
import path from 'path';
import Koa from 'koa';
import KoaRouter from 'koa-router';
import graphqlHTTP from 'koa-graphql';
// module we created that lets you serve a custom build of GraphiQL
import graphiql from 'koa-custom-graphiql';
import koaStatic from 'koa-static';
import koaConvert from 'koa-convert';
import koaCors from 'kcors';
import OpticsAgent from 'optics-agent';
import schemaRelay from './src/graphqlTodo/index';
import DataLoader from 'dataloader';
import fetch from 'node-fetch';
import { koa as voyagerMiddleware } from 'graphql-voyager/middleware';
import timeout from 'koa-timeout-v2';
import {error}  from 'koa-2-error-handler';
import depthLimit from 'graphql-depth-limit';
import log4js from 'koa-log4';
import fs from 'fs';
import { createComplexityLimitRule } from 'graphql-validation-complexity';
import { GraphQLError, parse, validate } from 'graphql';

const app = new Koa();
const router = new KoaRouter();

/**
 * make a log directory, just in case it isn't there.
 */

const logDir = path.join(__dirname, 'logs');
try {
  fs.mkdirSync(logDir);
} catch (e) {
  if (e.code != 'EEXIST') {
    console.error('Could not set up log directory, error was: ', e);
    process.exit(1);
  }
}

log4js.configure(path.join(__dirname, 'log4js.json'), { cwd: logDir });

const logger = log4js.getLogger('app');
const httpLogger = log4js.koaLogger(log4js.getLogger('http'), { level: 'auto' });
const startUpLogger = log4js.getLogger('startup');


//设置httpLogger
app.use(httpLogger);



//设置错误处理中间件
app.use(error((err, ctx) => {
  ctx.body = {
    message: err.message
  };
  //console.error(err);
  logger.error('server error', err, ctx);
}));

//设置超时中间件
const callback = (context, delay) => {
  //console.log(context);
  //console.warn(delay);
};

app.use(timeout(500,{
  callback,
  status:503,
  message:'service unavailable'
}));


app.use(koaConvert(koaCors()));



router.get('/graphql-relay', graphiql({
  url: '/graphql-relay',
  css: '/graphiql.css',
  js: '/graphiql.js'
}));



router.all('/voyager-relay', voyagerMiddleware({
  endpointUrl: '/graphql-relay',
  displayOptions: {
    sortByAlphabet: true,
    skipRelay: false,
  }
}));

const BASE_URL = "http://localhost:8080";
const getProductByUrl = (id) => {
  return fetch(`${BASE_URL}/products/${id}.json`).then(res => res.json()).then(json => json)
};



const schemaRelayOpt = OpticsAgent.instrumentSchema(schemaRelay);
app.use(OpticsAgent.koaMiddleware());

router.post('/graphql-relay', koaConvert(graphqlHTTP(async (request, response, context) => {
  const personLoader = new DataLoader(
    keys => Promise.all(keys.map(getProductByUrl))
  );
  const loaders = {person: personLoader};

  // create an optic context
  const opticsContext = OpticsAgent.context(context.request);
  // create a context for each request
  context.opticsContext = opticsContext;
  context.loaders = loaders;

  return {
    schema: schemaRelayOpt,
    validationRules: [
      depthLimit(10,
        //{ ignore: [ /kk$/, 'idontcare' ] },
        //depths => console.log(depths)
      ),
      createComplexityLimitRule(1000, {
        onCost: (cost) => {
          console.log('query cost:', cost);
        },
        formatErrorMessage: cost => (
          `query with cost ${cost} exceeds complexity limit`
        ),
        /*
         createError(cost, documentNode) {
         const error = new GraphQLError('custom error', [documentNode]);
         error.meta = { cost };
         return error;
         },
         introspectionListFactor: 10, // Default is 2.
         scalarCost: 1,
         objectCost: 10, // Default is 0.
         listFactor: 20, // Default is 10.
         */
      })
    ],
    context,
    formatError: err => {
      //console.error(e)
      logger.error('server error', err, context)
      return err
    }
  };
})))

router.redirect('/', '/graphql-relay');

app.use(router.routes());
app.use(router.allowedMethods());
// serve the custom build of GraphiQL
app.use(koaStatic(path.join(__dirname, 'node_modules/graphsiql')));

const port = process.env.PORT || 5000;
app.listen(port, () => startUpLogger.info(`server listening at http://localhost:${port}/graphql && http://localhost:${port}/graphql-relay`));

