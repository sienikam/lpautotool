/**
* lpautotool.js
* LivePerson Automation Tool
*
*
* @license The Unlicense, http://unlicense.org/
* @version 0.2
* @author  Kamil Sienicki
*
*/

const requestImageSize = require('request-image-size');
const puppeteer = require('puppeteer');
var csv = require('csv-parser');
var fs = require('fs');
var csv_data = [];
var siteNumber = "SITE NUMBER";
var userName = "USERNAME";
var lpPass = "PASSWORD";
var lp_loginpage = "https://authentication.liveperson.net/login.html?servicepath=a%2F~~accountid~~%2F%23%2C~~ssokey~~%3Bmarketer%21campaigns%2Fweb&lpservice=liveEngage";
var campaignName = "CAMPAIGN NAME";
var engagementWindow = "ENGAGEMENT WINDOW";
var timeout = 7000; // change if needed (depend on liveperson server speed)
var imageSize; // external image size
var closeButton_overlay = "250"; // position left of close button image for overlay type

console.log("[!] Reading CSV data.. \n");

(async() => {
	var stream = csv({
	raw: false,     // do not decode to utf-8 strings
	separator: ';', // specify optional cell separator
	quote: '"',     // specify optional quote character
	escape: '"',    // specify optional escape character (defaults to quote value)
	newline: '\n',  // specify a newline character
	strict: true    // require column length match headers length
})

fs.createReadStream('VWPW.csv')
.pipe(stream)
.on('data', function (data) {
	csv_data.push(data);
}).on('end', function (data) {
	console.log(csv_data);
	console.log("\n");
}).on('error', function(error){
	console.log('Error:', error.message);
});

const browser = await puppeteer.launch({headless: false, slowMo: 10, devtools: false});
const page = await browser.newPage();
await page.setViewport({
	width: 1024, height:768,
	deviceScaleFactor: 2
});
await page.goto(lp_loginpage);
console.log("[!] Logging into LivePerson..");
await page.type('#siteNumber', siteNumber); // account number
await page.type('#userName', userName); // username
await page.type('#sitePass', lpPass); // password
await page.click('#submitButtonWrapper > input'); // press login button
await page.waitForXPath('/html/body/div[1]/div[1]/div[5]/div/div/div[5]/div/div/div/div/div/div[1]/div/div[2]/span'); // wait for list of campaigns
console.log("[!] Logged in: "+userName);
await page.click('body > div.root > div:nth-child(1) > div.main-wrapper > div > div > div.le.bubble-component-container.interaction-area-item-wrapper.interaction-area-transition.campaigns-wrapper.open > div > div > div > div > div > div.page-inside-view-container.content-width-full.with-description.with-footer > div > div.page-view-container > div.campaign-web-list-paging-container > div > div.paging > div.button-container.paging-next > button') // click on next page button
await page.waitFor(500); // wait to show campaign list
const Campaign_div = (await page.$x("//div[contains(text(), '"+campaignName+"')]"))[0];
await Campaign_div.click();
console.log("[!] Campaign: "+campaignName);
await page.waitFor(1000); // wait for slider..
await page.click('body > div.root > div:nth-child(1) > div.le.bubble-component-container.connection-bar-wrapper.connection-panel-wrapper > div > div > div.connection-panel-container > div.main-container-region > div > div.profile-region > div > div.cp-close-wrapper > div > div'); // hide slider..
await page.waitFor(1000); // wait for slider to hide
console.log("[!] Ready for creating engagements..")
for(i=0;i<csv_data.length;i++) {
	requestImageSize(csv_data[i].Image_URL)
	.then(size => imageSize = size);
	var position_type = csv_data[i].Format.toLowerCase(); // normalize format type overlay or sticky - needed for selector as it's dynamic
	await page.waitForXPath('/html/body/div[1]/div[1]/div[5]/div/div/div[5]/div/div/div/div[2]/div/div/div[2]/div[2]/div[1]/div[1]/div[1]/div/div[2]/div[1]/div[1]/h6'); // // wait for campaign ready
	await page.click('body > div.root > div:nth-child(1) > div.main-wrapper > div > div > div.le.bubble-component-container.interaction-area-item-wrapper.interaction-area-transition.campaigns-wrapper.open > div > div > div > div.page.custom-page > div > div > div.details-container > div.main-details > div.engagements-section-container > div > div.new-engagement-button-container > div > div.inner-wrapper > div.new-engagement-button > button > span') // click on add engagement
	await page.waitFor(timeout); // wait for list of engagement ready
	await page.click('body > div.root > div:nth-child(1) > div.main-wrapper > div > div > div.le.bubble-component-container.interaction-area-item-wrapper.interaction-area-transition.campaigns-wrapper.open > div > div > div > div.page.custom-page > div > div > div.details-container > div.main-details > div.engagements-section-container > div > div.new-engagement-button-container > div > div.inner-wrapper > div.sources-list-container > ul > li.source-item.first > div.source-image-container > center > img'); // click on web engagement
	await page.waitForXPath('/html/body/div[1]/div[1]/div[5]/div/div/div[5]/div/div/div/div[2]/div[2]/div[3]/div/div[2]/div[2]/div[3]/button/span'); // wait for engagement template gallery
	switch(csv_data[i].Format) {
    case "Overlay":
        await page.click('body > div.root > div:nth-child(1) > div.main-wrapper > div > div > div.le.bubble-component-container.interaction-area-item-wrapper.interaction-area-transition.campaigns-wrapper.open > div > div > div > div.page.dialog-page > div.dialog-page-layout > div.page-inside-view-container.with-description > div > div.view-container.engagement-gallery > div > div.view-gallery-header > div.filter.type > div.engagement-type-filter > div > div > button') // click on type of engagements
		await page.keyboard.press('ArrowDown'); // choose overlay
		await page.keyboard.press('Enter'); // confirm
		await page.click('body > div.root > div:nth-child(1) > div.main-wrapper > div > div > div.le.bubble-component-container.interaction-area-item-wrapper.interaction-area-transition.campaigns-wrapper.open > div > div > div > div.page.dialog-page > div.dialog-page-layout > div.page-inside-view-container.with-description > div > div.view-container.engagement-gallery > div > div.view-gallery-list.browser-scroll.light.scroll-fixed > div > div > ul > li:nth-child(2) > div > span'); // click on design your own
        break;
    case "Sticky":
        // no need because sticky is default option in LiveEngage UI
        break;
	}
	await page.click('body > div.root > div:nth-child(1) > div.main-wrapper > div > div > div.le.bubble-component-container.interaction-area-item-wrapper.interaction-area-transition.campaigns-wrapper.open > div > div > div > div.page.dialog-page > div.dialog-page-layout > div.page-inside-view-container.with-description > div > div.page-footer.engagement-template-gallery-page-footer > div.buttons-container > div.button-next > button > span'); // click on next
	await page.waitForXPath('/html/body/div[1]/div[1]/div[5]/div/div/div[5]/div/div/div/div[2]/div[2]/div[3]/div/div[1]/div/div/div[1]/div[1]'); // wait for engagement settings
	await page.waitFor(2000); // waiting anyway..
	await page.click('body > div.root > div:nth-child(1) > div.main-wrapper > div > div > div.le.bubble-component-container.interaction-area-item-wrapper.interaction-area-transition.campaigns-wrapper.open > div > div > div > div.page.dialog-page > div.dialog-page-layout > div.page-inside-view-container.with-description > div > div.view-container.engagement-settings > div > div > div.conversation-type-container > div.conversation-types-container > div > button') // click on conversation type
	await page.keyboard.press('ArrowDown'); // choose LiveChat
	await page.keyboard.press('Enter'); // confirm
    await page.click('body > div.root > div:nth-child(1) > div.main-wrapper > div > div > div.le.bubble-component-container.interaction-area-item-wrapper.interaction-area-transition.campaigns-wrapper.open > div > div > div > div.page.dialog-page > div.dialog-page-layout > div.page-inside-view-container.with-description > div > div.view-container.engagement-settings > div > div > div.skills-panel > div.skills-wrapper > ul > li:nth-child(2) > span'); // click on specific skill
	await page.type('body > div.root > div:nth-child(1) > div.main-wrapper > div > div > div.le.bubble-component-container.interaction-area-item-wrapper.interaction-area-transition.campaigns-wrapper.open > div > div > div > div.page.dialog-page > div.dialog-page-layout > div.page-inside-view-container.with-description > div > div.view-container.engagement-settings > div > div > div.skills-panel > div.specific-skill > div.specific-input-container > div > div.input-field-container > input', csv_data[i].Skill); // type skill
	await page.keyboard.press('Enter'); // confirm
    await page.click('body > div.root > div:nth-child(1) > div.main-wrapper > div > div > div.le.bubble-component-container.interaction-area-item-wrapper.interaction-area-transition.campaigns-wrapper.open > div > div > div > div.page.dialog-page > div.dialog-page-layout > div.page-inside-view-container.with-description > div > div.view-container.engagement-settings > div > div > div.language-panel > div.language-row > div.language-options > div > div > button') // click on language option list
	const Language_div = (await page.$x("//div[contains(text(), '"+csv_data[i].Language+"')]"))[0]; // search for language in csv data
	await Language_div.click();
	await page.click('body > div.root > div:nth-child(1) > div.main-wrapper > div > div > div.le.bubble-component-container.interaction-area-item-wrapper.interaction-area-transition.campaigns-wrapper.open > div > div > div > div.page.dialog-page > div.dialog-page-layout > div.page-inside-view-container.with-description > div > div.page-footer.engagement-settings-page-footer > div.buttons-container > div.button-next > button > span'); // click on next
	await page.waitForXPath('/html/body/div[1]/div[1]/div[5]/div/div/div[5]/div/div/div/div[2]/div[2]/div[2]/div/div[2]/span'); // wait for engagement studio
	await page.waitFor(timeout); // wait for engagement studio (later change it it waitForXPath)
	if(csv_data[i].Format == "Sticky" && csv_data[i].Ignore_Max_Wait_Time) { // check if engagement format is sticky and if ignore max wait time is true
		await page.click('body > div.root > div:nth-child(1) > div.main-wrapper > div > div > div.le.bubble-component-container.interaction-area-item-wrapper.interaction-area-transition.campaigns-wrapper.open > div > div > div > div.page.dialog-page > div.dialog-page-layout > div.page-inside-view-container.with-description > div > div.view-container.engagement-studio > div > div.toolbar-region > div > div.toolbar-menu > ul > li.toolbar-dropdown.state > div > div > button') // click on dropdown menu
		await page.click('body > div.root > div:nth-child(1) > div.main-wrapper > div > div > div.le.bubble-component-container.interaction-area-item-wrapper.interaction-area-transition.campaigns-wrapper.open > div > div > div > div.page.dialog-page > div.dialog-page-layout > div.page-inside-view-container.with-description > div > div.view-container.engagement-studio > div > div.toolbar-region > div > div.toolbar-menu > ul > li.toolbar-dropdown.state > div > div > div > table > tbody > tr:nth-child(3) > td.cell.status-container > div > div > div') // click on deactivate offline survey
		await page.click('body > div.root > div:nth-child(1) > div.main-wrapper > div > div > div.le.bubble-component-container.interaction-area-item-wrapper.interaction-area-transition.campaigns-wrapper.open > div > div > div > div.page.dialog-page > div.dialog-page-layout > div.page-inside-view-container.with-description > div > div.view-container.engagement-studio > div > div.toolbar-region > div > div.toolbar-menu > ul > li.toolbar-dropdown.state > div > div > div > div > div.ignore-max-wait-time-container > div.ignore-max-wait-time-checkbox-container > div > button') // click on Ignore Max Wait Time
	}
	if(csv_data[i].Format == "Sticky") {
		await page.click('body > div.root > div:nth-child(1) > div.main-wrapper > div > div > div.le.bubble-component-container.interaction-area-item-wrapper.interaction-area-transition.campaigns-wrapper.open > div > div > div > div.page.dialog-page > div.dialog-page-layout > div.page-inside-view-container.with-description > div > div.view-container.engagement-studio > div > div.toolbar-region > div > div.toolbar-menu > ul > li.toolbar-dropdown.state > div > div > div > div > div.refresh-rate-container > div.refresh-rate-checkbox-container > div > button') // click on refresh engagement
		await page.click('body > div.root > div:nth-child(1) > div.main-wrapper > div > div > div.le.bubble-component-container.interaction-area-item-wrapper.interaction-area-transition.campaigns-wrapper.open > div > div > div > div.page.dialog-page > div.dialog-page-layout > div.page-inside-view-container.with-description > div > div.view-container.engagement-studio > div > div.toolbar-region > div > div.toolbar-menu > ul > li.toolbar-dropdown.state > div > div > div > div > div.refresh-rate-container > div.refresh-rate-list-container > div > div > button') // click on 120 sec button
			switch(csv_data[i].Refresh_Engagement) {
			case "30":
				await page.click('body > div.root > div:nth-child(1) > div.main-wrapper > div > div > div.le.bubble-component-container.interaction-area-item-wrapper.interaction-area-transition.campaigns-wrapper.open > div > div > div > div.page.dialog-page > div.dialog-page-layout > div.page-inside-view-container.with-description > div > div.view-container.engagement-studio > div > div.toolbar-region > div > div.toolbar-menu > ul > li.toolbar-dropdown.state > div > div > div > div > div.refresh-rate-container > div.refresh-rate-list-container > div > div > ul > li:nth-child(1) > div.dropdown-li-value') // click on 30 seconds
			break;
			case "60":
				await page.click('body > div.root > div:nth-child(1) > div.main-wrapper > div > div > div.le.bubble-component-container.interaction-area-item-wrapper.interaction-area-transition.campaigns-wrapper.open > div > div > div > div.page.dialog-page > div.dialog-page-layout > div.page-inside-view-container.with-description > div > div.view-container.engagement-studio > div > div.toolbar-region > div > div.toolbar-menu > ul > li.toolbar-dropdown.state > div > div > div > div > div.refresh-rate-container > div.refresh-rate-list-container > div > div > ul > li:nth-child(2) > div.dropdown-li-value') // click on 60 seconds
			break;
			case "90":
				await page.click('body > div.root > div:nth-child(1) > div.main-wrapper > div > div > div.le.bubble-component-container.interaction-area-item-wrapper.interaction-area-transition.campaigns-wrapper.open > div > div > div > div.page.dialog-page > div.dialog-page-layout > div.page-inside-view-container.with-description > div > div.view-container.engagement-studio > div > div.toolbar-region > div > div.toolbar-menu > ul > li.toolbar-dropdown.state > div > div > div > div > div.refresh-rate-container > div.refresh-rate-list-container > div > div > ul > li:nth-child(3) > div.dropdown-li-value') // click on 90 seconds
			break;
			case "120":
				await page.click('body > div.root > div:nth-child(1) > div.main-wrapper > div > div > div.le.bubble-component-container.interaction-area-item-wrapper.interaction-area-transition.campaigns-wrapper.open > div > div > div > div.page.dialog-page > div.dialog-page-layout > div.page-inside-view-container.with-description > div > div.view-container.engagement-studio > div > div.toolbar-region > div > div.toolbar-menu > ul > li.toolbar-dropdown.state > div > div > div > div > div.refresh-rate-container > div.refresh-rate-list-container > div > div > ul > li:nth-child(4) > div.dropdown-li-value') // click on 120 seconds
			break;
			case "150":
				await page.click('body > div.root > div:nth-child(1) > div.main-wrapper > div > div > div.le.bubble-component-container.interaction-area-item-wrapper.interaction-area-transition.campaigns-wrapper.open > div > div > div > div.page.dialog-page > div.dialog-page-layout > div.page-inside-view-container.with-description > div > div.view-container.engagement-studio > div > div.toolbar-region > div > div.toolbar-menu > ul > li.toolbar-dropdown.state > div > div > div > div > div.refresh-rate-container > div.refresh-rate-list-container > div > div > ul > li:nth-child(5) > div.dropdown-li-value') // click on 150 seconds
			break;
		}
	}
	await page.click('body > div.root > div:nth-child(1) > div.main-wrapper > div > div > div.le.bubble-component-container.interaction-area-item-wrapper.interaction-area-transition.campaigns-wrapper.open > div > div > div > div.page.dialog-page > div.dialog-page-layout > div.page-inside-view-container.with-description > div > div.view-container.engagement-studio > div > div.toolbar-region > div > div.toolbar-menu > ul > li.toolbar-action.placement > button'); // click on select size & placement
	await page.waitFor(500) // wait half second before click on selected position
	switch(csv_data[i].Position) {
    case "Bottom_Right":
        await page.click('body > div.root > div:nth-child(1) > div.main-wrapper > div > div > div.le.bubble-component-container.interaction-area-item-wrapper.interaction-area-transition.campaigns-wrapper.open > div > div > div > div.page.dialog-page > div.dialog-page-layout > div.page-inside-view-container.with-description > div > div.view-container.engagement-studio > div > div.toolbar-region > div > div.toolbar-menu > div > div > div.menu-item-content > div > div.engagement-position.'+position_type+' > div > div > div.position-wrap > ol > li.position.bottom.right'); // click on bottom right place of engagement 
        break;
    case "Center":
        // default
        break;
	}
	await page.waitFor(1000); // wait some time on position window
	switch(csv_data[i].Format) {
    case "Sticky":
		await page.click('body > div.root > div:nth-child(1) > div.main-wrapper > div > div > div.le.bubble-component-container.interaction-area-item-wrapper.interaction-area-transition.campaigns-wrapper.open > div > div > div > div.page.dialog-page > div.dialog-page-layout > div.page-inside-view-container.with-description > div > div.view-container.engagement-studio > div > div.stage-region > div > div > div.engagement.sticky'); // click on default image
		await page.click('body > div.root > div:nth-child(1) > div.main-wrapper > div > div > div.le.bubble-component-container.interaction-area-item-wrapper.interaction-area-transition.campaigns-wrapper.open > div > div > div > div.page.dialog-page > div.dialog-page-layout > div.page-inside-view-container.with-description > div > div.view-container.engagement-studio > div > div.property-boxes-region > div > div > div.property-box-content > div.img-url.url-property > div.img-url-line > div.input-image-url > input', {clickCount: 3}); // click on input type
		await page.keyboard.press('Backspace'); // clear url for image
		await page.type('body > div.root > div:nth-child(1) > div.main-wrapper > div > div > div.le.bubble-component-container.interaction-area-item-wrapper.interaction-area-transition.campaigns-wrapper.open > div > div > div > div.page.dialog-page > div.dialog-page-layout > div.page-inside-view-container.with-description > div > div.view-container.engagement-studio > div > div.property-boxes-region > div > div > div.property-box-content > div.img-url.url-property > div.img-url-line > div.input-image-url > input', csv_data[i].Image_URL); // type url for image
        await page.click('body > div.root > div:nth-child(1) > div.main-wrapper > div > div > div.le.bubble-component-container.interaction-area-item-wrapper.interaction-area-transition.campaigns-wrapper.open > div > div > div > div.page.dialog-page > div.dialog-page-layout > div.page-inside-view-container.with-description > div > div.view-container.engagement-studio > div > div.property-boxes-region > div > div > div.property-box-content > div.img-url.url-property > div.img-url-line > div.apply > button'); // click on apply image (refresh)
		await page.click('body > div.root > div:nth-child(1) > div.main-wrapper > div > div > div.le.bubble-component-container.interaction-area-item-wrapper.interaction-area-transition.campaigns-wrapper.open > div > div > div > div.page.dialog-page > div.dialog-page-layout > div.page-inside-view-container.with-description > div > div.view-container.engagement-studio > div > div.property-boxes-region > div > div > div.property-box-content > div.position-zindex-container > div.img-position.position-property > div.left-wrapper > div > input'); // click on position left
		await page.keyboard.press('Backspace'); // clear left
		await page.type('body > div.root > div:nth-child(1) > div.main-wrapper > div > div > div.le.bubble-component-container.interaction-area-item-wrapper.interaction-area-transition.campaigns-wrapper.open > div > div > div > div.page.dialog-page > div.dialog-page-layout > div.page-inside-view-container.with-description > div > div.view-container.engagement-studio > div > div.property-boxes-region > div > div > div.property-box-content > div.position-zindex-container > div.img-position.position-property > div.left-wrapper > div > input', csv_data[i].Position_Left); // type position left
		await page.click('body > div.root > div:nth-child(1) > div.main-wrapper > div > div > div.le.bubble-component-container.interaction-area-item-wrapper.interaction-area-transition.campaigns-wrapper.open > div > div > div > div.page.dialog-page > div.dialog-page-layout > div.page-inside-view-container.with-description > div > div.view-container.engagement-studio > div > div.property-boxes-region > div > div > div.property-box-content > div.position-zindex-container > div.img-position.position-property > div.top-wrapper > div > input'); // click on top
		await page.keyboard.press('Backspace'); // clear top
		await page.type('body > div.root > div:nth-child(1) > div.main-wrapper > div > div > div.le.bubble-component-container.interaction-area-item-wrapper.interaction-area-transition.campaigns-wrapper.open > div > div > div > div.page.dialog-page > div.dialog-page-layout > div.page-inside-view-container.with-description > div > div.view-container.engagement-studio > div > div.property-boxes-region > div > div > div.property-box-content > div.position-zindex-container > div.img-position.position-property > div.top-wrapper > div > input', csv_data[i].Position_Top);
		break;
    case "Overlay":
		const close_button_img = (await page.$x("//img[contains(@src,'https://lpcdn.lpsnmedia.net/gallery/libraries/content/close_icons/default-close.png')]"))[0]; // search for close button image
		await close_button_img.click(); // click on button_image
		await page.click('body > div.root > div:nth-child(1) > div.main-wrapper > div > div > div.le.bubble-component-container.interaction-area-item-wrapper.interaction-area-transition.campaigns-wrapper.open > div > div > div > div.page.dialog-page > div.dialog-page-layout > div.page-inside-view-container.with-description > div > div.view-container.engagement-studio > div > div.property-boxes-region > div > div > div.property-box-content > div.close-button-position.position-property > div.left-wrapper > div > input', { clickCount: 3}); // click on left position
		await page.keyboard.press('Backspace'); // clear left
		await page.type('body > div.root > div:nth-child(1) > div.main-wrapper > div > div > div.le.bubble-component-container.interaction-area-item-wrapper.interaction-area-transition.campaigns-wrapper.open > div > div > div > div.page.dialog-page > div.dialog-page-layout > div.page-inside-view-container.with-description > div > div.view-container.engagement-studio > div > div.property-boxes-region > div > div > div.property-box-content > div.close-button-position.position-property > div.left-wrapper > div > input', closeButton_overlay); // type position left
		await page.click('body > div.root > div:nth-child(1) > div.main-wrapper > div > div > div.le.bubble-component-container.interaction-area-item-wrapper.interaction-area-transition.campaigns-wrapper.open > div > div > div > div.page.dialog-page > div.dialog-page-layout > div.page-inside-view-container.with-description > div > div.view-container.engagement-studio > div > div.property-boxes-region > div > div > div.property-box-content > div.close-button-position.position-property > div.top-wrapper > div > input', { clickCount: 3}); // click on top
		await page.keyboard.press('Backspace'); // clear top
		await page.type('body > div.root > div:nth-child(1) > div.main-wrapper > div > div > div.le.bubble-component-container.interaction-area-item-wrapper.interaction-area-transition.campaigns-wrapper.open > div > div > div > div.page.dialog-page > div.dialog-page-layout > div.page-inside-view-container.with-description > div > div.view-container.engagement-studio > div > div.property-boxes-region > div > div > div.property-box-content > div.close-button-position.position-property > div.top-wrapper > div > input', '0'); // type position top
		await page.click('body > div.root > div:nth-child(1) > div.main-wrapper > div > div > div.le.bubble-component-container.interaction-area-item-wrapper.interaction-area-transition.campaigns-wrapper.open > div > div > div > div.page.dialog-page > div.dialog-page-layout > div.page-inside-view-container.with-description > div > div.view-container.engagement-studio > div > div.property-boxes-region > div > div > div.property-box-controls > div.property-box-control.property-box-close') // close 'close button' window
        await page.click('body > div.root > div:nth-child(1) > div.main-wrapper > div > div > div.le.bubble-component-container.interaction-area-item-wrapper.interaction-area-transition.campaigns-wrapper.open > div > div > div > div.page.dialog-page > div.dialog-page-layout > div.page-inside-view-container.with-description > div > div.view-container.engagement-studio > div > div.stage-region > div > div > div.engagement.overlay > div:nth-child(3) > div'); // click on 'click to edit title'
		await page.keyboard.press('Delete'); // delete text
		await page.click('body > div.root > div:nth-child(1) > div.main-wrapper > div > div > div.le.bubble-component-container.interaction-area-item-wrapper.interaction-area-transition.campaigns-wrapper.open > div > div > div > div.page.dialog-page > div.dialog-page-layout > div.page-inside-view-container.with-description > div > div.view-container.engagement-studio > div > div.stage-region > div > div > div.engagement.overlay > div:nth-child(2) > div'); // click on 'click to edit button'
		await page.keyboard.press('Delete'); // delete button
		await page.click('body > div.root > div:nth-child(1) > div.main-wrapper > div > div > div.le.bubble-component-container.interaction-area-item-wrapper.interaction-area-transition.campaigns-wrapper.open > div > div > div > div.page.dialog-page > div.dialog-page-layout > div.page-inside-view-container.with-description > div > div.view-container.engagement-studio > div > div.stage-region > div > div > div.engagement.overlay > div:nth-child(2) > div'); // click on 'click to edit text'
		await page.keyboard.press('Delete'); // delete text
		await page.click('body > div.root > div:nth-child(1) > div.main-wrapper > div > div > div.le.bubble-component-container.interaction-area-item-wrapper.interaction-area-transition.campaigns-wrapper.open > div > div > div > div.page.dialog-page > div.dialog-page-layout > div.page-inside-view-container.with-description > div > div.view-container.engagement-studio > div > div.toolbar-region > div > div.toolbar-menu > ul > li.toolbar-action.add-element > button'); // click on add element
		await page.click('body > div.root > div:nth-child(1) > div.main-wrapper > div > div > div.le.bubble-component-container.interaction-area-item-wrapper.interaction-area-transition.campaigns-wrapper.open > div > div > div > div.page.dialog-page > div.dialog-page-layout > div.page-inside-view-container.with-description > div > div.view-container.engagement-studio > div > div.toolbar-region > div > div.toolbar-menu > div > div > div.menu-item-content > div > ul > li.element.image'); // click on add image
		await page.type('body > div.root > div:nth-child(1) > div.main-wrapper > div > div > div.le.bubble-component-container.interaction-area-item-wrapper.interaction-area-transition.campaigns-wrapper.open > div > div > div > div.page.dialog-page > div.dialog-page-layout > div.page-inside-view-container.with-description > div > div.view-container.engagement-studio > div > div.property-boxes-region > div > div > div.property-box-content > div.img-url.url-property > div.img-url-line > div.input-image-url > input', csv_data[i].Image_URL); // enter url for image
		await page.click('body > div.root > div:nth-child(1) > div.main-wrapper > div > div > div.le.bubble-component-container.interaction-area-item-wrapper.interaction-area-transition.campaigns-wrapper.open > div > div > div > div.page.dialog-page > div.dialog-page-layout > div.page-inside-view-container.with-description > div > div.view-container.engagement-studio > div > div.property-boxes-region > div > div > div.property-box-content > div.img-url.url-property > div.img-url-line > div.apply > button') // apply image
		await page.click('body > div.root > div:nth-child(1) > div.main-wrapper > div > div > div.le.bubble-component-container.interaction-area-item-wrapper.interaction-area-transition.campaigns-wrapper.open > div > div > div > div.page.dialog-page > div.dialog-page-layout > div.page-inside-view-container.with-description > div > div.view-container.engagement-studio > div > div.property-boxes-region > div > div > div.property-box-content > div.position-zindex-container > div.img-position.position-property > div.left-wrapper > div > input') // click on position left
		await page.keyboard.press('Backspace'); // clear left
		await page.type('body > div.root > div:nth-child(1) > div.main-wrapper > div > div > div.le.bubble-component-container.interaction-area-item-wrapper.interaction-area-transition.campaigns-wrapper.open > div > div > div > div.page.dialog-page > div.dialog-page-layout > div.page-inside-view-container.with-description > div > div.view-container.engagement-studio > div > div.property-boxes-region > div > div > div.property-box-content > div.position-zindex-container > div.img-position.position-property > div.left-wrapper > div > input', csv_data[i].Position_Left); // enter position left
		await page.click('body > div.root > div:nth-child(1) > div.main-wrapper > div > div > div.le.bubble-component-container.interaction-area-item-wrapper.interaction-area-transition.campaigns-wrapper.open > div > div > div > div.page.dialog-page > div.dialog-page-layout > div.page-inside-view-container.with-description > div > div.view-container.engagement-studio > div > div.property-boxes-region > div > div > div.property-box-content > div.position-zindex-container > div.img-position.position-property > div.top-wrapper > div > input') // click on position top
		await page.keyboard.press('Backspace'); // clear top
		await page.type('body > div.root > div:nth-child(1) > div.main-wrapper > div > div > div.le.bubble-component-container.interaction-area-item-wrapper.interaction-area-transition.campaigns-wrapper.open > div > div > div > div.page.dialog-page > div.dialog-page-layout > div.page-inside-view-container.with-description > div > div.view-container.engagement-studio > div > div.property-boxes-region > div > div > div.property-box-content > div.position-zindex-container > div.img-position.position-property > div.top-wrapper > div > input', csv_data[i].Position_Top); // enter position top
        await page.click('body > div.root > div:nth-child(1) > div.main-wrapper > div > div > div.le.bubble-component-container.interaction-area-item-wrapper.interaction-area-transition.campaigns-wrapper.open > div > div > div > div.page.dialog-page > div.dialog-page-layout > div.page-inside-view-container.with-description > div > div.view-container.engagement-studio > div > div.toolbar-region > div > div.toolbar-menu > ul > li.toolbar-action.placement > button') // click on position button
		break;
	}
	await page.click('body > div.root > div:nth-child(1) > div.main-wrapper > div > div > div.le.bubble-component-container.interaction-area-item-wrapper.interaction-area-transition.campaigns-wrapper.open > div > div > div > div.page.dialog-page > div.dialog-page-layout > div.page-inside-view-container.with-description > div > div.view-container.engagement-studio > div > div.toolbar-region > div > div.toolbar-menu > div > div > div.menu-item-content > div > div.engagement-size.'+position_type+' > div > div.engagement-size-line > div.input-width > input', { clickCount: 3}); // click on width
	await page.keyboard.press('Backspace'); // clear width
	if(imageSize.width > 265) {
		imageSize.width = 245; // bo z lewej jest niebieski background.. jajebie
	}
	await page.type('body > div.root > div:nth-child(1) > div.main-wrapper > div > div > div.le.bubble-component-container.interaction-area-item-wrapper.interaction-area-transition.campaigns-wrapper.open > div > div > div > div.page.dialog-page > div.dialog-page-layout > div.page-inside-view-container.with-description > div > div.view-container.engagement-studio > div > div.toolbar-region > div > div.toolbar-menu > div > div > div.menu-item-content > div > div.engagement-size.'+position_type+' > div > div.engagement-size-line > div.input-width > input', imageSize.width.toString()); // type width
	await page.click('body > div.root > div:nth-child(1) > div.main-wrapper > div > div > div.le.bubble-component-container.interaction-area-item-wrapper.interaction-area-transition.campaigns-wrapper.open > div > div > div > div.page.dialog-page > div.dialog-page-layout > div.page-inside-view-container.with-description > div > div.view-container.engagement-studio > div > div.toolbar-region > div > div.toolbar-menu > div > div > div.menu-item-content > div > div.engagement-size.'+position_type+' > div > div.engagement-size-line > div.input-height > input', { clickCount: 3}) // click on height
	await page.keyboard.press('Backspace'); // clear height
	await page.type('body > div.root > div:nth-child(1) > div.main-wrapper > div > div > div.le.bubble-component-container.interaction-area-item-wrapper.interaction-area-transition.campaigns-wrapper.open > div > div > div > div.page.dialog-page > div.dialog-page-layout > div.page-inside-view-container.with-description > div > div.view-container.engagement-studio > div > div.toolbar-region > div > div.toolbar-menu > div > div > div.menu-item-content > div > div.engagement-size.'+position_type+' > div > div.engagement-size-line > div.input-height > input', imageSize.height.toString()); // type height
	await page.waitFor(1000); // wait some time to close window
	await page.click('body > div.root > div:nth-child(1) > div.main-wrapper > div > div > div.le.bubble-component-container.interaction-area-item-wrapper.interaction-area-transition.campaigns-wrapper.open > div > div > div > div.page.dialog-page > div.dialog-page-layout > div.page-inside-view-container.with-description > div > div.view-container.engagement-studio > div > div.property-boxes-region > div > div > div.property-box-controls > div.property-box-control.property-box-close') // click on close image window
	await page.click('body > div.root > div:nth-child(1) > div.main-wrapper > div > div > div.le.bubble-component-container.interaction-area-item-wrapper.interaction-area-transition.campaigns-wrapper.open > div > div > div > div.page.dialog-page > div.dialog-page-layout > div.page-inside-view-container.with-description > div > div.page-footer.engagement-studio-page-footer > div.buttons-container > div.button-next > button > span'); // click on next
	await page.waitForXPath('/html/body/div[1]/div[1]/div[5]/div/div/div[5]/div/div/div/div[2]/div[2]/div[3]/div/div[1]/div[2]/span[1]'); // wait for engagement window library
	const Engagement_Window_div = (await page.$x("//div[contains(text(), '"+engagementWindow+"')]"))[0]; // search for engagement window
	await Engagement_Window_div.click(); // click on selected engagement
	await page.click('body > div.root > div:nth-child(1) > div.main-wrapper > div > div > div.le.bubble-component-container.interaction-area-item-wrapper.interaction-area-transition.campaigns-wrapper.open > div > div > div > div.page.dialog-page > div.dialog-page-layout > div.page-inside-view-container.with-description.with-action-strip > div > div.page-footer.engagement-windows-collection-page-footer > div.buttons-container > div.button-next > button > span'); //click on next
	await page.waitForXPath('/html/body/div[1]/div[1]/div[5]/div/div/div[5]/div/div/div/div[2]/div[2]/div[3]/div/div[2]/div/div/div/ul/li[1]/div/p'); // wait for entry point library
	await page.waitFor(1000); // wait for entry point library (later change it it waitForXPath)
	const add_new_entry_point_div = (await page.$x("//span[contains(text(), 'Add new')]"))[0]; // search for add new entry point library button
	await add_new_entry_point_div.click(); // click on add new entry point library
	await page.waitFor(timeout);
	await page.type('body > div.root > div:nth-child(1) > div.main-wrapper > div > div > div.le.bubble-component-container.interaction-area-item-wrapper.interaction-area-transition.campaigns-wrapper.open > div > div > div > div.page.dialog-page > div.dialog-page-layout > div.page-inside-view-container.with-description.with-action-strip > div > div.view-container.browser-scroll.light.scroll-fixed > div.segment-header > div.name-container.input-container-perm-2 > div > div.input', csv_data[i].Name); // type name for new entry point
	await page.click('body > div.root > div:nth-child(1) > div.main-wrapper > div > div > div.le.bubble-component-container.interaction-area-item-wrapper.interaction-area-transition.campaigns-wrapper.open > div > div > div > div.page.dialog-page > div.dialog-page-layout > div.page-inside-view-container.with-description.with-action-strip > div > div.view-container.browser-scroll.light.scroll-fixed > div.segment-details > div > div.cbs-region > div > div > ul > div:nth-child(1) > li > div.cb-body > div > div > div.cb-onsite-location-main-selector > ul > li.item-wrapper.view-only > button'); // click on section
	await page.click('body > div.root > div:nth-child(1) > div.main-wrapper > div > div > div.le.bubble-component-container.interaction-area-item-wrapper.interaction-area-transition.campaigns-wrapper.open > div > div > div > div.page.dialog-page > div.dialog-page-layout > div.page-inside-view-container.with-description.with-action-strip > div > div.view-container.browser-scroll.light.scroll-fixed > div.segment-details > div > div.cbs-region > div > div > ul > div:nth-child(1) > li > div.cb-body > div > div > div.cb-onsite-location-main-content > div > div > div.cb-container.include.onsite-location-populated.single-item > div.cb-container-inner-wrap > div > ul > div > div.cb-row > div.cb-row-input > div > div'); // click on entry point section
	for(x=0;x<csv_data[i].Location.split(",").length;x++) {
		await page.type('body > div.root > div:nth-child(1) > div.main-wrapper > div > div > div.le.bubble-component-container.interaction-area-item-wrapper.interaction-area-transition.campaigns-wrapper.open > div > div > div > div.page.dialog-page > div.dialog-page-layout > div.page-inside-view-container.with-description.with-action-strip > div > div.view-container.browser-scroll.light.scroll-fixed > div.segment-details > div > div.cbs-region > div > div > ul > div:nth-child(1) > li > div.cb-body > div > div > div.cb-onsite-location-main-content > div > div > div.cb-container.include.onsite-location-populated.single-item > div.cb-container-inner-wrap > div > ul > div > div.cb-row > div.cb-row-input > div > div > div', csv_data[i].Location.split(",")[x]); // type section
		await page.keyboard.press('Enter'); // confirm section
	}
	await page.click('body > div.root > div:nth-child(1) > div.main-wrapper > div > div > div.le.bubble-component-container.interaction-area-item-wrapper.interaction-area-transition.campaigns-wrapper.open > div > div > div > div.page.dialog-page > div.dialog-page-layout > div.page-inside-view-container.with-description.with-action-strip > div > div.page-footer > div > div.button-save > button > span'); // click on save
	await page.waitFor(timeout); // wait for entry point library (later change to to waitForXPath)
	await page.waitFor(1000); // waiting
	await page.click('body > div.root > div:nth-child(1) > div.main-wrapper > div > div > div.le.bubble-component-container.interaction-area-item-wrapper.interaction-area-transition.campaigns-wrapper.open > div > div > div > div.page.dialog-page > div.dialog-page-layout > div.page-inside-view-container.with-description.with-action-strip > div > div.page-footer.locations-collection-page-footer > div.buttons-container > div.button-next > button'); // click on next
	await page.waitFor(timeout); // wait for visitor behaviro library window (later change it to waitForXPath)
	if(!isNaN(csv_data[i].Behavior)) {
		const add_new_visitor_behavior_div = (await page.$x("//span[contains(text(), 'Add new')]"))[0]; // search for add new entry point library button
		await add_new_visitor_behavior_div.click(); // click on add new entry visitor behavior library
		await page.waitForXPath('/html/body/div[1]/div[1]/div[5]/div/div/div[5]/div/div/div/div[2]/div[2]/div[3]/div/div[1]/div[2]/div/div/div[2]/div/div/div'); // wait for add new visitor behavior window
		await page.type('body > div.root > div:nth-child(1) > div.main-wrapper > div > div > div.le.bubble-component-container.interaction-area-item-wrapper.interaction-area-transition.campaigns-wrapper.open > div > div > div > div.page.dialog-page > div.dialog-page-layout > div.page-inside-view-container.with-description.with-action-strip > div > div.view-container.browser-scroll.light.scroll-fixed > div.segment-header > div.name-container.input-container-perm-2 > div > input', csv_data[i].Name); // type visitor behavior name
		await page.click('body > div.root > div:nth-child(1) > div.main-wrapper > div > div > div.le.bubble-component-container.interaction-area-item-wrapper.interaction-area-transition.campaigns-wrapper.open > div > div > div > div.page.dialog-page > div.dialog-page-layout > div.page-inside-view-container.with-description.with-action-strip > div > div.view-container.browser-scroll.light.scroll-fixed > div.segment-details > div > div > div.cb-menu-region > div > div > ul.navigation.category.opened.shown > div:nth-child(3) > li > div > button') // click on time on entry point
		await page.type('body > div.root > div:nth-child(1) > div.main-wrapper > div > div > div.le.bubble-component-container.interaction-area-item-wrapper.interaction-area-transition.campaigns-wrapper.open > div > div > div > div.page.dialog-page > div.dialog-page-layout > div.page-inside-view-container.with-description.with-action-strip > div > div.view-container.browser-scroll.light.scroll-fixed > div.segment-details > div > div > div.cbs-region > div > div > ul > div:nth-child(1) > li > div.cb-body > div > div > div > div.cb-container-inner-wrap > div > ul > li > div.cb-input-row-fields > div.time-input > input', csv_data[i].Behavior) // type seconds time on entry 
		await page.click('body > div.root > div:nth-child(1) > div.main-wrapper > div > div > div.le.bubble-component-container.interaction-area-item-wrapper.interaction-area-transition.campaigns-wrapper.open > div > div > div > div.page.dialog-page > div.dialog-page-layout > div.page-inside-view-container.with-description.with-action-strip > div > div.view-container.browser-scroll.light.scroll-fixed > div.segment-details > div > div > div.cbs-region > div > div > ul > div:nth-child(1) > li > div.cb-body > div > div > div > div.cb-container-inner-wrap > div > ul > li > div.cb-input-row-fields > div.location-id-container > div > div > button'); // click on select entry point
		const select_entry_point = (await page.$x("//*[contains(text(), '"+csv_data[i].Name+"')]"))[0]; // search for add new entry point library button
		await select_entry_point.click(); // click on add new entry visitor behavior library
		await page.click('body > div.root > div:nth-child(1) > div.main-wrapper > div > div > div.le.bubble-component-container.interaction-area-item-wrapper.interaction-area-transition.campaigns-wrapper.open > div > div > div > div.page.dialog-page > div.dialog-page-layout > div.page-inside-view-container.with-description.with-action-strip > div > div.page-footer > div > div.button-save > button > span'); // click on save
		await page.waitForXPath('/html/body/div[1]/div[1]/div[5]/div/div/div[5]/div/div/div/div[2]/div[2]/div[3]/div/div[1]/div[2]/span[1]'); // wait for add new visitor behavior window
		await page.click('body > div.root > div:nth-child(1) > div.main-wrapper > div > div > div.le.bubble-component-container.interaction-area-item-wrapper.interaction-area-transition.campaigns-wrapper.open > div > div > div > div.page.dialog-page > div.dialog-page-layout > div.page-inside-view-container.with-description.with-action-strip > div > div.page-footer.visitor-behaviors-collection-page-footer > div.buttons-container > div.button-done > button > span'); //click on done
	} else {
		await page.click('body > div.root > div:nth-child(1) > div.main-wrapper > div > div > div.le.bubble-component-container.interaction-area-item-wrapper.interaction-area-transition.campaigns-wrapper.open > div > div > div > div.page.dialog-page > div.dialog-page-layout > div.page-inside-view-container.with-description.with-action-strip > div > div.page-footer.visitor-behaviors-collection-page-footer > div.buttons-container > div.button-done > button > span'); //click on done
	}
	await page.waitForXPath('/html/body/div[1]/div[1]/div[5]/div/div/div[5]/div/div/div/div[2]/div/div/div[2]/div[2]/div[1]/div[1]/div[1]/div/div[2]/div[1]/div[1]/h6'); // wait for campaign ready
	await page.type('body > div.root > div:nth-child(1) > div.main-wrapper > div > div > div.le.bubble-component-container.interaction-area-item-wrapper.interaction-area-transition.campaigns-wrapper.open > div > div > div > div.page.custom-page > div > div > div.details-container > div.main-details > div.engagements-section-container > div > div.engagements > div:nth-child(1) > div > div.inner-wrapper > div > div.engagement-header.clear > div.engagement-name-container > div > div > input', csv_data[i].Name); // type engagement name
	await page.keyboard.press('Enter'); // confirm engagement name
	await page.waitFor(2000); // wait for engagement name to be ready
	console.log("[!] Engagement: "+csv_data[i].Name+" created.")
}
await browser.close();
})();