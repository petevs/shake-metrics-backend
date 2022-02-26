import { checkInputs, getRandomDate, randomInt, randomNum, randomUsernames, Transaction } from "./helpers"

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

export const makeSale = ( wallets: any, historicalData: any ) => {

    const currencies = ['BTC', 'ETH']
    const currency : string = currencies[randomInt(0, currencies.length - 1)]
    const date = getRandomDate() || '2020-01-05'

    let buySellRate = undefined
    if(date in historicalData[currency]){
       buySellRate = historicalData[currency][date]
    }

    const maxAmount = Number(wallets[currency])

    if(maxAmount === 0){
        makeSale(wallets, historicalData)
        return
    }

    const amountCredited : any = randomNum(0, maxAmount).toString()

    if(amountCredited === 0){
        makeSale(wallets, historicalData)
        return
    }

    let amountDebited = undefined
    if(buySellRate !== undefined){
        amountDebited = buySellRate * Number(amountCredited)
    }

    const inputs : any = {
        transactionType: 'purchase/sale',
        date: date,
        amountDebited: amountDebited,
        debitCurrency: 'CAD',
        buySellRate: buySellRate,
        amountCredited: amountCredited,
        creditCurrency: currency,
        direction: 'sale'
    }

    const passedCheck = checkInputs(inputs)

    if(!passedCheck){
        makeSale(wallets, historicalData)
        return
    }

    const transaction = new Transaction(inputs)
    wallets['CAD'] += Number(transaction['Amount Debited'])
    wallets[currency] -= Number(transaction['Amount Credited'])

    return {
        transaction: transaction,
        wallets: wallets
    }

}


export const makeCryptoFunding = ( wallets : any) => {

    const currencies = ['BTC', 'ETH']
    const currency : string = currencies[randomInt(0, currencies.length - 1)]

    const inputs : any = {
        transactionType: 'crypto funding',
        date: getRandomDate(),
        amountCredited: randomNum(0.0005, 10).toString(),
        creditCurrency: currency,
        direction: 'credit',
    }

    const passedCheck = checkInputs(inputs)

    if(!passedCheck){
        makeCryptoFunding(wallets)
        return
    }

    const transaction = new Transaction(inputs)
    wallets['CAD'] += Number(transaction['Amount Credited'])

    return {
        transaction: transaction,
        wallets: wallets
    }
}

export const makeCryptoCashout = ( wallets : any ) => {

    const currencies = ['BTC', 'ETH']
    const currency : string = currencies[randomInt(0, currencies.length - 1)]

    const maxAmount = Number(wallets[currency])

    const inputs : any = {
        transactionType: 'crypto cashout',
        date: getRandomDate(),
        amountDebited: randomNum(0.0005, maxAmount).toString(),
        debitCurrency: currency,
        direction: 'debit',
    }

    const passedCheck = checkInputs(inputs)

    if(!passedCheck){
        makeCryptoCashout(wallets)
        return
    }

    const transaction = new Transaction(inputs)
    wallets[currency] -= Number(transaction['Amount Credited'])

    return {
        transaction: transaction,
        wallets: wallets
    }
}

const usernameList = randomUsernames()

export const makePeerSend = (wallets : any ) => {
    const currencies = ['BTC', 'ETH', 'CAD']
    const currency : string = currencies[randomInt(0, currencies.length - 1)]

    const maxAmount = Number(wallets[currency])

    const randomUser = usernameList[randomInt(0, usernameList.length - 1)]

    const inputs : any = {
        transactionType: 'peer transfer',
        date: getRandomDate(),
        amountDebited: randomNum(0.0005, maxAmount).toString(),
        debitCurrency: currency,
        direction: 'debit',
        sourceDestination: randomUser
    }

    const passedCheck = checkInputs(inputs)

    if(!passedCheck){
        makePeerSend(wallets)
        return
    }

    const transaction = new Transaction(inputs)
    wallets[currency] -= Number(transaction['Amount Credited'])

    return {
        transaction: transaction,
        wallets: wallets
    }

}

export const makePeerReceive = (wallets : any ) => {
    const currencies = ['BTC', 'ETH', 'CAD']
    const currency : string = currencies[randomInt(0, currencies.length - 1)]

    const maxAmount = () => {
        if(currency === 'CAD'){
            return 1000
        }
        return 10
    }
    
    const randomUser = usernameList[randomInt(0, usernameList.length - 1)]

    const inputs : any = {
        transactionType: 'peer transfer',
        date: getRandomDate(),
        amountCredited: randomNum(0.0005, maxAmount()).toString(),
        creditCurrency: currency,
        direction: 'credit',
        sourceDestination: randomUser,
    }

    const passedCheck = checkInputs(inputs)

    if(!passedCheck){
        makePeerReceive(wallets)
        return
    }

    const transaction = new Transaction(inputs)
    wallets[currency] += Number(transaction['Amount Credited'])

    return {
        transaction: transaction,
        wallets: wallets
    }

}