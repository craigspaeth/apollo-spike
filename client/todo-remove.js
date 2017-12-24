import { graphql } from 'react-apollo'
import React from 'react'
import gql from 'graphql-tag'
import { reject } from 'lodash'
import { TodoListQuery } from './todo-list'

const TodoDeleteMutation = gql`mutation deleteTodo($id: ID!) {
  deleteTodo(id: $id) {
    id
    text
    completed
  }
}`

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

const TodoRemove = graphql(TodoDeleteMutation)(({ todo, mutate }) => {
  return <button onClick={removeTodo(mutate, todo)}>x</button>
})

export { TodoRemove }
