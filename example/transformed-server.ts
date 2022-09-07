import { delegateToSchema } from '@graphql-tools/delegate';
import { makeExecutableSchema } from '@graphql-tools/schema';
import { ApolloServer } from 'apollo-server';
import { transformSchemaFederation } from '../src/transform-federation';
import { OperationTypeNode } from 'graphql';

const products = [
  {
    id: '123',
    name: 'name from transformed service',
  },
];

interface ProductKey {
  id: string;
}

const schemaWithoutFederation = makeExecutableSchema({
  typeDefs: `
    type Product {
      id: String!
      name: String!
    }
    
    type Query {
      productById(id: String!): Product!
    }
  `,
  resolvers: {
    Query: {
      productById(source, { id }: ProductKey) {
        return products.find((product) => product.id === id);
      },
    },
  },
});

const federationSchema = transformSchemaFederation(schemaWithoutFederation, {
  Product: {
    keyFields: ['id'],

    resolveReference(reference, context: { [key: string]: any }, info) {
      console.log(info.returnType.toString());
      return delegateToSchema({
        schema: info.schema,
        operation: OperationTypeNode.QUERY,
        fieldName: 'productById',
        args: {
          id: (reference as ProductKey).id,
        },
        context,
        info,
      });
    },
  },
});

new ApolloServer({
  schema: federationSchema,
})
  .listen({
    port: 4001,
  })
  .then(({ url }) => {
    console.log(`🚀 Transformed server ready at ${url}`);
  });
