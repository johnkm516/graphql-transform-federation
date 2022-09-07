"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.addFederationAnnotations = void 0;
var language_1 = require("graphql/language");
var ast_builders_1 = require("./ast-builders");
function createDirectiveWithFields(directiveName, fields) {
    return (0, ast_builders_1.createDirectiveNode)(directiveName, {
        fields: (0, ast_builders_1.createStringValueNode)(fields),
    });
}
function isFieldConfigToDo(_a) {
    var external = _a.external, provides = _a.provides, requires = _a.requires;
    return Boolean(external || provides || requires);
}
function filterFieldsConfigToDo(fieldsConfig) {
    return Object.fromEntries(Object.entries(fieldsConfig).filter(function (_a) {
        var fieldConfig = _a[1];
        return isFieldConfigToDo(fieldConfig);
    }));
}
function isObjectConfigToDo(_a) {
    var extend = _a.extend, keyFields = _a.keyFields;
    return Boolean((keyFields && keyFields.length) || extend);
}
function addFederationAnnotations(schema, federationConfig) {
    var ast = (0, language_1.parse)(schema);
    var objectTypesTodo = new Set(Object.entries(federationConfig)
        .filter(function (_a) {
        var config = _a[1];
        return isObjectConfigToDo(config);
    })
        .map(function (_a) {
        var objectName = _a[0];
        return objectName;
    }));
    var fieldTypesTodo = Object.fromEntries(Object.entries(federationConfig)
        .flatMap(function (_a) {
        var objectName = _a[0], fields = _a[1].fields;
        return fields ? [[objectName, filterFieldsConfigToDo(fields)]] : [];
    })
        .filter(function (_a) {
        var fieldsConfig = _a[1];
        return Object.keys(fieldsConfig).length;
    }));
    var currentObjectName = undefined;
    var withDirectives = (0, language_1.visit)(ast, {
        ObjectTypeDefinition: {
            enter: function (node) {
                currentObjectName = node.name.value;
                if (objectTypesTodo.has(currentObjectName)) {
                    objectTypesTodo.delete(currentObjectName);
                    var _a = federationConfig[currentObjectName], keyFields = _a.keyFields, extend = _a.extend;
                    var newDirectives = keyFields
                        ? keyFields.map(function (keyField) {
                            return createDirectiveWithFields('key', keyField);
                        })
                        : [];
                    return __assign(__assign({}, node), { directives: __spreadArray(__spreadArray([], (node.directives || []), true), newDirectives, true), kind: extend ? 'ObjectTypeExtension' : node.kind });
                }
            },
            leave: function () {
                currentObjectName = undefined;
            },
        },
        FieldDefinition: function (node) {
            var currentFieldsTodo = currentObjectName && fieldTypesTodo[currentObjectName];
            if (currentObjectName &&
                currentFieldsTodo &&
                currentFieldsTodo[node.name.value]) {
                var currentFieldConfig = currentFieldsTodo[node.name.value];
                delete currentFieldsTodo[node.name.value];
                if (Object.keys(currentFieldsTodo).length === 0) {
                    delete fieldTypesTodo[currentObjectName];
                }
                return __assign(__assign({}, node), { directives: __spreadArray(__spreadArray(__spreadArray(__spreadArray([], (node.directives || []), true), (currentFieldConfig.external
                        ? [(0, ast_builders_1.createDirectiveNode)('external')]
                        : []), true), (currentFieldConfig.provides
                        ? [
                            createDirectiveWithFields('provides', currentFieldConfig.provides),
                        ]
                        : []), true), (currentFieldConfig.requires
                        ? [
                            createDirectiveWithFields('requires', currentFieldConfig.requires),
                        ]
                        : []), true) });
            }
            return undefined;
        },
    });
    if (objectTypesTodo.size !== 0) {
        throw new Error("Could not add key directives or extend types: ".concat(Array.from(objectTypesTodo).join(', ')));
    }
    if (Object.keys(fieldTypesTodo).length !== 0) {
        throw new Error("Could not add directive to these fields: ".concat(Object.entries(fieldTypesTodo)
            .flatMap(function (_a) {
            var objectName = _a[0], fieldsConfig = _a[1];
            return Object.keys(fieldsConfig).map(function (externalField) { return "".concat(objectName, ".").concat(externalField); });
        })
            .join(', ')));
    }
    return (0, language_1.print)(withDirectives);
}
exports.addFederationAnnotations = addFederationAnnotations;
//# sourceMappingURL=transform-sdl.js.map