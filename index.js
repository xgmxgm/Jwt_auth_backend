require('dotenv').config()
const cors = require('cors')
const express = require('express')
const router = require('./router/index')
const cookieParser = require('cookie-parser')
const errorMiddleware = require('./middlewares/error-middleware')

const PORT = process.env.PORT || 4444
const app = express()

app.use(express.json())
app.use(cookieParser())
app.use(cors())
app.use('/api', router)
app.use(errorMiddleware)

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
