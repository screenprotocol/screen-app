import express from 'express'
import { create, get, getTransactions } from '@/controllers/safe'

const safeRouter = express.Router()

safeRouter.route('/:address').post(create())
safeRouter.route('/:address').get(get())
safeRouter.route('/:address/transactions').get(getTransactions())

export default safeRouter
