import { checkInputs, getRandomDate, randomInt, Transaction } from "./helpers"

export const makeFiatFunding = ( wallets : any ) => {

    const inputs : any = {
        transactionType: 'fiat funding',
        date: getRandomDate(),
        amountCredited: randomInt(5, 3000).toString(),
        creditCurrency: 'CAD',
        direction: 'credit',
        sourceDestination: 'bigshaker@domain.com'
    }

    const passedCheck = checkInputs(inputs)

    if(!passedCheck){
        makeFiatFunding(wallets)
        return
    }

    const transaction = new Transaction(inputs)
    wallets['CAD'] += Number(transaction['Amount Credited'])

    return {
        transaction: transaction,
        wallets: wallets
    }
}


export const makeFiatCashout = ( wallets: any ) => {

    const maxAmount : number = Math.floor(Number(wallets.CAD))

    const inputs : any = {
        transactionType: 'fiat cashout',
        date: getRandomDate(),
        amountDebited: randomInt(5, maxAmount).toString(),
        debitCurrency: 'CAD',
        direction: 'debit',
        sourceDestination: 'bigshaker@domain.com'
    }

    const passedCheck = checkInputs(inputs)

    if(!passedCheck){
        makeFiatCashout(wallets)
        return
    }

    const transaction = new Transaction(inputs)
    wallets['CAD'] -= Number(transaction['Amount Debited'])

    return {
        transaction: transaction,
        wallets: wallets
    }
}

export const makePurchase = ( wallets: any, historicalData: any ) => {

    const currencies = ['BTC', 'ETH']
    const currency : string = currencies[randomInt(0, currencies.length - 1)]
    const date = getRandomDate() || '2020-01-05'

    let buySellRate = undefined
    if(date in historicalData[currency]){
       buySellRate = historicalData[currency][date]
    }

    const maxAmount = Math.floor(Number(wallets.CAD))
    const amountDebited : any = randomInt(5, maxAmount).toString()

    let amountCredited = undefined
    if(buySellRate !== undefined){
        amountCredited = Number(amountDebited) / buySellRate
    }

    const inputs : any = {
        transactionType: 'purchase/sale',
        date: date,
        amountDebited: amountDebited,
        debitCurrency: 'CAD',
        buySellRate: buySellRate,
        amountCredited: amountCredited,
        creditCurrency: currency,
        direction: 'purchase'
    }

    const passedCheck = checkInputs(inputs)

    if(!passedCheck){
        makePurchase(wallets, historicalData)
        return
    }

    const transaction = new Transaction(inputs)
    wallets['CAD'] -= Number(transaction['Amount Debited'])
    wallets[currency] += Number(transaction['Amount Credited'])

    return {
        transaction: transaction,
        wallets: wallets
    }

}