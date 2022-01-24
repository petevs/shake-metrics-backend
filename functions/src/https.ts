import * as functions from 'firebase-functions'
import * as express from 'express'
import * as cors from 'cors'
import * as admin from 'firebase-admin'
admin.initializeApp()


const app = express()

app.use(express.json())
app.use(express.urlencoded({extended: true}))
app.use(cors({ origin: true }))

app.get('/cat', (req, res) => {
    
    res.send('HI CAT')
})

export const api = functions.https.onRequest(app)