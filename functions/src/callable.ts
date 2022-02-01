import axios from 'axios'
import * as Papa from 'papaparse'
import * as functions from 'firebase-functions'
import { processTransactions } from './utils/processTransactions'


export const parseShakepay = functions.https.onCall(async (req, context) => {

    const { data } = await axios.get(req.url)

    const res = Papa.parse(data, {
        header: true
    })

    const transactions = res.data
    return processTransactions(transactions)

})