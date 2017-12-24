const express = require('express')
const bodyParser = require('body-parser')
const { makeExecutableSchema } = require('graphql-tools')
const { graphqlExpress, graphiqlExpress } = require('apollo-server-express')
const cors = require('cors')
const { reject, uniqueId, find, findIndex, assign } = require('lodash')

let todos = []

const typeDefs = `
  # Says hello
  type Todo {
    id: ID
    text: String
    completed: Boolean
  }

  type Mutation {
    createTodo(text: String!): Todo
    deleteTodo(id: ID!): Todo
    updateTodo(id: ID! text: String completed: Boolean): Todo
  }

  type Query {
    todos: [Todo]
  }
`

const resolvers = {
  Query: {
    todos () {
      return todos
    }
  },
  Mutation: {
    createTodo (_, { text }) {
      const todo = { id: String(uniqueId()), text }
      todos.push(todo)
      return todo
    },
    deleteTodo (_, { id }) {
      const todo = find(todos, { id })
      todos = reject(todos, { id })
      return todo
    },
    updateTodo (_, { id, ...fields }) {
      const index = findIndex(todos, { id })
      const todo = assign(find(todos, { id }), fields)
      todos[index] = todo
      return todo
    }
  }
}

const schema = makeExecutableSchema({ typeDefs, resolvers })
const app = express()

app.use(cors())
app.use('/graphql', bodyParser.json(), graphqlExpress({ schema }))
app.get('/graphiql', graphiqlExpress({ endpointURL: '/graphql' }))

module.exports = app
