import express from 'express'
import { createReloadable } from '@artsy/express-reloadable'

const app = express()
const PORT = process.env.PORT || 3000

const mountAndReload = createReloadable(app, require)
app.use(mountAndReload('./app.js'))
app.listen(PORT, () => console.log(`Listening on ${PORT}`))
