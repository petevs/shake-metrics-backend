import * as puppeteer from 'puppeteer'

const preparePageForTests = async (page: { setUserAgent: (arg0: string) => any; }) => {

    // Pass the User-Agent Test.
    const userAgent = 'Mozilla/5.0 (X11; Linux x86_64)' +
      'AppleWebKit/537.36 (KHTML, like Gecko) Chrome/64.0.3282.39 Safari/537.36';
    await page.setUserAgent(userAgent);
}

export const getShakepayPrice = async () => {


    const browser = await puppeteer.launch()
    const page = await browser.newPage()
    await preparePageForTests(page);
  
    await page.goto('https://shakepay.com')
  
    const textContent = await page.evaluate(() => {

          const BTC = document.querySelectorAll('.navbar-rates li a')[0]
          const ETH = document.querySelectorAll('.navbar-rates li a')[1]

          if (!(BTC instanceof HTMLElement)) {return}
          if (!(ETH instanceof HTMLElement)) {return}

          const prices = {
            BTC: BTC.innerText.replace(/[^\d\.]/g,''),
            ETH: ETH.innerText.replace(/[^\d\.]/g,'')
          }
          
          return prices
      })
  
    return textContent

    browser.close()
  
  }