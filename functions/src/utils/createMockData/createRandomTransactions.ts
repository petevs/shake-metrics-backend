import { getHistoricalData } from "../processTransactions";
import { getDates, randomInt } from "./helpers";
import { makeCardCashback, makeCardTransaction, makeCryptoCashout, makeCryptoFunding, makeFiatCashout, makeFiatFunding, makePeerReceive, makePeerSend, makePurchase, makeSale, makeShakingSats } from "./transactionTypes";


const transactionTypes = [makeFiatCashout, makeFiatFunding, makePurchase, makeSale, makeCryptoFunding, makeCryptoCashout, makePeerReceive, makePeerSend, makeCardTransaction]

const getRandomTransaction = ( wallets : any, historicalData : any ) => {
    const selected = transactionTypes[randomInt(0, transactionTypes.length - 1)]

    if(wallets.CAD <= 5 && (selected === makeFiatCashout || selected === makePurchase || selected === makePeerSend)){
        getRandomTransaction(wallets, historicalData)
        return
    }

    if((wallets.BTC <= 0.0005 && wallets.ETH <= 0.0005) && (selected === makeSale || selected === makeCryptoCashout || selected === makePeerSend)){
        getRandomTransaction(wallets, historicalData)
        return
    }

    return selected( wallets, historicalData)
}


export const getMockTransactions = async () => {
    const historicalData = await getHistoricalData('America/Edmonton')

    const occurrences = [...Array(20).keys()]

    const initial = {
        wallets: {
            'CAD': 0,
            'BTC': 0,
            'ETH': 0
        },
        transactions: []
    }
    
    const mockTransactions = occurrences.reduce( (previous: any, current) => {
    
        const result = getRandomTransaction(previous.wallets, historicalData)
        if(result){
            previous['wallets'] = {...result.wallets}
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

    
    const allDates = getDates(transactionsWithCashbacks)

    const shakingSats = allDates.map( (date) => makeShakingSats(date, historicalData))

    return [...transactionsWithCashbacks, ...shakingSats]

}