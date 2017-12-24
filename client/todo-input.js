import { graphql } from 'react-apollo'
import React from 'react'
import gql from 'graphql-tag'
import { TodoListQuery } from './todo-list'

const TodoInputMutation = gql`mutation createTodo($text: String!) {
  createTodo(text: $text) {
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

const TodoInput = graphql(TodoInputMutation)(({ mutate }) => {
  return (
    <form onSubmit={addTodo(mutate)}>
      <input placeholder='Add todo' />
      <button>Add</button>
    </form>
  )
})

export { TodoInput }
