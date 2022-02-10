import * as admin from 'firebase-admin'
import * as moment from 'moment'


const db = admin.firestore()

//Get historical prices
const getHistoricalData = async () => {
    
    //Get historical bitcoin prices from firebase firestore
    const docRef = db.collection('historicalData').doc('cad')
    const doc = await docRef.get()
    const result = doc.data()

    //Get historical ethereum prices from firebase firestore
    const ethRef = db.collection('historicalData').doc('eth')
    const ethDoc = await ethRef.get()
    const ethResult = ethDoc.data()
    
    if(!result || !ethResult){return []}
    
    //Return historical prices
    return {
        BTC: {...result},
        ETH: {...ethResult}
    }
}


//Get all the dates in between the start and end date and return an array of dates
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


//Create a snapshot for each date 
const createDateSnapshots = async ( transactions: string | any[] ) => {

    if(transactions.length === 0){ return []}

    //Get start and end date based on transactions
    const startDate = moment(transactions[0]['Date']).format('YYYY-MM-DD')
    const endDate = moment().format('YYYY-MM-DD')

    //Create an array of all the dates
    const dateList = getDatesBetween(startDate, endDate)
    
    //Empty datesnapshot 
    const dateSnapshots : any = {}

    //Get all the historical prices for bitcoin and ethereum
    const historicalData : any = await getHistoricalData()

    //Count to keep track of the index
    let count : any = 0

    //Loop through every date in datelist
    dateList.forEach( ( date ) => {
        
        //Add to count to keep track of index
        count += 1

        //Lookup prices on date and add
        dateSnapshots[date] = {
            historicalPrice: {
                BTC: historicalData['BTC'][date],
                ETH: historicalData['ETH'][date]
            },
            //add index, so can easily slice array later    
            index: count,
            transactions: [],
        }
    })

    return dateSnapshots

}

//Add transactions to each date snapshot
const addTransactionsToDateSnapshots = async ( transactions: any[] ) => {

    //Create datesnapshots
    const dateSnapshots : any = await createDateSnapshots(transactions)

    //for each transaction add it to the daily snapshots object
    transactions.forEach( ( transaction: { [x: string]: moment.MomentInput } ) => {
        //Make friendly date 
        const friendlyDate = moment(transaction['Date']).format('YYYY-MM-DD')

        //Look up snapshot date and add transactions
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

//Adjust the snapshots based on type of transaction
const adjustSnapshots = async ( transactions: any[] ) => {

    //Starting balances to keep track of aggregates
    const wallets : any = {
        CAD: 0,
        BTC: 0,
        ETH: 0,
        coldStorage: 0
    }

    const cryptoTransfers : any = {
        BTC: {
            in: 0,
            out: 0,
        },
        ETH: {
            in: 0,
            out: 0,
        }
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
        streaks: [],
        lastDay: '',
        longestStreak: {
            days: 0,
            startDate: '',
            endDate: ''
        }
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
            cryptoTransfers[transaction['Credit Currency']].in += Number(transaction['Amount Credited'])
        }

        if(transaction['Credit Currency']){
            wallets[transaction['Credit Currency']] += Number(transaction['Amount Credited'])
        }

        if(transaction['Transaction Type'] === 'crypto cashout') {
            cryptoTransfers[transaction['Debit Currency']].out += Number(transaction['Amount Debited'])
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
            
            //Date of current shake
            const shakeDate = moment(transaction['Date'])

            //Date of last shake
            const lastShakeDate = moment(shakingSats.lastDay)

            //If the difference between them is more than one day, streak breaks
            if(!lastShakeDate || shakeDate.diff(lastShakeDate, 'days') > 1) {
                shakingSats.streaks.push([])
            }

            //Change last day shaking to date
            shakingSats.lastDay = shakeDate.format('YYYY-MM-DD')

            //get last streak and add date to it
            const lastStreakIndex = shakingSats.streaks.length - 1

            if(lastStreakIndex >= 0){
                shakingSats.streaks[lastStreakIndex].push(shakeDate.format('YYYY-MM-DD'))
            }

            //Check all the streaks to find out the longest
            shakingSats.streaks.forEach((streak: string | any[]) => {
                if(streak.length > shakingSats.longestStreak.days){
                    shakingSats.longestStreak.days = streak.length
                    shakingSats.longestStreak.startDate = streak[0]
                    shakingSats.longestStreak.endDate = streak[streak.length - 1]
                }
            })

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

        const historicalPrice = dailySnapshots[day].historicalPrice['BTC']

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
            cryptoTransfers: {
                BTC: {...cryptoTransfers.BTC},
                ETH: {...cryptoTransfers.ETH},
            },
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