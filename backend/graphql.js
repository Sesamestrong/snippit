module.exports = new Promise(async (resolve, reject) => {
  const mongoose = require("mongoose");
  const {
    ApolloServer,
    gql,
    SchemaDirectiveVisitor,
  } = require("apollo-server-express");
    const jwt = require("jsonwebtoken");

  const ObjectId = mongoose.Types.ObjectId;
  ObjectId.prototype.valueOf = function() {
    return this.toString();
  };

  //Import models
  const {
    models: {
      User,
      Snip,
      UserRole
    },
    privateKey
  } = await require("./mongoose.js");

  const {
    IdToDocDirective,
    idToDoc,
    AuthenticatedDirective,
    authenticated,
    RoleDirective,
    role,
  }=await require("./directives.js");

  //TODO Fix bug that means that snips query doesn't show public snips to non-editors
  const typeDefs = gql `
directive @role(role:Role) on FIELD_DEFINITION
directive @authenticated(isAuth:Boolean) on FIELD_DEFINITION
directive @idToDoc(idName:String!,docType:Type!) on FIELD_DEFINITION

type Query {
  me: User
  user(username: String!): User
  validate(username: String!, password: String!): String
  snip(id: String!): Snip
  snips(query: SnipQuery!): [Snip]!
}

type Mutation{
  newUser(username: String!, password: String!): String @authenticated(isAuth:false)
  newSnip(name: String!, public:Boolean!): Snip @authenticated(isAuth:true)
  setUserRole(snipId:String!,username:String!,role:Role): UserRole @authenticated(isAuth:true)
  updateSnip(snipId:String!,query:SnipQuery!): Snip! @authenticated(isAuth:true)
  deleteSnip(snipId:String!): String! @authenticated(isAuth:true)
}

type User {
  username: String!
  snips: [Snip]! @idToDoc(idName:"snipIds",docType:SNIP)
}

enum Role {
  OWNER
  EDITOR
  READER
}

type UserRole {
  user:User! @idToDoc(idName:"userId",docType:USER)
  role:Role
}

type Snip {
  id: String!
  name: String! @role(role:READER)
  content: String! @role(role:READER)
  owner: User! @idToDoc(idName:"ownerId",docType:USER) @role(role:READER)
  public: Boolean!
  users:[UserRole!]! @idToDoc(idName:"roleIds",docType:USER_ROLE) @role(role:READER)
  tags:[String!]!
}

input SnipQuery {
  name: String
  tags:[String!]
  public:Boolean
  content:String
  owner:String
}

enum Type {
  USER
  SNIP
  USER_ROLE
}

schema {
  query: Query
  mutation: Mutation
}
`;

  //Removes all undefined values from a graphql input query
  const graphqlToMongoose = query => (Object.keys(query).reduce((obj, key) => query[key] === undefined ? obj : { ...obj,
    [key]: query[key]
  }, {}));


  const resolvers = {
    Query: {
      me: (async (_, args, {
        _id
      }) => await User.findById(_id)),
      user: async (_, {
        username
      }) => await User.findOne({
        username
      }),
      validate: async (_, {
          username,
          password
        }) =>
        await (await User.validate({
          username,
          password
        })).genToken(),
      snip: async (root, {
        id
      }) => await Snip.findById(id),
      snips: async (root, {
        query: {
          name,
          public,
          tags,
          owner,
          //Content search ignored, as use of it would be prohibitively expensive
        }
      }, {
        _id
      }) => (await Promise.all((await Snip.find(graphqlToMongoose({
        public,
      }))).map(async snip => (await snip.userHasRole({
        role: "READER",
        _id
      }))&&(//Include only the snips that have at least one of the tags specified
        tags?tags.reduce((last,next)=>last||(snip.tags.includes(next)),false):true
      )
        &&(//Assure that owner has the given username
          owner?(await User.findById(snip.ownerId)).username===owner:true
        )
        &&(
          name?snip.name.includes(name):true
        )
        ? snip : null))).filter(i => i),
    },
    Mutation: {
      newUser: (async (_, {
          username,
          password
        }) =>
        await (await User.create({
          username,
          password
        })).genToken()),
      newSnip: ((_, {
          name,
          public
        }, {
          _id
        }) =>
        Snip.create({
          name,
          public,
          _id
        })),
      setUserRole: (async (_, {
          snipId,
          username,
          role: roleName
        }, {
          _id
        }) =>

        await role("OWNER")(async (snip) => await snip.setUserRole({
          _id: (await User.findOne({
            username
          }))._id,
          role: roleName,
        }))(await Snip.findById(snipId), null, {
          _id
        })
      ),
      updateSnip: (async (_, {
          snipId,
          query,
        }, {
          _id
        }) =>
        await role("EDITOR")(async (snip) => (await snip.update(graphqlToMongoose({
          name:query.name,
          content:query.content,
          public:query.public,
          tags:query.tags,
          //owner excluded because we have setUserRole for that
        }))))(await Snip.findById(snipId), null, {
          _id
        })
      ),
      deleteSnip: (async (_, {
        snipId
      }, {
        _id
      }) => await role("OWNER")(async (snip) => {
        const owner = await User.findById(snip.ownerId);
        const startLength=owner.snipIds.length;
        owner.snipIds = owner.snipIds.filter(id => id+"" !== snipId);
        console.log("Deleting: Starting length of owner snipIds vs. ending length: "+startLength+" vs. "+owner.snipIds.length);
        await new Promise((resolve, reject) => owner.save((err, owner) => err || !owner ? reject(err) : resolve(owner)));
        await (Snip.findByIdAndDelete(snipId));
        return snipId;
      })(await Snip.findById(snipId), null, {
        _id
      }))
    },
    //Add more resolvers here
    User: {},
    Snip: {},
    UserRole: {},
  };

  const context = function({
    req
  }) {
    return new Promise((resolve, reject) => {
      const headers = req.headers;
      const auth = headers.authentication;
      jwt.verify(auth, privateKey, (err, info) => {
        resolve({
          auth,
          _id: !err && info._id
        });
      });
    });
  };

  const server = new ApolloServer({
    typeDefs,
    resolvers,
    context,
    schemaDirectives: {
      authenticated: AuthenticatedDirective,
      role: RoleDirective,
      idToDoc: IdToDocDirective,
    },
  });

  resolve((app) => server.applyMiddleware({
    app
  }));
});
