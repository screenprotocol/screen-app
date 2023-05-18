import express, { Express } from 'express'
import safeRouter from '@/routes/safe'

const apirouter = express.Router()

const routes = (app: Express) => {
    apirouter.use('/safe', safeRouter)
    app.use('/api/v1', apirouter)
}

export default routes
