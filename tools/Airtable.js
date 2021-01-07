var Airtable = require('airtable');
var base = new Airtable({ apiKey: 'keye3x4Q46SfapiiF' }).base('appJmEaVvuHt0tCaU');
exports.createSubjects = createSubjects;
exports.createTags = createTags;
exports.createStorys = createStorys;
async function createSubjects (arraySubject) {
    let results = []
    try {
        let fillFields = []
        for (var i = 0; i < arraySubject.length; i++) {
            fillFields.push({
                "fields": {
                    "Name": arraySubject[i]
                }
            })
            if ((i + 1) % 10 === 0 && i !== 0) {//一次只能塞10筆
                const records = await base('主分類').create(fillFields)
                records.forEach(function (record) {
                    results.push(record.fields)
                });
                fillFields = []

            }
        }
        // 如果還有剩餘的就會在這裡解決
        if (fillFields.length > 0) {
            const records = await base('主分類').create(fillFields)
            records.forEach(function (record) {
                results.push(record.fields)
            });
        }
        return results

    } catch (e) {
        console.error(e)
    }
}
createTags([])
async function createTags (arrayTag) {
    let results = []
    try {
        let fillFields = []
        for (var i = 0; i < arrayTag.length; i++) {
            fillFields.push({
                "fields": {
                    "Name": arrayTag[i]
                }
            })
            if ((i + 1) % 10 === 0 && i !== 0) {//一次只能塞10筆
                const records = await base('Medium_tag').create(fillFields)
                records.forEach(function (record) {
                    results.push(record.fields)
                });
                fillFields = []

            }
        }
        // 如果還有剩餘的就會在這裡解決
        if (fillFields.length > 0) {
            const records = await base('Medium_tag').create(fillFields)
            records.forEach(function (record) {
                results.push(record.fields)
            });
        }
        return results

    } catch (e) {
        console.error(e)
    }
}
async function createStorys (subjectsRecords, tagRecords, arrayStory) {
    try {
        console.log(arrayStory)
        let fillFields = []
        for (var i = 0; i < arrayStory.length; i++) {
            let subjectId = subjectsRecords.find(subject => subject.Name === arrayStory[i].subject).record_id;
            let arrayMediumTagId = []
            arrayStory[i].tag.forEach(storyTag => {
                let mediumTagId = tagRecords.find(tag => tag.Name === storyTag).record_id;
                arrayMediumTagId.push(mediumTagId)
            })
            // console.log(subjectId)
            // console.log(arrayMediumTagId.toString())
            fillFields.push({
                "fields": {
                    "文章標題": arrayStory[i].title,
                    "發表時間": arrayStory[i].publishTime,
                    "主分類": [subjectId],
                    "Medium 🏷️": arrayMediumTagId,
                    "Medium": arrayStory[i].link,
                }
            })
            // console.log(fillFields)
            if ((i + 1) % 10 === 0 && i !== 0) {//一次只能塞10筆
                await base('Medium文章').create(fillFields)
                fillFields = []
            }
        }
        await base('Medium文章').create(fillFields)

    } catch (e) {
        console.error(e)
    }
}