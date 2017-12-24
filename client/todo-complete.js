import { graphql } from 'react-apollo'
import React from 'react'
import gql from 'graphql-tag'

const TodoCompleteMutation = gql`mutation updateTodo($id: ID! $completed: Boolean) {
  updateTodo(id: $id completed: $completed) {
    id
    text
    completed
  }
}`

const completeTodo = (mutate, todo) => () => {
  mutate({ variables: { id: todo.id, completed: !todo.completed } })
}

const TodoComplete = graphql(TodoCompleteMutation)(({ todo, mutate }) => {
  return <button onClick={completeTodo(mutate, todo)}>✓</button>
})

export { TodoComplete }
