// 會在這個檔案中印出使用者目前的設定資訊，然後再依序執行
require('dotenv').config();
const { initDrive } = require("./tools/initDrive.js");
const { crawlerMedium } = require("./tools/crawlerMedium.js");
var toBoolean = require('to-boolean');

crawler ()
async function crawler () {
    console.log("目標 medium page：" + process.env.MEDIUM_PAGE)
    console.log("是否顯示瀏覽器：" + toBoolean(process.env.SHOW_BROWSER))
    const start_time = new Date();
    const driver = await initDrive();
    if (!driver) {//driver不存在就結束程式
        return
    }
    //爬 Medium 文章
    // const { "result_array": medium_result_array } = await crawlerMedium(driver)
    await crawlerMedium(driver)
    // driver.quit();
    //處理 AirTable 相關動作
    // await updateAirTable(medium_result_array)
    const end_time = new Date();
    const spend_time = spendTime(start_time, end_time)
    console.log(spend_time)
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