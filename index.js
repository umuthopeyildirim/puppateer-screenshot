const puppeteer = require('puppeteer');
const { Storage } = require('@google-cloud/storage');

const GOOGLE_CLOUD_PROJECT_ID = "fill-it-with-your-project-id";
const BUCKET_NAME = "fill-it-with-your-bucket-name";

exports.run = async (req, res) => {
  res.setHeader("content-type", "application/json");
  
  try {
    const buffer = await takeScreenshot(req.body);
    
    let screenshotUrl = await uploadToGoogleCloud(buffer, req.body.name+".png");
    
    res.status(200).send(JSON.stringify({
      'screenshotUrl': screenshotUrl
    }));
    
  } catch(error) {
    res.status(422).send(JSON.stringify({
      error: error.message,
    }));
  }
};

async function uploadToGoogleCloud(buffer, filename) {
    const storage = new Storage({
        projectId: GOOGLE_CLOUD_PROJECT_ID,
    });

    const bucket = storage.bucket(BUCKET_NAME);

    const file = bucket.file(filename);
    await uploadBuffer(file, buffer, filename);
  
    await file.makePublic();

  	return `https://${BUCKET_NAME}.storage.googleapis.com/${filename}`;
}

async function takeScreenshot(params) {
	const browser = await puppeteer.launch({
		args: ['--no-sandbox']
	});
	const page = await browser.newPage();
	await page.goto(params.url, {waitUntil: 'networkidle2'});

	const buffer = await page.screenshot();

	await page.close();
	await browser.close();
  
  	return buffer;
}

async function uploadBuffer(file, buffer, filename) {
    return new Promise((resolve) => {
        file.save(buffer, { destination: filename }, () => {
            resolve();
        });
    })
}