const puppeteer = require('puppeteer')
const jestpkg = require('jest')
const config = require('../lib/config')
const click = require('../lib/helpers').click
const typeText = require('../lib/helpers').typeText
const loadUrl = require('../lib/helpers').loadUrl
const waitForText = require('../lib/helpers').waitForText
const pressKey = require('../lib/helpers').pressKey
const shouldExist = require('../lib/helpers').shouldExist
const shouldNotExist = require('../lib/helpers').shouldNotExist
const dragAndDrop = require('../lib/helpers').dragAndDrop

//const utils = require('../lib/utils')

describe('Test the delete of an existing template feature of Apache Nifi service', () => {  
    /** @type {puppeteer.Browser} */
    let browser

    /** @type {puppeteer.Page} */
    let page 
    
    beforeAll(async function () {
        browser = await puppeteer.launch({
            headless: config.isHeadless,
            slowMo: config.slowMo,
            devtools: config.isDevtools,
            timeout: config.launchTimeout,
            args: ['--no-sandbox']
        })
        page = await browser.newPage()
        await page.setDefaultNavigationTimeout(config.waitingTimeout) //10 seconds is the industry standard
        await page.setViewport({
            width: config.viewportWidth,
            height: config.viewportHeight
        })
    })
    afterAll(async function () {
        await browser.close()
    })
    it('should show the Nifi dashboard', async () => {
        // Go to the indicated page 
        await page.goto('http://nifi.newtech4steel.cetic.be')
        // Check that the nifi logo appears
        await shouldExist(page, '#nifi-logo')
    })

    it('access to the Nifi menu ', async () => {
        await shouldExist(page, '#global-menu-button')
        await click(page, '#global-menu-button')
    })

    it('click on the Templates views ', async () => {
        await shouldExist(page, '#templates-link')
        await click(page, '#templates-link')
    })

    it('Access to the Templates views ', async () => {
        // check the loading of the Templates frame
        await shouldExist(page, '#shell-iframe')

        const element = await page.$("#shell-iframe");
        const text = await (await element.getProperty('src')).jsonValue()
        //console.log( await (await element.getProperty('style')).jsonValue())
        await page.goto(text)
        
        
        
        // const element2 = await page.$$('#templates > #templates-table > .slick-viewport > .grid-canvas > .ui-widget-content')
        
        // // console.log(deletee[4])
        // // await shouldExist(page, await deletee[4].$('.prompt-to-delete-template'))
        // await click (page, '#templates > #templates-table > .slick-viewport > .grid-canvas > .ui-widget-content:nth-child(2) > .slick-cell > .pointer:nth-child(2)')
        // const templates = await page.$$('#templates > #templates-table > .slick-viewport > .grid-canvas > .ui-widget-content')
        // //console.log(templates)
        // console.log(await templates[0].asElement().nodes);
        // //console.log(await templates[1].getProperties());
        
        // await page.waitFor(5000)
        
    })

    // it('delete the existing template ', async () => {
    //     await page.waitForSelector('.slick-viewport > .grid-canvas > .ui-widget-content:nth-child(1) > .slick-cell > .pointer:nth-child(2)')
    //     await page.click('.slick-viewport > .grid-canvas > .ui-widget-content:nth-child(1) > .slick-cell > .pointer:nth-child(2)')
  
    //     await page.waitForSelector('body > #nf-yes-no-dialog > .dialog-buttons > .button:nth-child(1) > span')
    //     await page.click('body > #nf-yes-no-dialog > .dialog-buttons > .button:nth-child(1) > span')
  
    //     await page.waitForSelector('#shell-dialog > #shell-container > #shell-close-container > #shell-close-button > .fa')
    //     await page.click('#shell-dialog > #shell-container > #shell-close-container > #shell-close-button > .fa')
    // })

})

describe('Test the upload template feature of Apache Nifi service', () => {  
    /** @type {puppeteer.Browser} */
    let browser

    /** @type {puppeteer.Page} */
    let page 
    
    beforeAll(async function () {
        browser = await puppeteer.launch({
            headless: config.isHeadless,
            slowMo: config.slowMo,
            devtools: config.isDevtools,
            timeout: config.launchTimeout,
            args: ['--no-sandbox']
        })
        page = await browser.newPage()
        await page.setDefaultNavigationTimeout(config.waitingTimeout) //10 seconds is the industry standard
        await page.setViewport({
            width: config.viewportWidth,
            height: config.viewportHeight
        })
    })
    afterAll(async function () {
        await browser.close()
    })
    it('should show the Nifi dashboard', async () => {
        // Go to the indicated page 
        await page.goto('http://nifi.newtech4steel.cetic.be')
        // Check that the nifi logo appears
        await shouldExist(page, '#nifi-logo')
    })

    it('click the template uploader', async () => {
        // check that the Operate frame appears
        await shouldExist(page, '#operation-control')
        // click on the 'Upload Template' button
        await click(page, '#operate-template-upload')
    })

    it('select the template to upload', async () => {
        // check that the upload template dialog appears
        await shouldExist(page, '#upload-template-dialog')
        
        // select the approapriate template
        const [fileChooser] = await Promise.all([
            page.waitForFileChooser(),
            page.click('#select-template-button'), // some button that triggers file selection
            ]);
        await fileChooser.accept(['/builds/newtech4steel/setup/tests/files/basic_example_final_template.xml']);
    })

    it('upload the chosen template', async () => {
        // click on the 'upload' button
        await page.click('#canvas-body > #upload-template-dialog > .dialog-buttons > .button:nth-child(1)')
    })
    //fixme verify unable to upload. 
    it('confirm the upload of the template', async () => {
        // check if the success upload template dialog appears
        await shouldExist(page, "#nf-ok-dialog")

        // check that the success message appears
        const shownMessage = await page.evaluate(() => {
            const string = 'Success';
            const selector = '#canvas-body > #nf-ok-dialog > .dialog-header > .dialog-header-text';
            return document.querySelector(selector).innerText.includes(string);
        });
        expect(shownMessage).toBe(true);
    })
})