import React from 'react'
import { TodoRemove } from './todo-remove'
import { TodoComplete } from './todo-complete'

const TodoItem = ({ todo, mutate }) => {
  return (
    <li key={todo.id}>
      {todo.completed ? <del>{todo.text}</del> : todo.text}
      <TodoRemove todo={todo} />
      <TodoComplete todo={todo} />
    </li>
  )
}

export { TodoItem }
