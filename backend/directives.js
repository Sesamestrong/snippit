module.exports = new Promise(async (resolve, reject) => {
  const {
    models: {
      User,
      Snip,
      UserRole
    },
  } = await require("./mongoose.js");
  const {
    GraphQLObjectType,
    GraphQLList,
    GraphQLNonNull,
    defaultFieldResolver
  } = require("graphql");
  const {
    SchemaDirectiveVisitor
  } = require("apollo-server-express");

  const authenticated = (bool = true) => next => (root, args, context, info) => {
    if ((!!(context._id)) == bool)
      return next(root, args, context, info);
    throw bool ? "Not authenticated." : "Already authenticated.";
  };
  class AuthenticatedDirective extends SchemaDirectiveVisitor {
    visitFieldDefinition(field) {
      const {
        resolve = defaultFieldResolver
      } = field;
      const {
        isAuth = true
      } = this.args;
      field.resolve = authenticated(isAuth)((...args) => resolve.call(this, ...args));
    }
  }

  const role = role => next => async (root, args, context, info) => {
    //console.log("Looking for role", role);
    if (root.constructor.modelName !== "Snip") throw "Roles exist only for snips!";
    if (await root.userHasRole({
        role,
        _id: context._id
      }))
      return await next(root, args, context, info);
    throw `User does not have role ${role}.`;
  };

  class RoleDirective extends SchemaDirectiveVisitor {
    visitFieldDefinition(field) {
      const {
        resolve = defaultFieldResolver
      } = field;
      const {
        role: roleName
      } = this.args;
      field.resolve = role(roleName)((...args) => resolve.call(this, ...args));
    }
  }

  const docTypeToModel = {
    USER: User,
    SNIP: Snip,
    USER_ROLE: UserRole,
  };

  const isObj = (type, className = GraphQLObjectType) => (type instanceof className ? type : undefined) || ((type instanceof GraphQLNonNull) && (type.ofType instanceof className) ? type.ofType : undefined); //Works for Type, Type! and returns Type
  const isObjList = type => ((list => list && isObj(list.ofType))(isObj(type, GraphQLList))); //Works for [Type],![Type],[Type!],[Type!]! and returns Type

  const idToDoc = (idName, model, doList) => async (root) => doList ? await Promise.all(root[idName].map(async idName => await model.findById(idName))) : await model.findById(root[idName]);

  class IdToDocDirective extends SchemaDirectiveVisitor {
    visitFieldDefinition(field) {
      const {
        type
      } = field;
      const {
        idName,
        docType,
      } = this.args;
      const model = docTypeToModel[docType];

      const isObj = (type, className = GraphQLObjectType) => (type instanceof className ? type : undefined) || ((type instanceof GraphQLNonNull) && (type.ofType instanceof className) ? type.ofType : undefined); //Works for Type, Type! and returns Type
      const isObjList = type => ((list => list && isObj(list.ofType))(isObj(type, GraphQLList))); //Works for [Type],![Type],[Type!],[Type!]! and returns Type

      const isThisList = isObjList(type);
      if (!(isObj(type) || isThisList))
        throw "Invalid type; return type must be GraphQLNonNull (optional) wrapping either GraphQLObjectType or GraphQLList holding GraphQLObjectType.";
      field.resolve = idToDoc(idName, model, isThisList);
    }
  }

  resolve({
    IdToDocDirective,
    idToDoc,
    AuthenticatedDirective,
    authenticated,
    RoleDirective,
    role,
  });

});
