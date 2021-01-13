// 會在這個檔案中印出使用者目前的設定資訊，然後再依序執行
require('dotenv').config();
const { initDrive } = require("./tools/initDrive.js");
const { createSubjects, createTags, createStorys, readTable, deleteStorys } = require("./tools/airtable.js");
const { crawlerMedium } = require("./tools/crawlerMedium.js");
var toBoolean = require('to-boolean');

crawler()
async function crawler () {
    console.log("目標 medium page：" + process.env.MEDIUM_PAGE)
    console.log("是否顯示瀏覽器：" + toBoolean(process.env.SHOW_BROWSER))
    const start_time = new Date();
    const driver = await initDrive();
    if (!driver) {//driver不存在就結束程式
        return
    }

    // 先抓出線上的文章資訊
    console.log("抓取 airtable 儲存的 Medium文章...")
    const originStorys = await readTable('Medium文章', '文章標題')
    console.log("抓取 airtable 儲存的 主分類...")
    const originSubjects = await readTable('主分類', 'Name')
    console.log("抓取 airtable 儲存的 Medium_tag...")
    const originTags = await readTable('Medium_tag', 'Name')
    console.log("完成 airtable 資料抓取")
    // 爬 Medium 文章
    let { arraySubject, arrayTag, arrayStory, arrayDeleteStorys } = await crawlerMedium(driver, originStorys, originSubjects, originTags)

    driver.quit();

    //處理 AirTable 相關動作
    let subjectsRecords = await createSubjects(arraySubject)
    let tagRecords = await createTags(arrayTag)
    // 這裡要組成完成的Subject、Tag給Story取用
    subjectsRecords = subjectsRecords.concat(originSubjects)
    tagRecords = tagRecords.concat(originTags)
    // console.log(subjectsRecords)
    // console.log(tagRecords)
    await createStorys(subjectsRecords, tagRecords, arrayStory)
    await deleteStorys(arrayDeleteStorys)
    const end_time = new Date();
    const spend_time = spendTime(start_time, end_time)
    console.log("完成時間：" + spend_time)
}

function spendTime (start_time, end_time) {
    const milisecond = end_time.getTime() - start_time.getTime()  //時間差的毫秒數  
    //計算出相差天數  
    const days = Math.floor(milisecond / (24 * 3600 * 1000))
    //計算出小時數  
    const leave1 = milisecond % (24 * 3600 * 1000)// 計算天數後剩余的毫秒數  
    const hours = Math.floor(leave1 / (3600 * 1000))
    //計算相差分鐘數  
    const leave2 = leave1 % (3600 * 1000)// 計算小時數後剩余的毫秒數  
    const minutes = Math.floor(leave2 / (60 * 1000))
    //計算相差秒數  
    const leave3 = leave2 % (60 * 1000)// 計算分鐘數後剩余的毫秒數  
    const seconds = Math.round(leave3 / 1000)

    let time_msg = ""
    if (days !== 0)
        time_msg = time_msg + days + '天'
    if (hours !== 0)
        time_msg = time_msg + hours + '小時'
    if (minutes !== 0)
        time_msg = time_msg + minutes + '分'
    if (seconds !== 0)
        time_msg = time_msg + seconds + '秒'
    return time_msg
}