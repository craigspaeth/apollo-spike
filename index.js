const express = require('express')
const { createReloadable } = require('@artsy/express-reloadable')

const app = express()
const PORT = process.env.PORT || 3000

const mountAndReload = createReloadable(app, require)
app.use(mountAndReload('./server.js'))
app.listen(PORT, () => console.log(`Listening on ${PORT}`))
