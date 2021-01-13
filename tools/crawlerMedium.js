
exports.crawlerMedium = crawlerMedium;//讓其他程式在引入時可以使用這個函式
const { By, until } = require('selenium-webdriver') // 從套件中取出需要用到的功能

async function crawlerMedium (driver, originStorys, originSubjects, originTags) {
    let arraySubject = []//記錄大主題
    let arrayTag = []//紀錄每個Tags
    let arrayTotalStory = []//每個story詳細內容
    // 先取得上面標題的名稱及連結
    const arrayNavItemLink = await getNavItemLink(driver)
    // 依序前往每個title

    for (var i = 0; i < arrayNavItemLink.length; i++) {

        await goTitlePage(driver, arrayNavItemLink[i].title_href)
        //去搜集該title下的所有連結

        let arrayStorymethod1 = await getStoryTitleAndLink(driver, arrayNavItemLink[i].title_text, `//*[contains(@class,"postArticle--short")]/div/a`, "可拍手列表")
        let arrayStorymethod2 = await getStoryTitleAndLink(driver, arrayNavItemLink[i].title_text, `//*[contains(@class,"postItem")]/a`, "原本的版型")
        //因為發現有些頁面是混合頁面，所以兩種都要嘗試
        let arrayStory = arrayStorymethod1.concat(arrayStorymethod2)
        let filterStorys = []
        for (story of arrayStory) {
            // 如果該文章原本不存在才需要加入
            let existStory = originStorys.find(originStory => originStory.Name === story.title)
            if (!existStory) {
                filterStorys.push(story)
            } else {//如果有找到文章就刪除增加之後搜尋效率，並且用於刪除已經變更的文章
                let index = originStorys.findIndex(function (originStory) {
                    return originStory.Name === story.title
                })
                originStorys.splice(index, 1);
            }
        }
        console.log("Title: " + arrayNavItemLink[i].title_text + " 的文章數：" + filterStorys.length)


        // 如果該主題原本不存在才需要加入
        if (!originSubjects.find(subject => subject.Name === arrayNavItemLink[i].title_text)) {
            arraySubject.push(arrayNavItemLink[i].title_text)
        }

        for (var j = 0; j < filterStorys.length; j++) {
            await goStory(driver, filterStorys[j].link)
            let storyTag = await getStoryTag(driver)
            storyTag.forEach(tag => {
                // 如果該tag不存在原本的tag，並且也不是重複的tag就會新增
                if (!originTags.find(originTag => originTag.Name === tag) && !arrayTag.includes(tag)) {
                    arrayTag.push(tag)
                }
            })
            filterStorys[j].tag = storyTag
            console.log(filterStorys[j].title + " | Time:" + filterStorys[j].publishTime + " | Tag:" + filterStorys[j].tag.toString() + " | Link:" + filterStorys[j].link)
        }
        arrayTotalStory = arrayTotalStory.concat(filterStorys)
    }
    return { "arraySubject": arraySubject, "arrayTag": arrayTag, "arrayStory": arrayTotalStory, "deleteStorys": originStorys }
}
async function getStoryTag (driver) {
    try {
        // console.log("抓取 story 的 tag")
        //暫停1秒來load
        await driver.sleep(1000);
        let array_story_tag = []
        let story_tags = await driver.findElements(By.xpath(`//div/ul/li/a`));
        for (const story_tag of story_tags) {
            const story_tag_hret = await story_tag.getAttribute('href')
            const medium_page = process.env.MEDIUM_PAGE
            if (story_tag_hret.includes(medium_page)) {
                const story_tag_text = await story_tag.getText()
                array_story_tag.push(story_tag_text)
            }
        }
        return array_story_tag
    } catch (e) {
        console.error('抓取 Story tag 失敗')
        console.error(e)
        return false
    }
}
async function goStory (driver, storyLink) {
    //前往story頁面
    try {
        await driver.get(storyLink)
        return true
    } catch (e) {
        console.error('無效的網址')
        console.error(e)
        return false
    }
}
async function getStoryTitleAndLink (driver, subject, xpath, type) {
    try {
        // console.log("抓取story 的 title & link")
        let find_all_stroy = false
        let arrayStory = []
        //先歸零
        let preStoryLinkLength = 0
        while (!find_all_stroy) {
            //暫停2秒來load
            await driver.sleep(2000);
            let storyLinks = await driver.wait(until.elementLocated(By.xpath(xpath)), 5 * 1000).then(() => {
                return driver.findElements(By.xpath(xpath))
            });
            if (preStoryLinkLength === storyLinks.length) {//代表沒有下一個惹
                // console.log(title_text + " 的總文章數：" + preStoryLinkLength)
                let preStoryLinkHref = ''
                for (const storyLink of storyLinks) {
                    const storyLinkHref = await storyLink.getAttribute('href')
                    if (preStoryLinkHref === storyLinkHref) {//如果發現連結與上一個一樣，就直接往下
                        continue
                    }
                    let storyLinkText = ''
                    let publishTime
                    if (xpath === '//*[contains(@class,"postItem")]/a') {
                        storyLinkText = await storyLink.getText()
                        // 往上推三層
                        let parentEle = await storyLink.findElement(By.xpath(`./..`))
                        parentEle = await parentEle.findElement(By.xpath(`./..`))
                        parentEle = await parentEle.findElement(By.xpath(`./..`))
                        let timeEle = await parentEle.findElement(By.xpath(`.//time`))
                        publishTime = await timeEle.getAttribute('datetime')
                        publishTime = new Date(publishTime).toLocaleDateString()
                    } else {
                        let storyLinkTextTag = await storyLink.findElement(By.xpath(`.//*[contains(@class,"section-inner")]/h3`))
                        storyLinkText = await storyLinkTextTag.getText()
                        // 往上推三層
                        let parentEle = await storyLink.findElement(By.xpath(`./..`))
                        parentEle = await parentEle.findElement(By.xpath(`./..`))
                        let timeEle = await parentEle.findElement(By.xpath(`.//time`))
                        publishTime = await timeEle.getAttribute('datetime')
                        publishTime = new Date(publishTime).toLocaleDateString()
                    }
                    // console.log(storyLinkText)
                    // console.log(storyLinkHref)

                    preStoryLinkHref = storyLinkHref
                    arrayStory.push({
                        title: storyLinkText,
                        subject: subject,
                        link: storyLinkHref,
                        publishTime: publishTime
                    })
                }
                find_all_stroy = true
            } else {
                preStoryLinkLength = storyLinks.length
            }
            //執行下滑
            await driver.executeScript("window.scrollTo(0, document.body.scrollHeight)");
        }
        return arrayStory
    } catch (e) {
        console.error(type+' 無文章')
        // console.error(e)
        return []
    }
}
async function goTitlePage (driver, title_href) {
    //前往title頁面
    try {
        await driver.get(title_href)
        return true
    } catch (e) {
        console.error('無效的網址')
        console.error(e)
        return false
    }
}
async function getNavItemLink (driver) {
    const medium_page = process.env.MEDIUM_PAGE
    try {
        let arrayNavItemLink = []
        console.log("STEP 1 : 抓取 Medium title")
        await driver.get(medium_page)//在這裡要用await確保打開完網頁後才能繼續動作
        let navItemLinks = await driver.wait(until.elementLocated(By.xpath(`//*[contains(@class,"js-collectionNavItem")]`)), 5 * 1000).then(() => {
            return driver.findElements(By.xpath(`//*[contains(@class,"js-navItemLink")]`))
        });
        for (const navItemLink of navItemLinks) {
            const navItemLinkText = await navItemLink.getText()
            const navItemLinkHref = await navItemLink.getAttribute('href')
            arrayNavItemLink.push({
                title_text: navItemLinkText,
                title_href: navItemLinkHref
            })
            // console.log(navItemLinkText + " " + navItemLinkHref)
        }
        return arrayNavItemLink
    } catch (e) {
        console.error('Medium title 取得失敗')
        console.error(e)
        return false
    }
}

