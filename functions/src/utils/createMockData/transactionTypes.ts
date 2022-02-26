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