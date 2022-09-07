import { GraphQLSchema } from 'graphql';
/*******************************************************************************
 * BUG-FIX: E.Wolf, 2022-02-03
 */
import { GraphQLResolveInfo } from 'graphql';
declare type GraphQLReferenceResolver<TContext> = (reference: object, context: TContext, info: GraphQLResolveInfo) => any;
declare module 'graphql/type/definition' {
    interface GraphQLObjectType {
        resolveReference?: GraphQLReferenceResolver<any>;
    }
    interface GraphQLObjectTypeConfig<TSource, TContext> {
        resolveReference?: GraphQLReferenceResolver<TContext>;
    }
}
/******************************************************************************/
export interface FederationFieldConfig {
    external?: boolean;
    provides?: string;
    requires?: string;
}
export interface FederationFieldsConfig {
    [fieldName: string]: FederationFieldConfig;
}
export interface FederationObjectConfig<TContext> {
    keyFields?: string[];
    extend?: boolean;
    resolveReference?: GraphQLReferenceResolver<TContext>;
    fields?: FederationFieldsConfig;
}
export interface FederationConfig<TContext> {
    [objectName: string]: FederationObjectConfig<TContext>;
}
export declare function transformSchemaFederation<TContext>(schema: GraphQLSchema, federationConfig: FederationConfig<TContext>): GraphQLSchema;
export {};
