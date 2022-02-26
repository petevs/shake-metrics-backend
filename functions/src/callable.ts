import axios from 'axios'
import * as Papa from 'papaparse'
import * as functions from 'firebase-functions'
import { processTransactions } from './utils/processTransactions'
import { mockTransactions } from './utils/createMockData/createRandomTransactions'


export const parseShakepay = functions.https.onCall(async (req, context) => {

    const timezone = req.timezone
    const { data } = await axios.get(req.url)

    const res = Papa.parse(data, {
        header: true
    })

    const keyCheck : any = [
        'Transaction Type',
        'Date',
        'Amount Debited',
        'Debit Currency',
        'Amount Credited',
        'Credit Currency',
        'Buy / Sell Rate',
        'Direction',
        'Spot Rate',
        'Source / Destination',
        'Blockchain Transaction ID'
      ]
    
    
    const firstResult : any = res.data[0]
    const resultKeyList : any = Object.keys(firstResult)
    
    const checkKeys = () => {
        return keyCheck.toString() === resultKeyList.toString()
    }

    if(!checkKeys()) {
        throw new functions.https.HttpsError('invalid-argument', 'Poorly formatted csv: the csv file uploaded is not an unaltered Shakepay transaction csv file. Please, try again with an original, unaltered file. If error persists contact support.')
    }


    const transactions = res.data
    return processTransactions(transactions , timezone)

})


export const makeMockData = functions.https.onCall(async (req, context) => {

    return mockTransactions

})