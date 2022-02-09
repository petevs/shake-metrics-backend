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

const getDatesBetween = ( start: moment.MomentInput, end: moment.MomentInput ) => {

    let dateList = []

    let current = moment(start)
    const stopDate = moment(end)

    while(current.isSameOrBefore(stopDate)){
        dateList.push(current.format('YYYY-MM-DD'))
        current.add(1, 'days')
    }

     return dateList

}


const createDateSnapshots = async ( transactions: string | any[] ) => {

    if(transactions.length === 0){ return []}

    const startDate = moment(transactions[0]['Date']).format('YYYY-MM-DD')
    const endDate = moment().format('YYYY-MM-DD')

    const dateList = getDatesBetween(startDate, endDate)
    
    const dateSnapshots : any = {}

    const historicalData : any = await getHistoricalData()

    let count : any = 0

    dateList.forEach( ( date ) => {
        
        count += 1

        dateSnapshots[date] = {
            historicalPrice: historicalData[date],
            index: count,
            transactions: [],
        }
    })

    return dateSnapshots

}

const addTransactionsToDateSnapshots = async ( transactions: any[] ) => {

    const dateSnapshots : any = await createDateSnapshots(transactions)

    transactions.forEach( ( transaction: { [x: string]: moment.MomentInput } ) => {
        const friendlyDate = moment(transaction['Date']).format('YYYY-MM-DD')

        dateSnapshots[friendlyDate] = {
            ...dateSnapshots[friendlyDate],
            transactions: [
                ...dateSnapshots[friendlyDate].transactions,
                {...transaction}
            ]
        }
    })

    return dateSnapshots

}

const adjustSnapshots = async ( transactions: any[] ) => {

    const wallets : any = {
        CAD: 0,
        BTC: 0,
        ETH: 0,
        coldStorage: 0
    }

    const bitcoinTransfers : any = {
        out: 0,
        in: 0
    }

    const peers : any = {}

    const card : any = {
        totalCardSpend: 0,
        totalCashBackBTC: 0,
        costBasis: 0
    }

    const shakingSats : any = {
        totalShakingSats: 0,
        costBasis: 0,
    }

    const portfolio : any = {
        totalInvested: 0,
        totalBitcoinPurchased: 0,
        totalBitcoinSold: 0,
        totalSaleProceeds: 0,
        totalFreeBitcoinEarned: 0,
        portfolioValue: 0,
        unrealizedGain: 0,
        averageCostPerBTCPurchased: 0,
        totalBitcoinAccumulated: 0,
        costBasisForTotal: 0,
        costBasis: 0
    }

    const pTransfers : any = {
        CAD: {
            totalSent: 0,
            totalReceived: 0,
            net: 0,
        },
        BTC: {
            totalSent: 0,
            totalReceived: 0,
            net: 0,
        },
        ETH: {
            totalSent: 0,
            totalReceived: 0,
            net: 0,
        },
    }

    const adjustWalletBalances = ( transaction: { [x: string]: any } ) => {

        if(transaction['Debit Currency']){
            wallets[transaction['Debit Currency']] -= Number(transaction['Amount Debited'])
        }

        if(transaction['Transaction Type'] === 'crypto funding') {
            bitcoinTransfers.in += Number(transaction['Amount Credited'])
        }

        if(transaction['Credit Currency']){
            wallets[transaction['Credit Currency']] += Number(transaction['Amount Credited'])
        }

        if(transaction['Transaction Type'] === 'crypto cashout') {
            bitcoinTransfers.out += Number(transaction['Amount Debited'])
        }

    }

    const adjustPeerActivity = ( transaction: { [x: string]: any } ) => {

        const debitCurrency = transaction['Debit Currency']
        const debitAmount = Number(transaction['Amount Debited'])
        const creditCurrency = transaction['Credit Currency']
        const creditAmount = Number(transaction['Amount Credited'])
        const transactionType = transaction['Transaction Type']
        // const direction = transaction['Direction']
        // const rate = Number(transaction['Buy / Sell Rate'])
        // const spotRate = Number(transaction['Spot Rate'])
        const sourceDestination = transaction['Source / Destination']


        //If not a peer transaction skip
        if(transactionType !== 'peer transfer'){return}

        //If peer does not exist, add peer
        if(!(sourceDestination in peers)) {
                peers[sourceDestination] = {
                CAD: {
                    sent: 0,
                    received: 0,
                    net: 0
                },
                BTC: {
                    sent: 0,
                    received: 0,
                    net: 0
                },
                ETH: {
                    sent: 0,
                    received: 0,
                    net: 0
                }
            }

        if(debitCurrency === 'BTC' || creditCurrency === 'BTC') {
            peers[sourceDestination].BTC.sent += debitAmount || 0
            peers[sourceDestination].BTC.received += creditAmount || 0
            peers[sourceDestination].BTC.net += creditAmount - debitAmount

            pTransfers.BTC.totalSent += debitAmount || 0
            pTransfers.BTC.totalReceived += creditAmount || 0
            pTransfers.BTC.net += creditAmount - debitAmount
            }
        }

        if(debitCurrency === 'CAD' || creditCurrency === 'CAD') {
                peers[sourceDestination].CAD.sent += debitAmount || 0
                peers[sourceDestination].CAD.received += creditAmount || 0
                peers[sourceDestination].CAD.net += creditAmount - debitAmount

                pTransfers.CAD.totalSent += debitAmount || 0
                pTransfers.CAD.totalReceived += creditAmount || 0
                pTransfers.CAD.net += creditAmount - debitAmount
        }

        if(debitCurrency === 'ETH' || creditCurrency === 'ETH') {
                peers[sourceDestination].ETH.sent += debitAmount || 0
                peers[sourceDestination].ETH.received += creditAmount || 0
                peers[sourceDestination].ETH.net += creditAmount - debitAmount

                pTransfers.ETH.totalSent += debitAmount || 0
                pTransfers.ETH.totalReceived += creditAmount || 0
                pTransfers.ETH.net += creditAmount - debitAmount
        }
    }

    const adjustCardActivity = ( transaction: { [x: string]: any } ) => {
        const transactionType = transaction['Transaction Type']

        if(transactionType === 'card transactions') {
            card.totalCardSpend += Number(transaction['Amount Debited'])
        }

        if(transactionType === 'card cashbacks') {
            card.totalCashBackBTC += Number(transaction['Amount Credited'])
            portfolio.totalFreeBitcoinEarned += Number(transaction['Amount Credited'])
            card.costBasis += Number(transaction['Amount Credited']) * Number(transaction['Spot Rate'])
            portfolio.costBasisForTotal += Number(transaction['Amount Credited']) * Number(transaction['Spot Rate'])
        }

    }

    const adjustShakingSats = ( transaction: { [x: string]: any } ) => {
        if(transaction['Transaction Type'] === 'shakingsats'){

            const amount = Number(transaction['Amount Credited'])
            const spotRate = Number(transaction['Spot Rate'])

            shakingSats.totalShakingSats += amount
            shakingSats.costBasis += (amount * spotRate)
            portfolio.totalFreeBitcoinEarned += amount
            portfolio.costBasisForTotal += (amount * spotRate)

        }
    }

    const adjustBuySell = ( transaction: { [x: string]: any }, price: number ) => {
        if(transaction['Transaction Type'] !== 'purchase/sale'){ return }

        if(transaction['Direction'] === 'purchase'){
            portfolio.totalInvested += Number(transaction['Amount Debited'])
            portfolio.totalBitcoinPurchased += Number(transaction['Amount Credited'])
        }

        if(transaction['Direction'] === 'sale'){
                portfolio.totalBitcoinSold += Number(transaction['Amount Debited'])
                portfolio.totalSaleProceeds += Number(transaction['Amount Credited'])
        }

        //Calculations
        const portfolioValue = (portfolio.totalBitcoinPurchased * price)
        const unrealizedGain = (portfolioValue - portfolio.totalInvested)
        const averageCostPerBTCPurchased = portfolio.totalInvested / portfolio.totalBitcoinPurchased

        portfolio.portfolioValue = portfolioValue
        portfolio.unrealizedGain = unrealizedGain
        portfolio.averageCostPerBTCPurchased = averageCostPerBTCPurchased


        portfolio.costBasisForTotal += portfolio.totalInvested
        portfolio.totalBitcoinAccumulated = portfolio.totalBitcoinPurchased + portfolio.totalFreeBitcoinEarned
        portfolio.costBasis = portfolio.costBasisForTotal / portfolio.totalBitcoinAccumulated 

    } 

    let dailySnapshots : any = await addTransactionsToDateSnapshots(transactions)

    for ( const day in dailySnapshots) {

        const historicalPrice = dailySnapshots[day].historicalPrice

        dailySnapshots[day]['transactions'].forEach( (trans: { [x: string]: any }) => {
            adjustWalletBalances(trans)
            adjustPeerActivity(trans)
            adjustCardActivity(trans)
            adjustShakingSats(trans)
            adjustBuySell(trans, historicalPrice)
        })
        
        dailySnapshots[day] = {
            ...dailySnapshots[day],
            wallets: {...wallets},
            bitcoinTransfers: {...bitcoinTransfers},
            portfolio: {...portfolio},
            peerTransfers: {
                CAD: {...pTransfers.CAD},
                BTC: {...pTransfers.BTC},
                ETH: {...pTransfers.ETH}
            },
            card: {...card},
            shakingSats: {...shakingSats},
            peers: {...peers}
        }
    }

    return dailySnapshots

}

const createSnapshotList = async ( transactions: any ) => {
    const snapshotObj : any = await adjustSnapshots(transactions)

    const snapshotList = []

    for (const date in snapshotObj) {
        snapshotList.push({
            date: date,
            ...snapshotObj[date]
        })
    }

    return {
        snapshotObj: { ...snapshotObj },
        snapshotList: [ ...snapshotList ]
    }
}

export const processTransactions = async ( transactions: any ) => {

    const results  = await createSnapshotList(transactions)

    return results
}