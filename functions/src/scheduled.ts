import * as functions from 'firebase-functions'
import * as admin from 'firebase-admin'
import axios from 'axios'
import { getShakepayPrice } from './utils/getShakepayPrice'
import { getMockTransactions } from './utils/createMockData/createRandomTransactions'
import { processTransactions } from './utils/processTransactions'


const db = admin.firestore()
const rtdb = admin.database()


export const updateHistoricalDataCAD = functions
    .runWith({ memory: '1GB', timeoutSeconds: 300})
    .pubsub.schedule('0 */3 * * *').onRun( async (context) => {


            let result: any
    
            const { data } = await axios.get(`https://api.coingecko.com/api/v3/coins/bitcoin/market_chart?vs_currency=cad&days=3650&interval=daily`)
    
            result = data
    
            let historical = {}
    
            result.prices.forEach( (item: any) => {
    
                historical = {
                    ...historical,
                    [item[0]]: item[1]
                }
            })
    
            return db.collection('historicalData').doc('cad').set(historical)

    })

export const updateHistoricalETH = functions
    .runWith({ memory: '1GB', timeoutSeconds: 300})
    .pubsub.schedule('0 */3 * * *').onRun( async (context) => {


            let result: any
    
            const { data } = await axios.get(`https://api.coingecko.com/api/v3/coins/ethereum/market_chart?vs_currency=cad&days=3650&interval=daily`)
    
            result = data
    
            let historical = {}
    
            result.prices.forEach( (item: any) => {
    
                historical = {
                    ...historical,
                    [item[0]]: item[1]
                }
            })
    
            return db.collection('historicalData').doc('eth').set(historical)

    })


    export const updateShakepayPrice = functions
    .runWith({ memory: '1GB', timeoutSeconds: 300})
    .pubsub.schedule('*/3 * * * *').onRun( async (context) => {

        const price = await getShakepayPrice()

        return db.collection('shakepayPrice').doc('currentPrice').set({
            timeStamp: Date.now(),
            price: {
                ...price
            }
        })
    })


    export const updateMockData = functions.pubsub.schedule('0 */3 * * *').onRun( async (context) => {

        const transactions = await getMockTransactions()
        const processedTransactions = await processTransactions(transactions, 'America/Edmonton')

        const snapshotObj = processedTransactions.snapshotObj

        //Remove transactions from each

        for(const date in snapshotObj){
            delete snapshotObj[date].transactions
        }

        rtdb.ref('snapshotObj').set({...snapshotObj})

        return

    })