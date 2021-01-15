var Airtable = require('airtable');
require('dotenv').config();
var base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEYKEY }).base(process.env.AIRTABLE_BASE);
exports.createSubjects = createSubjects;
exports.createTags = createTags;
exports.createStorys = createStorys;
exports.readTable = readTable;
exports.deleteStorys = deleteStorys;
async function deleteStorys (arrayStory) {
    var arrStoryId = []
    try {
        arrStoryId = JSON.parse(arrayStory).reduce((acc, val) => [...acc, val.record_id], [])
    } catch (e) {
        console.log("Invalid json")
    }
    if (arrStoryId.length > 0) {
        try {
            base('Medium文章').destroy(arrStoryId, function (err, deletedRecords) {
                if (err) {
                    console.error(err);
                    return;
                }
                console.log('刪除不存在的文章：', deletedRecords.length, '筆');
            });
        } catch (e) {
            console.error(e)
        }
    }
}
async function readTable (table, column) {
    return new Promise((resolve, reject) => {
        let results = []
        base(table).select({
            maxRecords: 1000,
            pageSize: 100,//因為一次最多抓100筆
            view: "Grid view",
            fields: [column, "record_id"]
        }).eachPage(async function page (records, fetchNextPage) {
            for (const record of records) {
                results.push({
                    Name: await record.get(column),
                    record_id: await record.get("record_id")
                })
            }
            fetchNextPage();
        }, function done (err) {
            if (err) {
                console.error(err); reject();
                return;
            }
            resolve(results)
        });
    })
}
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
        // console.log(arrayStory)
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
        if (fillFields.length > 0) {
            await base('Medium文章').create(fillFields)
        }

    } catch (e) {
        console.error(e)
    }
}