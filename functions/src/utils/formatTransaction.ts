/* DATA MODEL


Note: shakepay transactions stay in shakepay format, then if changed the function is added

    shakepayTransactions: [],

Note: daily snapshot object so that can easily access 

dailySnapshot: {
    '2021-01-26': {
        activity: {
            bitcoinPurchased: 0,
            bitcoinSold: 0,
            amountInvested: 0,
            fiatFunding: 0,
            fiatCashout: 0,
            cryptoFunding: 0,
            cryptoCashout: 0,
            other: 0,
        },
        portfolioPerformance: {
            totalBitcoinPurchased: 0,
            totalAmountInvested: 0,
            saleProceeds: 0,
            portfolioValue: 0,
            unrealizedGain: 0,
            realizedGain: 0,
            totalBitcoinSold: 0,
            averageCostPerBTC: 0,
        },
        creditCard: {
            creditCardSpend: 0,
            cashbackBTC: 0,
            totalCashBackBTC: 0
        },
        shakingSats: {
            dayStreak: 0,
            shakingSatsBTC: 0,
            totalshakingSatsBTC:
        },
        peers: {
            '@jennfountain7': {
                BTC: {
                    sent: 0,
                    received: 0,
                    totalSent: 0,
                    totalReceived: 0,
                    net: 0
                },
                fiat: {
                    sent: 0,
                    received: 0,
                    totalSent: 0,
                    totalReceived: 0,
                    net: 0
                }
            },
        wallets: {
            shakepayDollars: 0,
            shakepayBitcoin: 0,
            coldStorage: 0,
        }
        }
    }
}





*/




export const formatTransactions = ( transactions: any ) => {

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

    const results = transactions.map((transaction: { [x: string]: any }) => {

        const debitCurrency = transaction['Debit Currency']
        const debitAmount = Number(transaction['Amount Debited'])
        const creditCurrency = transaction['Credit Currency']
        const creditAmount = Number(transaction['Amount Credited'])
        const transactionType = transaction['Transaction Type']
        const direction = transaction['Direction']
        // const rate = Number(transaction['Buy / Sell Rate'])
        // const spotRate = Number(transaction['Spot Rate'])
        const sourceDestination = transaction['Source / Destination']

        const adjustWalletBalances = () => {

            if(debitCurrency){
              switch(debitCurrency) {
                case('BTC'):
                  wallets.shakepayBitcoin -= debitAmount
                  if(transactionType === 'crypto cashout'){
                    wallets.coldStorage += debitAmount
                  }
                default:
                  wallets.shakepayDollars -= debitAmount
              }
            }
          
            if(creditCurrency){
              switch(creditCurrency) {
                case('BTC'):
                  wallets.shakepayBitcoin += creditAmount
                  if(transactionType === 'crypto funding'){
                    wallets.coldStorage -= creditAmount
                  }
                default:
                  wallets.shakepayDollars += creditAmount
              }
            }
        }

        const adjustPeerActivity = () => {
            //If not a peer transaction skip
            if(transactionType !== 'peer transfer'){return}

            //If peer does not exist, add peer
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

            if(debitCurrency === 'BTC' || creditCurrency === 'BTC') {
                peers[sourceDestination].BTC.sent += debitAmount || 0
                peers[sourceDestination].BTC.received += creditAmount || 0
                peers[sourceDestination].BTC.net += creditAmount - debitAmount
                }
            }

            if(debitCurrency === 'CAD' || creditCurrency === 'CAD') {
                    peers[sourceDestination].fiat.sent += debitAmount || 0
                    peers[sourceDestination].fiat.received += creditAmount || 0
                    peers[sourceDestination].fiat.net += creditAmount - debitAmount
            }
        }

        const adjustCardActivity = () => {
            if(transactionType !== 'card transactions'){return}
            aggregates.totalCardSpend += debitAmount        
        }
  
        const adjustBuySell = () => {
            if(transactionType !== 'purchase/sale'){ return }

            if(direction === 'purchase'){
                aggregates.totalSpent += debitAmount
                aggregates.totalBitcoinPurchased += creditAmount
                return
            }

            aggregates.totalBitcoinSold += debitAmount
            aggregates.proceeds += creditAmount   

        }
  
        const adjustShakingSats = () => {
            if(transactionType !== 'shakingsats'){return}
            aggregates.totalShakingSats += creditAmount
        }

        const adjustCardCashbacks = () => {
            if(transactionType !== 'card cashbacks'){return}
            aggregates.totalCashBackBTC += creditAmount
        }

        adjustWalletBalances()
        adjustPeerActivity()
        adjustCardActivity()
        adjustBuySell()
        adjustShakingSats()
        adjustCardCashbacks()

        return {
            transaction: {
                ...transaction
            },
            wallets: {
                ...wallets
            },
            aggregates: {
                ...aggregates
            },
            peers: {
                ...peers
            }
        }

    })

    // return results


    const currentDetails = ( formattedTransactions: any ) => {

        const transactionCount = formattedTransactions.length
        const lastRecord = formattedTransactions[transactionCount - 1]

        return {
            wallets: {...lastRecord.wallets},
            aggregates: {
                ...lastRecord.aggregates,
                transactionCount: transactionCount,
            },
            peers: {...lastRecord.peers},
            transactions: [...formattedTransactions]
        }

    }


    return currentDetails(results)


}