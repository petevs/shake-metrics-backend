import * as functions from 'firebase-functions'
import * as express from 'express'
import * as cors from 'cors'
import * as admin from 'firebase-admin'

admin.initializeApp()

import { getReadyMockData } from './utils/createMockData/createRandomTransactions'



const app = express()

app.use(express.json())
app.use(express.urlencoded({extended: true}))
app.use(cors({ origin: true }))

app.get('/mock-data', async (req, res) => {

    const result = await getReadyMockData()
    
    res.send(result)
})

export const api = functions.https.onRequest(app)