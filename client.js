import 'babel-polyfill'
import { ApolloProvider, graphql, compose } from 'react-apollo'
import { ApolloClient } from 'apollo-client'
import { HttpLink } from 'apollo-link-http'
import { InMemoryCache } from 'apollo-cache-inmemory'
import React from 'react'
import ReactDOM from 'react-dom'
import gql from 'graphql-tag'
import { reject } from 'lodash'

const client = new ApolloClient({
  link: new HttpLink({ uri: 'http://localhost:3000/graphql' }),
  cache: new InMemoryCache()
})

const TodoListQuery = gql`query {
  todos {
    id
    text
    completed
  }
}`

const TodoInputMutation = gql`mutation createTodo($text: String!) {
  createTodo(text: $text) {
    id
    text
    completed
  }
}`

const TodoDeleteMutation = gql`mutation deleteTodo($id: ID!) {
  deleteTodo(id: $id) {
    id
    text
    completed
  }
}`

const TodoCompleteMutation = gql`mutation updateTodo($id: ID! $completed: Boolean) {
  updateTodo(id: $id completed: $completed) {
    id
    text
    completed
  }
}`

const addTodo = mutate => e => {
  e.preventDefault()
  const text = e.target.children[0].value
  mutate({
    variables: { text },
    update: (proxy, { data: { createTodo } }) => {
      const data = proxy.readQuery({ query: TodoListQuery })
      data.todos.push(createTodo)
      proxy.writeQuery({ query: TodoListQuery, data })
    }
  })
}

const removeTodo = (mutate, todo) => () => {
  mutate({
    variables: { id: todo.id },
    update: (proxy, { data: { createTodo } }) => {
      const data = proxy.readQuery({ query: TodoListQuery })
      data.todos = reject(data.todos, { id: todo.id })
      proxy.writeQuery({ query: TodoListQuery, data })
    }
  })
}

const completeTodo = (mutate, todo) => () => {
  mutate({ variables: { id: todo.id, completed: !todo.completed } })
}

const CompleteTodo = graphql(TodoCompleteMutation)(({ todo, mutate }) => {
  return <button onClick={completeTodo(mutate, todo)}>✓</button>
})

const RemoveTodo = graphql(TodoDeleteMutation)(({ todo, mutate }) => {
  return <button onClick={removeTodo(mutate, todo)}>x</button>
})

const TodoItem = ({ todo, mutate }) => {
  return (
    <li key={todo.id}>
      {todo.completed ? <del>{todo.text}</del> : todo.text}
      <RemoveTodo todo={todo} />
      <CompleteTodo todo={todo} />
    </li>
  )
}

const TodoList = graphql(TodoListQuery)(({ data: { loading, todos } }) => {
  if (loading) return <div>Loading...</div>
  else {
    return (
      <ul>
        {todos.map(todo => <TodoItem todo={todo} />)}
      </ul>
    )
  }
})

const TodoInput = graphql(TodoInputMutation)(({ mutate }) => {
  return (
    <form onSubmit={addTodo(mutate)}>
      <input placeholder='Add todo' />
      <button>Add</button>
    </form>
  )
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
