import axios from 'axios'
import * as Papa from 'papaparse'
import * as functions from 'firebase-functions'


// const summarize = ( transactions ) => {

//     const summary = {
//         wallets: [
//             {
//                 shakepay: 0,

//             }
//         ]
//     }

// }


//Check transaction type


const summary = (data: any) => {

    const wallets = {
      shakepayDollars: 0,
      shakepayBitcoin: 0,
      coldStorage: 0, 
    }

    const aggregates = {
        totalBitcoinPurchased: 0,
        totalSpent: 0,
        totalCardSpend: 0,
        totalShakingSats: 0,
        totalCashBackBTC: 0,
    }

    const peers: any = {}
  
    data.forEach((transaction: { [x: string]: any }) => {

        // const debitCurrency = transaction['Debit Currency']
        const debitAmount = Number(transaction['Amount Debited'])
        // const creditCurrency = transaction['Credit Currency']
        const creditAmount = Number(transaction['Amount Credited'])
        const transactionType = transaction['Transaction Type']
        const direction = transaction['Direction']
        // const rate = Number(transaction['Buy / Sell Rate'])
        // const spotRate = Number(transaction['Source / Direction'])
        const sourceDestination = transaction['Source / Destination']
  
        switch(transactionType){
            case ('fiat funding'):
                wallets.shakepayDollars += creditAmount
                return
            case ('fiat cashout'):
                  wallets.shakepayDollars -= debitAmount
                return
            case ('other'):
                  wallets.shakepayDollars += (-1 * debitAmount) + creditAmount
                return
            case ('card transactions'):
                  wallets.shakepayDollars -= debitAmount
                  aggregates.totalCardSpend += debitAmount
                return
            case ('purchase/sale'):
              if(direction === 'purchase') {
                  wallets.shakepayDollars -= debitAmount
                  aggregates.totalSpent += debitAmount
                  wallets.shakepayBitcoin += creditAmount
                  aggregates.totalBitcoinPurchased += creditAmount
                  
              }
              else {
                  wallets.shakepayDollars += creditAmount
                  wallets.shakepayBitcoin -= debitAmount
              }
              return
            case ('crypto funding'):
                wallets.shakepayBitcoin += creditAmount
                wallets.coldStorage -= creditAmount
                return
            case ('crypto cashout'):
                wallets.shakepayBitcoin -= debitAmount
                wallets.coldStorage += debitAmount
                return
            case ('peer transfer'):
              wallets.shakepayDollars += -debitAmount + creditAmount
              // create peer if does not exist
              if(!(sourceDestination in peers)) {
                peers[sourceDestination] = {
                  sent: 0,
                  received: 0,
                  net: 0
                }
              }
              
              peers[sourceDestination].sent += debitAmount || 0
              peers[sourceDestination].received += creditAmount || 0
              peers[sourceDestination].net += creditAmount - debitAmount
                return
            case ('shakingsats'):
              wallets.shakepayBitcoin += creditAmount
              aggregates.totalShakingSats += creditAmount
                return
            case ('card cashbacks'):
              wallets.shakepayBitcoin += creditAmount
              aggregates.totalCashBackBTC += creditAmount
                return
            default:
                return
        }
    
      })
  
  
    return {
        wallets: {
          ...wallets
        },
        aggregates: {
          ...aggregates,
          totalBitcoinEarned: aggregates.totalShakingSats + aggregates.totalCashBackBTC,
          averagePurchasePrice: aggregates.totalSpent / aggregates.totalBitcoinPurchased
        },
        peers: {
          ...peers
        }
      }
  
  }
  




export const parseShakepay = functions.https.onCall(async (req, context) => {

    const { data } = await axios.get(req.url)

    const res = Papa.parse(data, {
        header: true
    })

    const transactions = res.data

    return summary(transactions)

})