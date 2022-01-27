import * as moment from 'moment'


const getDatesBetween = ( start: any, end: any ) => {

    let dateList = []

    let current = moment(start)
    const stopDate = moment(end)

    while(current.isSameOrBefore(stopDate)){
        dateList.push(current.format('YYYY-MM-DD'))
        current.add(1, 'days')
    }

     return dateList

}


export const createDateList = (transactions: string | any[]) => {

    if(transactions.length === 0) { return []}

    const startDate = moment(transactions[0]['Date'])
    const endDate = moment().format('YYYY-MM-DD')
    
    const dateList = getDatesBetween(startDate, endDate)

    return dateList
}