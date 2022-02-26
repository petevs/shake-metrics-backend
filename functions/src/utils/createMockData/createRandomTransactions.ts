import { getHistoricalData } from "../processTransactions";
import { randomInt } from "./helpers";
import { makeCryptoFunding, makeFiatCashout, makeFiatFunding, makePurchase, makeSale } from "./transactionTypes";


const transactionTypes = [makeFiatCashout, makeFiatFunding, makePurchase, makeSale, makeCryptoFunding]

const getRandomTransaction = ( wallets : any, historicalData : any ) => {
    const selected = transactionTypes[randomInt(0, transactionTypes.length - 1)]
    return selected( wallets, historicalData)
}


export const getMockTransactions = async () => {
    const historicalData = await getHistoricalData('America/Edmonton')

    const occurrences = [...Array(25).keys()]

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


    return mockTransactions

}