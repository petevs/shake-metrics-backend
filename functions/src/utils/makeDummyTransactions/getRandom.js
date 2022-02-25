import moment from 'moment'

export const randomInt = (min, max) => {
    return Math.floor(Math.random() * (max - min + 1) + min)
}

export const addLeadingZero = (num) => {
    if(num < 10){ return `0${num}`}
    return num
}

export const getRandomDate = () => {

    const currentDate = moment()
    const currentYear = currentDate.year()

    //Random year
    const randomYear = randomInt(2019, currentYear)
    const randomMonth = addLeadingZero(randomInt(1, 12))
    const maxDays = moment(`${randomYear}-${randomMonth}`).daysInMonth()
    const randomDay = addLeadingZero(randomInt(1, maxDays))
    const randomDate = `${randomYear}-${randomMonth}-${randomDay}`
      
    if(currentDate.isSameOrBefore(moment(randomDate)) || !moment(randomDate)){
        getRandomDate()
    }

    else {
        return moment(randomDate).format('YYYY-MM-DD')
    }

}