import { graphql } from 'react-apollo'
import React from 'react'
import gql from 'graphql-tag'
import { TodoItem } from './todo-item'

const TodoListQuery = gql`query {
  todos {
    id
    text
    completed
  }
}`

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

export { TodoList, TodoListQuery }
