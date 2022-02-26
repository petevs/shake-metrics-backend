import { randomInt } from "./helpers";
import { makeFiatCashout, makeFiatFunding } from "./transactionTypes";


const transactionTypes = [makeFiatCashout, makeFiatFunding]

const getRandomTransaction = ( wallets : any ) => {
    const selected = transactionTypes[randomInt(0, transactionTypes.length - 1)]
    return selected(wallets)
}

const occurrences = [...Array(25).keys()]

const initial = {
    wallets: {
        'CAD': 0,
        'BTC': 0,
        'ETH': 0
    },
    transactions: []
}

export const mockTransactions = occurrences.reduce( (previous: any, current) => {

    const result = getRandomTransaction(previous.wallets)
    if(result){
        previous['wallets'] = {...result.wallets}
        previous['transactions'] = [...previous['transactions'], {...result.transaction}]
    }

    return previous
}, initial)