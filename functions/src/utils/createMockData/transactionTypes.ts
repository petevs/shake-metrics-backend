import { checkInputs, randomInt, randomNum, randomUsernames, Transaction } from "./helpers"
import * as moment from 'moment'

export const makeFiatFunding : Function = ( date: any, wallets : any ) => {

    const inputs : any = {
        transactionType: 'fiat funding',
        date: date,
        amountCredited: randomInt(5, 3000).toString(),
        creditCurrency: 'CAD',
        direction: 'credit',
        sourceDestination: 'bigshaker@domain.com'
    }

    const passedCheck = checkInputs(inputs)

    if(!passedCheck){
        return makeFiatFunding( date, wallets)
    }

    const transaction = new Transaction(inputs)
    wallets['CAD'] += Number(transaction['Amount Credited'])

    return {
        transaction: transaction,
        wallets: wallets
    }
}


export const makeFiatCashout : Function = ( date: any,wallets: any ) => {

    const maxAmount : number = Math.floor(Number(wallets.CAD))

    const inputs : any = {
        transactionType: 'fiat cashout',
        date: date,
        amountDebited: randomInt(5, maxAmount).toString(),
        debitCurrency: 'CAD',
        direction: 'debit',
        sourceDestination: 'bigshaker@domain.com'
    }

    const passedCheck = checkInputs(inputs)

    if(!passedCheck){
        return makeFiatCashout(date, wallets)
    }

    const transaction = new Transaction(inputs)
    wallets['CAD'] -= Number(transaction['Amount Debited'])

    return {
        transaction: transaction,
        wallets: wallets
    }
}

export const makePurchase : Function = ( date: any, wallets: any, historicalData: any ) => {

    const currencies = ['BTC', 'ETH']
    const currency : string = currencies[randomInt(0, currencies.length - 1)]

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
        return makePurchase(date, wallets, historicalData)
    }

    const transaction = new Transaction(inputs)
    wallets['CAD'] -= Number(transaction['Amount Debited'])
    wallets[currency] += Number(transaction['Amount Credited'])

    return {
        transaction: transaction,
        wallets: wallets
    }

}

export const makeSale : Function = ( date: any, wallets: any, historicalData: any ) => {

    const currencies = ['BTC', 'ETH']
    const currency : string = currencies[randomInt(0, currencies.length - 1)]

    let buySellRate = undefined
    if(date in historicalData[currency]){
       buySellRate = historicalData[currency][date]
    }

    const maxAmount = Number(wallets[currency])

    const amountDebited : any = randomNum(0.0001, maxAmount).toString()

    let amountCredited = undefined
    if(buySellRate !== undefined){
        amountCredited = buySellRate * Number(amountDebited)
    }

    const inputs : any = {
        transactionType: 'purchase/sale',
        date: date,
        amountDebited: amountDebited,
        debitCurrency: currency,
        buySellRate: buySellRate,
        amountCredited: amountCredited,
        creditCurrency: 'CAD',
        direction: 'sale'
    }

    const passedCheck = checkInputs(inputs)

    if(!passedCheck){
        return makeSale(date, wallets, historicalData)
    }

    const transaction = new Transaction(inputs)
    wallets['CAD'] += Number(transaction['Amount Credited'])
    wallets[currency] -= Number(transaction['Amount Debited'])

    return {
        transaction: transaction,
        wallets: wallets
    }

}


export const makeCryptoFunding : Function = ( date: any, wallets : any, historicalData : any) => {

    const currencies = ['BTC', 'ETH']
    const currency : string = currencies[randomInt(0, 1)]

    const spotRate = historicalData[currency][date]


    const inputs : any = {
        transactionType: 'crypto funding',
        date: date,
        amountCredited: randomNum(0.0005, .01).toString(),
        creditCurrency: currency,
        spotRate: spotRate,
        direction: 'credit',
    }

    const passedCheck = checkInputs(inputs)

    if(!passedCheck){
        return makeCryptoFunding(date, wallets, historicalData)
    }

    const transaction = new Transaction(inputs)
    wallets[currency] += Number(transaction['Amount Credited'])

    return {
        transaction: transaction,
        wallets: {
            CAD: wallets.CAD,
            BTC: wallets.BTC,
            ETH: wallets.ETH
        }
    }
}

export const makeCryptoCashout : Function = ( date: any, wallets : any, historicalData : any ) => {

    const currencies = ['BTC', 'ETH']
    const currency : string = currencies[randomInt(0, currencies.length - 1)]

    const maxAmount = Number(wallets[currency])

    const spotRate = historicalData[currency][date]

    const inputs : any = {
        transactionType: 'crypto cashout',
        date: date,
        amountDebited: randomNum(0.0005, maxAmount).toString(),
        spotRate: spotRate,
        debitCurrency: currency,

        direction: 'debit',
    }

    const passedCheck = checkInputs(inputs)

    if(!passedCheck){
        return makeCryptoCashout(date, wallets, historicalData)
    }

    const transaction = new Transaction(inputs)
    wallets[currency] -= Number(transaction['Amount Credited'])

    return {
        transaction: transaction,
        wallets: wallets
    }
}

const usernameList = randomUsernames()

export const makePeerSend : Function = (date: any, wallets : any, historicalData : any ) => {
    // const currencies = ['BTC', 'ETH', 'CAD']
    // const currency : string = currencies[randomInt(0, currencies.length - 1)]

    const currency = 'CAD'

    const maxAmount = Number(wallets[currency])

    const randomUser = usernameList[randomInt(0, usernameList.length - 1)]

    // let spotRate = ''

    // if(currency === 'BTC' || currency === 'ETH'){
    //     spotRate = historicalData[currency][date]
    // }


    const inputs : any = {
        transactionType: 'peer transfer',
        date: date,
        amountDebited: randomNum(0.0005, maxAmount).toString(),
        debitCurrency: currency,
        direction: 'debit',
        // spotRate: spotRate,
        sourceDestination: randomUser
    }

    const passedCheck = checkInputs(inputs)

    if(!passedCheck){
        return makePeerSend(date, wallets, historicalData)
    }

    const transaction = new Transaction(inputs)
    wallets[currency] -= Number(transaction['Amount Debited'])

    return {
        transaction: transaction,
        wallets: wallets
    }

}

export const makePeerReceive : Function = (date: any, wallets : any, historicalData : any ) => {
    // const currencies = ['BTC', 'ETH', 'CAD']
    // const currency : string = currencies[randomInt(0, currencies.length - 1)]

    // let spotRate = ''

    // if(currency === 'BTC' || currency === 'ETH'){
    //     spotRate = historicalData[currency][date]
    // }

    const currency : string = 'CAD'

    const maxAmount = () => {
        if(currency === 'CAD'){
            return 30
        }
        return 0.002
    }
    
    const randomUser = usernameList[randomInt(0, usernameList.length - 1)]

    const inputs : any = {
        transactionType: 'peer transfer',
        date: date,
        amountCredited: randomNum(0.0005, maxAmount()).toString(),
        creditCurrency: currency,
        direction: 'credit',
        // spotRate: spotRate,
        sourceDestination: randomUser,
    }

    const passedCheck = checkInputs(inputs)

    if(!passedCheck){
        return makePeerReceive(date, wallets, historicalData)
    }

    const transaction = new Transaction(inputs)
    wallets[currency] += Number(transaction['Amount Credited'])

    return {
        transaction: transaction,
        wallets: wallets
    }

}


export const makeCardTransaction : Function = ( date: any, wallets: any, historicalData : any ) => {

    const maxAmount = Number(wallets['CAD'])

    const inputs : any = {
        transactionType: 'card transactions',
        date: date,
        amountDebited: randomNum(0, maxAmount).toString(),
        debitCurrency: 'CAD',
        direction: 'debit',
        sourceDestination: 'STORE'
    }

    const passedCheck = checkInputs(inputs)

    if(!passedCheck){
        return makeCardTransaction( date, wallets, historicalData)
    }

    const transaction = new Transaction(inputs)
    wallets['CAD'] -= Number(transaction['Amount Debited'])

    return {
        transaction: transaction,
        wallets: wallets
    }

}

export const makeCardCashback : Function = ( cardTransaction: any, historicalData : any ) => {

    const transactionAmount = cardTransaction['Amount Debited']
    const transactionDate = cardTransaction['Date']

    const cashbackDate = moment(transactionDate).add(1, 'days').format('YYYY-MM-DD')
    const cashbackAmountDollars = Number(transactionAmount) * .01
    const spotRate = historicalData['BTC'][cashbackDate]
    const cashbackBitcoin = cashbackAmountDollars / spotRate

    const inputs : any = {
            transactionType: 'card cashbacks',
            date: cashbackDate,
            amountCredited: cashbackBitcoin,
            creditCurrency: 'BTC',
            direction: 'credit',
            spotRate: spotRate,
            sourceDestination: '@cashbacks'
    }

    const passedCheck = checkInputs(inputs)

    if(!passedCheck){
        return makeCardCashback(cardTransaction, historicalData)
    }

    const transaction = new Transaction(inputs)

    return transaction


}

export const makeShakingSats = ( date: any, historicalData : any ) => {

    const spotRate = historicalData['BTC'][date]
    const amountCredited = 0.05 / spotRate

    const inputs : any = {
        transactionType: 'shakingsats',
        date: date,
        amountCredited: amountCredited,
        creditCurrency: 'BTC',
        direction: 'credit',
        spotRate: spotRate,
    }

    const transaction = new Transaction(inputs)

    return transaction

}