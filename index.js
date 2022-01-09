var CronJob = require('cron').CronJob;
const puppeteer = require('puppeteer');
const MongoClient = require('mongodb').MongoClient;
const uri = "mongodb+srv://mongodb:m0ng0db@cluster0-0m1qt.mongodb.net/test?retryWrites=true&w=majority";
const client = new MongoClient(uri, { useNewUrlParser: true });

const getData = async (page) => {
    return await page.evaluate(() => {
        const date = document.querySelector('#updated_date').textContent.split(': ')[1].trim();
        const station = document.querySelector('#station_name').textContent.trim();
        if (date === '-') {
            return;
        }
        const data = {
            date,
            station
        };
        const q = '.col-xs-2 .col-xs-4:first-child';
        document.querySelectorAll('#graph_container .row').forEach((row) => {
            if (row.textContent.includes('PM 10')) {
                Object.assign(data , {
                    pm10: row.querySelector(q).textContent.trim()
                });
            } else if (row.textContent.includes('PM 2')) {
                Object.assign(data , {
                    pm25: row.querySelector(q).textContent.trim()
                });
            } else if (row.textContent.includes('Нүүрстөрөгч')) {
                Object.assign(data , {
                    co: row.querySelector(q).textContent.trim()
                });
            } else if (row.textContent.includes('Хүхрийн')) {
                Object.assign(data , {
                    so2: row.querySelector(q).textContent.trim()
                });
            } else if (row.textContent.includes('Азотын')) {
                Object.assign(data , {
                    no2: row.querySelector(q).textContent.trim()
                });
            } else if (row.textContent.includes('Салхины')) {
                Object.assign(data , {
                    wind: row.querySelector(q).textContent.trim()
                });
            } else if (row.textContent.includes('Температур')) {
                Object.assign(data , {
                    temp: row.querySelector(q).textContent.trim()
                });
            } else if (row.textContent.includes('Даралт')) {
                Object.assign(data , {
                    pres: row.querySelector(q).textContent.trim()
                });
            }
        });
        return data;
    });
}

const saveData = (data) => {
    client.connect(err => {
        const collection = client.db("air").collection("data");
        // perform actions on the collection object
        data.forEach(item => {
            collection.findOneAndUpdate({
                station: item.station,
                date: item.date
            }, {$set: item}, {upsert: true});
        });
        const docs = collection.find({}).toArray();
        docs.then(res => console.log(res));
        // client.close();
    });
}

var CronJob = require('cron').CronJob;
var job = new CronJob(
	'0 */15 * * * *',
	function() {
		console.log('You will see this message every 15 minutes');
        (async () => {
            const browser = await puppeteer.launch();
            const arr = [];
            for (let i = 0; i < 20; i++) {
                const page = await browser.newPage();
                await page.goto('http://agaar.mn/station/' + (i + 1));
                const data = await getData(page);
                if (data !== undefined) {
                    arr.push(data);
                }
            }
            saveData(arr);
          
            browser.close();
          })();
	},
	null,
	true
);


