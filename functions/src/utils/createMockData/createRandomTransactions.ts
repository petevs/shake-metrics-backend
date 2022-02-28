import { 
    getHistoricalData, 
    processTransactions 
} from "../processTransactions";

import { 
    getDates,
    randomInt 
} from "./helpers";
import { 
    // makeCryptoFunding, 
    makeFiatFunding, 
    makePurchase, 
    makeSale,
    makeFiatCashout,
    makeCardTransaction,
    makeCardCashback,
    makeShakingSats, 
    makePeerReceive,
    makePeerSend,
    makeCryptoCashout
} 
    from "./transactionTypes";



const transactionTypes = [
    makeFiatCashout,
    makeFiatFunding, 
    makePurchase, 
    makeSale, 
    makeCryptoCashout, 
    makeCardTransaction, 
    makePeerReceive,
    makePeerSend
]

const getRandomTransaction : Function = ( date : any, wallets : any, historicalData : any ) => {
    const selected = transactionTypes[randomInt(0, transactionTypes.length - 1)]

    if(wallets.CAD <= 5){
        return makeFiatFunding( date, wallets)
    }

    if(wallets.BTC === 0){
        return makePurchase( date, wallets, historicalData)
    }

    if(wallets.CAD <= 5 && (
        selected === makeFiatCashout || 
        selected === makePurchase ||
        selected === makeCardTransaction ||
        selected === makePeerSend
    )){
        return getRandomTransaction( date, wallets, historicalData)
    }

    if((wallets.BTC <= 0.0005 || wallets.ETH <= 0.0005) && (
        selected === makeSale ||
        selected === makeCryptoCashout ||
        selected === makePeerSend
        )){
        return getRandomTransaction( date, wallets, historicalData)
    }

    return selected( date, wallets, historicalData)
}


const getMockTransactions = async () => {
    const historicalData = await getHistoricalData('America/Edmonton')

    const allDates = getDates()

    const initial = {
        wallets: {
            CAD: 0,
            BTC: 0,
            ETH: 0
        },
        transactions: []
    }
    
    const mockTransactions = allDates.reduce( (previous: any, currentDate) => {
    
        const result = getRandomTransaction( currentDate, previous.wallets, historicalData)

        if(result){
    
            previous['wallets'] = {
                CAD: result.wallets.CAD,
                BTC: result.wallets.BTC,
                ETH: result.wallets.ETH
            }

            previous['transactions'] = [...previous['transactions'], {...result.transaction}]
        }
    
        return previous
    }, initial)
    

    const transactionsWithCashbacks = mockTransactions.transactions.reduce( (previous : any , current : any) => {

        if(current['Transaction Type'] !== 'card transactions'){return previous}

        const cardCashback = makeCardCashback( current, historicalData)

        previous.push(cardCashback)

        return previous


    }, mockTransactions.transactions )


    const shakingSats = transactionsWithCashbacks.map( (item: { [x: string]: any; }) => makeShakingSats(item['Date'], historicalData))

    const unsortedTransactions =  [...transactionsWithCashbacks, ...shakingSats]

    const sortedTransactions = unsortedTransactions.sort(
        function(a : any , b : any){

            const dateB : any = new Date(b['Date'])
            const dateA : any = new Date(a['Date'])

            return dateB - dateA
        }
    )

    return sortedTransactions.reverse()


}

export const getReadyMockData = async () => {

    const mockTransactions : any = await getMockTransactions()

    const results = await processTransactions(mockTransactions, 'Greenwich')

    return results

}