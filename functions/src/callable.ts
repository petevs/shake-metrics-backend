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
  
    data.forEach((transaction: { [x: string]: any }) => {

        const debitCurrency = transaction['Debit Currency']
        const debitAmount = Number(transaction['Amount Debited'])
        const creditCurrency = transaction['Credit Currency']
        const creditAmount = Number(transaction['Amount Credited'])
        const transactionType = transaction['Transaction Type']
        const direction = transaction['Direction']
        const rate = Number(transaction['Buy / Sell Rate'])
        const spotRate = Number(transaction['Source / Direction'])

  
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
              return
          case ('purchase/sale'):
            if(direction === 'purchase') {
                wallets.shakepayDollars -= debitAmount
                wallets.shakepayBitcoin += creditAmount
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
              return
          case ('shakingsats'):
            wallets.shakepayBitcoin += creditAmount
              return
          case ('card cashbacks'):
            wallets.shakepayBitcoin += creditAmount
              return
          default:
              return
      }
  
    })
  
  
    return wallets
  
  }
  




export const parseShakepay = functions.https.onCall(async (req, context) => {

    const { data } = await axios.get(req.url)

    const res = Papa.parse(data, {
        header: true
    })

    const transactions = res.data

    return transactions

})