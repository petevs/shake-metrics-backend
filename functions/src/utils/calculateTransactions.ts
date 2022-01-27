import * as admin from 'firebase-admin'
import * as moment from 'moment'


const db = admin.firestore()


const getHistoricalData = async () => {
    
    const docRef = db.collection('historicalData').doc('cad')
    const doc = await docRef.get()
    const result = doc.data()
    
    if(!result){return []}
    
    return result
}

export const calculateTransactions = async ( formattedTransactions: any ) => {

    const transactions = formattedTransactions.transactions

    const historicalData = await getHistoricalData()

    const newTransactions =  transactions.map( (trans: any) => {

        const transactionDetails = trans.transaction
    
        const friendlyDate = moment(transactionDetails['Date']).format('YYYY-MM-DD')

        return {
            ...trans,
            transaction: {
                ...trans.transaction,
                friendlyDate: friendlyDate,
                historicalPrice: historicalData[friendlyDate]
            }
        }

    })

    return {
        ...formattedTransactions,
        transactions: newTransactions
    }

}