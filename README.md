# ebay-scraper
Web Scraping API Development using AI

This project is a simple API built with Node.js, Puppeteer, and OpenAI API to:
    -Fetch product data from eBay based on a specific page number.
    -Add a short description for each product using AI.
    -Save the results to an output.json file and also return the JSON as the API response.

A. Installation:
1. Clone the repository
	git clone https://github.com/insanazka/ebay-scraper.git  
	cd ebay-scraper 
2. Install dependencies
	npm install express puppeteer-extra puppeteer-extra-plugin-stealth openai dotenv  
3. Create a .env file and add your API key
	OPENAI_API_KEY=your_openai_api_key

B. Running the server:
1. Run in the terminal
	node scraper-api.js  
2. The server will run at
	http://localhost:3000  

C. Using The API:
1. Endpoint: GET /scrape?keyword=keyword&pages=page_number
2. Example request:
	http://localhost:3000/scrape?keyword=nike&pages=1  
3. The data will be saved in output.json, and the API response will return a JSON array like this:
	[
  		{
    			"title": "Nike Air Max",
    			"price": "$120",
    			"description": "Stylish and comfortable Nike Air Max shoes for everyday activities."
  		},
  		...
	]

Technologies Used:
Express.js – Web framework for Node.js
Puppeteer Extra – Web scraping
Stealth Plugin – Avoids bot detection
OpenAI API – AI to generate product descriptions
dotenv – Manages environment variables

Note:
Make sure you have enough OpenAI API quota, as each product will have a generated description.
Requests are divided into 4 batches per page to avoid errors due to too large token limits.
Batch processing progress can be seen in the terminal console log.

