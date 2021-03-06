import * as admin from 'firebase-admin'
import * as moment from 'moment-timezone'


const db = admin.firestore()

//Get historical prices
export const getHistoricalData = async ( timezone: string ) => {
    
    //Get historical bitcoin prices from firebase firestore
    const docRef = db.collection('historicalData').doc('cad')
    const doc = await docRef.get()
    const result = doc.data()

    //Get historical ethereum prices from firebase firestore
    const ethRef = db.collection('historicalData').doc('eth')
    const ethDoc = await ethRef.get()
    const ethResult = ethDoc.data()
    
    if(!result || !ethResult){return []}
    
    //Format dates for accessing with current timezone

    const getDateFormattedObject = ( previousObject: { [x: string]: any } ) => {
        
        let newObject : any = {}

        for (const date in previousObject) {
            const currentPrice = previousObject[date]
            const convertedDate = moment(Number(date)).tz(timezone).format('YYYY-MM-DD')
            newObject[convertedDate] = currentPrice
        }

        return newObject

    }

    return {
        BTC: {...getDateFormattedObject(result)},
        ETH: {...getDateFormattedObject(ethResult)}
    }
}


//Get all the dates in between the start and end date and return an array of dates
const getDatesBetween = ( start: moment.MomentInput, timezone : string ) => {

    let dateList = []

    let current = moment(start).tz(timezone)
    const stopDate = moment().tz(timezone)

    while(current.isSameOrBefore(stopDate)){
        dateList.push(current.format('YYYY-MM-DD'))
        current.add(1, 'days')
    }
    
    return dateList

}


//Create a snapshot for each date 
const createDateSnapshots = async ( transactions: string | any[], timezone : string ) => {

    if(transactions.length === 0){ return []}

    //Get start and end date based on transactions
    const startDate = moment(transactions[0]['Date']).tz(timezone).format('YYYY-MM-DD')

    //Create an array of all the dates
    const dateList = getDatesBetween(startDate, timezone)
    
    //Empty datesnapshot 
    const dateSnapshots : any = {}

    //Get all the historical prices for bitcoin and ethereum
    const historicalData : any = await getHistoricalData( timezone )

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
const addTransactionsToDateSnapshots = async ( transactions: any[], timezone : string ) => {

    //Create datesnapshots
    const dateSnapshots : any = await createDateSnapshots( transactions , timezone )

    //for each transaction add it to the daily snapshots object
    transactions.forEach( ( transaction: { [x: string]: moment.MomentInput } ) => {
        //Make friendly date 
        const friendlyDate = moment(transaction['Date']).tz(timezone).format('YYYY-MM-DD')

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
const adjustSnapshots = async ( transactions: any[], timezone : string ) => {

    //Starting balances to keep track of aggregates
    const wallets : any = {
        CAD: 0,
        BTC: 0,
        ETH: 0,
        coldStorage: 0
    }

    const transfers : any = {
        CAD: {
            in: 0,
            out: 0,
            net: 0,
        },
        BTC: {
            in: 0,
            out: 0,
            net: 0
        },
        ETH: {
            in: 0,
            out: 0,
            net: 0,
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
        longestStreak: 0,
        longestStreakStartDate: '',
        longestStreakEndDate: ''
    }

    const buySell : any = {
        BTC: {
            totalPurchased: 0,
            totalInvested: 0,
            totalSold: 0,
            totalProceeds: 0,
        },
        ETH: {
            totalPurchased: 0,
            totalInvested: 0,
            totalSold: 0,
            totalProceeds: 0
        }
    }

    const other : any = {
        CAD: {
            in: 0,
            out: 0,
            net: 0,
        },
        BTC: {
            in: 0,
            out: 0,
            net: 0
        },
        ETH: {
            in: 0,
            out: 0,
            net: 0,
        }
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

        if(transaction['Transaction Type'] === 'crypto funding' || transaction['Transaction Type'] === 'fiat funding') {
            transfers[transaction['Credit Currency']].in += Number(transaction['Amount Credited'])
            transfers[transaction['Credit Currency']].net -= Number(transaction['Amount Credited'])
        }

        if(transaction['Credit Currency']){
            wallets[transaction['Credit Currency']] += Number(transaction['Amount Credited'])
        }

        if(transaction['Transaction Type'] === 'crypto cashout' || transaction['Transaction Type'] === 'fiat cashout') {
            transfers[transaction['Debit Currency']].out += Number(transaction['Amount Debited'])
            transfers[transaction['Debit Currency']].net += Number(transaction['Amount Debited'])
        }

        if(transaction['Transaction Type'] === 'other' && transaction['Credit Currency']) {
            other[transaction['Credit Currency']].in += Number(transaction['Amount Credited'])
            other[transaction['Credit Currency']].net += Number(transaction['Amount Credited'])
        }

        if(transaction['Transaction Type'] === 'other' && transaction['Debit Currency']) {
            other[transaction['Debit Currency']].out += Number(transaction['Amount Debited'])
            other[transaction['Debit Currency']].net -= Number(transaction['Amount Debited'])
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
            card.costBasis += Number(transaction['Amount Credited']) * Number(transaction['Spot Rate'])
        }

    }

    const adjustShakingSats = ( transaction: { [x: string]: any } ) => {
        if(transaction['Transaction Type'] === 'shakingsats'){

            const amount = Number(transaction['Amount Credited'])
            const spotRate = Number(transaction['Spot Rate'])
            
            //Date of current shake
            const shakeDate = moment(transaction['Date']).tz(timezone)

            //Date of last shake
            const lastShakeDate = moment(shakingSats.lastDay).tz(timezone)

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
                if(streak.length > shakingSats.longestStreak){
                    shakingSats.longestStreak = streak.length
                    shakingSats.longestStreakStartDate = streak[0]
                    shakingSats.longestStreakEndDate = streak[streak.length - 1]
                }
            })

            shakingSats.totalShakingSats += amount
            shakingSats.costBasis += (amount * spotRate)

        }
    }

    const adjustBuySell = ( transaction: { [x: string]: any }, price: number ) => {
        if(transaction['Transaction Type'] !== 'purchase/sale'){ return }

        if(transaction['Direction'] === 'purchase'){
            buySell[transaction['Credit Currency']].totalInvested += Number(transaction['Amount Debited'])
            buySell[transaction['Credit Currency']].totalPurchased += Number(transaction['Amount Credited'])
        }

        if(transaction['Direction'] === 'sale'){
            buySell[transaction['Debit Currency']].totalSold += Number(transaction['Amount Debited'])
            buySell[transaction['Debit Currency']].totalProceeds += Number(transaction['Amount Credited'])
        }

    } 

    let dailySnapshots : any = await addTransactionsToDateSnapshots(transactions, timezone)


    for ( const day in dailySnapshots) {

        const historicalPrice = dailySnapshots[day].historicalPrice['BTC']

        dailySnapshots[day]['transactions'].forEach( (trans: { [x: string]: any }) => {
            adjustWalletBalances(trans)
            adjustPeerActivity(trans)
            adjustCardActivity(trans)
            adjustShakingSats(trans)
            adjustBuySell(trans, historicalPrice)
        })

        const peerObj : any = {}

        for (const peer in peers){
            peerObj[peer] = {
                CAD: {...peers[peer].CAD},
                BTC: {...peers[peer].BTC},
                ETH: {...peers[peer].ETH}
            }
        }
        
        
        dailySnapshots[day] = {
            ...dailySnapshots[day],
            wallets: {...wallets},
            transfers: {
                CAD: {...transfers.CAD},
                BTC: {...transfers.BTC},
                ETH: {...transfers.ETH},
            },
            buySell: {
                BTC: {...buySell.BTC},
                ETH: {...buySell.ETH},
            },
            peerTransfers: {
                CAD: {...pTransfers.CAD},
                BTC: {...pTransfers.BTC},
                ETH: {...pTransfers.ETH}
            },
            card: {...card},
            shakingSats: {...shakingSats},
            other: {
                CAD: {...other.CAD},
                BTC: {...other.BTC},
                ETH: {...other.ETH},
            },
            peers: {...peerObj}
        }
    }

    return dailySnapshots

}


const aggregateSnapshots = async ( transactions: any[], timezone : string ) => {

    const getPerformance = ( current: 
        { buySell: { [x: string]: { totalInvested: any, totalSold: any, totalPurchased: any, totalProceeds: any } }; historicalPrice: { [x: string]: number } }, 
        currency: string 
        ) => {

        const netBalance = () => {
            return current.buySell[currency].totalPurchased - current.buySell[currency].totalSold
        }

        const currentValue = () => {
            return current.historicalPrice[currency] * netBalance()
        }

        const avgCost = () => {
            return current.buySell[currency].totalInvested / current.buySell[currency].totalPurchased || 0
        }

        const unrealizedCost = () => {
            return netBalance() * avgCost()
        }

        const unrealizedGain = () => {
            return currentValue() - unrealizedCost() || 0
        }

        const unrealizedROI = () => {
            return unrealizedGain() / unrealizedCost() || 0
        }

        const realizedCost = () => {
            return avgCost() * current.buySell[currency].totalSold
        }

        const realizedGain = () => {
            return current.buySell[currency].totalProceeds - realizedCost()
        }

        const realizedROI = () => {
            return realizedGain() / realizedCost() || 0
        }

        const totalReturn = () => {
            return unrealizedGain() + realizedGain()
        }

        const totalROI = () => {
            return totalReturn() / current.buySell[currency].totalInvested || 0
        }

        return {
                value: currentValue(),
                unrealizedCost: unrealizedCost(),
                unrealizedGain: unrealizedGain(),
                unrealizedROI: unrealizedROI(),
                netBalance: netBalance(),
                avgCost: avgCost(),
                totalSold: current.buySell[currency].totalSold,
                realizedGain: realizedGain(),
                realizedCost: realizedCost(),
                realizedROI: realizedROI(),
                totalReturn: totalReturn(),
                totalROI: totalROI(),
                totalPurchased: current.buySell[currency].totalPurchased,
            }


    }
 

    const snapshotObj = await adjustSnapshots(transactions, timezone )

    const performance = {
        ALL: {},
        BTC: {},
        ETH: {}
    }

    for (const date in snapshotObj ) {

        const current = snapshotObj[date]

        performance.BTC = {...getPerformance(current, 'BTC')}
        performance.ETH = {...getPerformance(current, 'ETH')} 

        snapshotObj[date] = {
            ...snapshotObj[date],
            performance: {...performance}
        }

    }

    for (const date in snapshotObj){
        
        const current = snapshotObj[date]

        const { performance } = current

        snapshotObj[date] = {
            ...snapshotObj[date],
            performance: {
                ...snapshotObj[date].performance,
                ALL: {
                    value: performance.BTC.value + performance.ETH.value,
                    unrealizedGain: performance.BTC.unrealizedGain + performance.ETH.unrealizedGain,
                    realizedGain: performance.BTC.realizedGain + performance.ETH.realizedGain,
                    totalReturn: performance.BTC.totalReturn + performance.ETH.totalReturn,
                }
            }
        }
    }

    return snapshotObj    

}



const createSnapshotList = async ( transactions: any, timezone : string ) => {
    const snapshotObj : any = await aggregateSnapshots(transactions, timezone)

    const snapshotList = []

    for (const date in snapshotObj) {
        snapshotList.push({
            date: date,
            ...snapshotObj[date]
        })
    }

    return {
        snapshotObj: { ...snapshotObj },
        snapshotList: [ ...snapshotList ],
    }
}

export const processTransactions = async ( transactions: any, timezone : string ) => {

    const results  = await createSnapshotList(transactions, timezone)

    return results
}