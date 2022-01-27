import axios from 'axios'
import * as Papa from 'papaparse'
import * as functions from 'firebase-functions'
import { formatTransactions } from './utils/formatTransaction'
import { calculateTransactions } from './utils/calculateTransactions'


export const parseShakepay = functions.https.onCall(async (req, context) => {

    const { data } = await axios.get(req.url)

    const res = Papa.parse(data, {
        header: true
    })

    const transactions = res.data
    const formattedTrans = formatTransactions(transactions)

    return calculateTransactions(formattedTrans)

})