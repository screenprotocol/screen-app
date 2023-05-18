import express, { Express, Request, Response } from 'express'
import morgan from 'morgan'
import rateLimit from 'express-rate-limit'
import cors from 'cors'
import routes from '@/routes'

const app: Express = express()

app.use(cors())
app.use(
    rateLimit({
        windowMs: 15 * 60 * 1000,
        max: 1000,
        standardHeaders: true,
        legacyHeaders: false,
    }),
)

app.use(morgan('combined'))
app.use(express.json())

app.get('/', (req: Request, res: Response) => {
    res.send('Express + TypeScript Server')
})

routes(app)

export default app
