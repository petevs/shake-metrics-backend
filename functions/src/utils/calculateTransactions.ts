// import * as admin from 'firebase-admin'
import * as moment from 'moment'


// const db = admin.firestore()

// const docRef = db.collection('historicalData').doc('cad')

// const getHistoricalData = async () => {

//     let historicalData: FirebaseFirestore.DocumentData = {}

//     docRef.get().then(( doc ) => {
//         if(doc.exists) {
//             historicalData = {
//                 ...historicalData,
//                 ...doc.data()
//             }
//         }
//         else {
//             console.log('No such document')
//         }
//     }).catch((error) => {
//         console.log('Error getting document:', error)
//     })

//     return historicalData
// }

export const calculateTransactions = async ( formattedTransactions: any ) => {

    const transactions = formattedTransactions.transactions

    // const historicalData = await getHistoricalData()

    const newTransactions =  transactions.map( (trans: any) => {

        const transactionDetails = trans.transaction
    
        const friendlyDate = moment(transactionDetails['Date']).format('YYYY-MM-DD')

        return {
            ...trans,
            transaction: {
                ...trans.transaction,
                friendlyDate: friendlyDate,
            }
        }

    })

    return {
        ...formattedTransactions,
        transactions: newTransactions
    }

}