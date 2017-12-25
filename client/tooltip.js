import { graphql, compose } from 'react-apollo'
import React from 'react'
import gql from 'graphql-tag'

const TooltipQuery = gql`
  query {
    tooltip @client {
      open
    }
  }
`

const TooltipMutation = gql`
  mutation updateTooltip($open: Boolean) {
    updateTooltip(open: $open) @client
  }
`

const toggle = (mutate, tooltip) => () => {
  mutate({ variables: { open: !tooltip.open } })
}

const Tooltip = compose(
  graphql(TooltipQuery),
  graphql(TooltipMutation)
)(({ mutate, data: { tooltip } }) => {
  return (
    <small>
      To add a todo just
      {tooltip.open
        ? <span>
            &nbsp;click "add"<a onClick={toggle(mutate, tooltip)}>[-]</a>
        </span>
        : <span>...<a onClick={toggle(mutate, tooltip)}>[+]</a></span>}
    </small>
  )
})

export { Tooltip }
