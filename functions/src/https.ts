import * as functions from 'firebase-functions'
import * as express from 'express'
import * as cors from 'cors'
import * as admin from 'firebase-admin'

admin.initializeApp()

const app = express()

app.use(express.json())
app.use(express.urlencoded({extended: true}))
app.use(cors({ origin: true }))

app.get('/get-mock', async (req, res) => {
    
    res.send('hi')


})

export const api = functions.https.onRequest(app)