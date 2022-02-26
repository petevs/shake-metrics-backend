import * as moment from 'moment'

export const randomInt = ( min: number, max: number ) => {
    return Math.floor(Math.random() * ( max - min + 1 ) + min )
}

export const addLeadingZero = ( num : number ) => {
    if(num < 10){ return `0${num}`}
    return num
}

export const getRandomDate = () => {

    const currentDate = moment()
    const currentYear = currentDate.year()
    
    const randomYear = randomInt(2019, currentYear)
    const randomMonth = addLeadingZero(randomInt(1, 12))
    const maxDays = moment(`${randomYear}-${randomMonth}`).daysInMonth()
    const randomDay = addLeadingZero(randomInt(1, maxDays))

    const randomDate = `${randomYear}=${randomMonth}-${randomDay}`

    if(currentDate.isSameOrBefore(moment(randomDate)) || !moment(randomDate)){
        getRandomDate()
        return
    }

    else {
        return moment(randomDate).format('YYYY-MM-DD')
    }

}

export class Transaction {
    ['Transaction Type']: string
    ['Date']: string
    ['Amount Debited']: string
    ['Debit Currency']: string
    ['Amount Credited']: string
    ['Credit Currency']: string
    ['Buy / Sell Rate']: string
    ['Direction']: string
    ['Spot Rate']: string
    ['Source / Destination']: string
    ['Blockchain Transaction ID']: string
    constructor(inputs: { 
        transactionType: string,
        date: string,
        amountDebited: any,
        debitCurrency: string,
        amountCredited: any,
        creditCurrency: string,
        buySellRate: any,
        direction: string,
        spotRate: any,
        sourceDestination: string,
        blockchainID: string

    }) {
        this['Transaction Type'] = inputs.transactionType || ""
        this['Date'] = inputs.date || ""
        this['Amount Debited'] = inputs.amountDebited || ""
        this['Debit Currency'] = inputs.debitCurrency || ""
        this['Amount Credited'] = inputs.amountCredited || ""
        this['Credit Currency'] = inputs.creditCurrency || ""
        this['Buy / Sell Rate'] = inputs.buySellRate || ""
        this['Direction'] = inputs.direction || ""
        this['Spot Rate'] = inputs.spotRate || ""
        this['Source / Destination'] = inputs.sourceDestination || ""
        this['Blockchain Transaction ID'] = inputs.blockchainID || ""
    }
}

export const checkInputs = ( inputs: any ) => {
    let passedCheck = true
    for(const key in inputs){
        if(inputs[key] === undefined){
            passedCheck = false
            break
        }
    }
    return passedCheck
}