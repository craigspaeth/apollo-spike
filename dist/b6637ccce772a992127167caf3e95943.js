// modules are defined as an array
// [ module function, map of requires ]
//
// map of requires is short require name -> numeric require
//
// anything defined in a previous bundle is accessed via the
// orig method which is the require for previous bundles

require = (function (modules, cache, entry) {
  // Save the require from previous bundle to this closure if any
  var previousRequire = typeof require === "function" && require;

  function newRequire(name, jumped) {
    if (!cache[name]) {
      if (!modules[name]) {
        // if we cannot find the module within our internal map or
        // cache jump to the current global require ie. the last bundle
        // that was added to the page.
        var currentRequire = typeof require === "function" && require;
        if (!jumped && currentRequire) {
          return currentRequire(name, true);
        }

        // If there are other bundles on this page the require from the
        // previous one is saved to 'previousRequire'. Repeat this as
        // many times as there are bundles until the module is found or
        // we exhaust the require chain.
        if (previousRequire) {
          return previousRequire(name, true);
        }

        var err = new Error('Cannot find module \'' + name + '\'');
        err.code = 'MODULE_NOT_FOUND';
        throw err;
      }
      
      localRequire.resolve = resolve;

      var module = cache[name] = new newRequire.Module;

      modules[name][0].call(module.exports, localRequire, module, module.exports);
    }

    return cache[name].exports;

    function localRequire(x){
      return newRequire(localRequire.resolve(x));
    }

    function resolve(x){
      return modules[name][1][x] || x;
    }
  }

  function Module() {
    this.bundle = newRequire;
    this.exports = {};
  }

  newRequire.Module = Module;
  newRequire.modules = modules;
  newRequire.cache = cache;
  newRequire.parent = previousRequire;

  for (var i = 0; i < entry.length; i++) {
    newRequire(entry[i]);
  }

  // Override the current require with this new one
  return newRequire;
})({44:[function(require,module,exports) {
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.visit = visit;
exports.visitInParallel = visitInParallel;
exports.visitWithTypeInfo = visitWithTypeInfo;
exports.getVisitFn = getVisitFn;


/**
 * A visitor is comprised of visit functions, which are called on each node
 * during the visitor's traversal.
 */


/**
 * A visitor is provided to visit, it contains the collection of
 * relevant functions to be called during the visitor's traversal.
 */
/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * 
 */

var QueryDocumentKeys = exports.QueryDocumentKeys = {
  Name: [],

  Document: ['definitions'],
  OperationDefinition: ['name', 'variableDefinitions', 'directives', 'selectionSet'],
  VariableDefinition: ['variable', 'type', 'defaultValue'],
  Variable: ['name'],
  SelectionSet: ['selections'],
  Field: ['alias', 'name', 'arguments', 'directives', 'selectionSet'],
  Argument: ['name', 'value'],

  FragmentSpread: ['name', 'directives'],
  InlineFragment: ['typeCondition', 'directives', 'selectionSet'],
  FragmentDefinition: ['name',
  // Note: fragment variable definitions are experimental and may be changed
  // or removed in the future.
  'variableDefinitions', 'typeCondition', 'directives', 'selectionSet'],

  IntValue: [],
  FloatValue: [],
  StringValue: [],
  BooleanValue: [],
  NullValue: [],
  EnumValue: [],
  ListValue: ['values'],
  ObjectValue: ['fields'],
  ObjectField: ['name', 'value'],

  Directive: ['name', 'arguments'],

  NamedType: ['name'],
  ListType: ['type'],
  NonNullType: ['type'],

  SchemaDefinition: ['directives', 'operationTypes'],
  OperationTypeDefinition: ['type'],

  ScalarTypeDefinition: ['description', 'name', 'directives'],
  ObjectTypeDefinition: ['description', 'name', 'interfaces', 'directives', 'fields'],
  FieldDefinition: ['description', 'name', 'arguments', 'type', 'directives'],
  InputValueDefinition: ['description', 'name', 'type', 'defaultValue', 'directives'],
  InterfaceTypeDefinition: ['description', 'name', 'directives', 'fields'],
  UnionTypeDefinition: ['description', 'name', 'directives', 'types'],
  EnumTypeDefinition: ['description', 'name', 'directives', 'values'],
  EnumValueDefinition: ['description', 'name', 'directives'],
  InputObjectTypeDefinition: ['description', 'name', 'directives', 'fields'],

  ScalarTypeExtension: ['name', 'directives'],
  ObjectTypeExtension: ['name', 'interfaces', 'directives', 'fields'],
  InterfaceTypeExtension: ['name', 'directives', 'fields'],
  UnionTypeExtension: ['name', 'directives', 'types'],
  EnumTypeExtension: ['name', 'directives', 'values'],
  InputObjectTypeExtension: ['name', 'directives', 'fields'],

  DirectiveDefinition: ['description', 'name', 'arguments', 'locations']
};

/**
 * A KeyMap describes each the traversable properties of each kind of node.
 */
var BREAK = exports.BREAK = {};

/**
 * visit() will walk through an AST using a depth first traversal, calling
 * the visitor's enter function at each node in the traversal, and calling the
 * leave function after visiting that node and all of its child nodes.
 *
 * By returning different values from the enter and leave functions, the
 * behavior of the visitor can be altered, including skipping over a sub-tree of
 * the AST (by returning false), editing the AST by returning a value or null
 * to remove the value, or to stop the whole traversal by returning BREAK.
 *
 * When using visit() to edit an AST, the original AST will not be modified, and
 * a new version of the AST with the changes applied will be returned from the
 * visit function.
 *
 *     const editedAST = visit(ast, {
 *       enter(node, key, parent, path, ancestors) {
 *         // @return
 *         //   undefined: no action
 *         //   false: skip visiting this node
 *         //   visitor.BREAK: stop visiting altogether
 *         //   null: delete this node
 *         //   any value: replace this node with the returned value
 *       },
 *       leave(node, key, parent, path, ancestors) {
 *         // @return
 *         //   undefined: no action
 *         //   false: no action
 *         //   visitor.BREAK: stop visiting altogether
 *         //   null: delete this node
 *         //   any value: replace this node with the returned value
 *       }
 *     });
 *
 * Alternatively to providing enter() and leave() functions, a visitor can
 * instead provide functions named the same as the kinds of AST nodes, or
 * enter/leave visitors at a named key, leading to four permutations of
 * visitor API:
 *
 * 1) Named visitors triggered when entering a node a specific kind.
 *
 *     visit(ast, {
 *       Kind(node) {
 *         // enter the "Kind" node
 *       }
 *     })
 *
 * 2) Named visitors that trigger upon entering and leaving a node of
 *    a specific kind.
 *
 *     visit(ast, {
 *       Kind: {
 *         enter(node) {
 *           // enter the "Kind" node
 *         }
 *         leave(node) {
 *           // leave the "Kind" node
 *         }
 *       }
 *     })
 *
 * 3) Generic visitors that trigger upon entering and leaving any node.
 *
 *     visit(ast, {
 *       enter(node) {
 *         // enter any node
 *       },
 *       leave(node) {
 *         // leave any node
 *       }
 *     })
 *
 * 4) Parallel visitors for entering and leaving nodes of a specific kind.
 *
 *     visit(ast, {
 *       enter: {
 *         Kind(node) {
 *           // enter the "Kind" node
 *         }
 *       },
 *       leave: {
 *         Kind(node) {
 *           // leave the "Kind" node
 *         }
 *       }
 *     })
 */
function visit(root, visitor) {
  var visitorKeys = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : QueryDocumentKeys;

  /* eslint-disable no-undef-init */
  var stack = undefined;
  var inArray = Array.isArray(root);
  var keys = [root];
  var index = -1;
  var edits = [];
  var node = undefined;
  var key = undefined;
  var parent = undefined;
  var path = [];
  var ancestors = [];
  var newRoot = root;
  /* eslint-enable no-undef-init */

  do {
    index++;
    var isLeaving = index === keys.length;
    var isEdited = isLeaving && edits.length !== 0;
    if (isLeaving) {
      key = ancestors.length === 0 ? undefined : path[path.length - 1];
      node = parent;
      parent = ancestors.pop();
      if (isEdited) {
        if (inArray) {
          node = node.slice();
        } else {
          var clone = {};
          for (var k in node) {
            if (node.hasOwnProperty(k)) {
              clone[k] = node[k];
            }
          }
          node = clone;
        }
        var editOffset = 0;
        for (var ii = 0; ii < edits.length; ii++) {
          var editKey = edits[ii][0];
          var editValue = edits[ii][1];
          if (inArray) {
            editKey -= editOffset;
          }
          if (inArray && editValue === null) {
            node.splice(editKey, 1);
            editOffset++;
          } else {
            node[editKey] = editValue;
          }
        }
      }
      index = stack.index;
      keys = stack.keys;
      edits = stack.edits;
      inArray = stack.inArray;
      stack = stack.prev;
    } else {
      key = parent ? inArray ? index : keys[index] : undefined;
      node = parent ? parent[key] : newRoot;
      if (node === null || node === undefined) {
        continue;
      }
      if (parent) {
        path.push(key);
      }
    }

    var result = void 0;
    if (!Array.isArray(node)) {
      if (!isNode(node)) {
        throw new Error('Invalid AST Node: ' + JSON.stringify(node));
      }
      var visitFn = getVisitFn(visitor, node.kind, isLeaving);
      if (visitFn) {
        result = visitFn.call(visitor, node, key, parent, path, ancestors);

        if (result === BREAK) {
          break;
        }

        if (result === false) {
          if (!isLeaving) {
            path.pop();
            continue;
          }
        } else if (result !== undefined) {
          edits.push([key, result]);
          if (!isLeaving) {
            if (isNode(result)) {
              node = result;
            } else {
              path.pop();
              continue;
            }
          }
        }
      }
    }

    if (result === undefined && isEdited) {
      edits.push([key, node]);
    }

    if (isLeaving) {
      path.pop();
    } else {
      stack = { inArray: inArray, index: index, keys: keys, edits: edits, prev: stack };
      inArray = Array.isArray(node);
      keys = inArray ? node : visitorKeys[node.kind] || [];
      index = -1;
      edits = [];
      if (parent) {
        ancestors.push(parent);
      }
      parent = node;
    }
  } while (stack !== undefined);

  if (edits.length !== 0) {
    newRoot = edits[edits.length - 1][1];
  }

  return newRoot;
}

function isNode(maybeNode) {
  return Boolean(maybeNode && typeof maybeNode.kind === 'string');
}

/**
 * Creates a new visitor instance which delegates to many visitors to run in
 * parallel. Each visitor will be visited for each node before moving on.
 *
 * If a prior visitor edits a node, no following visitors will see that node.
 */
function visitInParallel(visitors) {
  var skipping = new Array(visitors.length);

  return {
    enter: function enter(node) {
      for (var i = 0; i < visitors.length; i++) {
        if (!skipping[i]) {
          var fn = getVisitFn(visitors[i], node.kind, /* isLeaving */false);
          if (fn) {
            var result = fn.apply(visitors[i], arguments);
            if (result === false) {
              skipping[i] = node;
            } else if (result === BREAK) {
              skipping[i] = BREAK;
            } else if (result !== undefined) {
              return result;
            }
          }
        }
      }
    },
    leave: function leave(node) {
      for (var i = 0; i < visitors.length; i++) {
        if (!skipping[i]) {
          var fn = getVisitFn(visitors[i], node.kind, /* isLeaving */true);
          if (fn) {
            var result = fn.apply(visitors[i], arguments);
            if (result === BREAK) {
              skipping[i] = BREAK;
            } else if (result !== undefined && result !== false) {
              return result;
            }
          }
        } else if (skipping[i] === node) {
          skipping[i] = null;
        }
      }
    }
  };
}

/**
 * Creates a new visitor instance which maintains a provided TypeInfo instance
 * along with visiting visitor.
 */
function visitWithTypeInfo(typeInfo, visitor) {
  return {
    enter: function enter(node) {
      typeInfo.enter(node);
      var fn = getVisitFn(visitor, node.kind, /* isLeaving */false);
      if (fn) {
        var result = fn.apply(visitor, arguments);
        if (result !== undefined) {
          typeInfo.leave(node);
          if (isNode(result)) {
            typeInfo.enter(result);
          }
        }
        return result;
      }
    },
    leave: function leave(node) {
      var fn = getVisitFn(visitor, node.kind, /* isLeaving */true);
      var result = void 0;
      if (fn) {
        result = fn.apply(visitor, arguments);
      }
      typeInfo.leave(node);
      return result;
    }
  };
}

/**
 * Given a visitor instance, if it is leaving or not, and a node kind, return
 * the function the visitor runtime should call.
 */
function getVisitFn(visitor, kind, isLeaving) {
  var kindVisitor = visitor[kind];
  if (kindVisitor) {
    if (!isLeaving && typeof kindVisitor === 'function') {
      // { Kind() {} }
      return kindVisitor;
    }
    var kindSpecificVisitor = isLeaving ? kindVisitor.leave : kindVisitor.enter;
    if (typeof kindSpecificVisitor === 'function') {
      // { Kind: { enter() {}, leave() {} } }
      return kindSpecificVisitor;
    }
  } else {
    var specificVisitor = isLeaving ? visitor.leave : visitor.enter;
    if (specificVisitor) {
      if (typeof specificVisitor === 'function') {
        // { enter() {}, leave() {} }
        return specificVisitor;
      }
      var specificKindVisitor = specificVisitor[kind];
      if (typeof specificKindVisitor === 'function') {
        // { enter: { Kind() {} }, leave: { Kind() {} } }
        return specificKindVisitor;
      }
    }
  }
}
},{}],43:[function(require,module,exports) {
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.print = print;

var _visitor = require('./visitor');

/**
 * Converts an AST into a string, using one set of reasonable
 * formatting rules.
 */
function print(ast) {
  return (0, _visitor.visit)(ast, { leave: printDocASTReducer });
} /**
   * Copyright (c) 2015-present, Facebook, Inc.
   *
   * This source code is licensed under the MIT license found in the
   * LICENSE file in the root directory of this source tree.
   */

var printDocASTReducer = {
  Name: function Name(node) {
    return node.value;
  },
  Variable: function Variable(node) {
    return '$' + node.name;
  },

  // Document

  Document: function Document(node) {
    return join(node.definitions, '\n\n') + '\n';
  },

  OperationDefinition: function OperationDefinition(node) {
    var op = node.operation;
    var name = node.name;
    var varDefs = wrap('(', join(node.variableDefinitions, ', '), ')');
    var directives = join(node.directives, ' ');
    var selectionSet = node.selectionSet;
    // Anonymous queries with no directives or variable definitions can use
    // the query short form.
    return !name && !directives && !varDefs && op === 'query' ? selectionSet : join([op, join([name, varDefs]), directives, selectionSet], ' ');
  },


  VariableDefinition: function VariableDefinition(_ref) {
    var variable = _ref.variable,
        type = _ref.type,
        defaultValue = _ref.defaultValue;
    return variable + ': ' + type + wrap(' = ', defaultValue);
  },

  SelectionSet: function SelectionSet(_ref2) {
    var selections = _ref2.selections;
    return block(selections);
  },

  Field: function Field(_ref3) {
    var alias = _ref3.alias,
        name = _ref3.name,
        args = _ref3.arguments,
        directives = _ref3.directives,
        selectionSet = _ref3.selectionSet;
    return join([wrap('', alias, ': ') + name + wrap('(', join(args, ', '), ')'), join(directives, ' '), selectionSet], ' ');
  },

  Argument: function Argument(_ref4) {
    var name = _ref4.name,
        value = _ref4.value;
    return name + ': ' + value;
  },

  // Fragments

  FragmentSpread: function FragmentSpread(_ref5) {
    var name = _ref5.name,
        directives = _ref5.directives;
    return '...' + name + wrap(' ', join(directives, ' '));
  },

  InlineFragment: function InlineFragment(_ref6) {
    var typeCondition = _ref6.typeCondition,
        directives = _ref6.directives,
        selectionSet = _ref6.selectionSet;
    return join(['...', wrap('on ', typeCondition), join(directives, ' '), selectionSet], ' ');
  },

  FragmentDefinition: function FragmentDefinition(_ref7) {
    var name = _ref7.name,
        typeCondition = _ref7.typeCondition,
        variableDefinitions = _ref7.variableDefinitions,
        directives = _ref7.directives,
        selectionSet = _ref7.selectionSet;
    return (
      // Note: fragment variable definitions are experimental and may be changed
      // or removed in the future.
      'fragment ' + name + wrap('(', join(variableDefinitions, ', '), ')') + ' ' + ('on ' + typeCondition + ' ' + wrap('', join(directives, ' '), ' ')) + selectionSet
    );
  },

  // Value

  IntValue: function IntValue(_ref8) {
    var value = _ref8.value;
    return value;
  },
  FloatValue: function FloatValue(_ref9) {
    var value = _ref9.value;
    return value;
  },
  StringValue: function StringValue(_ref10, key) {
    var value = _ref10.value,
        isBlockString = _ref10.block;
    return isBlockString ? printBlockString(value, key === 'description') : JSON.stringify(value);
  },
  BooleanValue: function BooleanValue(_ref11) {
    var value = _ref11.value;
    return JSON.stringify(value);
  },
  NullValue: function NullValue() {
    return 'null';
  },
  EnumValue: function EnumValue(_ref12) {
    var value = _ref12.value;
    return value;
  },
  ListValue: function ListValue(_ref13) {
    var values = _ref13.values;
    return '[' + join(values, ', ') + ']';
  },
  ObjectValue: function ObjectValue(_ref14) {
    var fields = _ref14.fields;
    return '{' + join(fields, ', ') + '}';
  },
  ObjectField: function ObjectField(_ref15) {
    var name = _ref15.name,
        value = _ref15.value;
    return name + ': ' + value;
  },

  // Directive

  Directive: function Directive(_ref16) {
    var name = _ref16.name,
        args = _ref16.arguments;
    return '@' + name + wrap('(', join(args, ', '), ')');
  },

  // Type

  NamedType: function NamedType(_ref17) {
    var name = _ref17.name;
    return name;
  },
  ListType: function ListType(_ref18) {
    var type = _ref18.type;
    return '[' + type + ']';
  },
  NonNullType: function NonNullType(_ref19) {
    var type = _ref19.type;
    return type + '!';
  },

  // Type System Definitions

  SchemaDefinition: function SchemaDefinition(_ref20) {
    var directives = _ref20.directives,
        operationTypes = _ref20.operationTypes;
    return join(['schema', join(directives, ' '), block(operationTypes)], ' ');
  },

  OperationTypeDefinition: function OperationTypeDefinition(_ref21) {
    var operation = _ref21.operation,
        type = _ref21.type;
    return operation + ': ' + type;
  },

  ScalarTypeDefinition: function ScalarTypeDefinition(_ref22) {
    var description = _ref22.description,
        name = _ref22.name,
        directives = _ref22.directives;
    return join([description, join(['scalar', name, join(directives, ' ')], ' ')], '\n');
  },

  ObjectTypeDefinition: function ObjectTypeDefinition(_ref23) {
    var description = _ref23.description,
        name = _ref23.name,
        interfaces = _ref23.interfaces,
        directives = _ref23.directives,
        fields = _ref23.fields;
    return join([description, join(['type', name, wrap('implements ', join(interfaces, ', ')), join(directives, ' '), block(fields)], ' ')], '\n');
  },

  FieldDefinition: function FieldDefinition(_ref24) {
    var description = _ref24.description,
        name = _ref24.name,
        args = _ref24.arguments,
        type = _ref24.type,
        directives = _ref24.directives;
    return join([description, name + wrap('(', join(args, ', '), ')') + ': ' + type + wrap(' ', join(directives, ' '))], '\n');
  },

  InputValueDefinition: function InputValueDefinition(_ref25) {
    var description = _ref25.description,
        name = _ref25.name,
        type = _ref25.type,
        defaultValue = _ref25.defaultValue,
        directives = _ref25.directives;
    return join([description, join([name + ': ' + type, wrap('= ', defaultValue), join(directives, ' ')], ' ')], '\n');
  },

  InterfaceTypeDefinition: function InterfaceTypeDefinition(_ref26) {
    var description = _ref26.description,
        name = _ref26.name,
        directives = _ref26.directives,
        fields = _ref26.fields;
    return join([description, join(['interface', name, join(directives, ' '), block(fields)], ' ')], '\n');
  },

  UnionTypeDefinition: function UnionTypeDefinition(_ref27) {
    var description = _ref27.description,
        name = _ref27.name,
        directives = _ref27.directives,
        types = _ref27.types;
    return join([description, join(['union', name, join(directives, ' '), types && types.length !== 0 ? '= ' + join(types, ' | ') : ''], ' ')], '\n');
  },

  EnumTypeDefinition: function EnumTypeDefinition(_ref28) {
    var description = _ref28.description,
        name = _ref28.name,
        directives = _ref28.directives,
        values = _ref28.values;
    return join([description, join(['enum', name, join(directives, ' '), block(values)], ' ')], '\n');
  },

  EnumValueDefinition: function EnumValueDefinition(_ref29) {
    var description = _ref29.description,
        name = _ref29.name,
        directives = _ref29.directives;
    return join([description, join([name, join(directives, ' ')], ' ')], '\n');
  },

  InputObjectTypeDefinition: function InputObjectTypeDefinition(_ref30) {
    var description = _ref30.description,
        name = _ref30.name,
        directives = _ref30.directives,
        fields = _ref30.fields;
    return join([description, join(['input', name, join(directives, ' '), block(fields)], ' ')], '\n');
  },

  ScalarTypeExtension: function ScalarTypeExtension(_ref31) {
    var name = _ref31.name,
        directives = _ref31.directives;
    return join(['extend scalar', name, join(directives, ' ')], ' ');
  },

  ObjectTypeExtension: function ObjectTypeExtension(_ref32) {
    var name = _ref32.name,
        interfaces = _ref32.interfaces,
        directives = _ref32.directives,
        fields = _ref32.fields;
    return join(['extend type', name, wrap('implements ', join(interfaces, ', ')), join(directives, ' '), block(fields)], ' ');
  },

  InterfaceTypeExtension: function InterfaceTypeExtension(_ref33) {
    var name = _ref33.name,
        directives = _ref33.directives,
        fields = _ref33.fields;
    return join(['extend interface', name, join(directives, ' '), block(fields)], ' ');
  },

  UnionTypeExtension: function UnionTypeExtension(_ref34) {
    var name = _ref34.name,
        directives = _ref34.directives,
        types = _ref34.types;
    return join(['extend union', name, join(directives, ' '), types && types.length !== 0 ? '= ' + join(types, ' | ') : ''], ' ');
  },

  EnumTypeExtension: function EnumTypeExtension(_ref35) {
    var name = _ref35.name,
        directives = _ref35.directives,
        values = _ref35.values;
    return join(['extend enum', name, join(directives, ' '), block(values)], ' ');
  },

  InputObjectTypeExtension: function InputObjectTypeExtension(_ref36) {
    var name = _ref36.name,
        directives = _ref36.directives,
        fields = _ref36.fields;
    return join(['extend input', name, join(directives, ' '), block(fields)], ' ');
  },

  DirectiveDefinition: function DirectiveDefinition(_ref37) {
    var description = _ref37.description,
        name = _ref37.name,
        args = _ref37.arguments,
        locations = _ref37.locations;
    return join([description, 'directive @' + name + wrap('(', join(args, ', '), ')') + ' on ' + join(locations, ' | ')], '\n');
  }
};

/**
 * Given maybeArray, print an empty string if it is null or empty, otherwise
 * print all items together separated by separator if provided
 */
function join(maybeArray, separator) {
  return maybeArray ? maybeArray.filter(function (x) {
    return x;
  }).join(separator || '') : '';
}

/**
 * Given array, print each item on its own line, wrapped in an
 * indented "{ }" block.
 */
function block(array) {
  return array && array.length !== 0 ? indent('{\n' + join(array, '\n')) + '\n}' : '';
}

/**
 * If maybeString is not null or empty, then wrap with start and end, otherwise
 * print an empty string.
 */
function wrap(start, maybeString, end) {
  return maybeString ? start + maybeString + (end || '') : '';
}

function indent(maybeString) {
  return maybeString && maybeString.replace(/\n/g, '\n  ');
}

/**
 * Print a block string in the indented block form by adding a leading and
 * trailing blank line. However, if a block string starts with whitespace and is
 * a single-line, adding a leading blank line would strip that whitespace.
 */
function printBlockString(value, isDescription) {
  return (value[0] === ' ' || value[0] === '\t') && value.indexOf('\n') === -1 ? '"""' + value.replace(/"""/g, '\\"""') + '"""' : isDescription ? '"""\n' + value.replace(/"""/g, '\\"""') + '\n"""' : indent('"""\n' + value.replace(/"""/g, '\\"""')) + '\n"""';
}
},{"./visitor":44}],34:[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.isScalarValue = isScalarValue;
exports.isNumberValue = isNumberValue;
exports.valueToObjectRepresentation = valueToObjectRepresentation;
exports.storeKeyNameFromField = storeKeyNameFromField;
exports.getStoreKeyName = getStoreKeyName;
exports.argumentsObjectFromField = argumentsObjectFromField;
exports.resultKeyNameFromField = resultKeyNameFromField;
exports.isField = isField;
exports.isInlineFragment = isInlineFragment;
exports.isIdValue = isIdValue;
exports.toIdValue = toIdValue;
exports.isJsonValue = isJsonValue;
exports.valueFromNode = valueFromNode;
function isScalarValue(value) {
  return ['StringValue', 'BooleanValue', 'EnumValue'].indexOf(value.kind) > -1;
}
function isNumberValue(value) {
  return ['IntValue', 'FloatValue'].indexOf(value.kind) > -1;
}
function isStringValue(value) {
  return value.kind === 'StringValue';
}
function isBooleanValue(value) {
  return value.kind === 'BooleanValue';
}
function isIntValue(value) {
  return value.kind === 'IntValue';
}
function isFloatValue(value) {
  return value.kind === 'FloatValue';
}
function isVariable(value) {
  return value.kind === 'Variable';
}
function isObjectValue(value) {
  return value.kind === 'ObjectValue';
}
function isListValue(value) {
  return value.kind === 'ListValue';
}
function isEnumValue(value) {
  return value.kind === 'EnumValue';
}
function valueToObjectRepresentation(argObj, name, value, variables) {
  if (isIntValue(value) || isFloatValue(value)) {
    argObj[name.value] = Number(value.value);
  } else if (isBooleanValue(value) || isStringValue(value)) {
    argObj[name.value] = value.value;
  } else if (isObjectValue(value)) {
    var nestedArgObj_1 = {};
    value.fields.map(function (obj) {
      return valueToObjectRepresentation(nestedArgObj_1, obj.name, obj.value, variables);
    });
    argObj[name.value] = nestedArgObj_1;
  } else if (isVariable(value)) {
    var variableValue = (variables || {})[value.name.value];
    argObj[name.value] = variableValue;
  } else if (isListValue(value)) {
    argObj[name.value] = value.values.map(function (listValue) {
      var nestedArgArrayObj = {};
      valueToObjectRepresentation(nestedArgArrayObj, name, listValue, variables);
      return nestedArgArrayObj[name.value];
    });
  } else if (isEnumValue(value)) {
    argObj[name.value] = value.value;
  } else {
    throw new Error("The inline argument \"" + name.value + "\" of kind \"" + value.kind + "\" is not supported.\n                    Use variables instead of inline arguments to overcome this limitation.");
  }
}
function storeKeyNameFromField(field, variables) {
  var directivesObj = null;
  if (field.directives) {
    directivesObj = {};
    field.directives.forEach(function (directive) {
      directivesObj[directive.name.value] = {};
      if (directive.arguments) {
        directive.arguments.forEach(function (_a) {
          var name = _a.name,
              value = _a.value;
          return valueToObjectRepresentation(directivesObj[directive.name.value], name, value, variables);
        });
      }
    });
  }
  var argObj = null;
  if (field.arguments && field.arguments.length) {
    argObj = {};
    field.arguments.forEach(function (_a) {
      var name = _a.name,
          value = _a.value;
      return valueToObjectRepresentation(argObj, name, value, variables);
    });
  }
  return getStoreKeyName(field.name.value, argObj, directivesObj);
}
function getStoreKeyName(fieldName, args, directives) {
  if (directives && directives['connection'] && directives['connection']['key']) {
    if (directives['connection']['filter'] && directives['connection']['filter'].length > 0) {
      var filterKeys = directives['connection']['filter'] ? directives['connection']['filter'] : [];
      filterKeys.sort();
      var queryArgs_1 = args;
      var filteredArgs_1 = {};
      filterKeys.forEach(function (key) {
        filteredArgs_1[key] = queryArgs_1[key];
      });
      return directives['connection']['key'] + "(" + JSON.stringify(filteredArgs_1) + ")";
    } else {
      return directives['connection']['key'];
    }
  }
  if (args) {
    var stringifiedArgs = JSON.stringify(args);
    return fieldName + "(" + stringifiedArgs + ")";
  }
  return fieldName;
}
function argumentsObjectFromField(field, variables) {
  if (field.arguments && field.arguments.length) {
    var argObj_1 = {};
    field.arguments.forEach(function (_a) {
      var name = _a.name,
          value = _a.value;
      return valueToObjectRepresentation(argObj_1, name, value, variables);
    });
    return argObj_1;
  }
  return null;
}
function resultKeyNameFromField(field) {
  return field.alias ? field.alias.value : field.name.value;
}
function isField(selection) {
  return selection.kind === 'Field';
}
function isInlineFragment(selection) {
  return selection.kind === 'InlineFragment';
}
function isIdValue(idObject) {
  return idObject && idObject.type === 'id';
}
function toIdValue(id, generated) {
  if (generated === void 0) {
    generated = false;
  }
  return {
    type: 'id',
    id: id,
    generated: generated
  };
}
function isJsonValue(jsonObject) {
  return jsonObject != null && typeof jsonObject === 'object' && jsonObject.type === 'json';
}
function defaultValueFromVariable(node) {
  throw new Error("Variable nodes are not supported by valueFromNode");
}
function valueFromNode(node, onVariable) {
  if (onVariable === void 0) {
    onVariable = defaultValueFromVariable;
  }
  switch (node.kind) {
    case 'Variable':
      return onVariable(node);
    case 'NullValue':
      return null;
    case 'IntValue':
      return parseInt(node.value);
    case 'FloatValue':
      return parseFloat(node.value);
    case 'ListValue':
      return node.values.map(function (v) {
        return valueFromNode(v, onVariable);
      });
    case 'ObjectValue':
      {
        var value = {};
        for (var _i = 0, _a = node.fields; _i < _a.length; _i++) {
          var field = _a[_i];
          value[field.name.value] = valueFromNode(field.value, onVariable);
        }
        return value;
      }
    default:
      return node.value;
  }
}
//# sourceMappingURL=storeUtils.js.map
},{}],30:[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getDirectiveInfoFromField = getDirectiveInfoFromField;
exports.shouldInclude = shouldInclude;
exports.flattenSelections = flattenSelections;
exports.getDirectiveNames = getDirectiveNames;
exports.hasDirectives = hasDirectives;

var _storeUtils = require("./storeUtils");

function getDirectiveInfoFromField(field, variables) {
  if (field.directives && field.directives.length) {
    var directiveObj_1 = {};
    field.directives.forEach(function (directive) {
      directiveObj_1[directive.name.value] = (0, _storeUtils.argumentsObjectFromField)(directive, variables);
    });
    return directiveObj_1;
  }
  return null;
}
function shouldInclude(selection, variables) {
  if (variables === void 0) {
    variables = {};
  }
  if (!selection.directives) {
    return true;
  }
  var res = true;
  selection.directives.forEach(function (directive) {
    if (directive.name.value !== 'skip' && directive.name.value !== 'include') {
      return;
    }
    var directiveArguments = directive.arguments || [];
    var directiveName = directive.name.value;
    if (directiveArguments.length !== 1) {
      throw new Error("Incorrect number of arguments for the @" + directiveName + " directive.");
    }
    var ifArgument = directiveArguments[0];
    if (!ifArgument.name || ifArgument.name.value !== 'if') {
      throw new Error("Invalid argument for the @" + directiveName + " directive.");
    }
    var ifValue = directiveArguments[0].value;
    var evaledValue = false;
    if (!ifValue || ifValue.kind !== 'BooleanValue') {
      if (ifValue.kind !== 'Variable') {
        throw new Error("Argument for the @" + directiveName + " directive must be a variable or a bool ean value.");
      } else {
        evaledValue = variables[ifValue.name.value];
        if (evaledValue === undefined) {
          throw new Error("Invalid variable referenced in @" + directiveName + " directive.");
        }
      }
    } else {
      evaledValue = ifValue.value;
    }
    if (directiveName === 'skip') {
      evaledValue = !evaledValue;
    }
    if (!evaledValue) {
      res = false;
    }
  });
  return res;
}
function flattenSelections(selection) {
  if (!selection.selectionSet || !(selection.selectionSet.selections.length > 0)) return [selection];
  return [selection].concat(selection.selectionSet.selections.map(function (selectionNode) {
    return [selectionNode].concat(flattenSelections(selectionNode));
  }).reduce(function (selections, selected) {
    return selections.concat(selected);
  }, []));
}
var added = new Map();
function getDirectiveNames(doc) {
  var cached = added.get(doc);
  if (cached) return cached;
  var directives = doc.definitions.filter(function (definition) {
    return definition.selectionSet && definition.selectionSet.selections;
  }).map(function (x) {
    return flattenSelections(x);
  }).reduce(function (selections, selected) {
    return selections.concat(selected);
  }, []).filter(function (selection) {
    return selection.directives && selection.directives.length > 0;
  }).map(function (selection) {
    return selection.directives;
  }).reduce(function (directives, directive) {
    return directives.concat(directive);
  }, []).map(function (directive) {
    return directive.name.value;
  });
  added.set(doc, directives);
  return directives;
}
function hasDirectives(names, doc) {
  return getDirectiveNames(doc).some(function (name) {
    return names.indexOf(name) > -1;
  });
}
//# sourceMappingURL=directives.js.map
},{"./storeUtils":34}],31:[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getFragmentQueryDocument = getFragmentQueryDocument;
var __assign = undefined && undefined.__assign || Object.assign || function (t) {
  for (var s, i = 1, n = arguments.length; i < n; i++) {
    s = arguments[i];
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
  }
  return t;
};
function getFragmentQueryDocument(document, fragmentName) {
  var actualFragmentName = fragmentName;
  var fragments = [];
  document.definitions.forEach(function (definition) {
    if (definition.kind === 'OperationDefinition') {
      throw new Error("Found a " + definition.operation + " operation" + (definition.name ? " named '" + definition.name.value + "'" : '') + ". " + 'No operations are allowed when using a fragment as a query. Only fragments are allowed.');
    }
    if (definition.kind === 'FragmentDefinition') {
      fragments.push(definition);
    }
  });
  if (typeof actualFragmentName === 'undefined') {
    if (fragments.length !== 1) {
      throw new Error("Found " + fragments.length + " fragments. `fragmentName` must be provided when there is not exactly 1 fragment.");
    }
    actualFragmentName = fragments[0].name.value;
  }
  var query = __assign({}, document, { definitions: [{
      kind: 'OperationDefinition',
      operation: 'query',
      selectionSet: {
        kind: 'SelectionSet',
        selections: [{
          kind: 'FragmentSpread',
          name: {
            kind: 'Name',
            value: actualFragmentName
          }
        }]
      }
    }].concat(document.definitions) });
  return query;
}
//# sourceMappingURL=fragments.js.map
},{}],35:[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.assign = assign;
function assign(target) {
  var sources = [];
  for (var _i = 1; _i < arguments.length; _i++) {
    sources[_i - 1] = arguments[_i];
  }
  sources.forEach(function (source) {
    if (typeof source === 'undefined' || source === null) {
      return;
    }
    Object.keys(source).forEach(function (key) {
      target[key] = source[key];
    });
  });
  return target;
}
//# sourceMappingURL=assign.js.map
},{}],32:[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getMutationDefinition = getMutationDefinition;
exports.checkDocument = checkDocument;
exports.getOperationDefinition = getOperationDefinition;
exports.getOperationDefinitionOrDie = getOperationDefinitionOrDie;
exports.getOperationName = getOperationName;
exports.getFragmentDefinitions = getFragmentDefinitions;
exports.getQueryDefinition = getQueryDefinition;
exports.getFragmentDefinition = getFragmentDefinition;
exports.getMainDefinition = getMainDefinition;
exports.createFragmentMap = createFragmentMap;
exports.getDefaultValues = getDefaultValues;
exports.variablesInOperation = variablesInOperation;

var _assign = require("./util/assign");

var _storeUtils = require("./storeUtils");

function getMutationDefinition(doc) {
  checkDocument(doc);
  var mutationDef = doc.definitions.filter(function (definition) {
    return definition.kind === 'OperationDefinition' && definition.operation === 'mutation';
  })[0];
  if (!mutationDef) {
    throw new Error('Must contain a mutation definition.');
  }
  return mutationDef;
}
function checkDocument(doc) {
  if (doc.kind !== 'Document') {
    throw new Error("Expecting a parsed GraphQL document. Perhaps you need to wrap the query string in a \"gql\" tag? http://docs.apollostack.com/apollo-client/core.html#gql");
  }
  var operations = doc.definitions.filter(function (d) {
    return d.kind !== 'FragmentDefinition';
  }).map(function (definition) {
    if (definition.kind !== 'OperationDefinition') {
      throw new Error("Schema type definitions not allowed in queries. Found: \"" + definition.kind + "\"");
    }
    return definition;
  });
  if (operations.length > 1) {
    throw new Error("Ambiguous GraphQL document: contains " + operations.length + " operations");
  }
}
function getOperationDefinition(doc) {
  checkDocument(doc);
  return doc.definitions.filter(function (definition) {
    return definition.kind === 'OperationDefinition';
  })[0];
}
function getOperationDefinitionOrDie(document) {
  var def = getOperationDefinition(document);
  if (!def) {
    throw new Error("GraphQL document is missing an operation");
  }
  return def;
}
function getOperationName(doc) {
  return doc.definitions.filter(function (definition) {
    return definition.kind === 'OperationDefinition' && definition.name;
  }).map(function (x) {
    return x.name.value;
  })[0] || null;
}
function getFragmentDefinitions(doc) {
  return doc.definitions.filter(function (definition) {
    return definition.kind === 'FragmentDefinition';
  });
}
function getQueryDefinition(doc) {
  var queryDef = getOperationDefinition(doc);
  if (!queryDef || queryDef.operation !== 'query') {
    throw new Error('Must contain a query definition.');
  }
  return queryDef;
}
function getFragmentDefinition(doc) {
  if (doc.kind !== 'Document') {
    throw new Error("Expecting a parsed GraphQL document. Perhaps you need to wrap the query string in a \"gql\" tag? http://docs.apollostack.com/apollo-client/core.html#gql");
  }
  if (doc.definitions.length > 1) {
    throw new Error('Fragment must have exactly one definition.');
  }
  var fragmentDef = doc.definitions[0];
  if (fragmentDef.kind !== 'FragmentDefinition') {
    throw new Error('Must be a fragment definition.');
  }
  return fragmentDef;
}
function getMainDefinition(queryDoc) {
  checkDocument(queryDoc);
  var fragmentDefinition;
  for (var _i = 0, _a = queryDoc.definitions; _i < _a.length; _i++) {
    var definition = _a[_i];
    if (definition.kind === 'OperationDefinition') {
      var operation = definition.operation;
      if (operation === 'query' || operation === 'mutation' || operation === 'subscription') {
        return definition;
      }
    }
    if (definition.kind === 'FragmentDefinition' && !fragmentDefinition) {
      fragmentDefinition = definition;
    }
  }
  if (fragmentDefinition) {
    return fragmentDefinition;
  }
  throw new Error('Expected a parsed GraphQL query with a query, mutation, subscription, or a fragment.');
}
function createFragmentMap(fragments) {
  if (fragments === void 0) {
    fragments = [];
  }
  var symTable = {};
  fragments.forEach(function (fragment) {
    symTable[fragment.name.value] = fragment;
  });
  return symTable;
}
function getDefaultValues(definition) {
  if (definition && definition.variableDefinitions && definition.variableDefinitions.length) {
    var defaultValues = definition.variableDefinitions.filter(function (_a) {
      var defaultValue = _a.defaultValue;
      return defaultValue;
    }).map(function (_a) {
      var variable = _a.variable,
          defaultValue = _a.defaultValue;
      var defaultValueObj = {};
      (0, _storeUtils.valueToObjectRepresentation)(defaultValueObj, variable.name, defaultValue);
      return defaultValueObj;
    });
    return _assign.assign.apply(void 0, [{}].concat(defaultValues));
  }
  return {};
}
function variablesInOperation(operation) {
  var names = new Set();
  if (operation.variableDefinitions) {
    for (var _i = 0, _a = operation.variableDefinitions; _i < _a.length; _i++) {
      var definition = _a[_i];
      names.add(definition.variable.name.value);
    }
  }
  return names;
}
//# sourceMappingURL=getFromAST.js.map
},{"./util/assign":35,"./storeUtils":34}],36:[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.cloneDeep = cloneDeep;
function cloneDeep(value) {
  if (Array.isArray(value)) {
    return value.map(function (item) {
      return cloneDeep(item);
    });
  }
  if (value !== null && typeof value === 'object') {
    var nextValue = {};
    for (var key in value) {
      if (value.hasOwnProperty(key)) {
        nextValue[key] = cloneDeep(value[key]);
      }
    }
    return nextValue;
  }
  return value;
}
//# sourceMappingURL=cloneDeep.js.map
},{}],33:[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.removeDirectivesFromDocument = removeDirectivesFromDocument;
exports.addTypenameToDocument = addTypenameToDocument;
exports.removeConnectionDirectiveFromDocument = removeConnectionDirectiveFromDocument;

var _cloneDeep = require("./util/cloneDeep");

var _getFromAST = require("./getFromAST");

var TYPENAME_FIELD = {
  kind: 'Field',
  name: {
    kind: 'Name',
    value: '__typename'
  }
};
function addTypenameToSelectionSet(selectionSet, isRoot) {
  if (isRoot === void 0) {
    isRoot = false;
  }
  if (selectionSet.selections) {
    if (!isRoot) {
      var alreadyHasThisField = selectionSet.selections.some(function (selection) {
        return selection.kind === 'Field' && selection.name.value === '__typename';
      });
      if (!alreadyHasThisField) {
        selectionSet.selections.push(TYPENAME_FIELD);
      }
    }
    selectionSet.selections.forEach(function (selection) {
      if (selection.kind === 'Field') {
        if (selection.name.value.lastIndexOf('__', 0) !== 0 && selection.selectionSet) {
          addTypenameToSelectionSet(selection.selectionSet);
        }
      } else if (selection.kind === 'InlineFragment') {
        if (selection.selectionSet) {
          addTypenameToSelectionSet(selection.selectionSet);
        }
      }
    });
  }
}
function removeDirectivesFromSelectionSet(directives, selectionSet) {
  if (!selectionSet.selections) return selectionSet;
  var agressiveRemove = directives.some(function (dir) {
    return dir.remove;
  });
  selectionSet.selections = selectionSet.selections.map(function (selection) {
    if (selection.kind !== 'Field' || !selection || !selection.directives) return selection;
    var remove;
    selection.directives = selection.directives.filter(function (directive) {
      var shouldKeep = !directives.some(function (dir) {
        if (dir.name && dir.name === directive.name.value) return true;
        if (dir.test && dir.test(directive)) return true;
        return false;
      });
      if (!remove && !shouldKeep && agressiveRemove) remove = true;
      return shouldKeep;
    });
    return remove ? null : selection;
  }).filter(function (x) {
    return !!x;
  });
  selectionSet.selections.forEach(function (selection) {
    if ((selection.kind === 'Field' || selection.kind === 'InlineFragment') && selection.selectionSet) {
      removeDirectivesFromSelectionSet(directives, selection.selectionSet);
    }
  });
  return selectionSet;
}
function removeDirectivesFromDocument(directives, doc) {
  var docClone = (0, _cloneDeep.cloneDeep)(doc);
  docClone.definitions.forEach(function (definition) {
    removeDirectivesFromSelectionSet(directives, definition.selectionSet);
  });
  var operation = (0, _getFromAST.getOperationDefinitionOrDie)(docClone);
  var fragments = (0, _getFromAST.createFragmentMap)((0, _getFromAST.getFragmentDefinitions)(docClone));
  var isNotEmpty = function (op) {
    return op.selectionSet.selections.filter(function (selectionSet) {
      return !(selectionSet && selectionSet.kind === 'FragmentSpread' && !isNotEmpty(fragments[selectionSet.name.value]));
    }).length > 0;
  };
  return isNotEmpty(operation) ? docClone : null;
}
var added = new Map();
function addTypenameToDocument(doc) {
  (0, _getFromAST.checkDocument)(doc);
  var cached = added.get(doc);
  if (cached) return cached;
  var docClone = (0, _cloneDeep.cloneDeep)(doc);
  docClone.definitions.forEach(function (definition) {
    var isRoot = definition.kind === 'OperationDefinition';
    addTypenameToSelectionSet(definition.selectionSet, isRoot);
  });
  added.set(doc, docClone);
  return docClone;
}
var connectionRemoveConfig = {
  test: function (directive) {
    var willRemove = directive.name.value === 'connection';
    if (willRemove) {
      if (!directive.arguments || !directive.arguments.some(function (arg) {
        return arg.name.value === 'key';
      })) {
        console.warn('Removing an @connection directive even though it does not have a key. ' + 'You may want to use the key parameter to specify a store key.');
      }
    }
    return willRemove;
  }
};
var removed = new Map();
function removeConnectionDirectiveFromDocument(doc) {
  (0, _getFromAST.checkDocument)(doc);
  var cached = removed.get(doc);
  if (cached) return cached;
  var docClone = removeDirectivesFromDocument([connectionRemoveConfig], doc);
  removed.set(doc, docClone);
  return docClone;
}
//# sourceMappingURL=transform.js.map
},{"./util/cloneDeep":36,"./getFromAST":32}],42:[function(require,module,exports) {

// shim for using process in browser
var process = module.exports = {};

// cached from whatever global is present so that test runners that stub it
// don't break things.  But we need to wrap it in a try catch in case it is
// wrapped in strict mode code which doesn't define any globals.  It's inside a
// function because try/catches deoptimize in certain engines.

var cachedSetTimeout;
var cachedClearTimeout;

function defaultSetTimout() {
    throw new Error('setTimeout has not been defined');
}
function defaultClearTimeout () {
    throw new Error('clearTimeout has not been defined');
}
(function () {
    try {
        if (typeof setTimeout === 'function') {
            cachedSetTimeout = setTimeout;
        } else {
            cachedSetTimeout = defaultSetTimout;
        }
    } catch (e) {
        cachedSetTimeout = defaultSetTimout;
    }
    try {
        if (typeof clearTimeout === 'function') {
            cachedClearTimeout = clearTimeout;
        } else {
            cachedClearTimeout = defaultClearTimeout;
        }
    } catch (e) {
        cachedClearTimeout = defaultClearTimeout;
    }
} ())
function runTimeout(fun) {
    if (cachedSetTimeout === setTimeout) {
        //normal enviroments in sane situations
        return setTimeout(fun, 0);
    }
    // if setTimeout wasn't available but was latter defined
    if ((cachedSetTimeout === defaultSetTimout || !cachedSetTimeout) && setTimeout) {
        cachedSetTimeout = setTimeout;
        return setTimeout(fun, 0);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedSetTimeout(fun, 0);
    } catch(e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't trust the global object when called normally
            return cachedSetTimeout.call(null, fun, 0);
        } catch(e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error
            return cachedSetTimeout.call(this, fun, 0);
        }
    }


}
function runClearTimeout(marker) {
    if (cachedClearTimeout === clearTimeout) {
        //normal enviroments in sane situations
        return clearTimeout(marker);
    }
    // if clearTimeout wasn't available but was latter defined
    if ((cachedClearTimeout === defaultClearTimeout || !cachedClearTimeout) && clearTimeout) {
        cachedClearTimeout = clearTimeout;
        return clearTimeout(marker);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedClearTimeout(marker);
    } catch (e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't  trust the global object when called normally
            return cachedClearTimeout.call(null, marker);
        } catch (e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error.
            // Some versions of I.E. have different rules for clearTimeout vs setTimeout
            return cachedClearTimeout.call(this, marker);
        }
    }



}
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    if (!draining || !currentQueue) {
        return;
    }
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = runTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            if (currentQueue) {
                currentQueue[queueIndex].run();
            }
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    runClearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        runTimeout(drainQueue);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;
process.prependListener = noop;
process.prependOnceListener = noop;

process.listeners = function (name) { return [] }

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}],37:[function(require,module,exports) {
var process = require("process");
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getEnv = getEnv;
exports.isEnv = isEnv;
exports.isProduction = isProduction;
exports.isDevelopment = isDevelopment;
exports.isTest = isTest;
function getEnv() {
  if (typeof process !== 'undefined' && "development") {
    return "development";
  }
  return 'development';
}
function isEnv(env) {
  return getEnv() === env;
}
function isProduction() {
  return isEnv('production') === true;
}
function isDevelopment() {
  return isEnv('development') === true;
}
function isTest() {
  return isEnv('test') === true;
}
//# sourceMappingURL=environment.js.map
},{"process":42}],38:[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.tryFunctionOrLogError = tryFunctionOrLogError;
exports.graphQLResultHasError = graphQLResultHasError;
function tryFunctionOrLogError(f) {
  try {
    return f();
  } catch (e) {
    if (console.error) {
      console.error(e);
    }
  }
}
function graphQLResultHasError(result) {
  return result.errors && result.errors.length;
}
//# sourceMappingURL=errorHandling.js.map
},{}],39:[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.isEqual = isEqual;
function isEqual(a, b) {
  if (a === b) {
    return true;
  }
  if (a instanceof Date && b instanceof Date) {
    return a.getTime() === b.getTime();
  }
  if (a != null && typeof a === 'object' && b != null && typeof b === 'object') {
    for (var key in a) {
      if (Object.prototype.hasOwnProperty.call(a, key)) {
        if (!Object.prototype.hasOwnProperty.call(b, key)) {
          return false;
        }
        if (!isEqual(a[key], b[key])) {
          return false;
        }
      }
    }
    for (var key in b) {
      if (!Object.prototype.hasOwnProperty.call(a, key)) {
        return false;
      }
    }
    return true;
  }
  return false;
}
//# sourceMappingURL=isEqual.js.map
},{}],40:[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.maybeDeepFreeze = maybeDeepFreeze;

var _environment = require("./environment");

function deepFreeze(o) {
  Object.freeze(o);
  Object.getOwnPropertyNames(o).forEach(function (prop) {
    if (o.hasOwnProperty(prop) && o[prop] !== null && (typeof o[prop] === 'object' || typeof o[prop] === 'function') && !Object.isFrozen(o[prop])) {
      deepFreeze(o[prop]);
    }
  });
  return o;
}
function maybeDeepFreeze(obj) {
  if ((0, _environment.isDevelopment)() || (0, _environment.isTest)()) {
    return deepFreeze(obj);
  }
  return obj;
}
//# sourceMappingURL=maybeDeepFreeze.js.map
},{"./environment":37}],41:[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.warnOnceInDevelopment = warnOnceInDevelopment;

var _environment = require("./environment");

var haveWarned = Object.create({});
function warnOnceInDevelopment(msg, type) {
  if (type === void 0) {
    type = 'warn';
  }
  if ((0, _environment.isProduction)()) {
    return;
  }
  if (!haveWarned[msg]) {
    if (!(0, _environment.isTest)()) {
      haveWarned[msg] = true;
    }
    switch (type) {
      case 'error':
        console.error(msg);
        break;
      default:
        console.warn(msg);
    }
  }
}
//# sourceMappingURL=warnOnce.js.map
},{"./environment":37}],27:[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _directives = require("./directives");

Object.keys(_directives).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function () {
      return _directives[key];
    }
  });
});

var _fragments = require("./fragments");

Object.keys(_fragments).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function () {
      return _fragments[key];
    }
  });
});

var _getFromAST = require("./getFromAST");

Object.keys(_getFromAST).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function () {
      return _getFromAST[key];
    }
  });
});

var _transform = require("./transform");

Object.keys(_transform).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function () {
      return _transform[key];
    }
  });
});

var _storeUtils = require("./storeUtils");

Object.keys(_storeUtils).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function () {
      return _storeUtils[key];
    }
  });
});

var _assign = require("./util/assign");

Object.keys(_assign).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function () {
      return _assign[key];
    }
  });
});

var _cloneDeep = require("./util/cloneDeep");

Object.keys(_cloneDeep).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function () {
      return _cloneDeep[key];
    }
  });
});

var _environment = require("./util/environment");

Object.keys(_environment).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function () {
      return _environment[key];
    }
  });
});

var _errorHandling = require("./util/errorHandling");

Object.keys(_errorHandling).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function () {
      return _errorHandling[key];
    }
  });
});

var _isEqual = require("./util/isEqual");

Object.keys(_isEqual).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function () {
      return _isEqual[key];
    }
  });
});

var _maybeDeepFreeze = require("./util/maybeDeepFreeze");

Object.keys(_maybeDeepFreeze).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function () {
      return _maybeDeepFreeze[key];
    }
  });
});

var _warnOnce = require("./util/warnOnce");

Object.keys(_warnOnce).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function () {
      return _warnOnce[key];
    }
  });
});
},{"./directives":30,"./fragments":31,"./getFromAST":32,"./transform":33,"./storeUtils":34,"./util/assign":35,"./util/cloneDeep":36,"./util/environment":37,"./util/errorHandling":38,"./util/isEqual":39,"./util/maybeDeepFreeze":40,"./util/warnOnce":41}],9:[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.isNetworkRequestInFlight = isNetworkRequestInFlight;
var NetworkStatus = exports.NetworkStatus = undefined;
(function (NetworkStatus) {
  NetworkStatus[NetworkStatus["loading"] = 1] = "loading";
  NetworkStatus[NetworkStatus["setVariables"] = 2] = "setVariables";
  NetworkStatus[NetworkStatus["fetchMore"] = 3] = "fetchMore";
  NetworkStatus[NetworkStatus["refetch"] = 4] = "refetch";
  NetworkStatus[NetworkStatus["poll"] = 6] = "poll";
  NetworkStatus[NetworkStatus["ready"] = 7] = "ready";
  NetworkStatus[NetworkStatus["error"] = 8] = "error";
})(NetworkStatus || (exports.NetworkStatus = NetworkStatus = {}));
function isNetworkRequestInFlight(networkStatus) {
  return networkStatus < 7;
}
//# sourceMappingURL=networkStatus.js.map
},{}],57:[function(require,module,exports) {
'use strict'; (function(fn, name) { if (typeof exports !== "undefined") { fn(exports, module); } else if (typeof self !== "undefined") { var e = name === "*" ? self : (name ? self[name] = {} : {}); fn(e, { exports: e }); } })(function(exports, module) { // === Symbol Support ===

function hasSymbol(name) {
  return typeof Symbol === "function" && Boolean(Symbol[name]);
}

function getSymbol(name) {
  return hasSymbol(name) ? Symbol[name] : "@@" + name;
}

// Ponyfill Symbol.observable for interoperability with other libraries
if (typeof Symbol === "function" && !Symbol.observable) {
  Symbol.observable = Symbol("observable");
}

// === Abstract Operations ===

function getMethod(obj, key) {
  var value = obj[key];

  if (value == null)
    return undefined;

  if (typeof value !== "function")
    throw new TypeError(value + " is not a function");

  return value;
}

function getSpecies(obj) {
  var ctor = obj.constructor;
  if (ctor !== undefined) {
    ctor = ctor[getSymbol("species")];
    if (ctor === null) {
      ctor = undefined;
    }
  }
  return ctor !== undefined ? ctor : Observable;
}

function addMethods(target, methods) {
  Object.keys(methods).forEach(function(k) {
    var desc = Object.getOwnPropertyDescriptor(methods, k);
    desc.enumerable = false;
    Object.defineProperty(target, k, desc);
  });
}

function cleanupSubscription(subscription) {
  // Assert:  observer._observer is undefined

  var cleanup = subscription._cleanup;

  if (!cleanup)
    return;

  // Drop the reference to the cleanup function so that we won't call it
  // more than once
  subscription._cleanup = undefined;

  // Call the cleanup function
  cleanup();
}

function subscriptionClosed(subscription) {
  return subscription._observer === undefined;
}

function closeSubscription(subscription) {
  if (subscriptionClosed(subscription))
    return;

  subscription._observer = undefined;
  cleanupSubscription(subscription);
}

function cleanupFromSubscription(subscription) {
  return function() { subscription.unsubscribe() };
}

function Subscription(observer, subscriber) {
  // Assert: subscriber is callable

  // The observer must be an object
  if (Object(observer) !== observer)
    throw new TypeError("Observer must be an object");

  this._cleanup = undefined;
  this._observer = observer;

  var start = getMethod(observer, "start");

  if (start)
    start.call(observer, this);

  if (subscriptionClosed(this))
    return;

  observer = new SubscriptionObserver(this);

  try {
    // Call the subscriber function
    var cleanup$0 = subscriber.call(undefined, observer);

    // The return value must be undefined, null, a subscription object, or a function
    if (cleanup$0 != null) {
      if (typeof cleanup$0.unsubscribe === "function")
        cleanup$0 = cleanupFromSubscription(cleanup$0);
      else if (typeof cleanup$0 !== "function")
        throw new TypeError(cleanup$0 + " is not a function");

      this._cleanup = cleanup$0;
    }
  } catch (e) {
    // If an error occurs during startup, then attempt to send the error
    // to the observer
    observer.error(e);
    return;
  }

  // If the stream is already finished, then perform cleanup
  if (subscriptionClosed(this))
    cleanupSubscription(this);
}

addMethods(Subscription.prototype = {}, {
  get closed() { return subscriptionClosed(this) },
  unsubscribe: function() { closeSubscription(this) },
});

function SubscriptionObserver(subscription) {
  this._subscription = subscription;
}

addMethods(SubscriptionObserver.prototype = {}, {

  get closed() { return subscriptionClosed(this._subscription) },

  next: function(value) {
    var subscription = this._subscription;

    // If the stream is closed, then return undefined
    if (subscriptionClosed(subscription))
      return undefined;

    var observer = subscription._observer;
    var m = getMethod(observer, "next");

    // If the observer doesn't support "next", then return undefined
    if (!m)
      return undefined;

    // Send the next value to the sink
    return m.call(observer, value);
  },

  error: function(value) {
    var subscription = this._subscription;

    // If the stream is closed, throw the error to the caller
    if (subscriptionClosed(subscription))
      throw value;

    var observer = subscription._observer;
    subscription._observer = undefined;

    try {
      var m$0 = getMethod(observer, "error");

      // If the sink does not support "error", then throw the error to the caller
      if (!m$0)
        throw value;

      value = m$0.call(observer, value);
    } catch (e) {
      try { cleanupSubscription(subscription) }
      finally { throw e }
    }

    cleanupSubscription(subscription);
    return value;
  },

  complete: function(value) {
    var subscription = this._subscription;

    // If the stream is closed, then return undefined
    if (subscriptionClosed(subscription))
      return undefined;

    var observer = subscription._observer;
    subscription._observer = undefined;

    try {
      var m$1 = getMethod(observer, "complete");

      // If the sink does not support "complete", then return undefined
      value = m$1 ? m$1.call(observer, value) : undefined;
    } catch (e) {
      try { cleanupSubscription(subscription) }
      finally { throw e }
    }

    cleanupSubscription(subscription);
    return value;
  },

});

function Observable(subscriber) {
  // The stream subscriber must be a function
  if (typeof subscriber !== "function")
    throw new TypeError("Observable initializer must be a function");

  this._subscriber = subscriber;
}

addMethods(Observable.prototype, {

  subscribe: function(observer) { for (var args = [], __$0 = 1; __$0 < arguments.length; ++__$0) args.push(arguments[__$0]); 
    if (typeof observer === 'function') {
      observer = {
        next: observer,
        error: args[0],
        complete: args[1],
      };
    }

    return new Subscription(observer, this._subscriber);
  },

  forEach: function(fn) { var __this = this; 
    return new Promise(function(resolve, reject) {
      if (typeof fn !== "function")
        return Promise.reject(new TypeError(fn + " is not a function"));

      __this.subscribe({
        _subscription: null,

        start: function(subscription) {
          if (Object(subscription) !== subscription)
            throw new TypeError(subscription + " is not an object");

          this._subscription = subscription;
        },

        next: function(value) {
          var subscription = this._subscription;

          if (subscription.closed)
            return;

          try {
            return fn(value);
          } catch (err) {
            reject(err);
            subscription.unsubscribe();
          }
        },

        error: reject,
        complete: resolve,
      });
    });
  },

  map: function(fn) { var __this = this; 
    if (typeof fn !== "function")
      throw new TypeError(fn + " is not a function");

    var C = getSpecies(this);

    return new C(function(observer) { return __this.subscribe({
      next: function(value) {
        if (observer.closed)
          return;

        try { value = fn(value) }
        catch (e) { return observer.error(e) }

        return observer.next(value);
      },

      error: function(e) { return observer.error(e) },
      complete: function(x) { return observer.complete(x) },
    }); });
  },

  filter: function(fn) { var __this = this; 
    if (typeof fn !== "function")
      throw new TypeError(fn + " is not a function");

    var C = getSpecies(this);

    return new C(function(observer) { return __this.subscribe({
      next: function(value) {
        if (observer.closed)
          return;

        try { if (!fn(value)) return undefined }
        catch (e) { return observer.error(e) }

        return observer.next(value);
      },

      error: function(e) { return observer.error(e) },
      complete: function() { return observer.complete() },
    }); });
  },

  reduce: function(fn) { var __this = this; 
    if (typeof fn !== "function")
      throw new TypeError(fn + " is not a function");

    var C = getSpecies(this);
    var hasSeed = arguments.length > 1;
    var hasValue = false;
    var seed = arguments[1];
    var acc = seed;

    return new C(function(observer) { return __this.subscribe({

      next: function(value) {
        if (observer.closed)
          return;

        var first = !hasValue;
        hasValue = true;

        if (!first || hasSeed) {
          try { acc = fn(acc, value) }
          catch (e) { return observer.error(e) }
        } else {
          acc = value;
        }
      },

      error: function(e) { observer.error(e) },

      complete: function() {
        if (!hasValue && !hasSeed) {
          observer.error(new TypeError("Cannot reduce an empty sequence"));
          return;
        }

        observer.next(acc);
        observer.complete();
      },

    }); });
  },

  flatMap: function(fn) { var __this = this; 
    if (typeof fn !== "function")
      throw new TypeError(fn + " is not a function");

    var C = getSpecies(this);

    return new C(function(observer) {
      var completed = false;
      var subscriptions = [];

      // Subscribe to the outer Observable
      var outer = __this.subscribe({

        next: function(value) {
          if (fn) {
            try {
              value = fn(value);
            } catch (x) {
              observer.error(x);
              return;
            }
          }

          // Subscribe to the inner Observable
          Observable.from(value).subscribe({
            _subscription: null,

            start: function(s) { subscriptions.push(this._subscription = s) },
            next: function(value) { observer.next(value) },
            error: function(e) { observer.error(e) },

            complete: function() {
              var i = subscriptions.indexOf(this._subscription);

              if (i >= 0)
                subscriptions.splice(i, 1);

              closeIfDone();
            }
          });
        },

        error: function(e) {
          return observer.error(e);
        },

        complete: function() {
          completed = true;
          closeIfDone();
        }
      });

      function closeIfDone() {
        if (completed && subscriptions.length === 0)
          observer.complete();
      }

      return function() {
        subscriptions.forEach(function(s) { return s.unsubscribe(); });
        outer.unsubscribe();
      };
    });
  },

});

Object.defineProperty(Observable.prototype, getSymbol("observable"), {
  value: function() { return this },
  writable: true,
  configurable: true,
});

addMethods(Observable, {

  from: function(x) {
    var C = typeof this === "function" ? this : Observable;

    if (x == null)
      throw new TypeError(x + " is not an object");

    var method = getMethod(x, getSymbol("observable"));

    if (method) {
      var observable$0 = method.call(x);

      if (Object(observable$0) !== observable$0)
        throw new TypeError(observable$0 + " is not an object");

      if (observable$0.constructor === C)
        return observable$0;

      return new C(function(observer) { return observable$0.subscribe(observer); });
    }

    if (hasSymbol("iterator") && (method = getMethod(x, getSymbol("iterator")))) {
      return new C(function(observer) {
        for (var __$0 = (method.call(x))[Symbol.iterator](), __$1; __$1 = __$0.next(), !__$1.done;) { var item$0 = __$1.value; 
          observer.next(item$0);
          if (observer.closed)
            return;
        }

        observer.complete();
      });
    }

    if (Array.isArray(x)) {
      return new C(function(observer) {
        for (var i$0 = 0; i$0 < x.length; ++i$0) {
          observer.next(x[i$0]);
          if (observer.closed)
            return;
        }

        observer.complete();
      });
    }

    throw new TypeError(x + " is not observable");
  },

  of: function() { for (var items = [], __$0 = 0; __$0 < arguments.length; ++__$0) items.push(arguments[__$0]); 
    var C = typeof this === "function" ? this : Observable;

    return new C(function(observer) {
      for (var i$1 = 0; i$1 < items.length; ++i$1) {
        observer.next(items[i$1]);
        if (observer.closed)
          return;
      }

      observer.complete();
    });
  },

});

Object.defineProperty(Observable, getSymbol("species"), {
  get: function() { return this },
  configurable: true,
});

Object.defineProperty(Observable, "observableSymbol", {
  value: getSymbol("observable"),
});

exports.Observable = Observable;


}, "*");
},{}],56:[function(require,module,exports) {
module.exports = require("./zen-observable.js").Observable;

},{"./zen-observable.js":57}],29:[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.makePromise = exports.LinkError = undefined;
exports.validateOperation = validateOperation;
exports.isTerminating = isTerminating;
exports.toPromise = toPromise;
exports.fromPromise = fromPromise;
exports.transformOperation = transformOperation;
exports.createOperation = createOperation;
exports.getKey = getKey;

var _apolloUtilities = require("apollo-utilities");

var _zenObservable = require("zen-observable");

var Observable = _interopRequireWildcard(_zenObservable);

var _printer = require("graphql/language/printer");

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

var __extends = undefined && undefined.__extends || function () {
  var extendStatics = Object.setPrototypeOf || { __proto__: [] } instanceof Array && function (d, b) {
    d.__proto__ = b;
  } || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
  };
  return function (d, b) {
    extendStatics(d, b);
    function __() {
      this.constructor = d;
    }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
  };
}();
var __assign = undefined && undefined.__assign || Object.assign || function (t) {
  for (var s, i = 1, n = arguments.length; i < n; i++) {
    s = arguments[i];
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
  }
  return t;
};
function validateOperation(operation) {
  var OPERATION_FIELDS = ['query', 'operationName', 'variables', 'extensions', 'context'];
  for (var _i = 0, _a = Object.keys(operation); _i < _a.length; _i++) {
    var key = _a[_i];
    if (OPERATION_FIELDS.indexOf(key) < 0) {
      throw new Error("illegal argument: " + key);
    }
  }
  return operation;
}
var LinkError = function (_super) {
  __extends(LinkError, _super);
  function LinkError(message, link) {
    var _this = _super.call(this, message) || this;
    _this.link = link;
    return _this;
  }
  return LinkError;
}(Error);
exports.LinkError = LinkError;
function isTerminating(link) {
  return link.request.length <= 1;
}
function toPromise(observable) {
  var completed = false;
  return new Promise(function (resolve, reject) {
    observable.subscribe({
      next: function (data) {
        if (completed) {
          console.warn("Promise Wrapper does not support multiple results from Observable");
        } else {
          completed = true;
          resolve(data);
        }
      },
      error: reject
    });
  });
}
var makePromise = exports.makePromise = toPromise;
function fromPromise(promise) {
  return new Observable(function (observer) {
    promise.then(function (value) {
      observer.next(value);
      observer.complete();
    }).catch(observer.error.bind(observer));
  });
}
function transformOperation(operation) {
  var transformedOperation = {
    variables: operation.variables || {},
    extensions: operation.extensions || {},
    operationName: operation.operationName,
    query: operation.query
  };
  if (!transformedOperation.operationName) {
    transformedOperation.operationName = typeof transformedOperation.query !== 'string' ? (0, _apolloUtilities.getOperationName)(transformedOperation.query) : '';
  }
  return transformedOperation;
}
function createOperation(starting, operation) {
  var context = __assign({}, starting);
  var setContext = function (next) {
    if (typeof next === 'function') {
      context = __assign({}, context, next(context));
    } else {
      context = __assign({}, context, next);
    }
  };
  var getContext = function () {
    return __assign({}, context);
  };
  Object.defineProperty(operation, 'setContext', {
    enumerable: false,
    value: setContext
  });
  Object.defineProperty(operation, 'getContext', {
    enumerable: false,
    value: getContext
  });
  Object.defineProperty(operation, 'toKey', {
    enumerable: false,
    value: function () {
      return getKey(operation);
    }
  });
  return operation;
}
function getKey(operation) {
  return (0, _printer.print)(operation.query) + "|" + JSON.stringify(operation.variables) + "|" + operation.operationName;
}
//# sourceMappingURL=linkUtils.js.map
},{"apollo-utilities":27,"zen-observable":56,"graphql/language/printer":43}],28:[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.ApolloLink = exports.concat = exports.split = exports.from = exports.empty = undefined;
exports.execute = execute;

var _zenObservable = require("zen-observable");

var Observable = _interopRequireWildcard(_zenObservable);

var _linkUtils = require("./linkUtils");

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

var passthrough = function (op, forward) {
  return forward ? forward(op) : Observable.of();
};
var toLink = function (handler) {
  return typeof handler === 'function' ? new ApolloLink(handler) : handler;
};
var empty = exports.empty = function () {
  return new ApolloLink(function (op, forward) {
    return Observable.of();
  });
};
var from = exports.from = function (links) {
  if (links.length === 0) return empty();
  return links.map(toLink).reduce(function (x, y) {
    return x.concat(y);
  });
};
var split = exports.split = function (test, left, right) {
  if (right === void 0) {
    right = new ApolloLink(passthrough);
  }
  var leftLink = toLink(left);
  var rightLink = toLink(right);
  if ((0, _linkUtils.isTerminating)(leftLink) && (0, _linkUtils.isTerminating)(rightLink)) {
    return new ApolloLink(function (operation) {
      return test(operation) ? leftLink.request(operation) || Observable.of() : rightLink.request(operation) || Observable.of();
    });
  } else {
    return new ApolloLink(function (operation, forward) {
      return test(operation) ? leftLink.request(operation, forward) || Observable.of() : rightLink.request(operation, forward) || Observable.of();
    });
  }
};
var concat = exports.concat = function (first, second) {
  var firstLink = toLink(first);
  if ((0, _linkUtils.isTerminating)(firstLink)) {
    console.warn(new _linkUtils.LinkError("You are calling concat on a terminating link, which will have no effect", firstLink));
    return firstLink;
  }
  var nextLink = toLink(second);
  if ((0, _linkUtils.isTerminating)(nextLink)) {
    return new ApolloLink(function (operation) {
      return firstLink.request(operation, function (op) {
        return nextLink.request(op) || Observable.of();
      }) || Observable.of();
    });
  } else {
    return new ApolloLink(function (operation, forward) {
      return firstLink.request(operation, function (op) {
        return nextLink.request(op, forward) || Observable.of();
      }) || Observable.of();
    });
  }
};
var ApolloLink = function () {
  function ApolloLink(request) {
    if (request) this.request = request;
  }
  ApolloLink.prototype.split = function (test, left, right) {
    if (right === void 0) {
      right = new ApolloLink(passthrough);
    }
    return this.concat(split(test, left, right));
  };
  ApolloLink.prototype.concat = function (next) {
    return concat(this, next);
  };
  ApolloLink.prototype.request = function (operation, forward) {
    throw new Error('request is not implemented');
  };
  ApolloLink.empty = empty;
  ApolloLink.from = from;
  ApolloLink.split = split;
  return ApolloLink;
}();
exports.ApolloLink = ApolloLink;
function execute(link, operation) {
  return link.request((0, _linkUtils.createOperation)(operation.context, (0, _linkUtils.transformOperation)((0, _linkUtils.validateOperation)(operation)))) || Observable.of();
}
//# sourceMappingURL=link.js.map
},{"zen-observable":56,"./linkUtils":29}],26:[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Observable = exports.fromPromise = exports.toPromise = exports.makePromise = exports.createOperation = undefined;

var _link = require("./link");

Object.keys(_link).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function () {
      return _link[key];
    }
  });
});

var _linkUtils = require("./linkUtils");

Object.defineProperty(exports, "createOperation", {
  enumerable: true,
  get: function () {
    return _linkUtils.createOperation;
  }
});
Object.defineProperty(exports, "makePromise", {
  enumerable: true,
  get: function () {
    return _linkUtils.makePromise;
  }
});
Object.defineProperty(exports, "toPromise", {
  enumerable: true,
  get: function () {
    return _linkUtils.toPromise;
  }
});
Object.defineProperty(exports, "fromPromise", {
  enumerable: true,
  get: function () {
    return _linkUtils.fromPromise;
  }
});

var _zenObservable = require("zen-observable");

var Observable = _interopRequireWildcard(_zenObservable);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

exports.Observable = Observable;
//# sourceMappingURL=index.js.map
},{"./link":28,"./linkUtils":29,"zen-observable":56}],53:[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = symbolObservablePonyfill;
function symbolObservablePonyfill(root) {
  var result;
  var Symbol = root.Symbol;

  if (typeof Symbol === 'function') {
    if (Symbol.observable) {
      result = Symbol.observable;
    } else {
      result = Symbol('observable');
      Symbol.observable = result;
    }
  } else {
    result = '@@observable';
  }

  return result;
};
},{}],48:[function(require,module,exports) {
var global = (1,eval)("this");
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _ponyfill = require("./ponyfill.js");

var _ponyfill2 = _interopRequireDefault(_ponyfill);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var root; /* global window */


if (typeof self !== 'undefined') {
  root = self;
} else if (typeof window !== 'undefined') {
  root = window;
} else if (typeof global !== 'undefined') {
  root = global;
} else if (typeof module !== 'undefined') {
  root = module;
} else {
  root = Function('return this')();
}

var result = (0, _ponyfill2.default)(root);
exports.default = result;
},{"./ponyfill.js":53}],22:[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Observable = undefined;

var _apolloLink = require("apollo-link");

var _symbolObservable = require("symbol-observable");

var _symbolObservable2 = _interopRequireDefault(_symbolObservable);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var __extends = undefined && undefined.__extends || function () {
  var extendStatics = Object.setPrototypeOf || { __proto__: [] } instanceof Array && function (d, b) {
    d.__proto__ = b;
  } || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
  };
  return function (d, b) {
    extendStatics(d, b);
    function __() {
      this.constructor = d;
    }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
  };
}();

var Observable = function (_super) {
  __extends(Observable, _super);
  function Observable() {
    return _super !== null && _super.apply(this, arguments) || this;
  }
  Observable.prototype[_symbolObservable2.default] = function () {
    return this;
  };
  return Observable;
}(_apolloLink.Observable);
exports.Observable = Observable;
//# sourceMappingURL=Observable.js.map
},{"apollo-link":26,"symbol-observable":48}],11:[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.isApolloError = isApolloError;
var __extends = undefined && undefined.__extends || function () {
  var extendStatics = Object.setPrototypeOf || { __proto__: [] } instanceof Array && function (d, b) {
    d.__proto__ = b;
  } || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
  };
  return function (d, b) {
    extendStatics(d, b);
    function __() {
      this.constructor = d;
    }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
  };
}();
function isApolloError(err) {
  return err.hasOwnProperty('graphQLErrors');
}
var generateErrorMessage = function (err) {
  var message = '';
  if (Array.isArray(err.graphQLErrors) && err.graphQLErrors.length !== 0) {
    err.graphQLErrors.forEach(function (graphQLError) {
      var errorMessage = graphQLError ? graphQLError.message : 'Error message not found.';
      message += "GraphQL error: " + errorMessage + "\n";
    });
  }
  if (err.networkError) {
    message += 'Network error: ' + err.networkError.message + '\n';
  }
  message = message.replace(/\n$/, '');
  return message;
};
var ApolloError = function (_super) {
  __extends(ApolloError, _super);
  function ApolloError(_a) {
    var graphQLErrors = _a.graphQLErrors,
        networkError = _a.networkError,
        errorMessage = _a.errorMessage,
        extraInfo = _a.extraInfo;
    var _this = _super.call(this, errorMessage) || this;
    _this.graphQLErrors = graphQLErrors || [];
    _this.networkError = networkError || null;
    if (!errorMessage) {
      _this.message = generateErrorMessage(_this);
    } else {
      _this.message = errorMessage;
    }
    _this.extraInfo = extraInfo;
    return _this;
  }
  return ApolloError;
}(Error);
exports.ApolloError = ApolloError;
//# sourceMappingURL=ApolloError.js.map
},{}],10:[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
var FetchType = exports.FetchType = undefined;
(function (FetchType) {
  FetchType[FetchType["normal"] = 1] = "normal";
  FetchType[FetchType["refetch"] = 2] = "refetch";
  FetchType[FetchType["poll"] = 3] = "poll";
})(FetchType || (exports.FetchType = FetchType = {}));
//# sourceMappingURL=types.js.map
},{}],8:[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.ObservableQuery = exports.hasError = undefined;

var _apolloUtilities = require("apollo-utilities");

var _networkStatus = require("./networkStatus");

var _Observable = require("../util/Observable");

var _ApolloError = require("../errors/ApolloError");

var _types = require("./types");

var __extends = undefined && undefined.__extends || function () {
  var extendStatics = Object.setPrototypeOf || { __proto__: [] } instanceof Array && function (d, b) {
    d.__proto__ = b;
  } || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
  };
  return function (d, b) {
    extendStatics(d, b);
    function __() {
      this.constructor = d;
    }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
  };
}();
var __assign = undefined && undefined.__assign || Object.assign || function (t) {
  for (var s, i = 1, n = arguments.length; i < n; i++) {
    s = arguments[i];
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
  }
  return t;
};
var hasError = exports.hasError = function (storeValue, policy) {
  if (policy === void 0) {
    policy = 'none';
  }
  return storeValue && (storeValue.graphQLErrors && storeValue.graphQLErrors.length > 0 && policy === 'none' || storeValue.networkError);
};
var ObservableQuery = function (_super) {
  __extends(ObservableQuery, _super);
  function ObservableQuery(_a) {
    var scheduler = _a.scheduler,
        options = _a.options,
        _b = _a.shouldSubscribe,
        shouldSubscribe = _b === void 0 ? true : _b;
    var _this = _super.call(this, function (observer) {
      return _this.onSubscribe(observer);
    }) || this;
    _this.isCurrentlyPolling = false;
    _this.isTornDown = false;
    _this.options = options;
    _this.variables = options.variables || {};
    _this.queryId = scheduler.queryManager.generateQueryId();
    _this.shouldSubscribe = shouldSubscribe;
    _this.scheduler = scheduler;
    _this.queryManager = scheduler.queryManager;
    _this.observers = [];
    _this.subscriptionHandles = [];
    return _this;
  }
  ObservableQuery.prototype.result = function () {
    var that = this;
    return new Promise(function (resolve, reject) {
      var subscription;
      var observer = {
        next: function (result) {
          resolve(result);
          if (!that.observers.some(function (obs) {
            return obs !== observer;
          })) {
            that.queryManager.removeQuery(that.queryId);
          }
          setTimeout(function () {
            subscription.unsubscribe();
          }, 0);
        },
        error: function (error) {
          reject(error);
        }
      };
      subscription = that.subscribe(observer);
    });
  };
  ObservableQuery.prototype.currentResult = function () {
    if (this.isTornDown) {
      return {
        data: this.lastError ? {} : this.lastResult ? this.lastResult.data : {},
        error: this.lastError,
        loading: false,
        networkStatus: _networkStatus.NetworkStatus.error
      };
    }
    var queryStoreValue = this.queryManager.queryStore.get(this.queryId);
    if (hasError(queryStoreValue, this.options.errorPolicy)) {
      return {
        data: {},
        loading: false,
        networkStatus: queryStoreValue.networkStatus,
        error: new _ApolloError.ApolloError({
          graphQLErrors: queryStoreValue.graphQLErrors,
          networkError: queryStoreValue.networkError
        })
      };
    }
    var _a = this.queryManager.getCurrentQueryResult(this),
        data = _a.data,
        partial = _a.partial;
    var queryLoading = !queryStoreValue || queryStoreValue.networkStatus === _networkStatus.NetworkStatus.loading;
    var loading = this.options.fetchPolicy === 'network-only' && queryLoading || partial && this.options.fetchPolicy !== 'cache-only';
    var networkStatus;
    if (queryStoreValue) {
      networkStatus = queryStoreValue.networkStatus;
    } else {
      networkStatus = loading ? _networkStatus.NetworkStatus.loading : _networkStatus.NetworkStatus.ready;
    }
    var result = {
      data: data,
      loading: (0, _networkStatus.isNetworkRequestInFlight)(networkStatus),
      networkStatus: networkStatus
    };
    if (queryStoreValue && queryStoreValue.graphQLErrors && this.options.errorPolicy === 'all') {
      result.errors = queryStoreValue.graphQLErrors;
    }
    if (!partial) {
      var stale = false;
      this.lastResult = __assign({}, result, { stale: stale });
    }
    return __assign({}, result, { partial: partial });
  };
  ObservableQuery.prototype.getLastResult = function () {
    return this.lastResult;
  };
  ObservableQuery.prototype.getLastError = function () {
    return this.lastError;
  };
  ObservableQuery.prototype.resetLastResults = function () {
    delete this.lastResult;
    delete this.lastError;
    this.isTornDown = false;
  };
  ObservableQuery.prototype.refetch = function (variables) {
    if (this.options.fetchPolicy === 'cache-only') {
      return Promise.reject(new Error('cache-only fetchPolicy option should not be used together with query refetch.'));
    }
    if (!(0, _apolloUtilities.isEqual)(this.variables, variables)) {
      this.variables = __assign({}, this.variables, variables);
    }
    if (!(0, _apolloUtilities.isEqual)(this.options.variables, this.variables)) {
      this.options.variables = __assign({}, this.options.variables, this.variables);
    }
    var combinedOptions = __assign({}, this.options, { fetchPolicy: 'network-only' });
    return this.queryManager.fetchQuery(this.queryId, combinedOptions, _types.FetchType.refetch).then(function (result) {
      return (0, _apolloUtilities.maybeDeepFreeze)(result);
    });
  };
  ObservableQuery.prototype.fetchMore = function (fetchMoreOptions) {
    var _this = this;
    if (!fetchMoreOptions.updateQuery) {
      throw new Error('updateQuery option is required. This function defines how to update the query data with the new results.');
    }
    return Promise.resolve().then(function () {
      var qid = _this.queryManager.generateQueryId();
      var combinedOptions;
      if (fetchMoreOptions.query) {
        combinedOptions = fetchMoreOptions;
      } else {
        combinedOptions = __assign({}, _this.options, fetchMoreOptions, { variables: __assign({}, _this.variables, fetchMoreOptions.variables) });
      }
      combinedOptions.fetchPolicy = 'network-only';
      return _this.queryManager.fetchQuery(qid, combinedOptions, _types.FetchType.normal, _this.queryId);
    }).then(function (fetchMoreResult) {
      _this.updateQuery(function (previousResult, _a) {
        var variables = _a.variables;
        return fetchMoreOptions.updateQuery(previousResult, {
          fetchMoreResult: fetchMoreResult.data,
          variables: variables
        });
      });
      return fetchMoreResult;
    });
  };
  ObservableQuery.prototype.subscribeToMore = function (options) {
    var _this = this;
    var subscription = this.queryManager.startGraphQLSubscription({
      query: options.document,
      variables: options.variables
    }).subscribe({
      next: function (data) {
        if (options.updateQuery) {
          _this.updateQuery(function (previous, _a) {
            var variables = _a.variables;
            return options.updateQuery(previous, {
              subscriptionData: data,
              variables: variables
            });
          });
        }
      },
      error: function (err) {
        if (options.onError) {
          options.onError(err);
          return;
        }
        console.error('Unhandled GraphQL subscription error', err);
      }
    });
    this.subscriptionHandles.push(subscription);
    return function () {
      var i = _this.subscriptionHandles.indexOf(subscription);
      if (i >= 0) {
        _this.subscriptionHandles.splice(i, 1);
        subscription.unsubscribe();
      }
    };
  };
  ObservableQuery.prototype.setOptions = function (opts) {
    var oldOptions = this.options;
    this.options = __assign({}, this.options, opts);
    if (opts.pollInterval) {
      this.startPolling(opts.pollInterval);
    } else if (opts.pollInterval === 0) {
      this.stopPolling();
    }
    var tryFetch = oldOptions.fetchPolicy !== 'network-only' && opts.fetchPolicy === 'network-only' || oldOptions.fetchPolicy === 'cache-only' && opts.fetchPolicy !== 'cache-only' || oldOptions.fetchPolicy === 'standby' && opts.fetchPolicy !== 'standby' || false;
    return this.setVariables(this.options.variables, tryFetch, opts.fetchResults);
  };
  ObservableQuery.prototype.setVariables = function (variables, tryFetch, fetchResults) {
    if (tryFetch === void 0) {
      tryFetch = false;
    }
    if (fetchResults === void 0) {
      fetchResults = true;
    }
    this.isTornDown = false;
    var newVariables = __assign({}, this.variables, variables);
    if ((0, _apolloUtilities.isEqual)(newVariables, this.variables) && !tryFetch) {
      if (this.observers.length === 0 || !fetchResults) {
        return new Promise(function (resolve) {
          return resolve();
        });
      }
      return this.result();
    } else {
      this.lastVariables = this.variables;
      this.variables = newVariables;
      this.options.variables = newVariables;
      if (this.observers.length === 0) {
        return new Promise(function (resolve) {
          return resolve();
        });
      }
      return this.queryManager.fetchQuery(this.queryId, __assign({}, this.options, { variables: this.variables })).then(function (result) {
        return (0, _apolloUtilities.maybeDeepFreeze)(result);
      });
    }
  };
  ObservableQuery.prototype.updateQuery = function (mapFn) {
    var _a = this.queryManager.getQueryWithPreviousResult(this.queryId),
        previousResult = _a.previousResult,
        variables = _a.variables,
        document = _a.document;
    var newResult = (0, _apolloUtilities.tryFunctionOrLogError)(function () {
      return mapFn(previousResult, { variables: variables });
    });
    if (newResult) {
      this.queryManager.dataStore.markUpdateQueryResult(document, variables, newResult);
      this.queryManager.broadcastQueries();
    }
  };
  ObservableQuery.prototype.stopPolling = function () {
    if (this.isCurrentlyPolling) {
      this.scheduler.stopPollingQuery(this.queryId);
      this.options.pollInterval = undefined;
      this.isCurrentlyPolling = false;
    }
  };
  ObservableQuery.prototype.startPolling = function (pollInterval) {
    if (this.options.fetchPolicy === 'cache-first' || this.options.fetchPolicy === 'cache-only') {
      throw new Error('Queries that specify the cache-first and cache-only fetchPolicies cannot also be polling queries.');
    }
    if (this.isCurrentlyPolling) {
      this.scheduler.stopPollingQuery(this.queryId);
      this.isCurrentlyPolling = false;
    }
    this.options.pollInterval = pollInterval;
    this.isCurrentlyPolling = true;
    this.scheduler.startPollingQuery(this.options, this.queryId);
  };
  ObservableQuery.prototype.onSubscribe = function (observer) {
    var _this = this;
    if (observer._subscription && observer._subscription._observer && !observer._subscription._observer.error) {
      observer._subscription._observer.error = function (error) {
        console.error('Unhandled error', error.message, error.stack);
      };
    }
    this.observers.push(observer);
    if (observer.next && this.lastResult) observer.next(this.lastResult);
    if (observer.error && this.lastError) observer.error(this.lastError);
    if (this.observers.length === 1) this.setUpQuery();
    return function () {
      _this.observers = _this.observers.filter(function (obs) {
        return obs !== observer;
      });
      if (_this.observers.length === 0) {
        _this.tearDownQuery();
      }
    };
  };
  ObservableQuery.prototype.setUpQuery = function () {
    var _this = this;
    if (this.shouldSubscribe) {
      this.queryManager.addObservableQuery(this.queryId, this);
    }
    if (!!this.options.pollInterval) {
      if (this.options.fetchPolicy === 'cache-first' || this.options.fetchPolicy === 'cache-only') {
        throw new Error('Queries that specify the cache-first and cache-only fetchPolicies cannot also be polling queries.');
      }
      this.isCurrentlyPolling = true;
      this.scheduler.startPollingQuery(this.options, this.queryId);
    }
    var observer = {
      next: function (result) {
        _this.lastResult = result;
        _this.observers.forEach(function (obs) {
          return obs.next && obs.next(result);
        });
      },
      error: function (error) {
        _this.lastError = error;
        _this.observers.forEach(function (obs) {
          return obs.error && obs.error(error);
        });
      }
    };
    this.queryManager.startQuery(this.queryId, this.options, this.queryManager.queryListenerForObserver(this.queryId, this.options, observer));
  };
  ObservableQuery.prototype.tearDownQuery = function () {
    this.isTornDown = true;
    if (this.isCurrentlyPolling) {
      this.scheduler.stopPollingQuery(this.queryId);
      this.isCurrentlyPolling = false;
    }
    this.subscriptionHandles.forEach(function (sub) {
      return sub.unsubscribe();
    });
    this.subscriptionHandles = [];
    this.queryManager.removeObservableQuery(this.queryId);
    this.queryManager.stopQuery(this.queryId);
    this.observers = [];
  };
  return ObservableQuery;
}(_Observable.Observable);
exports.ObservableQuery = ObservableQuery;
//# sourceMappingURL=ObservableQuery.js.map
},{"apollo-utilities":27,"./networkStatus":9,"../util/Observable":22,"../errors/ApolloError":11,"./types":10}],52:[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.DedupLink = undefined;

var _apolloLink = require("apollo-link");

var __extends = undefined && undefined.__extends || function () {
  var extendStatics = Object.setPrototypeOf || { __proto__: [] } instanceof Array && function (d, b) {
    d.__proto__ = b;
  } || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
  };
  return function (d, b) {
    extendStatics(d, b);
    function __() {
      this.constructor = d;
    }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
  };
}();

var DedupLink = function (_super) {
  __extends(DedupLink, _super);
  function DedupLink() {
    var _this = _super !== null && _super.apply(this, arguments) || this;
    _this.inFlightRequestObservables = new Map();
    _this.subscribers = new Map();
    return _this;
  }
  DedupLink.prototype.request = function (operation, forward) {
    var _this = this;
    if (operation.getContext().forceFetch) {
      return forward(operation);
    }
    var key = operation.toKey();
    var cleanup = function (key) {
      _this.inFlightRequestObservables.delete(key);
      var prev = _this.subscribers.get(key);
      return prev;
    };
    if (!this.inFlightRequestObservables.get(key)) {
      var singleObserver_1 = forward(operation);
      var subscription_1;
      var sharedObserver = new _apolloLink.Observable(function (observer) {
        var prev = _this.subscribers.get(key);
        if (!prev) prev = { next: [], error: [], complete: [] };
        _this.subscribers.set(key, {
          next: prev.next.concat([observer.next.bind(observer)]),
          error: prev.error.concat([observer.error.bind(observer)]),
          complete: prev.complete.concat([observer.complete.bind(observer)])
        });
        if (!subscription_1) {
          subscription_1 = singleObserver_1.subscribe({
            next: function (result) {
              var prev = cleanup(key);
              _this.subscribers.delete(key);
              if (prev) {
                prev.next.forEach(function (next) {
                  return next(result);
                });
                prev.complete.forEach(function (complete) {
                  return complete();
                });
              }
            },
            error: function (error) {
              var prev = cleanup(key);
              _this.subscribers.delete(key);
              if (prev) prev.error.forEach(function (err) {
                return err(error);
              });
            }
          });
        }
        return function () {
          if (subscription_1) subscription_1.unsubscribe();
          _this.inFlightRequestObservables.delete(key);
        };
      });
      this.inFlightRequestObservables.set(key, sharedObserver);
    }
    return this.inFlightRequestObservables.get(key);
  };
  return DedupLink;
}(_apolloLink.ApolloLink);
exports.DedupLink = DedupLink;
//# sourceMappingURL=dedupLink.js.map
},{"apollo-link":26}],47:[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _dedupLink = require("./dedupLink");

Object.keys(_dedupLink).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function () {
      return _dedupLink[key];
    }
  });
});
},{"./dedupLink":52}],23:[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.QueryScheduler = undefined;

var _types = require("../core/types");

var _ObservableQuery = require("../core/ObservableQuery");

var _networkStatus = require("../core/networkStatus");

var __assign = undefined && undefined.__assign || Object.assign || function (t) {
  for (var s, i = 1, n = arguments.length; i < n; i++) {
    s = arguments[i];
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
  }
  return t;
};

var QueryScheduler = function () {
  function QueryScheduler(_a) {
    var queryManager = _a.queryManager,
        ssrMode = _a.ssrMode;
    this.inFlightQueries = {};
    this.registeredQueries = {};
    this.intervalQueries = {};
    this.pollingTimers = {};
    this.ssrMode = false;
    this.queryManager = queryManager;
    this.ssrMode = ssrMode || false;
  }
  QueryScheduler.prototype.checkInFlight = function (queryId) {
    var query = this.queryManager.queryStore.get(queryId);
    return query && query.networkStatus !== _networkStatus.NetworkStatus.ready && query.networkStatus !== _networkStatus.NetworkStatus.error;
  };
  QueryScheduler.prototype.fetchQuery = function (queryId, options, fetchType) {
    var _this = this;
    return new Promise(function (resolve, reject) {
      _this.queryManager.fetchQuery(queryId, options, fetchType).then(function (result) {
        resolve(result);
      }).catch(function (error) {
        reject(error);
      });
    });
  };
  QueryScheduler.prototype.startPollingQuery = function (options, queryId, listener) {
    if (!options.pollInterval) {
      throw new Error('Attempted to start a polling query without a polling interval.');
    }
    if (this.ssrMode) return queryId;
    this.registeredQueries[queryId] = options;
    if (listener) {
      this.queryManager.addQueryListener(queryId, listener);
    }
    this.addQueryOnInterval(queryId, options);
    return queryId;
  };
  QueryScheduler.prototype.stopPollingQuery = function (queryId) {
    delete this.registeredQueries[queryId];
  };
  QueryScheduler.prototype.fetchQueriesOnInterval = function (interval) {
    var _this = this;
    this.intervalQueries[interval] = this.intervalQueries[interval].filter(function (queryId) {
      if (!(_this.registeredQueries.hasOwnProperty(queryId) && _this.registeredQueries[queryId].pollInterval === interval)) {
        return false;
      }
      if (_this.checkInFlight(queryId)) {
        return true;
      }
      var queryOptions = _this.registeredQueries[queryId];
      var pollingOptions = __assign({}, queryOptions);
      pollingOptions.fetchPolicy = 'network-only';
      _this.fetchQuery(queryId, pollingOptions, _types.FetchType.poll).catch(function () {});
      return true;
    });
    if (this.intervalQueries[interval].length === 0) {
      clearInterval(this.pollingTimers[interval]);
      delete this.intervalQueries[interval];
    }
  };
  QueryScheduler.prototype.addQueryOnInterval = function (queryId, queryOptions) {
    var _this = this;
    var interval = queryOptions.pollInterval;
    if (!interval) {
      throw new Error("A poll interval is required to start polling query with id '" + queryId + "'.");
    }
    if (this.intervalQueries.hasOwnProperty(interval.toString()) && this.intervalQueries[interval].length > 0) {
      this.intervalQueries[interval].push(queryId);
    } else {
      this.intervalQueries[interval] = [queryId];
      this.pollingTimers[interval] = setInterval(function () {
        _this.fetchQueriesOnInterval(interval);
      }, interval);
    }
  };
  QueryScheduler.prototype.registerPollingQuery = function (queryOptions) {
    if (!queryOptions.pollInterval) {
      throw new Error('Attempted to register a non-polling query with the scheduler.');
    }
    return new _ObservableQuery.ObservableQuery({
      scheduler: this,
      options: queryOptions
    });
  };
  return QueryScheduler;
}();
exports.QueryScheduler = QueryScheduler;
//# sourceMappingURL=scheduler.js.map
},{"../core/types":10,"../core/ObservableQuery":8,"../core/networkStatus":9}],24:[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
var MutationStore = function () {
  function MutationStore() {
    this.store = {};
  }
  MutationStore.prototype.getStore = function () {
    return this.store;
  };
  MutationStore.prototype.get = function (mutationId) {
    return this.store[mutationId];
  };
  MutationStore.prototype.initMutation = function (mutationId, mutationString, variables) {
    this.store[mutationId] = {
      mutationString: mutationString,
      variables: variables || {},
      loading: true,
      error: null
    };
  };
  MutationStore.prototype.markMutationError = function (mutationId, error) {
    this.store[mutationId].loading = false;
    this.store[mutationId].error = error;
  };
  MutationStore.prototype.markMutationResult = function (mutationId) {
    this.store[mutationId].loading = false;
    this.store[mutationId].error = null;
  };
  MutationStore.prototype.reset = function () {
    this.store = {};
  };
  return MutationStore;
}();
exports.MutationStore = MutationStore;
//# sourceMappingURL=mutations.js.map
},{}],25:[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.QueryStore = undefined;

var _apolloUtilities = require("apollo-utilities");

var _networkStatus = require("../core/networkStatus");

var __assign = undefined && undefined.__assign || Object.assign || function (t) {
  for (var s, i = 1, n = arguments.length; i < n; i++) {
    s = arguments[i];
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
  }
  return t;
};

var QueryStore = function () {
  function QueryStore() {
    this.store = {};
  }
  QueryStore.prototype.getStore = function () {
    return this.store;
  };
  QueryStore.prototype.get = function (queryId) {
    return this.store[queryId];
  };
  QueryStore.prototype.initQuery = function (query) {
    var previousQuery = this.store[query.queryId];
    if (previousQuery && previousQuery.queryString !== query.queryString) {
      throw new Error('Internal Error: may not update existing query string in store');
    }
    var isSetVariables = false;
    var previousVariables = null;
    if (query.storePreviousVariables && previousQuery && previousQuery.networkStatus !== _networkStatus.NetworkStatus.loading) {
      if (!(0, _apolloUtilities.isEqual)(previousQuery.variables, query.variables)) {
        isSetVariables = true;
        previousVariables = previousQuery.variables;
      }
    }
    var networkStatus;
    if (isSetVariables) {
      networkStatus = _networkStatus.NetworkStatus.setVariables;
    } else if (query.isPoll) {
      networkStatus = _networkStatus.NetworkStatus.poll;
    } else if (query.isRefetch) {
      networkStatus = _networkStatus.NetworkStatus.refetch;
    } else {
      networkStatus = _networkStatus.NetworkStatus.loading;
    }
    var graphQLErrors = [];
    if (previousQuery && previousQuery.graphQLErrors) {
      graphQLErrors = previousQuery.graphQLErrors;
    }
    this.store[query.queryId] = {
      queryString: query.queryString,
      document: query.document,
      variables: query.variables,
      previousVariables: previousVariables,
      networkError: null,
      graphQLErrors: graphQLErrors,
      networkStatus: networkStatus,
      metadata: query.metadata
    };
    if (typeof query.fetchMoreForQueryId === 'string') {
      this.store[query.fetchMoreForQueryId].networkStatus = _networkStatus.NetworkStatus.fetchMore;
    }
  };
  QueryStore.prototype.markQueryResult = function (queryId, result, fetchMoreForQueryId) {
    if (!this.store[queryId]) return;
    this.store[queryId].networkError = null;
    this.store[queryId].graphQLErrors = result.errors && result.errors.length ? result.errors : [];
    this.store[queryId].previousVariables = null;
    this.store[queryId].networkStatus = _networkStatus.NetworkStatus.ready;
    if (typeof fetchMoreForQueryId === 'string') {
      this.store[fetchMoreForQueryId].networkStatus = _networkStatus.NetworkStatus.ready;
    }
  };
  QueryStore.prototype.markQueryError = function (queryId, error, fetchMoreForQueryId) {
    if (!this.store[queryId]) return;
    this.store[queryId].networkError = error;
    this.store[queryId].networkStatus = _networkStatus.NetworkStatus.error;
    if (typeof fetchMoreForQueryId === 'string') {
      this.markQueryError(fetchMoreForQueryId, error, undefined);
    }
  };
  QueryStore.prototype.markQueryResultClient = function (queryId, complete) {
    if (!this.store[queryId]) return;
    this.store[queryId].networkError = null;
    this.store[queryId].previousVariables = null;
    this.store[queryId].networkStatus = complete ? _networkStatus.NetworkStatus.ready : _networkStatus.NetworkStatus.loading;
  };
  QueryStore.prototype.stopQuery = function (queryId) {
    delete this.store[queryId];
  };
  QueryStore.prototype.reset = function (observableQueryIds) {
    var _this = this;
    this.store = Object.keys(this.store).filter(function (queryId) {
      return observableQueryIds.indexOf(queryId) > -1;
    }).reduce(function (res, key) {
      res[key] = __assign({}, _this.store[key], { networkStatus: _networkStatus.NetworkStatus.loading });
      return res;
    }, {});
  };
  return QueryStore;
}();
exports.QueryStore = QueryStore;
//# sourceMappingURL=queries.js.map
},{"apollo-utilities":27,"../core/networkStatus":9}],20:[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.QueryManager = undefined;

var _apolloLink = require("apollo-link");

var _printer = require("graphql/language/printer");

var _apolloLinkDedup = require("apollo-link-dedup");

var _apolloUtilities = require("apollo-utilities");

var _scheduler = require("../scheduler/scheduler");

var _ApolloError = require("../errors/ApolloError");

var _Observable = require("../util/Observable");

var _mutations = require("../data/mutations");

var _queries = require("../data/queries");

var _ObservableQuery = require("./ObservableQuery");

var _networkStatus = require("./networkStatus");

var _types = require("./types");

var __assign = undefined && undefined.__assign || Object.assign || function (t) {
  for (var s, i = 1, n = arguments.length; i < n; i++) {
    s = arguments[i];
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
  }
  return t;
};

var defaultQueryInfo = {
  listeners: [],
  invalidated: false,
  document: null,
  newData: null,
  lastRequestId: null,
  observableQuery: null,
  subscriptions: []
};
var QueryManager = function () {
  function QueryManager(_a) {
    var link = _a.link,
        _b = _a.queryDeduplication,
        queryDeduplication = _b === void 0 ? false : _b,
        store = _a.store,
        _c = _a.onBroadcast,
        onBroadcast = _c === void 0 ? function () {
      return undefined;
    } : _c,
        _d = _a.ssrMode,
        ssrMode = _d === void 0 ? false : _d;
    this.mutationStore = new _mutations.MutationStore();
    this.queryStore = new _queries.QueryStore();
    this.idCounter = 1;
    this.queries = new Map();
    this.fetchQueryPromises = new Map();
    this.queryIdsByName = {};
    this.link = link;
    this.deduplicator = _apolloLink.ApolloLink.from([new _apolloLinkDedup.DedupLink(), link]);
    this.queryDeduplication = queryDeduplication;
    this.dataStore = store;
    this.onBroadcast = onBroadcast;
    this.scheduler = new _scheduler.QueryScheduler({ queryManager: this, ssrMode: ssrMode });
  }
  QueryManager.prototype.mutate = function (_a) {
    var _this = this;
    var mutation = _a.mutation,
        variables = _a.variables,
        optimisticResponse = _a.optimisticResponse,
        updateQueriesByName = _a.updateQueries,
        _b = _a.refetchQueries,
        refetchQueries = _b === void 0 ? [] : _b,
        updateWithProxyFn = _a.update,
        _c = _a.errorPolicy,
        errorPolicy = _c === void 0 ? 'none' : _c,
        _d = _a.context,
        context = _d === void 0 ? {} : _d;
    if (!mutation) {
      throw new Error('mutation option is required. You must specify your GraphQL document in the mutation option.');
    }
    var mutationId = this.generateQueryId();
    var cache = this.dataStore.getCache();
    mutation = cache.transformDocument(mutation), variables = (0, _apolloUtilities.assign)({}, (0, _apolloUtilities.getDefaultValues)((0, _apolloUtilities.getMutationDefinition)(mutation)), variables);
    var mutationString = (0, _printer.print)(mutation);
    var request = {
      query: mutation,
      variables: variables,
      operationName: (0, _apolloUtilities.getOperationName)(mutation) || undefined,
      context: context
    };
    this.setQuery(mutationId, function () {
      return { document: mutation };
    });
    var generateUpdateQueriesInfo = function () {
      var ret = {};
      if (updateQueriesByName) {
        Object.keys(updateQueriesByName).forEach(function (queryName) {
          return (_this.queryIdsByName[queryName] || []).forEach(function (queryId) {
            ret[queryId] = {
              updater: updateQueriesByName[queryName],
              query: _this.queryStore.get(queryId)
            };
          });
        });
      }
      return ret;
    };
    this.mutationStore.initMutation(mutationId, mutationString, variables);
    this.dataStore.markMutationInit({
      mutationId: mutationId,
      document: mutation,
      variables: variables || {},
      updateQueries: generateUpdateQueriesInfo(),
      update: updateWithProxyFn,
      optimisticResponse: optimisticResponse
    });
    this.broadcastQueries();
    return new Promise(function (resolve, reject) {
      var storeResult;
      var error;
      var newRequest = __assign({ context: {} }, request, { query: cache.transformForLink ? cache.transformForLink(request.query) : request.query });
      newRequest.context.cache = _this.dataStore.getCache();
      (0, _apolloLink.execute)(_this.link, newRequest).subscribe({
        next: function (result) {
          if (result.errors && errorPolicy === 'none') {
            error = new _ApolloError.ApolloError({
              graphQLErrors: result.errors
            });
            return;
          }
          _this.mutationStore.markMutationResult(mutationId);
          _this.dataStore.markMutationResult({
            mutationId: mutationId,
            result: result,
            document: mutation,
            variables: variables || {},
            updateQueries: generateUpdateQueriesInfo(),
            update: updateWithProxyFn
          });
          storeResult = result;
        },
        error: function (err) {
          _this.mutationStore.markMutationError(mutationId, err);
          _this.dataStore.markMutationComplete({
            mutationId: mutationId,
            optimisticResponse: optimisticResponse
          });
          _this.broadcastQueries();
          _this.setQuery(mutationId, function () {
            return { document: undefined };
          });
          reject(new _ApolloError.ApolloError({
            networkError: err
          }));
        },
        complete: function () {
          if (error) {
            _this.mutationStore.markMutationError(mutationId, error);
          }
          _this.dataStore.markMutationComplete({
            mutationId: mutationId,
            optimisticResponse: optimisticResponse
          });
          _this.broadcastQueries();
          if (error) {
            reject(error);
            return;
          }
          if (typeof refetchQueries === 'function') refetchQueries = refetchQueries(storeResult);
          refetchQueries.forEach(function (refetchQuery) {
            if (typeof refetchQuery === 'string') {
              _this.refetchQueryByName(refetchQuery);
              return;
            }
            _this.query({
              query: refetchQuery.query,
              variables: refetchQuery.variables,
              fetchPolicy: 'network-only'
            });
          });
          _this.setQuery(mutationId, function () {
            return { document: undefined };
          });
          if (errorPolicy === 'ignore' && storeResult && storeResult.errors) {
            delete storeResult.errors;
          }
          resolve(storeResult);
        }
      });
    });
  };
  QueryManager.prototype.fetchQuery = function (queryId, options, fetchType, fetchMoreForQueryId) {
    var _this = this;
    var _a = options.variables,
        variables = _a === void 0 ? {} : _a,
        _b = options.metadata,
        metadata = _b === void 0 ? null : _b,
        _c = options.fetchPolicy,
        fetchPolicy = _c === void 0 ? 'cache-first' : _c;
    var cache = this.dataStore.getCache();
    var query = cache.transformDocument(options.query);
    var storeResult;
    var needToFetch = fetchPolicy === 'network-only';
    if (fetchType !== _types.FetchType.refetch && fetchPolicy !== 'network-only') {
      var _d = this.dataStore.getCache().diff({
        query: query,
        variables: variables,
        returnPartialData: true,
        optimistic: false
      }),
          complete = _d.complete,
          result = _d.result;
      needToFetch = !complete || fetchPolicy === 'cache-and-network';
      storeResult = result;
    }
    var shouldFetch = needToFetch && fetchPolicy !== 'cache-only' && fetchPolicy !== 'standby';
    if ((0, _apolloUtilities.hasDirectives)(['live'], query)) shouldFetch = true;
    var requestId = this.generateRequestId();
    var cancel = this.updateQueryWatch(queryId, query, options);
    this.setQuery(queryId, function () {
      return {
        document: query,
        lastRequestId: requestId,
        invalidated: true,
        cancel: cancel
      };
    });
    this.invalidate(true, fetchMoreForQueryId);
    this.queryStore.initQuery({
      queryId: queryId,
      queryString: (0, _printer.print)(query),
      document: query,
      storePreviousVariables: shouldFetch,
      variables: variables,
      isPoll: fetchType === _types.FetchType.poll,
      isRefetch: fetchType === _types.FetchType.refetch,
      metadata: metadata,
      fetchMoreForQueryId: fetchMoreForQueryId
    });
    this.broadcastQueries();
    var shouldDispatchClientResult = !shouldFetch || fetchPolicy === 'cache-and-network';
    if (shouldDispatchClientResult) {
      this.queryStore.markQueryResultClient(queryId, !shouldFetch);
      this.invalidate(true, queryId, fetchMoreForQueryId);
      this.broadcastQueries();
    }
    if (shouldFetch) {
      var networkResult = this.fetchRequest({
        requestId: requestId,
        queryId: queryId,
        document: cache.transformForLink ? cache.transformForLink(query) : query,
        options: options,
        fetchMoreForQueryId: fetchMoreForQueryId
      }).catch(function (error) {
        if ((0, _ApolloError.isApolloError)(error)) {
          throw error;
        } else {
          var lastRequestId = _this.getQuery(queryId).lastRequestId;
          if (requestId >= (lastRequestId || 1)) {
            _this.queryStore.markQueryError(queryId, error, fetchMoreForQueryId);
            _this.invalidate(true, queryId, fetchMoreForQueryId);
            _this.broadcastQueries();
          }
          _this.removeFetchQueryPromise(requestId);
          throw new _ApolloError.ApolloError({ networkError: error });
        }
      });
      if (fetchPolicy !== 'cache-and-network') {
        return networkResult;
      } else {
        networkResult.catch(function () {});
      }
    }
    return Promise.resolve({ data: storeResult });
  };
  QueryManager.prototype.queryListenerForObserver = function (queryId, options, observer) {
    var _this = this;
    var previouslyHadError = false;
    return function (queryStoreValue, newData) {
      _this.invalidate(false, queryId);
      if (!queryStoreValue) return;
      var observableQuery = _this.getQuery(queryId).observableQuery;
      var fetchPolicy = observableQuery ? observableQuery.options.fetchPolicy : options.fetchPolicy;
      if (fetchPolicy === 'standby') return;
      var errorPolicy = observableQuery ? observableQuery.options.errorPolicy : options.errorPolicy;
      var lastResult = observableQuery ? observableQuery.getLastResult() : null;
      var lastError = observableQuery ? observableQuery.getLastError() : null;
      var shouldNotifyIfLoading = !newData && queryStoreValue.previousVariables != null || fetchPolicy === 'cache-only' || fetchPolicy === 'cache-and-network';
      var networkStatusChanged = Boolean(lastResult && queryStoreValue.networkStatus !== lastResult.networkStatus);
      var errorStatusChanged = errorPolicy && (lastError && lastError.graphQLErrors) !== queryStoreValue.graphQLErrors && errorPolicy !== 'none';
      if (!(0, _networkStatus.isNetworkRequestInFlight)(queryStoreValue.networkStatus) || networkStatusChanged && options.notifyOnNetworkStatusChange || shouldNotifyIfLoading) {
        if ((!errorPolicy || errorPolicy === 'none') && queryStoreValue.graphQLErrors && queryStoreValue.graphQLErrors.length > 0 || queryStoreValue.networkError) {
          var apolloError_1 = new _ApolloError.ApolloError({
            graphQLErrors: queryStoreValue.graphQLErrors,
            networkError: queryStoreValue.networkError
          });
          previouslyHadError = true;
          if (observer.error) {
            try {
              observer.error(apolloError_1);
            } catch (e) {
              setTimeout(function () {
                throw e;
              }, 0);
            }
          } else {
            setTimeout(function () {
              throw apolloError_1;
            }, 0);
            if (!(0, _apolloUtilities.isProduction)()) {
              console.info('An unhandled error was thrown because no error handler is registered ' + 'for the query ' + queryStoreValue.queryString);
            }
          }
          return;
        }
        try {
          var data = void 0;
          var isMissing = void 0;
          if (newData) {
            _this.setQuery(queryId, function () {
              return { newData: null };
            });
            data = newData.result;
            isMissing = !newData.complete ? !newData.complete : false;
          } else {
            if (lastResult && lastResult.data && !errorStatusChanged) {
              data = lastResult.data;
              isMissing = false;
            } else {
              var document_1 = _this.getQuery(queryId).document;
              var readResult = _this.dataStore.getCache().diff({
                query: document_1,
                variables: queryStoreValue.previousVariables || queryStoreValue.variables,
                optimistic: true
              });
              data = readResult.result;
              isMissing = !readResult.complete;
            }
          }
          var resultFromStore = void 0;
          if (isMissing && fetchPolicy !== 'cache-only') {
            resultFromStore = {
              data: lastResult && lastResult.data,
              loading: (0, _networkStatus.isNetworkRequestInFlight)(queryStoreValue.networkStatus),
              networkStatus: queryStoreValue.networkStatus,
              stale: true
            };
          } else {
            resultFromStore = {
              data: data,
              loading: (0, _networkStatus.isNetworkRequestInFlight)(queryStoreValue.networkStatus),
              networkStatus: queryStoreValue.networkStatus,
              stale: false
            };
          }
          if (errorPolicy === 'all' && queryStoreValue.graphQLErrors && queryStoreValue.graphQLErrors.length > 0) {
            resultFromStore.errors = queryStoreValue.graphQLErrors;
          }
          if (observer.next) {
            var isDifferentResult = !(lastResult && resultFromStore && lastResult.networkStatus === resultFromStore.networkStatus && lastResult.stale === resultFromStore.stale && lastResult.data === resultFromStore.data);
            if (isDifferentResult || previouslyHadError) {
              try {
                observer.next((0, _apolloUtilities.maybeDeepFreeze)(resultFromStore));
              } catch (e) {
                setTimeout(function () {
                  throw e;
                }, 0);
              }
            }
          }
          previouslyHadError = false;
        } catch (error) {
          previouslyHadError = true;
          if (observer.error) observer.error(new _ApolloError.ApolloError({ networkError: error }));
          return;
        }
      }
    };
  };
  QueryManager.prototype.watchQuery = function (options, shouldSubscribe) {
    if (shouldSubscribe === void 0) {
      shouldSubscribe = true;
    }
    if (options.fetchPolicy === 'standby') {
      throw new Error('client.watchQuery cannot be called with fetchPolicy set to "standby"');
    }
    var queryDefinition = (0, _apolloUtilities.getQueryDefinition)(options.query);
    if (queryDefinition.variableDefinitions && queryDefinition.variableDefinitions.length) {
      var defaultValues = (0, _apolloUtilities.getDefaultValues)(queryDefinition);
      options.variables = (0, _apolloUtilities.assign)({}, defaultValues, options.variables);
    }
    if (typeof options.notifyOnNetworkStatusChange === 'undefined') {
      options.notifyOnNetworkStatusChange = false;
    }
    var transformedOptions = __assign({}, options);
    return new _ObservableQuery.ObservableQuery({
      scheduler: this.scheduler,
      options: transformedOptions,
      shouldSubscribe: shouldSubscribe
    });
  };
  QueryManager.prototype.query = function (options) {
    var _this = this;
    if (!options.query) {
      throw new Error('query option is required. You must specify your GraphQL document in the query option.');
    }
    if (options.query.kind !== 'Document') {
      throw new Error('You must wrap the query string in a "gql" tag.');
    }
    if (options.returnPartialData) {
      throw new Error('returnPartialData option only supported on watchQuery.');
    }
    if (options.pollInterval) {
      throw new Error('pollInterval option only supported on watchQuery.');
    }
    if (typeof options.notifyOnNetworkStatusChange !== 'undefined') {
      throw new Error('Cannot call "query" with "notifyOnNetworkStatusChange" option. Only "watchQuery" has that option.');
    }
    options.notifyOnNetworkStatusChange = false;
    var requestId = this.idCounter;
    var resPromise = new Promise(function (resolve, reject) {
      _this.addFetchQueryPromise(requestId, resPromise, resolve, reject);
      return _this.watchQuery(options, false).result().then(function (result) {
        _this.removeFetchQueryPromise(requestId);
        resolve(result);
      }).catch(function (error) {
        _this.removeFetchQueryPromise(requestId);
        reject(error);
      });
    });
    return resPromise;
  };
  QueryManager.prototype.generateQueryId = function () {
    var queryId = this.idCounter.toString();
    this.idCounter++;
    return queryId;
  };
  QueryManager.prototype.stopQueryInStore = function (queryId) {
    this.queryStore.stopQuery(queryId);
    this.invalidate(true, queryId);
    this.broadcastQueries();
  };
  QueryManager.prototype.addQueryListener = function (queryId, listener) {
    this.setQuery(queryId, function (_a) {
      var _b = _a.listeners,
          listeners = _b === void 0 ? [] : _b;
      return {
        listeners: listeners.concat([listener]),
        invalidate: false
      };
    });
  };
  QueryManager.prototype.updateQueryWatch = function (queryId, document, options) {
    var _this = this;
    var cancel = this.getQuery(queryId).cancel;
    if (cancel) cancel();
    var previousResult = function () {
      var previousResult = null;
      var observableQuery = _this.getQuery(queryId).observableQuery;
      if (observableQuery) {
        var lastResult = observableQuery.getLastResult();
        if (lastResult) {
          previousResult = lastResult.data;
        }
      }
      return previousResult;
    };
    return this.dataStore.getCache().watch({
      query: document,
      variables: options.variables,
      optimistic: true,
      previousResult: previousResult,
      callback: function (newData) {
        _this.setQuery(queryId, function () {
          return { invalidated: true, newData: newData };
        });
      }
    });
  };
  QueryManager.prototype.addFetchQueryPromise = function (requestId, promise, resolve, reject) {
    this.fetchQueryPromises.set(requestId.toString(), {
      promise: promise,
      resolve: resolve,
      reject: reject
    });
  };
  QueryManager.prototype.removeFetchQueryPromise = function (requestId) {
    this.fetchQueryPromises.delete(requestId.toString());
  };
  QueryManager.prototype.addObservableQuery = function (queryId, observableQuery) {
    this.setQuery(queryId, function () {
      return { observableQuery: observableQuery };
    });
    var queryDef = (0, _apolloUtilities.getQueryDefinition)(observableQuery.options.query);
    if (queryDef.name && queryDef.name.value) {
      var queryName = queryDef.name.value;
      this.queryIdsByName[queryName] = this.queryIdsByName[queryName] || [];
      this.queryIdsByName[queryName].push(observableQuery.queryId);
    }
  };
  QueryManager.prototype.removeObservableQuery = function (queryId) {
    var _a = this.getQuery(queryId),
        observableQuery = _a.observableQuery,
        cancel = _a.cancel;
    if (cancel) cancel();
    if (!observableQuery) return;
    var definition = (0, _apolloUtilities.getQueryDefinition)(observableQuery.options.query);
    var queryName = definition.name ? definition.name.value : null;
    this.setQuery(queryId, function () {
      return { observableQuery: null };
    });
    if (queryName) {
      this.queryIdsByName[queryName] = this.queryIdsByName[queryName].filter(function (val) {
        return !(observableQuery.queryId === val);
      });
    }
  };
  QueryManager.prototype.resetStore = function () {
    this.fetchQueryPromises.forEach(function (_a) {
      var reject = _a.reject;
      reject(new Error('Store reset while query was in flight.'));
    });
    var resetIds = [];
    this.queries.forEach(function (_a, queryId) {
      var observableQuery = _a.observableQuery;
      if (observableQuery) resetIds.push(queryId);
    });
    this.queryStore.reset(resetIds);
    this.mutationStore.reset();
    var dataStoreReset = this.dataStore.reset();
    var observableQueryPromises = this.getObservableQueryPromises();
    this.broadcastQueries();
    return dataStoreReset.then(function () {
      return Promise.all(observableQueryPromises);
    });
  };
  QueryManager.prototype.getObservableQueryPromises = function () {
    var _this = this;
    var observableQueryPromises = [];
    this.queries.forEach(function (_a, queryId) {
      var observableQuery = _a.observableQuery;
      if (!observableQuery) return;
      var fetchPolicy = observableQuery.options.fetchPolicy;
      observableQuery.resetLastResults();
      if (fetchPolicy !== 'cache-only' && fetchPolicy !== 'standby') {
        observableQueryPromises.push(observableQuery.refetch());
      }
      _this.setQuery(queryId, function () {
        return { newData: null };
      });
      _this.invalidate(true, queryId);
    });
    return observableQueryPromises;
  };
  QueryManager.prototype.reFetchObservableQueries = function () {
    var observableQueryPromises = this.getObservableQueryPromises();
    this.broadcastQueries();
    return Promise.all(observableQueryPromises);
  };
  QueryManager.prototype.startQuery = function (queryId, options, listener) {
    this.addQueryListener(queryId, listener);
    this.fetchQuery(queryId, options).catch(function () {
      return undefined;
    });
    return queryId;
  };
  QueryManager.prototype.startGraphQLSubscription = function (options) {
    var _this = this;
    var query = options.query;
    var cache = this.dataStore.getCache();
    var transformedDoc = cache.transformDocument(query);
    var variables = (0, _apolloUtilities.assign)({}, (0, _apolloUtilities.getDefaultValues)((0, _apolloUtilities.getOperationDefinition)(query)), options.variables);
    var request = {
      query: transformedDoc,
      variables: variables,
      operationName: (0, _apolloUtilities.getOperationName)(transformedDoc) || undefined
    };
    var sub;
    var observers = [];
    return new _Observable.Observable(function (observer) {
      observers.push(observer);
      if (observers.length === 1) {
        var handler = {
          next: function (result) {
            _this.dataStore.markSubscriptionResult(result, transformedDoc, variables);
            _this.broadcastQueries();
            observers.forEach(function (obs) {
              if (obs.next) obs.next(result);
            });
          },
          error: function (error) {
            observers.forEach(function (obs) {
              if (obs.error) obs.error(error);
            });
          }
        };
        var newRequest = __assign({}, request, { query: cache.transformForLink ? cache.transformForLink(request.query) : request.query });
        sub = (0, _apolloLink.execute)(_this.link, newRequest).subscribe(handler);
      }
      return function () {
        observers = observers.filter(function (obs) {
          return obs !== observer;
        });
        if (observers.length === 0 && sub) {
          sub.unsubscribe();
        }
      };
    });
  };
  QueryManager.prototype.stopQuery = function (queryId) {
    this.removeQuery(queryId);
    this.stopQueryInStore(queryId);
  };
  QueryManager.prototype.removeQuery = function (queryId) {
    var subscriptions = this.getQuery(queryId).subscriptions;
    subscriptions.forEach(function (x) {
      return x.unsubscribe();
    });
    this.queries.delete(queryId);
  };
  QueryManager.prototype.getCurrentQueryResult = function (observableQuery) {
    var _a = observableQuery.options,
        variables = _a.variables,
        query = _a.query;
    var lastResult = observableQuery.getLastResult();
    var newData = this.getQuery(observableQuery.queryId).newData;
    if (newData) {
      return (0, _apolloUtilities.maybeDeepFreeze)({ data: newData.result, partial: false });
    } else {
      try {
        var data = this.dataStore.getCache().read({
          query: query,
          variables: variables,
          previousResult: lastResult ? lastResult.data : undefined,
          optimistic: true
        });
        return (0, _apolloUtilities.maybeDeepFreeze)({ data: data, partial: false });
      } catch (e) {
        return (0, _apolloUtilities.maybeDeepFreeze)({ data: {}, partial: true });
      }
    }
  };
  QueryManager.prototype.getQueryWithPreviousResult = function (queryIdOrObservable) {
    var observableQuery;
    if (typeof queryIdOrObservable === 'string') {
      var foundObserveableQuery = this.getQuery(queryIdOrObservable).observableQuery;
      if (!foundObserveableQuery) {
        throw new Error("ObservableQuery with this id doesn't exist: " + queryIdOrObservable);
      }
      observableQuery = foundObserveableQuery;
    } else {
      observableQuery = queryIdOrObservable;
    }
    var _a = observableQuery.options,
        variables = _a.variables,
        query = _a.query;
    var data = this.getCurrentQueryResult(observableQuery).data;
    return {
      previousResult: data,
      variables: variables,
      document: query
    };
  };
  QueryManager.prototype.broadcastQueries = function () {
    var _this = this;
    this.onBroadcast();
    this.queries.forEach(function (info, id) {
      if (!info.invalidated || !info.listeners) return;
      info.listeners.filter(function (x) {
        return !!x;
      }).forEach(function (listener) {
        listener(_this.queryStore.get(id), info.newData);
      });
    });
  };
  QueryManager.prototype.fetchRequest = function (_a) {
    var _this = this;
    var requestId = _a.requestId,
        queryId = _a.queryId,
        document = _a.document,
        options = _a.options,
        fetchMoreForQueryId = _a.fetchMoreForQueryId;
    var variables = options.variables,
        context = options.context,
        _b = options.errorPolicy,
        errorPolicy = _b === void 0 ? 'none' : _b;
    var request = {
      query: document,
      variables: variables,
      operationName: (0, _apolloUtilities.getOperationName)(document) || undefined,
      context: context || {}
    };
    request.context.forceFetch = !this.queryDeduplication;
    request.context.cache = this.dataStore.getCache();
    var resultFromStore;
    var errorsFromStore;
    var retPromise = new Promise(function (resolve, reject) {
      _this.addFetchQueryPromise(requestId, retPromise, resolve, reject);
      var subscription = (0, _apolloLink.execute)(_this.deduplicator, request).subscribe({
        next: function (result) {
          var lastRequestId = _this.getQuery(queryId).lastRequestId;
          if (requestId >= (lastRequestId || 1)) {
            try {
              _this.dataStore.markQueryResult(result, document, variables, fetchMoreForQueryId, errorPolicy === 'ignore');
            } catch (e) {
              reject(e);
              return;
            }
            _this.queryStore.markQueryResult(queryId, result, fetchMoreForQueryId);
            _this.invalidate(true, queryId, fetchMoreForQueryId);
            _this.broadcastQueries();
          }
          if (result.errors && errorPolicy === 'none') {
            reject(new _ApolloError.ApolloError({
              graphQLErrors: result.errors
            }));
            return;
          } else if (errorPolicy === 'all') {
            errorsFromStore = result.errors;
          }
          if (fetchMoreForQueryId) {
            resultFromStore = result.data;
          } else {
            try {
              resultFromStore = _this.dataStore.getCache().read({
                variables: variables,
                query: document,
                optimistic: false
              });
            } catch (e) {}
          }
        },
        error: function (error) {
          _this.removeFetchQueryPromise(requestId);
          _this.setQuery(queryId, function (_a) {
            var subscriptions = _a.subscriptions;
            return {
              subscriptions: subscriptions.filter(function (x) {
                return x !== subscription;
              })
            };
          });
          reject(error);
        },
        complete: function () {
          _this.removeFetchQueryPromise(requestId);
          _this.setQuery(queryId, function (_a) {
            var subscriptions = _a.subscriptions;
            return {
              subscriptions: subscriptions.filter(function (x) {
                return x !== subscription;
              })
            };
          });
          resolve({
            data: resultFromStore,
            errors: errorsFromStore,
            loading: false,
            networkStatus: _networkStatus.NetworkStatus.ready,
            stale: false
          });
        }
      });
      _this.setQuery(queryId, function (_a) {
        var subscriptions = _a.subscriptions;
        return {
          subscriptions: subscriptions.concat([subscription])
        };
      });
    });
    return retPromise;
  };
  QueryManager.prototype.refetchQueryByName = function (queryName) {
    var _this = this;
    var refetchedQueries = this.queryIdsByName[queryName];
    if (refetchedQueries === undefined) return;
    return Promise.all(refetchedQueries.map(function (id) {
      return _this.getQuery(id).observableQuery;
    }).filter(function (x) {
      return !!x;
    }).map(function (x) {
      return x.refetch();
    }));
  };
  QueryManager.prototype.generateRequestId = function () {
    var requestId = this.idCounter;
    this.idCounter++;
    return requestId;
  };
  QueryManager.prototype.getQuery = function (queryId) {
    return this.queries.get(queryId) || __assign({}, defaultQueryInfo);
  };
  QueryManager.prototype.setQuery = function (queryId, updater) {
    var prev = this.getQuery(queryId);
    var newInfo = __assign({}, prev, updater(prev));
    this.queries.set(queryId, newInfo);
  };
  QueryManager.prototype.invalidate = function (invalidated, queryId, fetchMoreForQueryId) {
    if (queryId) this.setQuery(queryId, function () {
      return { invalidated: invalidated };
    });
    if (fetchMoreForQueryId) {
      this.setQuery(fetchMoreForQueryId, function () {
        return { invalidated: invalidated };
      });
    }
  };
  return QueryManager;
}();
exports.QueryManager = QueryManager;
//# sourceMappingURL=QueryManager.js.map
},{"apollo-link":26,"graphql/language/printer":43,"apollo-link-dedup":47,"apollo-utilities":27,"../scheduler/scheduler":23,"../errors/ApolloError":11,"../util/Observable":22,"../data/mutations":24,"../data/queries":25,"./ObservableQuery":8,"./networkStatus":9,"./types":10}],21:[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.DataStore = undefined;

var _apolloUtilities = require("apollo-utilities");

var DataStore = function () {
  function DataStore(initialCache) {
    this.cache = initialCache;
  }
  DataStore.prototype.getCache = function () {
    return this.cache;
  };
  DataStore.prototype.markQueryResult = function (result, document, variables, fetchMoreForQueryId, ignoreErrors) {
    if (ignoreErrors === void 0) {
      ignoreErrors = false;
    }
    var writeWithErrors = !(0, _apolloUtilities.graphQLResultHasError)(result);
    if (ignoreErrors && (0, _apolloUtilities.graphQLResultHasError)(result) && result.data) {
      writeWithErrors = true;
    }
    if (!fetchMoreForQueryId && writeWithErrors) {
      this.cache.write({
        result: result.data,
        dataId: 'ROOT_QUERY',
        query: document,
        variables: variables
      });
    }
  };
  DataStore.prototype.markSubscriptionResult = function (result, document, variables) {
    if (!(0, _apolloUtilities.graphQLResultHasError)(result)) {
      this.cache.write({
        result: result.data,
        dataId: 'ROOT_SUBSCRIPTION',
        query: document,
        variables: variables
      });
    }
  };
  DataStore.prototype.markMutationInit = function (mutation) {
    var _this = this;
    if (mutation.optimisticResponse) {
      var optimistic_1;
      if (typeof mutation.optimisticResponse === 'function') {
        optimistic_1 = mutation.optimisticResponse(mutation.variables);
      } else {
        optimistic_1 = mutation.optimisticResponse;
      }
      var changeFn_1 = function () {
        _this.markMutationResult({
          mutationId: mutation.mutationId,
          result: { data: optimistic_1 },
          document: mutation.document,
          variables: mutation.variables,
          updateQueries: mutation.updateQueries,
          update: mutation.update
        });
      };
      this.cache.recordOptimisticTransaction(function (c) {
        var orig = _this.cache;
        _this.cache = c;
        try {
          changeFn_1();
        } finally {
          _this.cache = orig;
        }
      }, mutation.mutationId);
    }
  };
  DataStore.prototype.markMutationResult = function (mutation) {
    var _this = this;
    if (!(0, _apolloUtilities.graphQLResultHasError)(mutation.result)) {
      var cacheWrites_1 = [];
      cacheWrites_1.push({
        result: mutation.result.data,
        dataId: 'ROOT_MUTATION',
        query: mutation.document,
        variables: mutation.variables
      });
      if (mutation.updateQueries) {
        Object.keys(mutation.updateQueries).filter(function (id) {
          return mutation.updateQueries[id];
        }).forEach(function (queryId) {
          var _a = mutation.updateQueries[queryId],
              query = _a.query,
              updater = _a.updater;
          var _b = _this.cache.diff({
            query: query.document,
            variables: query.variables,
            returnPartialData: true,
            optimistic: false
          }),
              currentQueryResult = _b.result,
              complete = _b.complete;
          if (!complete) {
            return;
          }
          var nextQueryResult = (0, _apolloUtilities.tryFunctionOrLogError)(function () {
            return updater(currentQueryResult, {
              mutationResult: mutation.result,
              queryName: (0, _apolloUtilities.getOperationName)(query.document) || undefined,
              queryVariables: query.variables
            });
          });
          if (nextQueryResult) {
            cacheWrites_1.push({
              result: nextQueryResult,
              dataId: 'ROOT_QUERY',
              query: query.document,
              variables: query.variables
            });
          }
        });
      }
      this.cache.performTransaction(function (c) {
        cacheWrites_1.forEach(function (write) {
          return c.write(write);
        });
      });
      var update_1 = mutation.update;
      if (update_1) {
        this.cache.performTransaction(function (c) {
          (0, _apolloUtilities.tryFunctionOrLogError)(function () {
            return update_1(c, mutation.result);
          });
        });
      }
    }
  };
  DataStore.prototype.markMutationComplete = function (_a) {
    var mutationId = _a.mutationId,
        optimisticResponse = _a.optimisticResponse;
    if (!optimisticResponse) return;
    this.cache.removeOptimistic(mutationId);
  };
  DataStore.prototype.markUpdateQueryResult = function (document, variables, newResult) {
    this.cache.write({
      result: newResult,
      dataId: 'ROOT_QUERY',
      variables: variables,
      query: document
    });
  };
  DataStore.prototype.reset = function () {
    return this.cache.reset();
  };
  return DataStore;
}();
exports.DataStore = DataStore;
//# sourceMappingURL=store.js.map
},{"apollo-utilities":27}],19:[function(require,module,exports) {
exports.version = "2.0.4"
},{}],7:[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _apolloLink = require("apollo-link");

var _apolloUtilities = require("apollo-utilities");

var _QueryManager = require("./core/QueryManager");

var _store = require("./data/store");

var _version = require("./version");

var __assign = undefined && undefined.__assign || Object.assign || function (t) {
  for (var s, i = 1, n = arguments.length; i < n; i++) {
    s = arguments[i];
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
  }
  return t;
};

var hasSuggestedDevtools = false;
var supportedDirectives = new _apolloLink.ApolloLink(function (operation, forward) {
  operation.query = (0, _apolloUtilities.removeConnectionDirectiveFromDocument)(operation.query);
  return forward(operation);
});
var ApolloClient = function () {
  function ApolloClient(options) {
    var _this = this;
    this.defaultOptions = {};
    var link = options.link,
        cache = options.cache,
        _a = options.ssrMode,
        ssrMode = _a === void 0 ? false : _a,
        _b = options.ssrForceFetchDelay,
        ssrForceFetchDelay = _b === void 0 ? 0 : _b,
        connectToDevTools = options.connectToDevTools,
        _c = options.queryDeduplication,
        queryDeduplication = _c === void 0 ? true : _c,
        defaultOptions = options.defaultOptions;
    if (!link || !cache) {
      throw new Error("\n        In order to initialize Apollo Client, you must specify link & cache properties on the config object.\n        This is part of the required upgrade when migrating from Apollo Client 1.0 to Apollo Client 2.0.\n        For more information, please visit:\n          https://www.apollographql.com/docs/react/basics/setup.html\n        to help you get started.\n      ");
    }
    this.link = supportedDirectives.concat(link);
    this.cache = cache;
    this.store = new _store.DataStore(cache);
    this.disableNetworkFetches = ssrMode || ssrForceFetchDelay > 0;
    this.queryDeduplication = queryDeduplication;
    this.ssrMode = ssrMode;
    this.defaultOptions = defaultOptions || {};
    if (ssrForceFetchDelay) {
      setTimeout(function () {
        return _this.disableNetworkFetches = false;
      }, ssrForceFetchDelay);
    }
    this.watchQuery = this.watchQuery.bind(this);
    this.query = this.query.bind(this);
    this.mutate = this.mutate.bind(this);
    this.resetStore = this.resetStore.bind(this);
    this.reFetchObservableQueries = this.reFetchObservableQueries.bind(this);
    var defaultConnectToDevTools = !(0, _apolloUtilities.isProduction)() && typeof window !== 'undefined' && !window.__APOLLO_CLIENT__;
    if (typeof connectToDevTools === 'undefined' ? defaultConnectToDevTools : connectToDevTools && typeof window !== 'undefined') {
      window.__APOLLO_CLIENT__ = this;
    }
    if (!hasSuggestedDevtools && !(0, _apolloUtilities.isProduction)()) {
      hasSuggestedDevtools = true;
      if (typeof window !== 'undefined' && window.document && window.top === window.self) {
        if (typeof window.__APOLLO_DEVTOOLS_GLOBAL_HOOK__ === 'undefined') {
          if (navigator.userAgent.indexOf('Chrome') > -1) {
            console.debug('Download the Apollo DevTools ' + 'for a better development experience: ' + 'https://chrome.google.com/webstore/detail/apollo-client-developer-t/jdkknkkbebbapilgoeccciglkfbmbnfm');
          }
        }
      }
    }
    this.version = _version.version;
  }
  ApolloClient.prototype.watchQuery = function (options) {
    this.initQueryManager();
    if (this.defaultOptions.watchQuery) {
      options = __assign({}, this.defaultOptions.watchQuery, options);
    }
    if (this.disableNetworkFetches && options.fetchPolicy === 'network-only') {
      options = __assign({}, options, { fetchPolicy: 'cache-first' });
    }
    return this.queryManager.watchQuery(options);
  };
  ApolloClient.prototype.query = function (options) {
    this.initQueryManager();
    if (options.fetchPolicy === 'cache-and-network') {
      throw new Error('cache-and-network fetchPolicy can only be used with watchQuery');
    }
    if (this.defaultOptions.query) {
      options = __assign({}, this.defaultOptions.query, options);
    }
    if (this.disableNetworkFetches && options.fetchPolicy === 'network-only') {
      options = __assign({}, options, { fetchPolicy: 'cache-first' });
    }
    return this.queryManager.query(options);
  };
  ApolloClient.prototype.mutate = function (options) {
    this.initQueryManager();
    if (this.defaultOptions.mutate) {
      options = __assign({}, this.defaultOptions.mutate, options);
    }
    return this.queryManager.mutate(options);
  };
  ApolloClient.prototype.subscribe = function (options) {
    this.initQueryManager();
    return this.queryManager.startGraphQLSubscription(options);
  };
  ApolloClient.prototype.readQuery = function (options) {
    return this.initProxy().readQuery(options);
  };
  ApolloClient.prototype.readFragment = function (options) {
    return this.initProxy().readFragment(options);
  };
  ApolloClient.prototype.writeQuery = function (options) {
    var result = this.initProxy().writeQuery(options);
    this.queryManager.broadcastQueries();
    return result;
  };
  ApolloClient.prototype.writeFragment = function (options) {
    var result = this.initProxy().writeFragment(options);
    this.queryManager.broadcastQueries();
    return result;
  };
  ApolloClient.prototype.__actionHookForDevTools = function (cb) {
    this.devToolsHookCb = cb;
  };
  ApolloClient.prototype.__requestRaw = function (payload) {
    return (0, _apolloLink.execute)(this.link, payload);
  };
  ApolloClient.prototype.initQueryManager = function () {
    var _this = this;
    if (this.queryManager) return;
    this.queryManager = new _QueryManager.QueryManager({
      link: this.link,
      store: this.store,
      queryDeduplication: this.queryDeduplication,
      ssrMode: this.ssrMode,
      onBroadcast: function () {
        if (_this.devToolsHookCb) {
          _this.devToolsHookCb({
            action: {},
            state: {
              queries: _this.queryManager.queryStore.getStore(),
              mutations: _this.queryManager.mutationStore.getStore()
            },
            dataWithOptimisticResults: _this.cache.extract(true)
          });
        }
      }
    });
  };
  ApolloClient.prototype.resetStore = function () {
    return this.queryManager ? this.queryManager.resetStore() : Promise.resolve(null);
  };
  ApolloClient.prototype.reFetchObservableQueries = function () {
    return this.queryManager ? this.queryManager.reFetchObservableQueries() : Promise.resolve(null);
  };
  ApolloClient.prototype.extract = function (optimistic) {
    return this.initProxy().extract(optimistic);
  };
  ApolloClient.prototype.restore = function (serializedState) {
    return this.initProxy().restore(serializedState);
  };
  ApolloClient.prototype.initProxy = function () {
    if (!this.proxy) {
      this.initQueryManager();
      this.proxy = this.cache;
    }
    return this.proxy;
  };
  return ApolloClient;
}();
exports.default = ApolloClient;
//# sourceMappingURL=ApolloClient.js.map
},{"apollo-link":26,"apollo-utilities":27,"./core/QueryManager":20,"./data/store":21,"./version":19}],3:[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.ApolloClient = exports.ApolloError = exports.NetworkStatus = exports.ObservableQuery = exports.printAST = undefined;

var _printer = require("graphql/language/printer");

Object.defineProperty(exports, "printAST", {
  enumerable: true,
  get: function () {
    return _printer.print;
  }
});

var _ObservableQuery = require("./core/ObservableQuery");

Object.defineProperty(exports, "ObservableQuery", {
  enumerable: true,
  get: function () {
    return _ObservableQuery.ObservableQuery;
  }
});

var _networkStatus = require("./core/networkStatus");

Object.defineProperty(exports, "NetworkStatus", {
  enumerable: true,
  get: function () {
    return _networkStatus.NetworkStatus;
  }
});

var _types = require("./core/types");

Object.keys(_types).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function () {
      return _types[key];
    }
  });
});

var _ApolloError = require("./errors/ApolloError");

Object.defineProperty(exports, "ApolloError", {
  enumerable: true,
  get: function () {
    return _ApolloError.ApolloError;
  }
});

var _ApolloClient = require("./ApolloClient");

var _ApolloClient2 = _interopRequireDefault(_ApolloClient);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.ApolloClient = _ApolloClient2.default;
exports.default = _ApolloClient2.default;
//# sourceMappingURL=index.js.map
},{"graphql/language/printer":43,"./core/ObservableQuery":8,"./core/networkStatus":9,"./core/types":10,"./errors/ApolloError":11,"./ApolloClient":7}],12:[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.HttpLink = exports.createHttpLink = undefined;

var _apolloLink = require("apollo-link");

var _printer = require("graphql/language/printer");

var __extends = undefined && undefined.__extends || function () {
  var extendStatics = Object.setPrototypeOf || { __proto__: [] } instanceof Array && function (d, b) {
    d.__proto__ = b;
  } || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
  };
  return function (d, b) {
    extendStatics(d, b);
    function __() {
      this.constructor = d;
    }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
  };
}();
var __assign = undefined && undefined.__assign || Object.assign || function (t) {
  for (var s, i = 1, n = arguments.length; i < n; i++) {
    s = arguments[i];
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
  }
  return t;
};
var __rest = undefined && undefined.__rest || function (s, e) {
  var t = {};
  for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0) t[p] = s[p];
  if (s != null && typeof Object.getOwnPropertySymbols === "function") for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) if (e.indexOf(p[i]) < 0) t[p[i]] = s[p[i]];
  return t;
};

var throwServerError = function (response, result, message) {
  var error = new Error(message);
  error.response = response;
  error.statusCode = response.status;
  error.result = result;
  throw error;
};
var parseAndCheckResponse = function (request) {
  return function (response) {
    return response.text().then(function (bodyText) {
      try {
        return JSON.parse(bodyText);
      } catch (err) {
        var parseError = err;
        parseError.response = response;
        parseError.statusCode = response.status;
        parseError.bodyText = bodyText;
        return Promise.reject(parseError);
      }
    }).then(function (result) {
      if (response.status >= 300) {
        throwServerError(response, result, "Response not successful: Received status code " + response.status);
      }
      if (!result.hasOwnProperty('data') && !result.hasOwnProperty('errors')) {
        throwServerError(response, result, "Server response was missing for query '" + request.operationName + "'.");
      }
      return result;
    });
  };
};
var checkFetcher = function (fetcher) {
  if (fetcher.use) {
    throw new Error("\n      It looks like you're using apollo-fetch! Apollo Link now uses native fetch\n      implementation, so apollo-fetch is not needed. If you want to use your existing\n      apollo-fetch middleware, please check this guide to upgrade:\n        https://github.com/apollographql/apollo-link/blob/master/docs/implementation.md\n    ");
  }
};
var warnIfNoFetch = function (fetcher) {
  if (!fetcher && typeof fetch === 'undefined') {
    var library = 'unfetch';
    if (typeof window === 'undefined') library = 'node-fetch';
    throw new Error("fetch is not found globally and no fetcher passed, to fix pass a fetch for\n      your environment like https://www.npmjs.com/package/" + library + ".\n\n      For example:\n        import fetch from '" + library + "';\n        import { createHttpLink } from 'apollo-link-http';\n\n        const link = createHttpLink({ uri: '/graphql', fetch: fetch });\n      ");
  }
};
var createSignalIfSupported = function () {
  if (typeof AbortController === 'undefined') return { controller: false, signal: false };
  var controller = new AbortController();
  var signal = controller.signal;
  return { controller: controller, signal: signal };
};
var defaultHttpOptions = {
  includeQuery: true,
  includeExtensions: false
};
var createHttpLink = exports.createHttpLink = function (linkOptions) {
  if (linkOptions === void 0) {
    linkOptions = {};
  }
  var uri = linkOptions.uri,
      fetcher = linkOptions.fetch,
      includeExtensions = linkOptions.includeExtensions,
      requestOptions = __rest(linkOptions, ["uri", "fetch", "includeExtensions"]);
  warnIfNoFetch(fetcher);
  if (fetcher) checkFetcher(fetcher);
  if (!fetcher) fetcher = fetch;
  if (!uri) uri = '/graphql';
  return new _apolloLink.ApolloLink(function (operation) {
    return new _apolloLink.Observable(function (observer) {
      var _a = operation.getContext(),
          headers = _a.headers,
          credentials = _a.credentials,
          _b = _a.fetchOptions,
          fetchOptions = _b === void 0 ? {} : _b,
          contextURI = _a.uri,
          _c = _a.http,
          httpOptions = _c === void 0 ? {} : _c;
      var operationName = operation.operationName,
          extensions = operation.extensions,
          variables = operation.variables,
          query = operation.query;
      var http = __assign({}, defaultHttpOptions, httpOptions);
      var body = { operationName: operationName, variables: variables };
      if (includeExtensions || http.includeExtensions) body.extensions = extensions;
      if (http.includeQuery) body.query = (0, _printer.print)(query);
      var serializedBody;
      try {
        serializedBody = JSON.stringify(body);
      } catch (e) {
        var parseError = new Error("Network request failed. Payload is not serializable: " + e.message);
        parseError.parseError = e;
        throw parseError;
      }
      var options = fetchOptions;
      if (requestOptions.fetchOptions) options = __assign({}, requestOptions.fetchOptions, options);
      var fetcherOptions = __assign({ method: 'POST' }, options, { headers: {
          accept: '*/*',
          'content-type': 'application/json'
        }, body: serializedBody });
      if (requestOptions.credentials) fetcherOptions.credentials = requestOptions.credentials;
      if (credentials) fetcherOptions.credentials = credentials;
      if (requestOptions.headers) fetcherOptions.headers = __assign({}, fetcherOptions.headers, requestOptions.headers);
      if (headers) fetcherOptions.headers = __assign({}, fetcherOptions.headers, headers);
      var _d = createSignalIfSupported(),
          controller = _d.controller,
          signal = _d.signal;
      if (controller) fetcherOptions.signal = signal;
      fetcher(contextURI || uri, fetcherOptions).then(function (response) {
        operation.setContext({ response: response });
        return response;
      }).then(parseAndCheckResponse(operation)).then(function (result) {
        observer.next(result);
        observer.complete();
        return result;
      }).catch(function (err) {
        if (err.name === 'AbortError') return;
        observer.error(err);
      });
      return function () {
        if (controller) controller.abort();
      };
    });
  });
};
var HttpLink = function (_super) {
  __extends(HttpLink, _super);
  function HttpLink(opts) {
    return _super.call(this, createHttpLink(opts).request) || this;
  }
  return HttpLink;
}(_apolloLink.ApolloLink);
exports.HttpLink = HttpLink;
//# sourceMappingURL=httpLink.js.map
},{"apollo-link":26,"graphql/language/printer":43}],4:[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _httpLink = require("./httpLink");

Object.keys(_httpLink).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function () {
      return _httpLink[key];
    }
  });
});
},{"./httpLink":12}],49:[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.ApolloCache = undefined;

var _apolloUtilities = require("apollo-utilities");

var ApolloCache = function () {
  function ApolloCache() {}
  ApolloCache.prototype.transformDocument = function (document) {
    return document;
  };
  ApolloCache.prototype.transformForLink = function (document) {
    return document;
  };
  ApolloCache.prototype.readQuery = function (options, optimistic) {
    if (optimistic === void 0) {
      optimistic = false;
    }
    return this.read({
      query: options.query,
      variables: options.variables,
      optimistic: optimistic
    });
  };
  ApolloCache.prototype.readFragment = function (options, optimistic) {
    if (optimistic === void 0) {
      optimistic = false;
    }
    return this.read({
      query: (0, _apolloUtilities.getFragmentQueryDocument)(options.fragment, options.fragmentName),
      variables: options.variables,
      rootId: options.id,
      optimistic: optimistic
    });
  };
  ApolloCache.prototype.writeQuery = function (options) {
    this.write({
      dataId: 'ROOT_QUERY',
      result: options.data,
      query: options.query,
      variables: options.variables
    });
  };
  ApolloCache.prototype.writeFragment = function (options) {
    this.write({
      dataId: options.id,
      result: options.data,
      variables: options.variables,
      query: (0, _apolloUtilities.getFragmentQueryDocument)(options.fragment, options.fragmentName)
    });
  };
  return ApolloCache;
}();
exports.ApolloCache = ApolloCache;
//# sourceMappingURL=cache.js.map
},{"apollo-utilities":27}],55:[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
var Cache = exports.Cache = undefined;
(function (Cache) {})(Cache || (exports.Cache = Cache = {}));
//# sourceMappingURL=Cache.js.map
},{}],54:[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _Cache = require("./Cache");

Object.keys(_Cache).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function () {
      return _Cache[key];
    }
  });
});
},{"./Cache":55}],45:[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _cache = require("./cache");

Object.keys(_cache).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function () {
      return _cache[key];
    }
  });
});

var _types = require("./types");

Object.keys(_types).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function () {
      return _types[key];
    }
  });
});
},{"./cache":49,"./types":54}],16:[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.IntrospectionFragmentMatcher = exports.HeuristicFragmentMatcher = undefined;

var _apolloUtilities = require("apollo-utilities");

var haveWarned = false;
var HeuristicFragmentMatcher = function () {
  function HeuristicFragmentMatcher() {}
  HeuristicFragmentMatcher.prototype.ensureReady = function () {
    return Promise.resolve();
  };
  HeuristicFragmentMatcher.prototype.canBypassInit = function () {
    return true;
  };
  HeuristicFragmentMatcher.prototype.match = function (idValue, typeCondition, context) {
    var obj = context.store.get(idValue.id);
    if (!obj) {
      return false;
    }
    if (!obj.__typename) {
      if (!haveWarned) {
        console.warn("You're using fragments in your queries, but either don't have the addTypename:\n  true option set in Apollo Client, or you are trying to write a fragment to the store without the __typename.\n   Please turn on the addTypename option and include __typename when writing fragments so that Apollo Client\n   can accurately match fragments.");
        console.warn('Could not find __typename on Fragment ', typeCondition, obj);
        console.warn("DEPRECATION WARNING: using fragments without __typename is unsupported behavior " + "and will be removed in future versions of Apollo client. You should fix this and set addTypename to true now.");
        if (!(0, _apolloUtilities.isTest)()) {
          haveWarned = true;
        }
      }
      context.returnPartialData = true;
      return true;
    }
    if (obj.__typename === typeCondition) {
      return true;
    }
    (0, _apolloUtilities.warnOnceInDevelopment)("You are using the simple (heuristic) fragment matcher, but your queries contain union or interface types.\n     Apollo Client will not be able to able to accurately map fragments." + "To make this error go away, use the IntrospectionFragmentMatcher as described in the docs: " + "http://dev.apollodata.com/react/initialization.html#fragment-matcher", 'error');
    context.returnPartialData = true;
    return true;
  };
  return HeuristicFragmentMatcher;
}();
exports.HeuristicFragmentMatcher = HeuristicFragmentMatcher;

var IntrospectionFragmentMatcher = function () {
  function IntrospectionFragmentMatcher(options) {
    if (options && options.introspectionQueryResultData) {
      this.possibleTypesMap = this.parseIntrospectionResult(options.introspectionQueryResultData);
      this.isReady = true;
    } else {
      this.isReady = false;
    }
    this.match = this.match.bind(this);
  }
  IntrospectionFragmentMatcher.prototype.match = function (idValue, typeCondition, context) {
    if (!this.isReady) {
      throw new Error('FragmentMatcher.match() was called before FragmentMatcher.init()');
    }
    var obj = context.store.get(idValue.id);
    if (!obj) {
      return false;
    }
    if (!obj.__typename) {
      throw new Error("Cannot match fragment because __typename property is missing: " + JSON.stringify(obj));
    }
    if (obj.__typename === typeCondition) {
      return true;
    }
    var implementingTypes = this.possibleTypesMap[typeCondition];
    if (implementingTypes && implementingTypes.indexOf(obj.__typename) > -1) {
      return true;
    }
    return false;
  };
  IntrospectionFragmentMatcher.prototype.parseIntrospectionResult = function (introspectionResultData) {
    var typeMap = {};
    introspectionResultData.__schema.types.forEach(function (type) {
      if (type.kind === 'UNION' || type.kind === 'INTERFACE') {
        typeMap[type.name] = type.possibleTypes.map(function (implementingType) {
          return implementingType.name;
        });
      }
    });
    return typeMap;
  };
  return IntrospectionFragmentMatcher;
}();
exports.IntrospectionFragmentMatcher = IntrospectionFragmentMatcher;
//# sourceMappingURL=fragmentMatcher.js.map
},{"apollo-utilities":27}],17:[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.defaultNormalizedCacheFactory = defaultNormalizedCacheFactory;
var ObjectCache = function () {
  function ObjectCache(data) {
    if (data === void 0) {
      data = {};
    }
    this.data = data;
  }
  ObjectCache.prototype.toObject = function () {
    return this.data;
  };
  ObjectCache.prototype.get = function (dataId) {
    return this.data[dataId];
  };
  ObjectCache.prototype.set = function (dataId, value) {
    this.data[dataId] = value;
  };
  ObjectCache.prototype.delete = function (dataId) {
    this.data[dataId] = undefined;
  };
  ObjectCache.prototype.clear = function () {
    this.data = {};
  };
  ObjectCache.prototype.replace = function (newData) {
    this.data = newData || {};
  };
  return ObjectCache;
}();
exports.ObjectCache = ObjectCache;
function defaultNormalizedCacheFactory(seed) {
  return new ObjectCache(seed);
}
//# sourceMappingURL=objectCache.js.map
},{}],15:[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.WriteError = undefined;
exports.enhanceErrorWithDocument = enhanceErrorWithDocument;
exports.writeQueryToStore = writeQueryToStore;
exports.writeResultToStore = writeResultToStore;
exports.writeSelectionSetToStore = writeSelectionSetToStore;

var _printer = require("graphql/language/printer");

var _apolloUtilities = require("apollo-utilities");

var _objectCache = require("./objectCache");

var __extends = undefined && undefined.__extends || function () {
  var extendStatics = Object.setPrototypeOf || { __proto__: [] } instanceof Array && function (d, b) {
    d.__proto__ = b;
  } || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
  };
  return function (d, b) {
    extendStatics(d, b);
    function __() {
      this.constructor = d;
    }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
  };
}();
var __assign = undefined && undefined.__assign || Object.assign || function (t) {
  for (var s, i = 1, n = arguments.length; i < n; i++) {
    s = arguments[i];
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
  }
  return t;
};

var WriteError = function (_super) {
  __extends(WriteError, _super);
  function WriteError() {
    var _this = _super !== null && _super.apply(this, arguments) || this;
    _this.type = 'WriteError';
    return _this;
  }
  return WriteError;
}(Error);
exports.WriteError = WriteError;
function enhanceErrorWithDocument(error, document) {
  var enhancedError = new WriteError("Error writing result to store for query:\n " + (0, _printer.print)(document));
  enhancedError.message += '\n' + error.message;
  enhancedError.stack = error.stack;
  return enhancedError;
}
function writeQueryToStore(_a) {
  var result = _a.result,
      query = _a.query,
      _b = _a.storeFactory,
      storeFactory = _b === void 0 ? _objectCache.defaultNormalizedCacheFactory : _b,
      _c = _a.store,
      store = _c === void 0 ? storeFactory() : _c,
      variables = _a.variables,
      dataIdFromObject = _a.dataIdFromObject,
      _d = _a.fragmentMap,
      fragmentMap = _d === void 0 ? {} : _d,
      fragmentMatcherFunction = _a.fragmentMatcherFunction;
  var queryDefinition = (0, _apolloUtilities.getQueryDefinition)(query);
  variables = (0, _apolloUtilities.assign)({}, (0, _apolloUtilities.getDefaultValues)(queryDefinition), variables);
  try {
    return writeSelectionSetToStore({
      dataId: 'ROOT_QUERY',
      result: result,
      selectionSet: queryDefinition.selectionSet,
      context: {
        store: store,
        storeFactory: storeFactory,
        processedData: {},
        variables: variables,
        dataIdFromObject: dataIdFromObject,
        fragmentMap: fragmentMap,
        fragmentMatcherFunction: fragmentMatcherFunction
      }
    });
  } catch (e) {
    throw enhanceErrorWithDocument(e, query);
  }
}
function writeResultToStore(_a) {
  var dataId = _a.dataId,
      result = _a.result,
      document = _a.document,
      _b = _a.storeFactory,
      storeFactory = _b === void 0 ? _objectCache.defaultNormalizedCacheFactory : _b,
      _c = _a.store,
      store = _c === void 0 ? storeFactory() : _c,
      variables = _a.variables,
      dataIdFromObject = _a.dataIdFromObject,
      fragmentMatcherFunction = _a.fragmentMatcherFunction;
  var operationDefinition = (0, _apolloUtilities.getOperationDefinition)(document);
  var selectionSet = operationDefinition.selectionSet;
  var fragmentMap = (0, _apolloUtilities.createFragmentMap)((0, _apolloUtilities.getFragmentDefinitions)(document));
  variables = (0, _apolloUtilities.assign)({}, (0, _apolloUtilities.getDefaultValues)(operationDefinition), variables);
  try {
    return writeSelectionSetToStore({
      result: result,
      dataId: dataId,
      selectionSet: selectionSet,
      context: {
        store: store,
        storeFactory: storeFactory,
        processedData: {},
        variables: variables,
        dataIdFromObject: dataIdFromObject,
        fragmentMap: fragmentMap,
        fragmentMatcherFunction: fragmentMatcherFunction
      }
    });
  } catch (e) {
    throw enhanceErrorWithDocument(e, document);
  }
}
function writeSelectionSetToStore(_a) {
  var result = _a.result,
      dataId = _a.dataId,
      selectionSet = _a.selectionSet,
      context = _a.context;
  var variables = context.variables,
      store = context.store,
      fragmentMap = context.fragmentMap;
  selectionSet.selections.forEach(function (selection) {
    var included = (0, _apolloUtilities.shouldInclude)(selection, variables);
    if ((0, _apolloUtilities.isField)(selection)) {
      var resultFieldKey = (0, _apolloUtilities.resultKeyNameFromField)(selection);
      var value = result[resultFieldKey];
      if (included) {
        if (typeof value !== 'undefined') {
          writeFieldToStore({
            dataId: dataId,
            value: value,
            field: selection,
            context: context
          });
        } else {
          var isDefered = selection.directives && selection.directives.length && selection.directives.some(function (directive) {
            return directive.name && directive.name.value === 'defer';
          });
          if (!isDefered && context.fragmentMatcherFunction) {
            if (!(0, _apolloUtilities.isProduction)()) {
              console.warn("Missing field " + resultFieldKey + " in " + JSON.stringify(result, null, 2).substring(0, 100));
            }
          }
        }
      }
    } else {
      var fragment = void 0;
      if ((0, _apolloUtilities.isInlineFragment)(selection)) {
        fragment = selection;
      } else {
        fragment = (fragmentMap || {})[selection.name.value];
        if (!fragment) {
          throw new Error("No fragment named " + selection.name.value + ".");
        }
      }
      var matches = true;
      if (context.fragmentMatcherFunction && fragment.typeCondition) {
        var idValue = { type: 'id', id: 'self', generated: false };
        var fakeContext = {
          store: new _objectCache.ObjectCache({ self: result }),
          returnPartialData: false,
          hasMissingField: false,
          cacheResolvers: {}
        };
        matches = context.fragmentMatcherFunction(idValue, fragment.typeCondition.name.value, fakeContext);
        if (!(0, _apolloUtilities.isProduction)() && fakeContext.returnPartialData) {
          console.error('WARNING: heuristic fragment matching going on!');
        }
      }
      if (included && matches) {
        writeSelectionSetToStore({
          result: result,
          selectionSet: fragment.selectionSet,
          dataId: dataId,
          context: context
        });
      }
    }
  });
  return store;
}
function isGeneratedId(id) {
  return id[0] === '$';
}
function mergeWithGenerated(generatedKey, realKey, cache) {
  var generated = cache.get(generatedKey);
  var real = cache.get(realKey);
  Object.keys(generated).forEach(function (key) {
    var value = generated[key];
    var realValue = real[key];
    if ((0, _apolloUtilities.isIdValue)(value) && isGeneratedId(value.id) && (0, _apolloUtilities.isIdValue)(realValue)) {
      mergeWithGenerated(value.id, realValue.id, cache);
    }
    cache.delete(generatedKey);
    cache.set(realKey, __assign({}, generated, real));
  });
}
function isDataProcessed(dataId, field, processedData) {
  if (!processedData) {
    return false;
  }
  if (processedData[dataId]) {
    if (processedData[dataId].indexOf(field) >= 0) {
      return true;
    } else {
      processedData[dataId].push(field);
    }
  } else {
    processedData[dataId] = [field];
  }
  return false;
}
function writeFieldToStore(_a) {
  var field = _a.field,
      value = _a.value,
      dataId = _a.dataId,
      context = _a.context;
  var variables = context.variables,
      dataIdFromObject = context.dataIdFromObject,
      store = context.store;
  var storeValue;
  var storeObject;
  var storeFieldName = (0, _apolloUtilities.storeKeyNameFromField)(field, variables);
  var shouldMerge = false;
  var generatedKey = '';
  if (!field.selectionSet || value === null) {
    storeValue = value != null && typeof value === 'object' ? { type: 'json', json: value } : value;
  } else if (Array.isArray(value)) {
    var generatedId = dataId + "." + storeFieldName;
    storeValue = processArrayValue(value, generatedId, field.selectionSet, context);
  } else {
    var valueDataId = dataId + "." + storeFieldName;
    var generated = true;
    if (!isGeneratedId(valueDataId)) {
      valueDataId = '$' + valueDataId;
    }
    if (dataIdFromObject) {
      var semanticId = dataIdFromObject(value);
      if (semanticId && isGeneratedId(semanticId)) {
        throw new Error('IDs returned by dataIdFromObject cannot begin with the "$" character.');
      }
      if (semanticId) {
        valueDataId = semanticId;
        generated = false;
      }
    }
    if (!isDataProcessed(valueDataId, field, context.processedData)) {
      writeSelectionSetToStore({
        dataId: valueDataId,
        result: value,
        selectionSet: field.selectionSet,
        context: context
      });
    }
    storeValue = {
      type: 'id',
      id: valueDataId,
      generated: generated
    };
    storeObject = store.get(dataId);
    if (storeObject && storeObject[storeFieldName] !== storeValue) {
      var escapedId = storeObject[storeFieldName];
      if ((0, _apolloUtilities.isIdValue)(storeValue) && storeValue.generated && (0, _apolloUtilities.isIdValue)(escapedId) && !escapedId.generated) {
        throw new Error("Store error: the application attempted to write an object with no provided id" + (" but the store already contains an id of " + escapedId.id + " for this object. The selectionSet") + " that was trying to be written is:\n" + (0, _printer.print)(field));
      }
      if ((0, _apolloUtilities.isIdValue)(escapedId) && escapedId.generated) {
        generatedKey = escapedId.id;
        shouldMerge = true;
      }
    }
  }
  var newStoreObj = __assign({}, store.get(dataId), (_b = {}, _b[storeFieldName] = storeValue, _b));
  if (shouldMerge) {
    mergeWithGenerated(generatedKey, storeValue.id, store);
  }
  storeObject = store.get(dataId);
  if (!storeObject || storeValue !== storeObject[storeFieldName]) {
    store.set(dataId, newStoreObj);
  }
  var _b;
}
function processArrayValue(value, generatedId, selectionSet, context) {
  return value.map(function (item, index) {
    if (item === null) {
      return null;
    }
    var itemDataId = generatedId + "." + index;
    if (Array.isArray(item)) {
      return processArrayValue(item, itemDataId, selectionSet, context);
    }
    var generated = true;
    if (context.dataIdFromObject) {
      var semanticId = context.dataIdFromObject(item);
      if (semanticId) {
        itemDataId = semanticId;
        generated = false;
      }
    }
    if (!isDataProcessed(itemDataId, selectionSet, context.processedData)) {
      writeSelectionSetToStore({
        dataId: itemDataId,
        result: item,
        selectionSet: selectionSet,
        context: context
      });
    }
    var idStoreValue = {
      type: 'id',
      id: itemDataId,
      generated: generated
    };
    return idStoreValue;
  });
}
//# sourceMappingURL=writeToStore.js.map
},{"graphql/language/printer":43,"apollo-utilities":27,"./objectCache":17}],51:[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.graphql = graphql;
exports.merge = merge;

var _apolloUtilities = require("apollo-utilities");

function graphql(resolver, document, rootValue, contextValue, variableValues, execOptions) {
  if (execOptions === void 0) {
    execOptions = {};
  }
  var mainDefinition = (0, _apolloUtilities.getMainDefinition)(document);
  var fragments = (0, _apolloUtilities.getFragmentDefinitions)(document);
  var fragmentMap = (0, _apolloUtilities.createFragmentMap)(fragments);
  var resultMapper = execOptions.resultMapper;
  var fragmentMatcher = execOptions.fragmentMatcher || function () {
    return true;
  };
  var execContext = {
    fragmentMap: fragmentMap,
    contextValue: contextValue,
    variableValues: variableValues,
    resultMapper: resultMapper,
    resolver: resolver,
    fragmentMatcher: fragmentMatcher
  };
  return executeSelectionSet(mainDefinition.selectionSet, rootValue, execContext);
}
function executeSelectionSet(selectionSet, rootValue, execContext) {
  var fragmentMap = execContext.fragmentMap,
      contextValue = execContext.contextValue,
      variables = execContext.variableValues;
  var result = {};
  selectionSet.selections.forEach(function (selection) {
    if (!(0, _apolloUtilities.shouldInclude)(selection, variables)) {
      return;
    }
    if ((0, _apolloUtilities.isField)(selection)) {
      var fieldResult = executeField(selection, rootValue, execContext);
      var resultFieldKey = (0, _apolloUtilities.resultKeyNameFromField)(selection);
      if (fieldResult !== undefined) {
        if (result[resultFieldKey] === undefined) {
          result[resultFieldKey] = fieldResult;
        } else {
          merge(result[resultFieldKey], fieldResult);
        }
      }
    } else {
      var fragment = void 0;
      if ((0, _apolloUtilities.isInlineFragment)(selection)) {
        fragment = selection;
      } else {
        fragment = fragmentMap[selection.name.value];
        if (!fragment) {
          throw new Error("No fragment named " + selection.name.value);
        }
      }
      var typeCondition = fragment.typeCondition.name.value;
      if (execContext.fragmentMatcher(rootValue, typeCondition, contextValue)) {
        var fragmentResult = executeSelectionSet(fragment.selectionSet, rootValue, execContext);
        merge(result, fragmentResult);
      }
    }
  });
  if (execContext.resultMapper) {
    return execContext.resultMapper(result, rootValue);
  }
  return result;
}
function executeField(field, rootValue, execContext) {
  var variables = execContext.variableValues,
      contextValue = execContext.contextValue,
      resolver = execContext.resolver;
  var fieldName = field.name.value;
  var args = (0, _apolloUtilities.argumentsObjectFromField)(field, variables);
  var info = {
    isLeaf: !field.selectionSet,
    resultKey: (0, _apolloUtilities.resultKeyNameFromField)(field),
    directives: (0, _apolloUtilities.getDirectiveInfoFromField)(field, variables)
  };
  var result = resolver(fieldName, rootValue, args, contextValue, info);
  if (!field.selectionSet) {
    return result;
  }
  if (result == null) {
    return result;
  }
  if (Array.isArray(result)) {
    return executeSubSelectedArray(field, result, execContext);
  }
  return executeSelectionSet(field.selectionSet, result, execContext);
}
function executeSubSelectedArray(field, result, execContext) {
  return result.map(function (item) {
    if (item === null) {
      return null;
    }
    if (Array.isArray(item)) {
      return executeSubSelectedArray(field, item, execContext);
    }
    return executeSelectionSet(field.selectionSet, item, execContext);
  });
}
function merge(dest, src) {
  if (src === null || typeof src !== 'object') {
    return src;
  }
  Object.keys(dest).forEach(function (destKey) {
    if (src.hasOwnProperty(destKey)) {
      merge(dest[destKey], src[destKey]);
    }
  });
  Object.keys(src).forEach(function (srcKey) {
    if (!dest.hasOwnProperty(srcKey)) {
      dest[srcKey] = src[srcKey];
    }
  });
}
//# sourceMappingURL=graphql.js.map
},{"apollo-utilities":27}],50:[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.filter = filter;
exports.check = check;
exports.propType = propType;

var _graphql = require("./graphql");

function filter(doc, data) {
  var resolver = function (fieldName, root, args, context, info) {
    return root[info.resultKey];
  };
  return (0, _graphql.graphql)(resolver, doc, data);
}
function check(doc, data) {
  var resolver = function (fieldName, root, args, context, info) {
    if (!{}.hasOwnProperty.call(root, info.resultKey)) {
      throw new Error(info.resultKey + " missing on " + root);
    }
    return root[info.resultKey];
  };
  (0, _graphql.graphql)(resolver, doc, data, {}, {}, {
    fragmentMatcher: function () {
      return false;
    }
  });
}
var ANONYMOUS = '<<anonymous>>';
function PropTypeError(message) {
  this.message = message;
  this.stack = '';
}
PropTypeError.prototype = Error.prototype;
var reactPropTypeLocationNames = {
  prop: 'prop',
  context: 'context',
  childContext: 'child context'
};
function createChainableTypeChecker(validate) {
  function checkType(isRequired, props, propName, componentName, location, propFullName) {
    componentName = componentName || ANONYMOUS;
    propFullName = propFullName || propName;
    if (props[propName] == null) {
      var locationName = reactPropTypeLocationNames[location];
      if (isRequired) {
        if (props[propName] === null) {
          return new PropTypeError("The " + locationName + " `" + propFullName + "` is marked as required " + ("in `" + componentName + "`, but its value is `null`."));
        }
        return new PropTypeError("The " + locationName + " `" + propFullName + "` is marked as required in " + ("`" + componentName + "`, but its value is `undefined`."));
      }
      return null;
    } else {
      return validate(props, propName, componentName, location, propFullName);
    }
  }
  var chainedCheckType = checkType.bind(null, false);
  chainedCheckType.isRequired = checkType.bind(null, true);
  return chainedCheckType;
}
function propType(doc) {
  return createChainableTypeChecker(function (props, propName) {
    var prop = props[propName];
    try {
      check(doc, prop);
      return null;
    } catch (e) {
      return e;
    }
  });
}
//# sourceMappingURL=utilities.js.map
},{"./graphql":51}],46:[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.propType = exports.check = exports.filter = undefined;

var _utilities = require("./utilities");

Object.defineProperty(exports, "filter", {
  enumerable: true,
  get: function () {
    return _utilities.filter;
  }
});
Object.defineProperty(exports, "check", {
  enumerable: true,
  get: function () {
    return _utilities.check;
  }
});
Object.defineProperty(exports, "propType", {
  enumerable: true,
  get: function () {
    return _utilities.propType;
  }
});

var _graphql = require("./graphql");

exports.default = _graphql.graphql;
//# sourceMappingURL=index.js.map
},{"./utilities":50,"./graphql":51}],14:[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.ID_KEY = undefined;
exports.readQueryFromStore = readQueryFromStore;
exports.diffQueryAgainstStore = diffQueryAgainstStore;
exports.assertIdValue = assertIdValue;

var _graphqlAnywhere = require("graphql-anywhere");

var _graphqlAnywhere2 = _interopRequireDefault(_graphqlAnywhere);

var _apolloUtilities = require("apollo-utilities");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var __assign = undefined && undefined.__assign || Object.assign || function (t) {
  for (var s, i = 1, n = arguments.length; i < n; i++) {
    s = arguments[i];
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
  }
  return t;
};
var ID_KEY = exports.ID_KEY = typeof Symbol !== 'undefined' ? Symbol('id') : '@@id';
function readQueryFromStore(options) {
  var optsPatch = { returnPartialData: false };
  return diffQueryAgainstStore(__assign({}, options, optsPatch)).result;
}
var readStoreResolver = function (fieldName, idValue, args, context, _a) {
  var resultKey = _a.resultKey,
      directives = _a.directives;
  assertIdValue(idValue);
  var objId = idValue.id;
  var obj = context.store.get(objId);
  var storeKeyName = (0, _apolloUtilities.getStoreKeyName)(fieldName, args, directives);
  var fieldValue = (obj || {})[storeKeyName];
  if (typeof fieldValue === 'undefined') {
    if (context.cacheResolvers && obj && (obj.__typename || objId === 'ROOT_QUERY')) {
      var typename = obj.__typename || 'Query';
      var type = context.cacheResolvers[typename];
      if (type) {
        var resolver = type[fieldName];
        if (resolver) {
          fieldValue = resolver(obj, args);
        }
      }
    }
  }
  if (typeof fieldValue === 'undefined') {
    if (!context.returnPartialData) {
      throw new Error("Can't find field " + storeKeyName + " on object (" + objId + ") " + JSON.stringify(obj, null, 2) + ".");
    }
    context.hasMissingField = true;
    return fieldValue;
  }
  if ((0, _apolloUtilities.isJsonValue)(fieldValue)) {
    if (idValue.previousResult && (0, _apolloUtilities.isEqual)(idValue.previousResult[resultKey], fieldValue.json)) {
      return idValue.previousResult[resultKey];
    }
    return fieldValue.json;
  }
  if (idValue.previousResult) {
    fieldValue = addPreviousResultToIdValues(fieldValue, idValue.previousResult[resultKey]);
  }
  return fieldValue;
};
function diffQueryAgainstStore(_a) {
  var store = _a.store,
      query = _a.query,
      variables = _a.variables,
      previousResult = _a.previousResult,
      _b = _a.returnPartialData,
      returnPartialData = _b === void 0 ? true : _b,
      _c = _a.rootId,
      rootId = _c === void 0 ? 'ROOT_QUERY' : _c,
      fragmentMatcherFunction = _a.fragmentMatcherFunction,
      config = _a.config;
  var queryDefinition = (0, _apolloUtilities.getQueryDefinition)(query);
  variables = (0, _apolloUtilities.assign)({}, (0, _apolloUtilities.getDefaultValues)(queryDefinition), variables);
  var context = {
    store: store,
    returnPartialData: returnPartialData,
    cacheResolvers: config && config.cacheResolvers || {},
    hasMissingField: false
  };
  var rootIdValue = {
    type: 'id',
    id: rootId,
    previousResult: previousResult
  };
  var result = (0, _graphqlAnywhere2.default)(readStoreResolver, query, rootIdValue, context, variables, {
    fragmentMatcher: fragmentMatcherFunction,
    resultMapper: resultMapper
  });
  return {
    result: result,
    complete: !context.hasMissingField
  };
}
function assertIdValue(idValue) {
  if (!(0, _apolloUtilities.isIdValue)(idValue)) {
    throw new Error("Encountered a sub-selection on the query, but the store doesn't have an object reference. This should never happen during normal use unless you have custom code that is directly manipulating the store; please file an issue.");
  }
}
function addPreviousResultToIdValues(value, previousResult) {
  if ((0, _apolloUtilities.isIdValue)(value)) {
    return __assign({}, value, { previousResult: previousResult });
  } else if (Array.isArray(value)) {
    var idToPreviousResult_1 = new Map();
    if (Array.isArray(previousResult)) {
      previousResult.forEach(function (item) {
        if (item && item[ID_KEY]) {
          idToPreviousResult_1.set(item[ID_KEY], item);
        }
      });
    }
    return value.map(function (item, i) {
      var itemPreviousResult = previousResult && previousResult[i];
      if ((0, _apolloUtilities.isIdValue)(item)) {
        itemPreviousResult = idToPreviousResult_1.get(item.id) || itemPreviousResult;
      }
      return addPreviousResultToIdValues(item, itemPreviousResult);
    });
  }
  return value;
}
function resultMapper(resultFields, idValue) {
  if (idValue.previousResult) {
    var currentResultKeys_1 = Object.keys(resultFields);
    var sameAsPreviousResult = Object.keys(idValue.previousResult).reduce(function (sameKeys, key) {
      return sameKeys && currentResultKeys_1.indexOf(key) > -1;
    }, true) && currentResultKeys_1.every(function (key) {
      return areNestedArrayItemsStrictlyEqual(resultFields[key], idValue.previousResult[key]);
    });
    if (sameAsPreviousResult) {
      return idValue.previousResult;
    }
  }
  Object.defineProperty(resultFields, ID_KEY, {
    enumerable: false,
    configurable: false,
    writable: false,
    value: idValue.id
  });
  return resultFields;
}
function areNestedArrayItemsStrictlyEqual(a, b) {
  if (a === b) {
    return true;
  }
  if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) {
    return false;
  }
  return a.every(function (item, i) {
    return areNestedArrayItemsStrictlyEqual(item, b[i]);
  });
}
//# sourceMappingURL=readFromStore.js.map
},{"graphql-anywhere":46,"apollo-utilities":27}],18:[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.record = record;
var __assign = undefined && undefined.__assign || Object.assign || function (t) {
  for (var s, i = 1, n = arguments.length; i < n; i++) {
    s = arguments[i];
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
  }
  return t;
};
var RecordingCache = function () {
  function RecordingCache(data) {
    if (data === void 0) {
      data = {};
    }
    this.data = data;
    this.recordedData = {};
  }
  RecordingCache.prototype.record = function (transaction) {
    transaction(this);
    var recordedData = this.recordedData;
    this.recordedData = {};
    return recordedData;
  };
  RecordingCache.prototype.toObject = function () {
    return __assign({}, this.data, this.recordedData);
  };
  RecordingCache.prototype.get = function (dataId) {
    if (this.recordedData.hasOwnProperty(dataId)) {
      return this.recordedData[dataId];
    }
    return this.data[dataId];
  };
  RecordingCache.prototype.set = function (dataId, value) {
    if (this.get(dataId) !== value) {
      this.recordedData[dataId] = value;
    }
  };
  RecordingCache.prototype.delete = function (dataId) {
    this.recordedData[dataId] = undefined;
  };
  RecordingCache.prototype.clear = function () {
    var _this = this;
    Object.keys(this.data).forEach(function (dataId) {
      return _this.delete(dataId);
    });
    this.recordedData = {};
  };
  RecordingCache.prototype.replace = function (newData) {
    this.clear();
    this.recordedData = __assign({}, newData);
  };
  return RecordingCache;
}();
exports.RecordingCache = RecordingCache;
function record(startingState, transaction) {
  var recordingCache = new RecordingCache(startingState);
  return recordingCache.record(transaction);
}
//# sourceMappingURL=recordingCache.js.map
},{}],13:[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.InMemoryCache = undefined;
exports.defaultDataIdFromObject = defaultDataIdFromObject;

var _apolloCache = require("apollo-cache");

var _apolloUtilities = require("apollo-utilities");

var _fragmentMatcher = require("./fragmentMatcher");

var _writeToStore = require("./writeToStore");

var _readFromStore = require("./readFromStore");

var _objectCache = require("./objectCache");

var _recordingCache = require("./recordingCache");

var __extends = undefined && undefined.__extends || function () {
  var extendStatics = Object.setPrototypeOf || { __proto__: [] } instanceof Array && function (d, b) {
    d.__proto__ = b;
  } || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
  };
  return function (d, b) {
    extendStatics(d, b);
    function __() {
      this.constructor = d;
    }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
  };
}();
var __assign = undefined && undefined.__assign || Object.assign || function (t) {
  for (var s, i = 1, n = arguments.length; i < n; i++) {
    s = arguments[i];
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
  }
  return t;
};

var defaultConfig = {
  fragmentMatcher: new _fragmentMatcher.HeuristicFragmentMatcher(),
  dataIdFromObject: defaultDataIdFromObject,
  addTypename: true,
  storeFactory: _objectCache.defaultNormalizedCacheFactory
};
function defaultDataIdFromObject(result) {
  if (result.__typename) {
    if (result.id !== undefined) {
      return result.__typename + ":" + result.id;
    }
    if (result._id !== undefined) {
      return result.__typename + ":" + result._id;
    }
  }
  return null;
}
var InMemoryCache = function (_super) {
  __extends(InMemoryCache, _super);
  function InMemoryCache(config) {
    if (config === void 0) {
      config = {};
    }
    var _this = _super.call(this) || this;
    _this.optimistic = [];
    _this.watches = [];
    _this.silenceBroadcast = false;
    _this.config = __assign({}, defaultConfig, config);
    if (_this.config.customResolvers) _this.config.cacheResolvers = _this.config.customResolvers;
    _this.addTypename = _this.config.addTypename ? true : false;
    _this.data = _this.config.storeFactory();
    return _this;
  }
  InMemoryCache.prototype.restore = function (data) {
    if (data) this.data.replace(data);
    return this;
  };
  InMemoryCache.prototype.extract = function (optimistic) {
    if (optimistic === void 0) {
      optimistic = false;
    }
    if (optimistic && this.optimistic.length > 0) {
      var patches = this.optimistic.map(function (opt) {
        return opt.data;
      });
      return Object.assign.apply(Object, [{}, this.data.toObject()].concat(patches));
    }
    return this.data.toObject();
  };
  InMemoryCache.prototype.read = function (query) {
    if (query.rootId && this.data.get(query.rootId) === undefined) {
      return null;
    }
    return (0, _readFromStore.readQueryFromStore)({
      store: this.config.storeFactory(this.extract(query.optimistic)),
      query: this.transformDocument(query.query),
      variables: query.variables,
      rootId: query.rootId,
      fragmentMatcherFunction: this.config.fragmentMatcher.match,
      previousResult: query.previousResult,
      config: this.config
    });
  };
  InMemoryCache.prototype.write = function (write) {
    (0, _writeToStore.writeResultToStore)({
      dataId: write.dataId,
      result: write.result,
      variables: write.variables,
      document: this.transformDocument(write.query),
      store: this.data,
      dataIdFromObject: this.config.dataIdFromObject,
      fragmentMatcherFunction: this.config.fragmentMatcher.match
    });
    this.broadcastWatches();
  };
  InMemoryCache.prototype.diff = function (query) {
    return (0, _readFromStore.diffQueryAgainstStore)({
      store: this.config.storeFactory(this.extract(query.optimistic)),
      query: this.transformDocument(query.query),
      variables: query.variables,
      returnPartialData: query.returnPartialData,
      previousResult: query.previousResult,
      fragmentMatcherFunction: this.config.fragmentMatcher.match,
      config: this.config
    });
  };
  InMemoryCache.prototype.watch = function (watch) {
    var _this = this;
    this.watches.push(watch);
    return function () {
      _this.watches = _this.watches.filter(function (c) {
        return c !== watch;
      });
    };
  };
  InMemoryCache.prototype.evict = function (query) {
    throw new Error("eviction is not implemented on InMemory Cache");
  };
  InMemoryCache.prototype.reset = function () {
    this.data.clear();
    this.broadcastWatches();
    return Promise.resolve();
  };
  InMemoryCache.prototype.removeOptimistic = function (id) {
    var _this = this;
    var toPerform = this.optimistic.filter(function (item) {
      return item.id !== id;
    });
    this.optimistic = [];
    toPerform.forEach(function (change) {
      _this.recordOptimisticTransaction(change.transaction, change.id);
    });
    this.broadcastWatches();
  };
  InMemoryCache.prototype.performTransaction = function (transaction) {
    var alreadySilenced = this.silenceBroadcast;
    this.silenceBroadcast = true;
    transaction(this);
    if (!alreadySilenced) {
      this.silenceBroadcast = false;
    }
    this.broadcastWatches();
  };
  InMemoryCache.prototype.recordOptimisticTransaction = function (transaction, id) {
    var _this = this;
    this.silenceBroadcast = true;
    var patch = (0, _recordingCache.record)(this.extract(true), function (recordingCache) {
      var dataCache = _this.data;
      _this.data = recordingCache;
      _this.performTransaction(transaction);
      _this.data = dataCache;
    });
    this.optimistic.push({
      id: id,
      transaction: transaction,
      data: patch
    });
    this.silenceBroadcast = false;
    this.broadcastWatches();
  };
  InMemoryCache.prototype.transformDocument = function (document) {
    if (this.addTypename) return (0, _apolloUtilities.addTypenameToDocument)(document);
    return document;
  };
  InMemoryCache.prototype.readQuery = function (options, optimistic) {
    if (optimistic === void 0) {
      optimistic = false;
    }
    return this.read({
      query: options.query,
      variables: options.variables,
      optimistic: optimistic
    });
  };
  InMemoryCache.prototype.readFragment = function (options, optimistic) {
    if (optimistic === void 0) {
      optimistic = false;
    }
    return this.read({
      query: this.transformDocument((0, _apolloUtilities.getFragmentQueryDocument)(options.fragment, options.fragmentName)),
      variables: options.variables,
      rootId: options.id,
      optimistic: optimistic
    });
  };
  InMemoryCache.prototype.writeQuery = function (options) {
    this.write({
      dataId: 'ROOT_QUERY',
      result: options.data,
      query: this.transformDocument(options.query),
      variables: options.variables
    });
  };
  InMemoryCache.prototype.writeFragment = function (options) {
    this.write({
      dataId: options.id,
      result: options.data,
      query: this.transformDocument((0, _apolloUtilities.getFragmentQueryDocument)(options.fragment, options.fragmentName)),
      variables: options.variables
    });
  };
  InMemoryCache.prototype.broadcastWatches = function () {
    var _this = this;
    if (this.silenceBroadcast) return;
    this.watches.forEach(function (c) {
      var newData = _this.diff({
        query: c.query,
        variables: c.variables,
        previousResult: c.previousResult && c.previousResult(),
        optimistic: c.optimistic
      });
      c.callback(newData);
    });
  };
  return InMemoryCache;
}(_apolloCache.ApolloCache);
exports.InMemoryCache = InMemoryCache;
//# sourceMappingURL=inMemoryCache.js.map
},{"apollo-cache":45,"apollo-utilities":27,"./fragmentMatcher":16,"./writeToStore":15,"./readFromStore":14,"./objectCache":17,"./recordingCache":18}],5:[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _inMemoryCache = require("./inMemoryCache");

Object.defineProperty(exports, "InMemoryCache", {
  enumerable: true,
  get: function () {
    return _inMemoryCache.InMemoryCache;
  }
});
Object.defineProperty(exports, "defaultDataIdFromObject", {
  enumerable: true,
  get: function () {
    return _inMemoryCache.defaultDataIdFromObject;
  }
});

var _readFromStore = require("./readFromStore");

Object.keys(_readFromStore).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function () {
      return _readFromStore[key];
    }
  });
});

var _writeToStore = require("./writeToStore");

Object.keys(_writeToStore).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function () {
      return _writeToStore[key];
    }
  });
});

var _fragmentMatcher = require("./fragmentMatcher");

Object.keys(_fragmentMatcher).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function () {
      return _fragmentMatcher[key];
    }
  });
});

var _objectCache = require("./objectCache");

Object.keys(_objectCache).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function () {
      return _objectCache[key];
    }
  });
});

var _recordingCache = require("./recordingCache");

Object.keys(_recordingCache).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function () {
      return _recordingCache[key];
    }
  });
});
},{"./inMemoryCache":13,"./readFromStore":14,"./writeToStore":15,"./fragmentMatcher":16,"./objectCache":17,"./recordingCache":18}],63:[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = invariant;
/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * 
 */

function invariant(condition, message) {
  /* istanbul ignore else */
  if (!condition) {
    throw new Error(message);
  }
}
},{}],59:[function(require,module,exports) {
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Source = undefined;

var _invariant = require('../jsutils/invariant');

var _invariant2 = _interopRequireDefault(_invariant);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } } /**
                                                                                                                                                           * Copyright (c) 2015-present, Facebook, Inc.
                                                                                                                                                           *
                                                                                                                                                           * This source code is licensed under the MIT license found in the
                                                                                                                                                           * LICENSE file in the root directory of this source tree.
                                                                                                                                                           *
                                                                                                                                                           * 
                                                                                                                                                           */

/**
 * A representation of source input to GraphQL.
 * `name` and `locationOffset` are optional. They are useful for clients who
 * store GraphQL documents in source files; for example, if the GraphQL input
 * starts at line 40 in a file named Foo.graphql, it might be useful for name to
 * be "Foo.graphql" and location to be `{ line: 40, column: 0 }`.
 * line and column in locationOffset are 1-indexed
 */
var Source = exports.Source = function Source(body, name, locationOffset) {
  _classCallCheck(this, Source);

  this.body = body;
  this.name = name || 'GraphQL request';
  this.locationOffset = locationOffset || { line: 1, column: 1 };
  !(this.locationOffset.line > 0) ? (0, _invariant2.default)(0, 'line in locationOffset is 1-indexed and must be positive') : void 0;
  !(this.locationOffset.column > 0) ? (0, _invariant2.default)(0, 'column in locationOffset is 1-indexed and must be positive') : void 0;
};
},{"../jsutils/invariant":63}],71:[function(require,module,exports) {
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getLocation = getLocation;


/**
 * Takes a Source and a UTF-8 character offset, and returns the corresponding
 * line and column as a SourceLocation.
 */
/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * 
 */

function getLocation(source, position) {
  var lineRegexp = /\r\n|[\n\r]/g;
  var line = 1;
  var column = position + 1;
  var match = void 0;
  while ((match = lineRegexp.exec(source.body)) && match.index < position) {
    line += 1;
    column = position + 1 - (match.index + match[0].length);
  }
  return { line: line, column: column };
}

/**
 * Represents a location in a Source.
 */
},{}],69:[function(require,module,exports) {
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.printError = printError;

var _location = require('../language/location');

/**
 * Prints a GraphQLError to a string, representing useful location information
 * about the error's position in the source.
 */
function printError(error) {
  var printedLocations = [];
  if (error.nodes) {
    error.nodes.forEach(function (node) {
      if (node.loc) {
        printedLocations.push(highlightSourceAtLocation(node.loc.source, (0, _location.getLocation)(node.loc.source, node.loc.start)));
      }
    });
  } else if (error.source && error.locations) {
    var source = error.source;
    error.locations.forEach(function (location) {
      printedLocations.push(highlightSourceAtLocation(source, location));
    });
  }
  return printedLocations.length === 0 ? error.message : [error.message].concat(printedLocations).join('\n\n') + '\n';
}

/**
 * Render a helpful description of the location of the error in the GraphQL
 * Source document.
 */
/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * 
 */

function highlightSourceAtLocation(source, location) {
  var line = location.line;
  var lineOffset = source.locationOffset.line - 1;
  var columnOffset = getColumnOffset(source, location);
  var contextLine = line + lineOffset;
  var contextColumn = location.column + columnOffset;
  var prevLineNum = (contextLine - 1).toString();
  var lineNum = contextLine.toString();
  var nextLineNum = (contextLine + 1).toString();
  var padLen = nextLineNum.length;
  var lines = source.body.split(/\r\n|[\n\r]/g);
  lines[0] = whitespace(source.locationOffset.column - 1) + lines[0];
  var outputLines = [source.name + ' (' + contextLine + ':' + contextColumn + ')', line >= 2 && lpad(padLen, prevLineNum) + ': ' + lines[line - 2], lpad(padLen, lineNum) + ': ' + lines[line - 1], whitespace(2 + padLen + contextColumn - 1) + '^', line < lines.length && lpad(padLen, nextLineNum) + ': ' + lines[line]];
  return outputLines.filter(Boolean).join('\n');
}

function getColumnOffset(source, location) {
  return location.line === 1 ? source.locationOffset.column - 1 : 0;
}

function whitespace(len) {
  return Array(len + 1).join(' ');
}

function lpad(len, str) {
  return whitespace(len - str.length) + str;
}
},{"../language/location":71}],66:[function(require,module,exports) {
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.GraphQLError = GraphQLError;

var _printError = require('./printError');

var _location = require('../language/location');

/**
 * A GraphQLError describes an Error found during the parse, validate, or
 * execute phases of performing a GraphQL operation. In addition to a message
 * and stack trace, it also includes information about the locations in a
 * GraphQL document and/or execution result that correspond to the Error.
 */
/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * 
 */

function GraphQLError( // eslint-disable-line no-redeclare
message, nodes, source, positions, path, originalError, extensions) {
  // Compute list of blame nodes.
  var _nodes = Array.isArray(nodes) ? nodes.length !== 0 ? nodes : undefined : nodes ? [nodes] : undefined;

  // Compute locations in the source for the given nodes/positions.
  var _source = source;
  if (!_source && _nodes) {
    var node = _nodes[0];
    _source = node && node.loc && node.loc.source;
  }

  var _positions = positions;
  if (!_positions && _nodes) {
    _positions = _nodes.reduce(function (list, node) {
      if (node.loc) {
        list.push(node.loc.start);
      }
      return list;
    }, []);
  }
  if (_positions && _positions.length === 0) {
    _positions = undefined;
  }

  var _locations = void 0;
  if (positions && source) {
    var providedSource = source;
    _locations = positions.map(function (pos) {
      return (0, _location.getLocation)(providedSource, pos);
    });
  } else if (_nodes) {
    _locations = _nodes.reduce(function (list, node) {
      if (node.loc) {
        list.push((0, _location.getLocation)(node.loc.source, node.loc.start));
      }
      return list;
    }, []);
  }

  Object.defineProperties(this, {
    message: {
      value: message,
      // By being enumerable, JSON.stringify will include `message` in the
      // resulting output. This ensures that the simplest possible GraphQL
      // service adheres to the spec.
      enumerable: true,
      writable: true
    },
    locations: {
      // Coercing falsey values to undefined ensures they will not be included
      // in JSON.stringify() when not provided.
      value: _locations || undefined,
      // By being enumerable, JSON.stringify will include `locations` in the
      // resulting output. This ensures that the simplest possible GraphQL
      // service adheres to the spec.
      enumerable: true
    },
    path: {
      // Coercing falsey values to undefined ensures they will not be included
      // in JSON.stringify() when not provided.
      value: path || undefined,
      // By being enumerable, JSON.stringify will include `path` in the
      // resulting output. This ensures that the simplest possible GraphQL
      // service adheres to the spec.
      enumerable: true
    },
    nodes: {
      value: _nodes || undefined
    },
    source: {
      value: _source || undefined
    },
    positions: {
      value: _positions || undefined
    },
    originalError: {
      value: originalError
    },
    extensions: {
      value: extensions || originalError && originalError.extensions
    }
  });

  // Include (non-enumerable) stack trace.
  if (originalError && originalError.stack) {
    Object.defineProperty(this, 'stack', {
      value: originalError.stack,
      writable: true,
      configurable: true
    });
  } else if (Error.captureStackTrace) {
    Error.captureStackTrace(this, GraphQLError);
  } else {
    Object.defineProperty(this, 'stack', {
      value: Error().stack,
      writable: true,
      configurable: true
    });
  }
}

GraphQLError.prototype = Object.create(Error.prototype, {
  constructor: { value: GraphQLError },
  name: { value: 'GraphQLError' },
  toString: {
    value: function toString() {
      return (0, _printError.printError)(this);
    }
  }
});
},{"./printError":69,"../language/location":71}],67:[function(require,module,exports) {
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.syntaxError = syntaxError;

var _GraphQLError = require('./GraphQLError');

/**
 * Produces a GraphQLError representing a syntax error, containing useful
 * descriptive information about the syntax error's position in the source.
 */
/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * 
 */

function syntaxError(source, position, description) {
  return new _GraphQLError.GraphQLError('Syntax Error: ' + description, undefined, source, [position]);
}
},{"./GraphQLError":66}],68:[function(require,module,exports) {
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.locatedError = locatedError;

var _GraphQLError = require('./GraphQLError');

/**
 * Given an arbitrary Error, presumably thrown while attempting to execute a
 * GraphQL operation, produce a new GraphQLError aware of the location in the
 * document responsible for the original Error.
 */
function locatedError(originalError, nodes, path) {
  // Note: this uses a brand-check to support GraphQL errors originating from
  // other contexts.
  if (originalError && Array.isArray(originalError.path)) {
    return originalError;
  }

  return new _GraphQLError.GraphQLError(originalError && originalError.message, originalError && originalError.nodes || nodes, originalError && originalError.source, originalError && originalError.positions, path, originalError);
} /**
   * Copyright (c) 2015-present, Facebook, Inc.
   *
   * This source code is licensed under the MIT license found in the
   * LICENSE file in the root directory of this source tree.
   *
   * 
   */
},{"./GraphQLError":66}],70:[function(require,module,exports) {
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; }; /**
                                                                                                                                                                                                                                                                   * Copyright (c) 2015-present, Facebook, Inc.
                                                                                                                                                                                                                                                                   *
                                                                                                                                                                                                                                                                   * This source code is licensed under the MIT license found in the
                                                                                                                                                                                                                                                                   * LICENSE file in the root directory of this source tree.
                                                                                                                                                                                                                                                                   *
                                                                                                                                                                                                                                                                   * 
                                                                                                                                                                                                                                                                   */

exports.formatError = formatError;

var _invariant = require('../jsutils/invariant');

var _invariant2 = _interopRequireDefault(_invariant);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Given a GraphQLError, format it according to the rules described by the
 * Response Format, Errors section of the GraphQL Specification.
 */
function formatError(error) {
  !error ? (0, _invariant2.default)(0, 'Received null or undefined error.') : void 0;
  return _extends({}, error.extensions, {
    message: error.message || 'An unknown error occurred.',
    locations: error.locations,
    path: error.path
  });
}
},{"../jsutils/invariant":63}],65:[function(require,module,exports) {
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _GraphQLError = require('./GraphQLError');

Object.defineProperty(exports, 'GraphQLError', {
  enumerable: true,
  get: function get() {
    return _GraphQLError.GraphQLError;
  }
});

var _syntaxError = require('./syntaxError');

Object.defineProperty(exports, 'syntaxError', {
  enumerable: true,
  get: function get() {
    return _syntaxError.syntaxError;
  }
});

var _locatedError = require('./locatedError');

Object.defineProperty(exports, 'locatedError', {
  enumerable: true,
  get: function get() {
    return _locatedError.locatedError;
  }
});

var _printError = require('./printError');

Object.defineProperty(exports, 'printError', {
  enumerable: true,
  get: function get() {
    return _printError.printError;
  }
});

var _formatError = require('./formatError');

Object.defineProperty(exports, 'formatError', {
  enumerable: true,
  get: function get() {
    return _formatError.formatError;
  }
});
},{"./GraphQLError":66,"./syntaxError":67,"./locatedError":68,"./printError":69,"./formatError":70}],64:[function(require,module,exports) {
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = blockStringValue;
/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * 
 */

/**
 * Produces the value of a block string from its parsed raw value, similar to
 * Coffeescript's block string, Python's docstring trim or Ruby's strip_heredoc.
 *
 * This implements the GraphQL spec's BlockStringValue() static algorithm.
 */
function blockStringValue(rawString) {
  // Expand a block string's raw value into independent lines.
  var lines = rawString.split(/\r\n|[\n\r]/g);

  // Remove common indentation from all lines but first.
  var commonIndent = null;
  for (var i = 1; i < lines.length; i++) {
    var line = lines[i];
    var indent = leadingWhitespace(line);
    if (indent < line.length && (commonIndent === null || indent < commonIndent)) {
      commonIndent = indent;
      if (commonIndent === 0) {
        break;
      }
    }
  }

  if (commonIndent) {
    for (var _i = 1; _i < lines.length; _i++) {
      lines[_i] = lines[_i].slice(commonIndent);
    }
  }

  // Remove leading and trailing blank lines.
  while (lines.length > 0 && isBlank(lines[0])) {
    lines.shift();
  }
  while (lines.length > 0 && isBlank(lines[lines.length - 1])) {
    lines.pop();
  }

  // Return a string of the lines joined with U+000A.
  return lines.join('\n');
}

function leadingWhitespace(str) {
  var i = 0;
  while (i < str.length && (str[i] === ' ' || str[i] === '\t')) {
    i++;
  }
  return i;
}

function isBlank(str) {
  return leadingWhitespace(str) === str.length;
}
},{}],60:[function(require,module,exports) {
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.TokenKind = undefined;
exports.createLexer = createLexer;
exports.getTokenDesc = getTokenDesc;

var _error = require('../error');

var _blockStringValue = require('./blockStringValue');

var _blockStringValue2 = _interopRequireDefault(_blockStringValue);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Given a Source object, this returns a Lexer for that source.
 * A Lexer is a stateful stream generator in that every time
 * it is advanced, it returns the next token in the Source. Assuming the
 * source lexes, the final Token emitted by the lexer will be of kind
 * EOF, after which the lexer will repeatedly return the same EOF token
 * whenever called.
 */
/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * 
 */

function createLexer(source, options) {
  var startOfFileToken = new Tok(SOF, 0, 0, 0, 0, null);
  var lexer = {
    source: source,
    options: options,
    lastToken: startOfFileToken,
    token: startOfFileToken,
    line: 1,
    lineStart: 0,
    advance: advanceLexer,
    lookahead: lookahead
  };
  return lexer;
}

function advanceLexer() {
  this.lastToken = this.token;
  var token = this.token = this.lookahead();
  return token;
}

function lookahead() {
  var token = this.token;
  if (token.kind !== EOF) {
    do {
      // Note: next is only mutable during parsing, so we cast to allow this.
      token = token.next || (token.next = readToken(this, token));
    } while (token.kind === COMMENT);
  }
  return token;
}

/**
 * The return type of createLexer.
 */


// Each kind of token.
var SOF = '<SOF>';
var EOF = '<EOF>';
var BANG = '!';
var DOLLAR = '$';
var PAREN_L = '(';
var PAREN_R = ')';
var SPREAD = '...';
var COLON = ':';
var EQUALS = '=';
var AT = '@';
var BRACKET_L = '[';
var BRACKET_R = ']';
var BRACE_L = '{';
var PIPE = '|';
var BRACE_R = '}';
var NAME = 'Name';
var INT = 'Int';
var FLOAT = 'Float';
var STRING = 'String';
var BLOCK_STRING = 'BlockString';
var COMMENT = 'Comment';

/**
 * An exported enum describing the different kinds of tokens that the
 * lexer emits.
 */
var TokenKind = exports.TokenKind = {
  SOF: SOF,
  EOF: EOF,
  BANG: BANG,
  DOLLAR: DOLLAR,
  PAREN_L: PAREN_L,
  PAREN_R: PAREN_R,
  SPREAD: SPREAD,
  COLON: COLON,
  EQUALS: EQUALS,
  AT: AT,
  BRACKET_L: BRACKET_L,
  BRACKET_R: BRACKET_R,
  BRACE_L: BRACE_L,
  PIPE: PIPE,
  BRACE_R: BRACE_R,
  NAME: NAME,
  INT: INT,
  FLOAT: FLOAT,
  STRING: STRING,
  BLOCK_STRING: BLOCK_STRING,
  COMMENT: COMMENT
};

/**
 * A helper function to describe a token as a string for debugging
 */
function getTokenDesc(token) {
  var value = token.value;
  return value ? token.kind + ' "' + value + '"' : token.kind;
}

var charCodeAt = String.prototype.charCodeAt;
var slice = String.prototype.slice;

/**
 * Helper function for constructing the Token object.
 */
function Tok(kind, start, end, line, column, prev, value) {
  this.kind = kind;
  this.start = start;
  this.end = end;
  this.line = line;
  this.column = column;
  this.value = value;
  this.prev = prev;
  this.next = null;
}

// Print a simplified form when appearing in JSON/util.inspect.
Tok.prototype.toJSON = Tok.prototype.inspect = function toJSON() {
  return {
    kind: this.kind,
    value: this.value,
    line: this.line,
    column: this.column
  };
};

function printCharCode(code) {
  return (
    // NaN/undefined represents access beyond the end of the file.
    isNaN(code) ? EOF : // Trust JSON for ASCII.
    code < 0x007f ? JSON.stringify(String.fromCharCode(code)) : // Otherwise print the escaped form.
    '"\\u' + ('00' + code.toString(16).toUpperCase()).slice(-4) + '"'
  );
}

/**
 * Gets the next token from the source starting at the given position.
 *
 * This skips over whitespace and comments until it finds the next lexable
 * token, then lexes punctuators immediately or calls the appropriate helper
 * function for more complicated tokens.
 */
function readToken(lexer, prev) {
  var source = lexer.source;
  var body = source.body;
  var bodyLength = body.length;

  var position = positionAfterWhitespace(body, prev.end, lexer);
  var line = lexer.line;
  var col = 1 + position - lexer.lineStart;

  if (position >= bodyLength) {
    return new Tok(EOF, bodyLength, bodyLength, line, col, prev);
  }

  var code = charCodeAt.call(body, position);

  // SourceCharacter
  if (code < 0x0020 && code !== 0x0009 && code !== 0x000a && code !== 0x000d) {
    throw (0, _error.syntaxError)(source, position, 'Cannot contain the invalid character ' + printCharCode(code) + '.');
  }

  switch (code) {
    // !
    case 33:
      return new Tok(BANG, position, position + 1, line, col, prev);
    // #
    case 35:
      return readComment(source, position, line, col, prev);
    // $
    case 36:
      return new Tok(DOLLAR, position, position + 1, line, col, prev);
    // (
    case 40:
      return new Tok(PAREN_L, position, position + 1, line, col, prev);
    // )
    case 41:
      return new Tok(PAREN_R, position, position + 1, line, col, prev);
    // .
    case 46:
      if (charCodeAt.call(body, position + 1) === 46 && charCodeAt.call(body, position + 2) === 46) {
        return new Tok(SPREAD, position, position + 3, line, col, prev);
      }
      break;
    // :
    case 58:
      return new Tok(COLON, position, position + 1, line, col, prev);
    // =
    case 61:
      return new Tok(EQUALS, position, position + 1, line, col, prev);
    // @
    case 64:
      return new Tok(AT, position, position + 1, line, col, prev);
    // [
    case 91:
      return new Tok(BRACKET_L, position, position + 1, line, col, prev);
    // ]
    case 93:
      return new Tok(BRACKET_R, position, position + 1, line, col, prev);
    // {
    case 123:
      return new Tok(BRACE_L, position, position + 1, line, col, prev);
    // |
    case 124:
      return new Tok(PIPE, position, position + 1, line, col, prev);
    // }
    case 125:
      return new Tok(BRACE_R, position, position + 1, line, col, prev);
    // A-Z _ a-z
    case 65:
    case 66:
    case 67:
    case 68:
    case 69:
    case 70:
    case 71:
    case 72:
    case 73:
    case 74:
    case 75:
    case 76:
    case 77:
    case 78:
    case 79:
    case 80:
    case 81:
    case 82:
    case 83:
    case 84:
    case 85:
    case 86:
    case 87:
    case 88:
    case 89:
    case 90:
    case 95:
    case 97:
    case 98:
    case 99:
    case 100:
    case 101:
    case 102:
    case 103:
    case 104:
    case 105:
    case 106:
    case 107:
    case 108:
    case 109:
    case 110:
    case 111:
    case 112:
    case 113:
    case 114:
    case 115:
    case 116:
    case 117:
    case 118:
    case 119:
    case 120:
    case 121:
    case 122:
      return readName(source, position, line, col, prev);
    // - 0-9
    case 45:
    case 48:
    case 49:
    case 50:
    case 51:
    case 52:
    case 53:
    case 54:
    case 55:
    case 56:
    case 57:
      return readNumber(source, position, code, line, col, prev);
    // "
    case 34:
      if (charCodeAt.call(body, position + 1) === 34 && charCodeAt.call(body, position + 2) === 34) {
        return readBlockString(source, position, line, col, prev);
      }
      return readString(source, position, line, col, prev);
  }

  throw (0, _error.syntaxError)(source, position, unexpectedCharacterMessage(code));
}

/**
 * Report a message that an unexpected character was encountered.
 */
function unexpectedCharacterMessage(code) {
  if (code === 39) {
    // '
    return "Unexpected single quote character ('), did you mean to use " + 'a double quote (")?';
  }

  return 'Cannot parse the unexpected character ' + printCharCode(code) + '.';
}

/**
 * Reads from body starting at startPosition until it finds a non-whitespace
 * or commented character, then returns the position of that character for
 * lexing.
 */
function positionAfterWhitespace(body, startPosition, lexer) {
  var bodyLength = body.length;
  var position = startPosition;
  while (position < bodyLength) {
    var code = charCodeAt.call(body, position);
    // tab | space | comma | BOM
    if (code === 9 || code === 32 || code === 44 || code === 0xfeff) {
      ++position;
    } else if (code === 10) {
      // new line
      ++position;
      ++lexer.line;
      lexer.lineStart = position;
    } else if (code === 13) {
      // carriage return
      if (charCodeAt.call(body, position + 1) === 10) {
        position += 2;
      } else {
        ++position;
      }
      ++lexer.line;
      lexer.lineStart = position;
    } else {
      break;
    }
  }
  return position;
}

/**
 * Reads a comment token from the source file.
 *
 * #[\u0009\u0020-\uFFFF]*
 */
function readComment(source, start, line, col, prev) {
  var body = source.body;
  var code = void 0;
  var position = start;

  do {
    code = charCodeAt.call(body, ++position);
  } while (code !== null && (
  // SourceCharacter but not LineTerminator
  code > 0x001f || code === 0x0009));

  return new Tok(COMMENT, start, position, line, col, prev, slice.call(body, start + 1, position));
}

/**
 * Reads a number token from the source file, either a float
 * or an int depending on whether a decimal point appears.
 *
 * Int:   -?(0|[1-9][0-9]*)
 * Float: -?(0|[1-9][0-9]*)(\.[0-9]+)?((E|e)(+|-)?[0-9]+)?
 */
function readNumber(source, start, firstCode, line, col, prev) {
  var body = source.body;
  var code = firstCode;
  var position = start;
  var isFloat = false;

  if (code === 45) {
    // -
    code = charCodeAt.call(body, ++position);
  }

  if (code === 48) {
    // 0
    code = charCodeAt.call(body, ++position);
    if (code >= 48 && code <= 57) {
      throw (0, _error.syntaxError)(source, position, 'Invalid number, unexpected digit after 0: ' + printCharCode(code) + '.');
    }
  } else {
    position = readDigits(source, position, code);
    code = charCodeAt.call(body, position);
  }

  if (code === 46) {
    // .
    isFloat = true;

    code = charCodeAt.call(body, ++position);
    position = readDigits(source, position, code);
    code = charCodeAt.call(body, position);
  }

  if (code === 69 || code === 101) {
    // E e
    isFloat = true;

    code = charCodeAt.call(body, ++position);
    if (code === 43 || code === 45) {
      // + -
      code = charCodeAt.call(body, ++position);
    }
    position = readDigits(source, position, code);
  }

  return new Tok(isFloat ? FLOAT : INT, start, position, line, col, prev, slice.call(body, start, position));
}

/**
 * Returns the new position in the source after reading digits.
 */
function readDigits(source, start, firstCode) {
  var body = source.body;
  var position = start;
  var code = firstCode;
  if (code >= 48 && code <= 57) {
    // 0 - 9
    do {
      code = charCodeAt.call(body, ++position);
    } while (code >= 48 && code <= 57); // 0 - 9
    return position;
  }
  throw (0, _error.syntaxError)(source, position, 'Invalid number, expected digit but got: ' + printCharCode(code) + '.');
}

/**
 * Reads a string token from the source file.
 *
 * "([^"\\\u000A\u000D]|(\\(u[0-9a-fA-F]{4}|["\\/bfnrt])))*"
 */
function readString(source, start, line, col, prev) {
  var body = source.body;
  var position = start + 1;
  var chunkStart = position;
  var code = 0;
  var value = '';

  while (position < body.length && (code = charCodeAt.call(body, position)) !== null &&
  // not LineTerminator
  code !== 0x000a && code !== 0x000d) {
    // Closing Quote (")
    if (code === 34) {
      value += slice.call(body, chunkStart, position);
      return new Tok(STRING, start, position + 1, line, col, prev, value);
    }

    // SourceCharacter
    if (code < 0x0020 && code !== 0x0009) {
      throw (0, _error.syntaxError)(source, position, 'Invalid character within String: ' + printCharCode(code) + '.');
    }

    ++position;
    if (code === 92) {
      // \
      value += slice.call(body, chunkStart, position - 1);
      code = charCodeAt.call(body, position);
      switch (code) {
        case 34:
          value += '"';
          break;
        case 47:
          value += '/';
          break;
        case 92:
          value += '\\';
          break;
        case 98:
          value += '\b';
          break;
        case 102:
          value += '\f';
          break;
        case 110:
          value += '\n';
          break;
        case 114:
          value += '\r';
          break;
        case 116:
          value += '\t';
          break;
        case 117:
          // u
          var charCode = uniCharCode(charCodeAt.call(body, position + 1), charCodeAt.call(body, position + 2), charCodeAt.call(body, position + 3), charCodeAt.call(body, position + 4));
          if (charCode < 0) {
            throw (0, _error.syntaxError)(source, position, 'Invalid character escape sequence: ' + ('\\u' + body.slice(position + 1, position + 5) + '.'));
          }
          value += String.fromCharCode(charCode);
          position += 4;
          break;
        default:
          throw (0, _error.syntaxError)(source, position, 'Invalid character escape sequence: \\' + String.fromCharCode(code) + '.');
      }
      ++position;
      chunkStart = position;
    }
  }

  throw (0, _error.syntaxError)(source, position, 'Unterminated string.');
}

/**
 * Reads a block string token from the source file.
 *
 * """("?"?(\\"""|\\(?!=""")|[^"\\]))*"""
 */
function readBlockString(source, start, line, col, prev) {
  var body = source.body;
  var position = start + 3;
  var chunkStart = position;
  var code = 0;
  var rawValue = '';

  while (position < body.length && (code = charCodeAt.call(body, position)) !== null) {
    // Closing Triple-Quote (""")
    if (code === 34 && charCodeAt.call(body, position + 1) === 34 && charCodeAt.call(body, position + 2) === 34) {
      rawValue += slice.call(body, chunkStart, position);
      return new Tok(BLOCK_STRING, start, position + 3, line, col, prev, (0, _blockStringValue2.default)(rawValue));
    }

    // SourceCharacter
    if (code < 0x0020 && code !== 0x0009 && code !== 0x000a && code !== 0x000d) {
      throw (0, _error.syntaxError)(source, position, 'Invalid character within String: ' + printCharCode(code) + '.');
    }

    // Escape Triple-Quote (\""")
    if (code === 92 && charCodeAt.call(body, position + 1) === 34 && charCodeAt.call(body, position + 2) === 34 && charCodeAt.call(body, position + 3) === 34) {
      rawValue += slice.call(body, chunkStart, position) + '"""';
      position += 4;
      chunkStart = position;
    } else {
      ++position;
    }
  }

  throw (0, _error.syntaxError)(source, position, 'Unterminated string.');
}

/**
 * Converts four hexidecimal chars to the integer that the
 * string represents. For example, uniCharCode('0','0','0','f')
 * will return 15, and uniCharCode('0','0','f','f') returns 255.
 *
 * Returns a negative number on error, if a char was invalid.
 *
 * This is implemented by noting that char2hex() returns -1 on error,
 * which means the result of ORing the char2hex() will also be negative.
 */
function uniCharCode(a, b, c, d) {
  return char2hex(a) << 12 | char2hex(b) << 8 | char2hex(c) << 4 | char2hex(d);
}

/**
 * Converts a hex character to its integer value.
 * '0' becomes 0, '9' becomes 9
 * 'A' becomes 10, 'F' becomes 15
 * 'a' becomes 10, 'f' becomes 15
 *
 * Returns -1 on error.
 */
function char2hex(a) {
  return a >= 48 && a <= 57 ? a - 48 // 0-9
  : a >= 65 && a <= 70 ? a - 55 // A-F
  : a >= 97 && a <= 102 ? a - 87 // a-f
  : -1;
}

/**
 * Reads an alphanumeric + underscore name from the source.
 *
 * [_A-Za-z][_0-9A-Za-z]*
 */
function readName(source, position, line, col, prev) {
  var body = source.body;
  var bodyLength = body.length;
  var end = position + 1;
  var code = 0;
  while (end !== bodyLength && (code = charCodeAt.call(body, end)) !== null && (code === 95 || // _
  code >= 48 && code <= 57 || // 0-9
  code >= 65 && code <= 90 || // A-Z
  code >= 97 && code <= 122) // a-z
  ) {
    ++end;
  }
  return new Tok(NAME, position, end, line, col, prev, slice.call(body, position, end));
}
},{"../error":65,"./blockStringValue":64}],61:[function(require,module,exports) {
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * 
 */

// Name

var NAME = exports.NAME = 'Name';

// Document

var DOCUMENT = exports.DOCUMENT = 'Document';
var OPERATION_DEFINITION = exports.OPERATION_DEFINITION = 'OperationDefinition';
var VARIABLE_DEFINITION = exports.VARIABLE_DEFINITION = 'VariableDefinition';
var VARIABLE = exports.VARIABLE = 'Variable';
var SELECTION_SET = exports.SELECTION_SET = 'SelectionSet';
var FIELD = exports.FIELD = 'Field';
var ARGUMENT = exports.ARGUMENT = 'Argument';

// Fragments

var FRAGMENT_SPREAD = exports.FRAGMENT_SPREAD = 'FragmentSpread';
var INLINE_FRAGMENT = exports.INLINE_FRAGMENT = 'InlineFragment';
var FRAGMENT_DEFINITION = exports.FRAGMENT_DEFINITION = 'FragmentDefinition';

// Values

var INT = exports.INT = 'IntValue';
var FLOAT = exports.FLOAT = 'FloatValue';
var STRING = exports.STRING = 'StringValue';
var BOOLEAN = exports.BOOLEAN = 'BooleanValue';
var NULL = exports.NULL = 'NullValue';
var ENUM = exports.ENUM = 'EnumValue';
var LIST = exports.LIST = 'ListValue';
var OBJECT = exports.OBJECT = 'ObjectValue';
var OBJECT_FIELD = exports.OBJECT_FIELD = 'ObjectField';

// Directives

var DIRECTIVE = exports.DIRECTIVE = 'Directive';

// Types

var NAMED_TYPE = exports.NAMED_TYPE = 'NamedType';
var LIST_TYPE = exports.LIST_TYPE = 'ListType';
var NON_NULL_TYPE = exports.NON_NULL_TYPE = 'NonNullType';

// Type System Definitions

var SCHEMA_DEFINITION = exports.SCHEMA_DEFINITION = 'SchemaDefinition';
var OPERATION_TYPE_DEFINITION = exports.OPERATION_TYPE_DEFINITION = 'OperationTypeDefinition';

// Type Definitions

var SCALAR_TYPE_DEFINITION = exports.SCALAR_TYPE_DEFINITION = 'ScalarTypeDefinition';
var OBJECT_TYPE_DEFINITION = exports.OBJECT_TYPE_DEFINITION = 'ObjectTypeDefinition';
var FIELD_DEFINITION = exports.FIELD_DEFINITION = 'FieldDefinition';
var INPUT_VALUE_DEFINITION = exports.INPUT_VALUE_DEFINITION = 'InputValueDefinition';
var INTERFACE_TYPE_DEFINITION = exports.INTERFACE_TYPE_DEFINITION = 'InterfaceTypeDefinition';
var UNION_TYPE_DEFINITION = exports.UNION_TYPE_DEFINITION = 'UnionTypeDefinition';
var ENUM_TYPE_DEFINITION = exports.ENUM_TYPE_DEFINITION = 'EnumTypeDefinition';
var ENUM_VALUE_DEFINITION = exports.ENUM_VALUE_DEFINITION = 'EnumValueDefinition';
var INPUT_OBJECT_TYPE_DEFINITION = exports.INPUT_OBJECT_TYPE_DEFINITION = 'InputObjectTypeDefinition';

// Type Extensions

var SCALAR_TYPE_EXTENSION = exports.SCALAR_TYPE_EXTENSION = 'ScalarTypeExtension';
var OBJECT_TYPE_EXTENSION = exports.OBJECT_TYPE_EXTENSION = 'ObjectTypeExtension';
var INTERFACE_TYPE_EXTENSION = exports.INTERFACE_TYPE_EXTENSION = 'InterfaceTypeExtension';
var UNION_TYPE_EXTENSION = exports.UNION_TYPE_EXTENSION = 'UnionTypeExtension';
var ENUM_TYPE_EXTENSION = exports.ENUM_TYPE_EXTENSION = 'EnumTypeExtension';
var INPUT_OBJECT_TYPE_EXTENSION = exports.INPUT_OBJECT_TYPE_EXTENSION = 'InputObjectTypeExtension';

// Directive Definitions

var DIRECTIVE_DEFINITION = exports.DIRECTIVE_DEFINITION = 'DirectiveDefinition';
},{}],62:[function(require,module,exports) {
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * 
 */

/**
 * The set of allowed directive location values.
 */
var DirectiveLocation = exports.DirectiveLocation = {
  // Request Definitions
  QUERY: 'QUERY',
  MUTATION: 'MUTATION',
  SUBSCRIPTION: 'SUBSCRIPTION',
  FIELD: 'FIELD',
  FRAGMENT_DEFINITION: 'FRAGMENT_DEFINITION',
  FRAGMENT_SPREAD: 'FRAGMENT_SPREAD',
  INLINE_FRAGMENT: 'INLINE_FRAGMENT',
  // Type System Definitions
  SCHEMA: 'SCHEMA',
  SCALAR: 'SCALAR',
  OBJECT: 'OBJECT',
  FIELD_DEFINITION: 'FIELD_DEFINITION',
  ARGUMENT_DEFINITION: 'ARGUMENT_DEFINITION',
  INTERFACE: 'INTERFACE',
  UNION: 'UNION',
  ENUM: 'ENUM',
  ENUM_VALUE: 'ENUM_VALUE',
  INPUT_OBJECT: 'INPUT_OBJECT',
  INPUT_FIELD_DEFINITION: 'INPUT_FIELD_DEFINITION'
};

/**
 * The enum type representing the directive location values.
 */
},{}],58:[function(require,module,exports) {
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.parse = parse;
exports.parseValue = parseValue;
exports.parseType = parseType;
exports.parseConstValue = parseConstValue;
exports.parseTypeReference = parseTypeReference;
exports.parseNamedType = parseNamedType;

var _source = require('./source');

var _error = require('../error');

var _lexer = require('./lexer');

var _kinds = require('./kinds');

var _directiveLocation = require('./directiveLocation');

/**
 * Given a GraphQL source, parses it into a Document.
 * Throws GraphQLError if a syntax error is encountered.
 */


/**
 * Configuration options to control parser behavior
 */
function parse(source, options) {
  var sourceObj = typeof source === 'string' ? new _source.Source(source) : source;
  if (!(sourceObj instanceof _source.Source)) {
    throw new TypeError('Must provide Source. Received: ' + String(sourceObj));
  }
  var lexer = (0, _lexer.createLexer)(sourceObj, options || {});
  return parseDocument(lexer);
}

/**
 * Given a string containing a GraphQL value (ex. `[42]`), parse the AST for
 * that value.
 * Throws GraphQLError if a syntax error is encountered.
 *
 * This is useful within tools that operate upon GraphQL Values directly and
 * in isolation of complete GraphQL documents.
 *
 * Consider providing the results to the utility function: valueFromAST().
 */
/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * 
 */

function parseValue(source, options) {
  var sourceObj = typeof source === 'string' ? new _source.Source(source) : source;
  var lexer = (0, _lexer.createLexer)(sourceObj, options || {});
  expect(lexer, _lexer.TokenKind.SOF);
  var value = parseValueLiteral(lexer, false);
  expect(lexer, _lexer.TokenKind.EOF);
  return value;
}

/**
 * Given a string containing a GraphQL Type (ex. `[Int!]`), parse the AST for
 * that type.
 * Throws GraphQLError if a syntax error is encountered.
 *
 * This is useful within tools that operate upon GraphQL Types directly and
 * in isolation of complete GraphQL documents.
 *
 * Consider providing the results to the utility function: typeFromAST().
 */
function parseType(source, options) {
  var sourceObj = typeof source === 'string' ? new _source.Source(source) : source;
  var lexer = (0, _lexer.createLexer)(sourceObj, options || {});
  expect(lexer, _lexer.TokenKind.SOF);
  var type = parseTypeReference(lexer);
  expect(lexer, _lexer.TokenKind.EOF);
  return type;
}

/**
 * Converts a name lex token into a name parse node.
 */
function parseName(lexer) {
  var token = expect(lexer, _lexer.TokenKind.NAME);
  return {
    kind: _kinds.NAME,
    value: token.value,
    loc: loc(lexer, token)
  };
}

// Implements the parsing rules in the Document section.

/**
 * Document : Definition+
 */
function parseDocument(lexer) {
  var start = lexer.token;
  expect(lexer, _lexer.TokenKind.SOF);
  var definitions = [];
  do {
    definitions.push(parseDefinition(lexer));
  } while (!skip(lexer, _lexer.TokenKind.EOF));

  return {
    kind: _kinds.DOCUMENT,
    definitions: definitions,
    loc: loc(lexer, start)
  };
}

/**
 * Definition :
 *   - ExecutableDefinition
 *   - TypeSystemDefinition
 */
function parseDefinition(lexer) {
  if (peek(lexer, _lexer.TokenKind.NAME)) {
    switch (lexer.token.value) {
      case 'query':
      case 'mutation':
      case 'subscription':
      case 'fragment':
        return parseExecutableDefinition(lexer);
      case 'schema':
      case 'scalar':
      case 'type':
      case 'interface':
      case 'union':
      case 'enum':
      case 'input':
      case 'extend':
      case 'directive':
        // Note: The schema definition language is an experimental addition.
        return parseTypeSystemDefinition(lexer);
    }
  } else if (peek(lexer, _lexer.TokenKind.BRACE_L)) {
    return parseExecutableDefinition(lexer);
  } else if (peekDescription(lexer)) {
    // Note: The schema definition language is an experimental addition.
    return parseTypeSystemDefinition(lexer);
  }

  throw unexpected(lexer);
}

/**
 * ExecutableDefinition :
 *   - OperationDefinition
 *   - FragmentDefinition
 */
function parseExecutableDefinition(lexer) {
  if (peek(lexer, _lexer.TokenKind.NAME)) {
    switch (lexer.token.value) {
      case 'query':
      case 'mutation':
      case 'subscription':
        return parseOperationDefinition(lexer);

      case 'fragment':
        return parseFragmentDefinition(lexer);
    }
  } else if (peek(lexer, _lexer.TokenKind.BRACE_L)) {
    return parseOperationDefinition(lexer);
  }

  throw unexpected(lexer);
}

// Implements the parsing rules in the Operations section.

/**
 * OperationDefinition :
 *  - SelectionSet
 *  - OperationType Name? VariableDefinitions? Directives? SelectionSet
 */
function parseOperationDefinition(lexer) {
  var start = lexer.token;
  if (peek(lexer, _lexer.TokenKind.BRACE_L)) {
    return {
      kind: _kinds.OPERATION_DEFINITION,
      operation: 'query',
      name: undefined,
      variableDefinitions: [],
      directives: [],
      selectionSet: parseSelectionSet(lexer),
      loc: loc(lexer, start)
    };
  }
  var operation = parseOperationType(lexer);
  var name = void 0;
  if (peek(lexer, _lexer.TokenKind.NAME)) {
    name = parseName(lexer);
  }
  return {
    kind: _kinds.OPERATION_DEFINITION,
    operation: operation,
    name: name,
    variableDefinitions: parseVariableDefinitions(lexer),
    directives: parseDirectives(lexer, false),
    selectionSet: parseSelectionSet(lexer),
    loc: loc(lexer, start)
  };
}

/**
 * OperationType : one of query mutation subscription
 */
function parseOperationType(lexer) {
  var operationToken = expect(lexer, _lexer.TokenKind.NAME);
  switch (operationToken.value) {
    case 'query':
      return 'query';
    case 'mutation':
      return 'mutation';
    case 'subscription':
      return 'subscription';
  }

  throw unexpected(lexer, operationToken);
}

/**
 * VariableDefinitions : ( VariableDefinition+ )
 */
function parseVariableDefinitions(lexer) {
  return peek(lexer, _lexer.TokenKind.PAREN_L) ? many(lexer, _lexer.TokenKind.PAREN_L, parseVariableDefinition, _lexer.TokenKind.PAREN_R) : [];
}

/**
 * VariableDefinition : Variable : Type DefaultValue?
 */
function parseVariableDefinition(lexer) {
  var start = lexer.token;
  return {
    kind: _kinds.VARIABLE_DEFINITION,
    variable: parseVariable(lexer),
    type: (expect(lexer, _lexer.TokenKind.COLON), parseTypeReference(lexer)),
    defaultValue: skip(lexer, _lexer.TokenKind.EQUALS) ? parseValueLiteral(lexer, true) : undefined,
    loc: loc(lexer, start)
  };
}

/**
 * Variable : $ Name
 */
function parseVariable(lexer) {
  var start = lexer.token;
  expect(lexer, _lexer.TokenKind.DOLLAR);
  return {
    kind: _kinds.VARIABLE,
    name: parseName(lexer),
    loc: loc(lexer, start)
  };
}

/**
 * SelectionSet : { Selection+ }
 */
function parseSelectionSet(lexer) {
  var start = lexer.token;
  return {
    kind: _kinds.SELECTION_SET,
    selections: many(lexer, _lexer.TokenKind.BRACE_L, parseSelection, _lexer.TokenKind.BRACE_R),
    loc: loc(lexer, start)
  };
}

/**
 * Selection :
 *   - Field
 *   - FragmentSpread
 *   - InlineFragment
 */
function parseSelection(lexer) {
  return peek(lexer, _lexer.TokenKind.SPREAD) ? parseFragment(lexer) : parseField(lexer);
}

/**
 * Field : Alias? Name Arguments? Directives? SelectionSet?
 *
 * Alias : Name :
 */
function parseField(lexer) {
  var start = lexer.token;

  var nameOrAlias = parseName(lexer);
  var alias = void 0;
  var name = void 0;
  if (skip(lexer, _lexer.TokenKind.COLON)) {
    alias = nameOrAlias;
    name = parseName(lexer);
  } else {
    name = nameOrAlias;
  }

  return {
    kind: _kinds.FIELD,
    alias: alias,
    name: name,
    arguments: parseArguments(lexer, false),
    directives: parseDirectives(lexer, false),
    selectionSet: peek(lexer, _lexer.TokenKind.BRACE_L) ? parseSelectionSet(lexer) : undefined,
    loc: loc(lexer, start)
  };
}

/**
 * Arguments[Const] : ( Argument[?Const]+ )
 */
function parseArguments(lexer, isConst) {
  var item = isConst ? parseConstArgument : parseArgument;
  return peek(lexer, _lexer.TokenKind.PAREN_L) ? many(lexer, _lexer.TokenKind.PAREN_L, item, _lexer.TokenKind.PAREN_R) : [];
}

/**
 * Argument[Const] : Name : Value[?Const]
 */
function parseArgument(lexer) {
  var start = lexer.token;
  return {
    kind: _kinds.ARGUMENT,
    name: parseName(lexer),
    value: (expect(lexer, _lexer.TokenKind.COLON), parseValueLiteral(lexer, false)),
    loc: loc(lexer, start)
  };
}

function parseConstArgument(lexer) {
  var start = lexer.token;
  return {
    kind: _kinds.ARGUMENT,
    name: parseName(lexer),
    value: (expect(lexer, _lexer.TokenKind.COLON), parseConstValue(lexer)),
    loc: loc(lexer, start)
  };
}

// Implements the parsing rules in the Fragments section.

/**
 * Corresponds to both FragmentSpread and InlineFragment in the spec.
 *
 * FragmentSpread : ... FragmentName Directives?
 *
 * InlineFragment : ... TypeCondition? Directives? SelectionSet
 */
function parseFragment(lexer) {
  var start = lexer.token;
  expect(lexer, _lexer.TokenKind.SPREAD);
  if (peek(lexer, _lexer.TokenKind.NAME) && lexer.token.value !== 'on') {
    return {
      kind: _kinds.FRAGMENT_SPREAD,
      name: parseFragmentName(lexer),
      directives: parseDirectives(lexer, false),
      loc: loc(lexer, start)
    };
  }
  var typeCondition = void 0;
  if (lexer.token.value === 'on') {
    lexer.advance();
    typeCondition = parseNamedType(lexer);
  }
  return {
    kind: _kinds.INLINE_FRAGMENT,
    typeCondition: typeCondition,
    directives: parseDirectives(lexer, false),
    selectionSet: parseSelectionSet(lexer),
    loc: loc(lexer, start)
  };
}

/**
 * FragmentDefinition :
 *   - fragment FragmentName on TypeCondition Directives? SelectionSet
 *
 * TypeCondition : NamedType
 */
function parseFragmentDefinition(lexer) {
  var start = lexer.token;
  expectKeyword(lexer, 'fragment');
  // Experimental support for defining variables within fragments changes
  // the grammar of FragmentDefinition:
  //   - fragment FragmentName VariableDefinitions? on TypeCondition Directives? SelectionSet
  if (lexer.options.experimentalFragmentVariables) {
    return {
      kind: _kinds.FRAGMENT_DEFINITION,
      name: parseFragmentName(lexer),
      variableDefinitions: parseVariableDefinitions(lexer),
      typeCondition: (expectKeyword(lexer, 'on'), parseNamedType(lexer)),
      directives: parseDirectives(lexer, false),
      selectionSet: parseSelectionSet(lexer),
      loc: loc(lexer, start)
    };
  }
  return {
    kind: _kinds.FRAGMENT_DEFINITION,
    name: parseFragmentName(lexer),
    typeCondition: (expectKeyword(lexer, 'on'), parseNamedType(lexer)),
    directives: parseDirectives(lexer, false),
    selectionSet: parseSelectionSet(lexer),
    loc: loc(lexer, start)
  };
}

/**
 * FragmentName : Name but not `on`
 */
function parseFragmentName(lexer) {
  if (lexer.token.value === 'on') {
    throw unexpected(lexer);
  }
  return parseName(lexer);
}

// Implements the parsing rules in the Values section.

/**
 * Value[Const] :
 *   - [~Const] Variable
 *   - IntValue
 *   - FloatValue
 *   - StringValue
 *   - BooleanValue
 *   - NullValue
 *   - EnumValue
 *   - ListValue[?Const]
 *   - ObjectValue[?Const]
 *
 * BooleanValue : one of `true` `false`
 *
 * NullValue : `null`
 *
 * EnumValue : Name but not `true`, `false` or `null`
 */
function parseValueLiteral(lexer, isConst) {
  var token = lexer.token;
  switch (token.kind) {
    case _lexer.TokenKind.BRACKET_L:
      return parseList(lexer, isConst);
    case _lexer.TokenKind.BRACE_L:
      return parseObject(lexer, isConst);
    case _lexer.TokenKind.INT:
      lexer.advance();
      return {
        kind: _kinds.INT,
        value: token.value,
        loc: loc(lexer, token)
      };
    case _lexer.TokenKind.FLOAT:
      lexer.advance();
      return {
        kind: _kinds.FLOAT,
        value: token.value,
        loc: loc(lexer, token)
      };
    case _lexer.TokenKind.STRING:
    case _lexer.TokenKind.BLOCK_STRING:
      return parseStringLiteral(lexer);
    case _lexer.TokenKind.NAME:
      if (token.value === 'true' || token.value === 'false') {
        lexer.advance();
        return {
          kind: _kinds.BOOLEAN,
          value: token.value === 'true',
          loc: loc(lexer, token)
        };
      } else if (token.value === 'null') {
        lexer.advance();
        return {
          kind: _kinds.NULL,
          loc: loc(lexer, token)
        };
      }
      lexer.advance();
      return {
        kind: _kinds.ENUM,
        value: token.value,
        loc: loc(lexer, token)
      };
    case _lexer.TokenKind.DOLLAR:
      if (!isConst) {
        return parseVariable(lexer);
      }
      break;
  }
  throw unexpected(lexer);
}

function parseStringLiteral(lexer) {
  var token = lexer.token;
  lexer.advance();
  return {
    kind: _kinds.STRING,
    value: token.value,
    block: token.kind === _lexer.TokenKind.BLOCK_STRING,
    loc: loc(lexer, token)
  };
}

function parseConstValue(lexer) {
  return parseValueLiteral(lexer, true);
}

function parseValueValue(lexer) {
  return parseValueLiteral(lexer, false);
}

/**
 * ListValue[Const] :
 *   - [ ]
 *   - [ Value[?Const]+ ]
 */
function parseList(lexer, isConst) {
  var start = lexer.token;
  var item = isConst ? parseConstValue : parseValueValue;
  return {
    kind: _kinds.LIST,
    values: any(lexer, _lexer.TokenKind.BRACKET_L, item, _lexer.TokenKind.BRACKET_R),
    loc: loc(lexer, start)
  };
}

/**
 * ObjectValue[Const] :
 *   - { }
 *   - { ObjectField[?Const]+ }
 */
function parseObject(lexer, isConst) {
  var start = lexer.token;
  expect(lexer, _lexer.TokenKind.BRACE_L);
  var fields = [];
  while (!skip(lexer, _lexer.TokenKind.BRACE_R)) {
    fields.push(parseObjectField(lexer, isConst));
  }
  return {
    kind: _kinds.OBJECT,
    fields: fields,
    loc: loc(lexer, start)
  };
}

/**
 * ObjectField[Const] : Name : Value[?Const]
 */
function parseObjectField(lexer, isConst) {
  var start = lexer.token;
  return {
    kind: _kinds.OBJECT_FIELD,
    name: parseName(lexer),
    value: (expect(lexer, _lexer.TokenKind.COLON), parseValueLiteral(lexer, isConst)),
    loc: loc(lexer, start)
  };
}

// Implements the parsing rules in the Directives section.

/**
 * Directives[Const] : Directive[?Const]+
 */
function parseDirectives(lexer, isConst) {
  var directives = [];
  while (peek(lexer, _lexer.TokenKind.AT)) {
    directives.push(parseDirective(lexer, isConst));
  }
  return directives;
}

/**
 * Directive[Const] : @ Name Arguments[?Const]?
 */
function parseDirective(lexer, isConst) {
  var start = lexer.token;
  expect(lexer, _lexer.TokenKind.AT);
  return {
    kind: _kinds.DIRECTIVE,
    name: parseName(lexer),
    arguments: parseArguments(lexer, isConst),
    loc: loc(lexer, start)
  };
}

// Implements the parsing rules in the Types section.

/**
 * Type :
 *   - NamedType
 *   - ListType
 *   - NonNullType
 */
function parseTypeReference(lexer) {
  var start = lexer.token;
  var type = void 0;
  if (skip(lexer, _lexer.TokenKind.BRACKET_L)) {
    type = parseTypeReference(lexer);
    expect(lexer, _lexer.TokenKind.BRACKET_R);
    type = {
      kind: _kinds.LIST_TYPE,
      type: type,
      loc: loc(lexer, start)
    };
  } else {
    type = parseNamedType(lexer);
  }
  if (skip(lexer, _lexer.TokenKind.BANG)) {
    return {
      kind: _kinds.NON_NULL_TYPE,
      type: type,
      loc: loc(lexer, start)
    };
  }
  return type;
}

/**
 * NamedType : Name
 */
function parseNamedType(lexer) {
  var start = lexer.token;
  return {
    kind: _kinds.NAMED_TYPE,
    name: parseName(lexer),
    loc: loc(lexer, start)
  };
}

// Implements the parsing rules in the Type Definition section.

/**
 * TypeSystemDefinition :
 *   - SchemaDefinition
 *   - TypeDefinition
 *   - TypeExtension
 *   - DirectiveDefinition
 *
 * TypeDefinition :
 *   - ScalarTypeDefinition
 *   - ObjectTypeDefinition
 *   - InterfaceTypeDefinition
 *   - UnionTypeDefinition
 *   - EnumTypeDefinition
 *   - InputObjectTypeDefinition
 */
function parseTypeSystemDefinition(lexer) {
  // Many definitions begin with a description and require a lookahead.
  var keywordToken = peekDescription(lexer) ? lexer.lookahead() : lexer.token;

  if (keywordToken.kind === _lexer.TokenKind.NAME) {
    switch (keywordToken.value) {
      case 'schema':
        return parseSchemaDefinition(lexer);
      case 'scalar':
        return parseScalarTypeDefinition(lexer);
      case 'type':
        return parseObjectTypeDefinition(lexer);
      case 'interface':
        return parseInterfaceTypeDefinition(lexer);
      case 'union':
        return parseUnionTypeDefinition(lexer);
      case 'enum':
        return parseEnumTypeDefinition(lexer);
      case 'input':
        return parseInputObjectTypeDefinition(lexer);
      case 'extend':
        return parseTypeExtension(lexer);
      case 'directive':
        return parseDirectiveDefinition(lexer);
    }
  }

  throw unexpected(lexer, keywordToken);
}

function peekDescription(lexer) {
  return peek(lexer, _lexer.TokenKind.STRING) || peek(lexer, _lexer.TokenKind.BLOCK_STRING);
}

/**
 * Description : StringValue
 */
function parseDescription(lexer) {
  if (peekDescription(lexer)) {
    return parseStringLiteral(lexer);
  }
}

/**
 * SchemaDefinition : schema Directives[Const]? { OperationTypeDefinition+ }
 */
function parseSchemaDefinition(lexer) {
  var start = lexer.token;
  expectKeyword(lexer, 'schema');
  var directives = parseDirectives(lexer, true);
  var operationTypes = many(lexer, _lexer.TokenKind.BRACE_L, parseOperationTypeDefinition, _lexer.TokenKind.BRACE_R);
  return {
    kind: _kinds.SCHEMA_DEFINITION,
    directives: directives,
    operationTypes: operationTypes,
    loc: loc(lexer, start)
  };
}

/**
 * OperationTypeDefinition : OperationType : NamedType
 */
function parseOperationTypeDefinition(lexer) {
  var start = lexer.token;
  var operation = parseOperationType(lexer);
  expect(lexer, _lexer.TokenKind.COLON);
  var type = parseNamedType(lexer);
  return {
    kind: _kinds.OPERATION_TYPE_DEFINITION,
    operation: operation,
    type: type,
    loc: loc(lexer, start)
  };
}

/**
 * ScalarTypeDefinition : Description? scalar Name Directives[Const]?
 */
function parseScalarTypeDefinition(lexer) {
  var start = lexer.token;
  var description = parseDescription(lexer);
  expectKeyword(lexer, 'scalar');
  var name = parseName(lexer);
  var directives = parseDirectives(lexer, true);
  return {
    kind: _kinds.SCALAR_TYPE_DEFINITION,
    description: description,
    name: name,
    directives: directives,
    loc: loc(lexer, start)
  };
}

/**
 * ObjectTypeDefinition :
 *   Description?
 *   type Name ImplementsInterfaces? Directives[Const]? FieldsDefinition?
 */
function parseObjectTypeDefinition(lexer) {
  var start = lexer.token;
  var description = parseDescription(lexer);
  expectKeyword(lexer, 'type');
  var name = parseName(lexer);
  var interfaces = parseImplementsInterfaces(lexer);
  var directives = parseDirectives(lexer, true);
  var fields = parseFieldsDefinition(lexer);
  return {
    kind: _kinds.OBJECT_TYPE_DEFINITION,
    description: description,
    name: name,
    interfaces: interfaces,
    directives: directives,
    fields: fields,
    loc: loc(lexer, start)
  };
}

/**
 * ImplementsInterfaces : implements NamedType+
 */
function parseImplementsInterfaces(lexer) {
  var types = [];
  if (lexer.token.value === 'implements') {
    lexer.advance();
    do {
      types.push(parseNamedType(lexer));
    } while (peek(lexer, _lexer.TokenKind.NAME));
  }
  return types;
}

/**
 * FieldsDefinition : { FieldDefinition+ }
 */
function parseFieldsDefinition(lexer) {
  return peek(lexer, _lexer.TokenKind.BRACE_L) ? many(lexer, _lexer.TokenKind.BRACE_L, parseFieldDefinition, _lexer.TokenKind.BRACE_R) : [];
}

/**
 * FieldDefinition :
 *   - Description? Name ArgumentsDefinition? : Type Directives[Const]?
 */
function parseFieldDefinition(lexer) {
  var start = lexer.token;
  var description = parseDescription(lexer);
  var name = parseName(lexer);
  var args = parseArgumentDefs(lexer);
  expect(lexer, _lexer.TokenKind.COLON);
  var type = parseTypeReference(lexer);
  var directives = parseDirectives(lexer, true);
  return {
    kind: _kinds.FIELD_DEFINITION,
    description: description,
    name: name,
    arguments: args,
    type: type,
    directives: directives,
    loc: loc(lexer, start)
  };
}

/**
 * ArgumentsDefinition : ( InputValueDefinition+ )
 */
function parseArgumentDefs(lexer) {
  if (!peek(lexer, _lexer.TokenKind.PAREN_L)) {
    return [];
  }
  return many(lexer, _lexer.TokenKind.PAREN_L, parseInputValueDef, _lexer.TokenKind.PAREN_R);
}

/**
 * InputValueDefinition :
 *   - Description? Name : Type DefaultValue? Directives[Const]?
 */
function parseInputValueDef(lexer) {
  var start = lexer.token;
  var description = parseDescription(lexer);
  var name = parseName(lexer);
  expect(lexer, _lexer.TokenKind.COLON);
  var type = parseTypeReference(lexer);
  var defaultValue = void 0;
  if (skip(lexer, _lexer.TokenKind.EQUALS)) {
    defaultValue = parseConstValue(lexer);
  }
  var directives = parseDirectives(lexer, true);
  return {
    kind: _kinds.INPUT_VALUE_DEFINITION,
    description: description,
    name: name,
    type: type,
    defaultValue: defaultValue,
    directives: directives,
    loc: loc(lexer, start)
  };
}

/**
 * InterfaceTypeDefinition :
 *   - Description? interface Name Directives[Const]? FieldsDefinition?
 */
function parseInterfaceTypeDefinition(lexer) {
  var start = lexer.token;
  var description = parseDescription(lexer);
  expectKeyword(lexer, 'interface');
  var name = parseName(lexer);
  var directives = parseDirectives(lexer, true);
  var fields = parseFieldsDefinition(lexer);
  return {
    kind: _kinds.INTERFACE_TYPE_DEFINITION,
    description: description,
    name: name,
    directives: directives,
    fields: fields,
    loc: loc(lexer, start)
  };
}

/**
 * UnionTypeDefinition :
 *   - Description? union Name Directives[Const]? MemberTypesDefinition?
 */
function parseUnionTypeDefinition(lexer) {
  var start = lexer.token;
  var description = parseDescription(lexer);
  expectKeyword(lexer, 'union');
  var name = parseName(lexer);
  var directives = parseDirectives(lexer, true);
  var types = parseMemberTypesDefinition(lexer);
  return {
    kind: _kinds.UNION_TYPE_DEFINITION,
    description: description,
    name: name,
    directives: directives,
    types: types,
    loc: loc(lexer, start)
  };
}

/**
 * MemberTypesDefinition : = MemberTypes
 *
 * MemberTypes :
 *   - `|`? NamedType
 *   - MemberTypes | NamedType
 */
function parseMemberTypesDefinition(lexer) {
  var types = [];
  if (skip(lexer, _lexer.TokenKind.EQUALS)) {
    // Optional leading pipe
    skip(lexer, _lexer.TokenKind.PIPE);
    do {
      types.push(parseNamedType(lexer));
    } while (skip(lexer, _lexer.TokenKind.PIPE));
  }
  return types;
}

/**
 * EnumTypeDefinition :
 *   - Description? enum Name Directives[Const]? EnumValuesDefinition?
 */
function parseEnumTypeDefinition(lexer) {
  var start = lexer.token;
  var description = parseDescription(lexer);
  expectKeyword(lexer, 'enum');
  var name = parseName(lexer);
  var directives = parseDirectives(lexer, true);
  var values = parseEnumValuesDefinition(lexer);
  return {
    kind: _kinds.ENUM_TYPE_DEFINITION,
    description: description,
    name: name,
    directives: directives,
    values: values,
    loc: loc(lexer, start)
  };
}

/**
 * EnumValuesDefinition : { EnumValueDefinition+ }
 */
function parseEnumValuesDefinition(lexer) {
  return peek(lexer, _lexer.TokenKind.BRACE_L) ? many(lexer, _lexer.TokenKind.BRACE_L, parseEnumValueDefinition, _lexer.TokenKind.BRACE_R) : [];
}

/**
 * EnumValueDefinition : Description? EnumValue Directives[Const]?
 *
 * EnumValue : Name
 */
function parseEnumValueDefinition(lexer) {
  var start = lexer.token;
  var description = parseDescription(lexer);
  var name = parseName(lexer);
  var directives = parseDirectives(lexer, true);
  return {
    kind: _kinds.ENUM_VALUE_DEFINITION,
    description: description,
    name: name,
    directives: directives,
    loc: loc(lexer, start)
  };
}

/**
 * InputObjectTypeDefinition :
 *   - Description? input Name Directives[Const]? InputFieldsDefinition?
 */
function parseInputObjectTypeDefinition(lexer) {
  var start = lexer.token;
  var description = parseDescription(lexer);
  expectKeyword(lexer, 'input');
  var name = parseName(lexer);
  var directives = parseDirectives(lexer, true);
  var fields = parseInputFieldsDefinition(lexer);
  return {
    kind: _kinds.INPUT_OBJECT_TYPE_DEFINITION,
    description: description,
    name: name,
    directives: directives,
    fields: fields,
    loc: loc(lexer, start)
  };
}

/**
 * InputFieldsDefinition : { InputValueDefinition+ }
 */
function parseInputFieldsDefinition(lexer) {
  return peek(lexer, _lexer.TokenKind.BRACE_L) ? many(lexer, _lexer.TokenKind.BRACE_L, parseInputValueDef, _lexer.TokenKind.BRACE_R) : [];
}

/**
 * TypeExtension :
 *   - ScalarTypeExtension
 *   - ObjectTypeExtension
 *   - InterfaceTypeExtension
 *   - UnionTypeExtension
 *   - EnumTypeExtension
 *   - InputObjectTypeDefinition
 */
function parseTypeExtension(lexer) {
  var keywordToken = lexer.lookahead();

  if (keywordToken.kind === _lexer.TokenKind.NAME) {
    switch (keywordToken.value) {
      case 'scalar':
        return parseScalarTypeExtension(lexer);
      case 'type':
        return parseObjectTypeExtension(lexer);
      case 'interface':
        return parseInterfaceTypeExtension(lexer);
      case 'union':
        return parseUnionTypeExtension(lexer);
      case 'enum':
        return parseEnumTypeExtension(lexer);
      case 'input':
        return parseInputObjectTypeExtension(lexer);
    }
  }

  throw unexpected(lexer, keywordToken);
}

/**
 * ScalarTypeExtension :
 *   - extend scalar Name Directives[Const]
 */
function parseScalarTypeExtension(lexer) {
  var start = lexer.token;
  expectKeyword(lexer, 'extend');
  expectKeyword(lexer, 'scalar');
  var name = parseName(lexer);
  var directives = parseDirectives(lexer, true);
  if (directives.length === 0) {
    throw unexpected(lexer);
  }
  return {
    kind: _kinds.SCALAR_TYPE_EXTENSION,
    name: name,
    directives: directives,
    loc: loc(lexer, start)
  };
}

/**
 * ObjectTypeExtension :
 *  - extend type Name ImplementsInterfaces? Directives[Const]? FieldsDefinition
 *  - extend type Name ImplementsInterfaces? Directives[Const]
 *  - extend type Name ImplementsInterfaces
 */
function parseObjectTypeExtension(lexer) {
  var start = lexer.token;
  expectKeyword(lexer, 'extend');
  expectKeyword(lexer, 'type');
  var name = parseName(lexer);
  var interfaces = parseImplementsInterfaces(lexer);
  var directives = parseDirectives(lexer, true);
  var fields = parseFieldsDefinition(lexer);
  if (interfaces.length === 0 && directives.length === 0 && fields.length === 0) {
    throw unexpected(lexer);
  }
  return {
    kind: _kinds.OBJECT_TYPE_EXTENSION,
    name: name,
    interfaces: interfaces,
    directives: directives,
    fields: fields,
    loc: loc(lexer, start)
  };
}

/**
 * InterfaceTypeExtension :
 *   - extend interface Name Directives[Const]? FieldsDefinition
 *   - extend interface Name Directives[Const]
 */
function parseInterfaceTypeExtension(lexer) {
  var start = lexer.token;
  expectKeyword(lexer, 'extend');
  expectKeyword(lexer, 'interface');
  var name = parseName(lexer);
  var directives = parseDirectives(lexer, true);
  var fields = parseFieldsDefinition(lexer);
  if (directives.length === 0 && fields.length === 0) {
    throw unexpected(lexer);
  }
  return {
    kind: _kinds.INTERFACE_TYPE_EXTENSION,
    name: name,
    directives: directives,
    fields: fields,
    loc: loc(lexer, start)
  };
}

/**
 * UnionTypeExtension :
 *   - extend union Name Directives[Const]? MemberTypesDefinition
 *   - extend union Name Directives[Const]
 */
function parseUnionTypeExtension(lexer) {
  var start = lexer.token;
  expectKeyword(lexer, 'extend');
  expectKeyword(lexer, 'union');
  var name = parseName(lexer);
  var directives = parseDirectives(lexer, true);
  var types = parseMemberTypesDefinition(lexer);
  if (directives.length === 0 && types.length === 0) {
    throw unexpected(lexer);
  }
  return {
    kind: _kinds.UNION_TYPE_EXTENSION,
    name: name,
    directives: directives,
    types: types,
    loc: loc(lexer, start)
  };
}

/**
 * EnumTypeExtension :
 *   - extend enum Name Directives[Const]? EnumValuesDefinition
 *   - extend enum Name Directives[Const]
 */
function parseEnumTypeExtension(lexer) {
  var start = lexer.token;
  expectKeyword(lexer, 'extend');
  expectKeyword(lexer, 'enum');
  var name = parseName(lexer);
  var directives = parseDirectives(lexer, true);
  var values = parseEnumValuesDefinition(lexer);
  if (directives.length === 0 && values.length === 0) {
    throw unexpected(lexer);
  }
  return {
    kind: _kinds.ENUM_TYPE_EXTENSION,
    name: name,
    directives: directives,
    values: values,
    loc: loc(lexer, start)
  };
}

/**
 * InputObjectTypeExtension :
 *   - extend input Name Directives[Const]? InputFieldsDefinition
 *   - extend input Name Directives[Const]
 */
function parseInputObjectTypeExtension(lexer) {
  var start = lexer.token;
  expectKeyword(lexer, 'extend');
  expectKeyword(lexer, 'input');
  var name = parseName(lexer);
  var directives = parseDirectives(lexer, true);
  var fields = parseInputFieldsDefinition(lexer);
  if (directives.length === 0 && fields.length === 0) {
    throw unexpected(lexer);
  }
  return {
    kind: _kinds.INPUT_OBJECT_TYPE_EXTENSION,
    name: name,
    directives: directives,
    fields: fields,
    loc: loc(lexer, start)
  };
}

/**
 * DirectiveDefinition :
 *   - Description? directive @ Name ArgumentsDefinition? on DirectiveLocations
 */
function parseDirectiveDefinition(lexer) {
  var start = lexer.token;
  var description = parseDescription(lexer);
  expectKeyword(lexer, 'directive');
  expect(lexer, _lexer.TokenKind.AT);
  var name = parseName(lexer);
  var args = parseArgumentDefs(lexer);
  expectKeyword(lexer, 'on');
  var locations = parseDirectiveLocations(lexer);
  return {
    kind: _kinds.DIRECTIVE_DEFINITION,
    description: description,
    name: name,
    arguments: args,
    locations: locations,
    loc: loc(lexer, start)
  };
}

/**
 * DirectiveLocations :
 *   - `|`? DirectiveLocation
 *   - DirectiveLocations | DirectiveLocation
 */
function parseDirectiveLocations(lexer) {
  // Optional leading pipe
  skip(lexer, _lexer.TokenKind.PIPE);
  var locations = [];
  do {
    locations.push(parseDirectiveLocation(lexer));
  } while (skip(lexer, _lexer.TokenKind.PIPE));
  return locations;
}

/*
 * DirectiveLocation :
 *   - ExecutableDirectiveLocation
 *   - TypeSystemDirectiveLocation
 *
 * ExecutableDirectiveLocation : one of
 *   `QUERY`
 *   `MUTATION`
 *   `SUBSCRIPTION`
 *   `FIELD`
 *   `FRAGMENT_DEFINITION`
 *   `FRAGMENT_SPREAD`
 *   `INLINE_FRAGMENT`
 *
 * TypeSystemDirectiveLocation : one of
 *   `SCHEMA`
 *   `SCALAR`
 *   `OBJECT`
 *   `FIELD_DEFINITION`
 *   `ARGUMENT_DEFINITION`
 *   `INTERFACE`
 *   `UNION`
 *   `ENUM`
 *   `ENUM_VALUE`
 *   `INPUT_OBJECT`
 *   `INPUT_FIELD_DEFINITION`
 */
function parseDirectiveLocation(lexer) {
  var start = lexer.token;
  var name = parseName(lexer);
  if (_directiveLocation.DirectiveLocation.hasOwnProperty(name.value)) {
    return name;
  }
  throw unexpected(lexer, start);
}

// Core parsing utility functions

/**
 * Returns a location object, used to identify the place in
 * the source that created a given parsed object.
 */
function loc(lexer, startToken) {
  if (!lexer.options.noLocation) {
    return new Loc(startToken, lexer.lastToken, lexer.source);
  }
}

function Loc(startToken, endToken, source) {
  this.start = startToken.start;
  this.end = endToken.end;
  this.startToken = startToken;
  this.endToken = endToken;
  this.source = source;
}

// Print a simplified form when appearing in JSON/util.inspect.
Loc.prototype.toJSON = Loc.prototype.inspect = function toJSON() {
  return { start: this.start, end: this.end };
};

/**
 * Determines if the next token is of a given kind
 */
function peek(lexer, kind) {
  return lexer.token.kind === kind;
}

/**
 * If the next token is of the given kind, return true after advancing
 * the lexer. Otherwise, do not change the parser state and return false.
 */
function skip(lexer, kind) {
  var match = lexer.token.kind === kind;
  if (match) {
    lexer.advance();
  }
  return match;
}

/**
 * If the next token is of the given kind, return that token after advancing
 * the lexer. Otherwise, do not change the parser state and throw an error.
 */
function expect(lexer, kind) {
  var token = lexer.token;
  if (token.kind === kind) {
    lexer.advance();
    return token;
  }
  throw (0, _error.syntaxError)(lexer.source, token.start, 'Expected ' + kind + ', found ' + (0, _lexer.getTokenDesc)(token));
}

/**
 * If the next token is a keyword with the given value, return that token after
 * advancing the lexer. Otherwise, do not change the parser state and return
 * false.
 */
function expectKeyword(lexer, value) {
  var token = lexer.token;
  if (token.kind === _lexer.TokenKind.NAME && token.value === value) {
    lexer.advance();
    return token;
  }
  throw (0, _error.syntaxError)(lexer.source, token.start, 'Expected "' + value + '", found ' + (0, _lexer.getTokenDesc)(token));
}

/**
 * Helper function for creating an error when an unexpected lexed token
 * is encountered.
 */
function unexpected(lexer, atToken) {
  var token = atToken || lexer.token;
  return (0, _error.syntaxError)(lexer.source, token.start, 'Unexpected ' + (0, _lexer.getTokenDesc)(token));
}

/**
 * Returns a possibly empty list of parse nodes, determined by
 * the parseFn. This list begins with a lex token of openKind
 * and ends with a lex token of closeKind. Advances the parser
 * to the next lex token after the closing token.
 */
function any(lexer, openKind, parseFn, closeKind) {
  expect(lexer, openKind);
  var nodes = [];
  while (!skip(lexer, closeKind)) {
    nodes.push(parseFn(lexer));
  }
  return nodes;
}

/**
 * Returns a non-empty list of parse nodes, determined by
 * the parseFn. This list begins with a lex token of openKind
 * and ends with a lex token of closeKind. Advances the parser
 * to the next lex token after the closing token.
 */
function many(lexer, openKind, parseFn, closeKind) {
  expect(lexer, openKind);
  var nodes = [parseFn(lexer)];
  while (!skip(lexer, closeKind)) {
    nodes.push(parseFn(lexer));
  }
  return nodes;
}
},{"./source":59,"../error":65,"./lexer":60,"./kinds":61,"./directiveLocation":62}],6:[function(require,module,exports) {
var parser = require('graphql/language/parser');

var parse = parser.parse;

// Strip insignificant whitespace
// Note that this could do a lot more, such as reorder fields etc.
function normalize(string) {
  return string.replace(/[\s,]+/g, ' ').trim();
}

// A map docString -> graphql document
var docCache = {};

// A map fragmentName -> [normalized source]
var fragmentSourceMap = {};

function cacheKeyFromLoc(loc) {
  return normalize(loc.source.body.substring(loc.start, loc.end));
}

// For testing.
function resetCaches() {
  docCache = {};
  fragmentSourceMap = {};
}

// Take a unstripped parsed document (query/mutation or even fragment), and
// check all fragment definitions, checking for name->source uniqueness.
// We also want to make sure only unique fragments exist in the document.
var printFragmentWarnings = true;
function processFragments(ast) {
  var astFragmentMap = {};
  var definitions = [];

  for (var i = 0; i < ast.definitions.length; i++) {
    var fragmentDefinition = ast.definitions[i];

    if (fragmentDefinition.kind === 'FragmentDefinition') {
      var fragmentName = fragmentDefinition.name.value;
      var sourceKey = cacheKeyFromLoc(fragmentDefinition.loc);

      // We know something about this fragment
      if (fragmentSourceMap.hasOwnProperty(fragmentName) && !fragmentSourceMap[fragmentName][sourceKey]) {

        // this is a problem because the app developer is trying to register another fragment with
        // the same name as one previously registered. So, we tell them about it.
        if (printFragmentWarnings) {
          console.warn("Warning: fragment with name " + fragmentName + " already exists.\n"
            + "graphql-tag enforces all fragment names across your application to be unique; read more about\n"
            + "this in the docs: http://dev.apollodata.com/core/fragments.html#unique-names");
        }

        fragmentSourceMap[fragmentName][sourceKey] = true;

      } else if (!fragmentSourceMap.hasOwnProperty(fragmentName)) {
        fragmentSourceMap[fragmentName] = {};
        fragmentSourceMap[fragmentName][sourceKey] = true;
      }

      if (!astFragmentMap[sourceKey]) {
        astFragmentMap[sourceKey] = true;
        definitions.push(fragmentDefinition);
      }
    } else {
      definitions.push(fragmentDefinition);
    }
  }

  ast.definitions = definitions;
  return ast;
}

function disableFragmentWarnings() {
  printFragmentWarnings = false;
}

function stripLoc(doc, removeLocAtThisLevel) {
  var docType = Object.prototype.toString.call(doc);

  if (docType === '[object Array]') {
    return doc.map(function (d) {
      return stripLoc(d, removeLocAtThisLevel);
    });
  }

  if (docType !== '[object Object]') {
    throw new Error('Unexpected input.');
  }

  // We don't want to remove the root loc field so we can use it
  // for fragment substitution (see below)
  if (removeLocAtThisLevel && doc.loc) {
    delete doc.loc;
  }

  // https://github.com/apollographql/graphql-tag/issues/40
  if (doc.loc) {
    delete doc.loc.startToken;
    delete doc.loc.endToken;
  }

  var keys = Object.keys(doc);
  var key;
  var value;
  var valueType;

  for (key in keys) {
    if (keys.hasOwnProperty(key)) {
      value = doc[keys[key]];
      valueType = Object.prototype.toString.call(value);

      if (valueType === '[object Object]' || valueType === '[object Array]') {
        doc[keys[key]] = stripLoc(value, true);
      }
    }
  }

  return doc;
}

function parseDocument(doc) {
  var cacheKey = normalize(doc);

  if (docCache[cacheKey]) {
    return docCache[cacheKey];
  }

  var parsed = parse(doc);
  if (!parsed || parsed.kind !== 'Document') {
    throw new Error('Not a valid GraphQL document.');
  }

  // check that all "new" fragments inside the documents are consistent with
  // existing fragments of the same name
  parsed = processFragments(parsed);
  parsed = stripLoc(parsed, false);
  docCache[cacheKey] = parsed;

  return parsed;
}

// XXX This should eventually disallow arbitrary string interpolation, like Relay does
function gql(/* arguments */) {
  var args = Array.prototype.slice.call(arguments);

  var literals = args[0];

  // We always get literals[0] and then matching post literals for each arg given
  var result = (typeof(literals) === "string") ? literals : literals[0];

  for (var i = 1; i < args.length; i++) {
    if (args[i] && args[i].kind && args[i].kind === 'Document') {
      result += args[i].loc.source.body;
    } else {
      result += args[i];
    }

    result += literals[i];
  }

  return parseDocument(result);
}

// Support typescript, which isn't as nice as Babel about default exports
gql.default = gql;
gql.resetCaches = resetCaches;
gql.disableFragmentWarnings = disableFragmentWarnings;

module.exports = gql;

},{"graphql/language/parser":58}],2:[function(require,module,exports) {
"use strict";

var _apolloClient = require("apollo-client");

var _apolloLinkHttp = require("apollo-link-http");

var _apolloCacheInmemory = require("apollo-cache-inmemory");

var _graphqlTag = require("graphql-tag");

var _graphqlTag2 = _interopRequireDefault(_graphqlTag);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// const { ApolloProvider } = ('react-apollo'
const client = new _apolloClient.ApolloClient({
  link: new _apolloLinkHttp.HttpLink({ uri: 'http://localhost:3000/graphql' }),
  cache: new _apolloCacheInmemory.InMemoryCache()
});
// const ReactDOM = ('react-dom'


const main = async () => {
  console.log('hi');
  const res = await client.query({ query: _graphqlTag2.default`{ hello { world } }` });
  console.log('hi', res.data.hello.world);
};

main();

// const fragments = gql`{
//     a
//     b
//     c
//     ...bar
//   }
// `

// ReactDOM.render(
//   <ApolloProvider client={client}>
//     <div>Hello World</div>
//   </ApolloProvider>,
//   document.getElementById('root')
// )
},{"apollo-client":3,"apollo-link-http":4,"apollo-cache-inmemory":5,"graphql-tag":6}],0:[function(require,module,exports) {
var global = (1, eval)('this');
var OldModule = module.bundle.Module;
function Module() {
  OldModule.call(this);
  this.hot = {
    accept: function (fn) {
      this._acceptCallback = fn || function () {};
    },
    dispose: function (fn) {
      this._disposeCallback = fn;
    }
  };
}

module.bundle.Module = Module;

if (!module.bundle.parent && typeof WebSocket !== 'undefined') {
  var ws = new WebSocket('ws://localhost:58153/');
  ws.onmessage = function(event) {
    var data = JSON.parse(event.data);

    if (data.type === 'update') {
      data.assets.forEach(function (asset) {
        hmrApply(global.require, asset);
      });

      data.assets.forEach(function (asset) {
        if (!asset.isNew) {
          hmrAccept(global.require, asset.id);
        }
      });
    }

    if (data.type === 'reload') {
      ws.close();
      ws.onclose = function () {
        window.location.reload();
      }
    }

    if (data.type === 'error-resolved') {
      console.log('[parcel] ✨ Error resolved');
    }

    if (data.type === 'error') {
      console.error('[parcel] 🚨  ' + data.error.message + '\n' + 'data.error.stack');
    }
  };
}

function getParents(bundle, id) {
  var modules = bundle.modules;
  if (!modules) {
    return [];
  }

  var parents = [];
  var k, d, dep;

  for (k in modules) {
    for (d in modules[k][1]) {
      dep = modules[k][1][d];
      if (dep === id || (Array.isArray(dep) && dep[dep.length - 1] === id)) {
        parents.push(+k);
      }
    }
  }

  if (bundle.parent) {
    parents = parents.concat(getParents(bundle.parent, id));
  }

  return parents;
}

function hmrApply(bundle, asset) {
  var modules = bundle.modules;
  if (!modules) {
    return;
  }

  if (modules[asset.id] || !bundle.parent) {
    var fn = new Function('require', 'module', 'exports', asset.generated.js);
    asset.isNew = !modules[asset.id];
    modules[asset.id] = [fn, asset.deps];
  } else if (bundle.parent) {
    hmrApply(bundle.parent, asset);
  }
}

function hmrAccept(bundle, id) {
  var modules = bundle.modules;
  if (!modules) {
    return;
  }

  if (!modules[id] && bundle.parent) {
    return hmrAccept(bundle.parent, id);
  }

  var cached = bundle.cache[id];
  if (cached && cached.hot._disposeCallback) {
    cached.hot._disposeCallback();
  }

  delete bundle.cache[id];
  bundle(id);

  cached = bundle.cache[id];
  if (cached && cached.hot && cached.hot._acceptCallback) {
    cached.hot._acceptCallback();
    return true;
  }

  return getParents(global.require, id).some(function (id) {
    return hmrAccept(global.require, id)
  });
}
},{}]},{},[0,2])