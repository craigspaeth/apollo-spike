import 'babel-polyfill'
import { ApolloProvider } from 'react-apollo'
import { ApolloClient } from 'apollo-client'
import { HttpLink } from 'apollo-link-http'
import { InMemoryCache } from 'apollo-cache-inmemory'
import React from 'react'
import ReactDOM from 'react-dom'
import { TodoList } from './todo-list'
import { TodoInput } from './todo-input'

const client = new ApolloClient({
  link: new HttpLink({ uri: 'http://localhost:3000/graphql' }),
  cache: new InMemoryCache()
})

const TodoApp = () => {
  return (
    <div>
      <h1>Todo List:</h1>
      <TodoList />
      <TodoInput />
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
