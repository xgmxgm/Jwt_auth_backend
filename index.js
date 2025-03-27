const cookieParser = require('cookie-parser')
const express = require('express')
const cors = require('cors')
require('dotenv').config()
const router = require('./router/index')

const PORT = process.env.PORT || 4444
const app = express()

app.use(express.json())
app.use(cookieParser())
app.use('/api', router)
app.use(cors())

app.get('', (req, res) => {
	res.json('Hello world !!!')
})

const start = async () => {
	try {
		app.listen(PORT, () => console.log(`Server started on PORT: ${PORT}`))
	} catch (e) {
		console.log(e)
	}
}

start()
