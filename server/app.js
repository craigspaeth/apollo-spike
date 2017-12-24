import express from 'express'
import bodyParser from 'body-parser'
import { makeExecutableSchema } from 'graphql-tools'
import { graphqlExpress, graphiqlExpress } from 'apollo-server-express'
import cors from 'cors'
import { reject, uniqueId, find, findIndex, assign, omit } from 'lodash'

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
    updateTodo (_, fields) {
      const index = findIndex(todos, { id: fields.id })
      const todo = assign(find(todos, { id: fields.id }), omit(fields, 'id'))
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
