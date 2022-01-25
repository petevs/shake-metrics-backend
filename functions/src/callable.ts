import axios from 'axios'
import * as Papa from 'papaparse'
import * as functions from 'firebase-functions'


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
        costBasisFreeSats: 0,
        totalBitcoinSold: 0,
        totalBitcoinSentToPeers: 0,
        proceeds: 0,
    }

    const peers: any = {}
  
    data.forEach((transaction: { [x: string]: any }) => {

        const debitCurrency = transaction['Debit Currency']
        const debitAmount = Number(transaction['Amount Debited'])
        const creditCurrency = transaction['Credit Currency']
        const creditAmount = Number(transaction['Amount Credited'])
        const transactionType = transaction['Transaction Type']
        const direction = transaction['Direction']
        // const rate = Number(transaction['Buy / Sell Rate'])
        const spotRate = Number(transaction['Spot Rate'])
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
                    aggregates.totalBitcoinSold += debitAmount
                    aggregates.proceeds += creditAmount
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

              // Create a new peer if does not exist
              if(!(sourceDestination in peers)) {
                peers[sourceDestination] = {
                    fiat: {
                        sent: 0,
                        received: 0,
                        net: 0
                    },
                    BTC: {
                        sent: 0,
                        received: 0,
                        net: 0
                    }
                }
              }

              //If sent in BTC then adjust the peer's BTC account
              if(debitCurrency === 'BTC' || creditCurrency === 'BTC') {
                wallets.shakepayBitcoin += -debitAmount + creditAmount
                peers[sourceDestination].BTC.sent += debitAmount || 0
                peers[sourceDestination].BTC.received += creditAmount || 0
                peers[sourceDestination].BTC.net += creditAmount - debitAmount
              }

              //If sent in CAD then adjust the peer's fiat account
              if(debitCurrency === 'CAD' || creditCurrency === 'CAD') {
                wallets.shakepayDollars += -debitAmount + creditAmount
                peers[sourceDestination].fiat.sent += debitAmount || 0
                peers[sourceDestination].fiat.received += creditAmount || 0
                peers[sourceDestination].fiat.net += creditAmount - debitAmount
              }
              
              return

            case ('shakingsats'):
              wallets.shakepayBitcoin += creditAmount
              aggregates.totalShakingSats += creditAmount
              aggregates.costBasisFreeSats += creditAmount * spotRate
              
              return

            case ('card cashbacks'):
              wallets.shakepayBitcoin += creditAmount
              aggregates.totalCashBackBTC += creditAmount
              aggregates.costBasisFreeSats += creditAmount * spotRate
              
              return

            default:
                return

        }
    
      })
  
    //More Summary
    const totalBitcoinEarned = aggregates.totalShakingSats + aggregates.totalCashBackBTC
    const totalBitcoinAccumulated = aggregates.totalBitcoinPurchased + totalBitcoinEarned
    const averagePurchasePrice = aggregates.totalSpent / aggregates.totalBitcoinPurchased
    const costBasis = (aggregates.costBasisFreeSats + aggregates.totalSpent) / totalBitcoinAccumulated

    const peersList = () => {

        const results = []

        for (const key in peers) {
            results.push({
                username: key,
                fiat: {
                    sent: peers[key].fiat.sent,
                    received: peers[key].fiat.received,
                    net: peers[key].fiat.net
                },
                BTC: {
                    sent: peers[key].BTC.sent,
                    received: peers[key].BTC.received,
                    net: peers[key].BTC.net
                }
                
            })
        }

        return results
    }
  
    return {
        wallets: {
          ...wallets
        },
        aggregates: {
          ...aggregates,
          totalBitcoinEarned: totalBitcoinEarned,
          totalBitcoinAccumulated: totalBitcoinAccumulated,
          averagePurchasePrice: averagePurchasePrice,
          costBasis: costBasis

        },
        peers: peersList(),
        transactions: data
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