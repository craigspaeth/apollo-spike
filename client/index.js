import 'babel-polyfill'
import { ApolloProvider } from 'react-apollo'
import { ApolloClient } from 'apollo-client'
import { ApolloLink } from 'apollo-link'
import { HttpLink } from 'apollo-link-http'
import { InMemoryCache } from 'apollo-cache-inmemory'
import { withClientState } from 'apollo-link-state'
import React from 'react'
import ReactDOM from 'react-dom'
import { TodoList } from './todo-list'
import { TodoInput } from './todo-input'
import { Tooltip } from './tooltip'

const cache = new InMemoryCache()

const stateLink = withClientState({
  cache,
  defaults: {
    tooltip: {
      __typename: 'Tooltip',
      open: false
    }
  },
  resolvers: {
    Mutation: {
      updateTooltip: (_, { open }, { cache }) => {
        const data = {
          tooltip: {
            __typename: 'Tooltip',
            open
          }
        }
        cache.writeData({ data })
      }
    }
  }
})

const client = new ApolloClient({
  cache,
  link: ApolloLink.from([
    stateLink,
    new HttpLink({ uri: 'http://localhost:3000/graphql' })
  ])
})

const TodoApp = () => {
  return (
    <div>
      <h1>Todo List:</h1>
      <TodoList />
      <TodoInput /><br />
      <Tooltip />
    </div>
  )
}

const main = async () => {
  ReactDOM.render(
    <ApolloProvider client={client}>
      <TodoApp />
    </ApolloProvider>,
    document.body
  )
}

main()
