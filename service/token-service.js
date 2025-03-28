const { PrismaClient } = require('@prisma/client')
const jwt = require('jsonwebtoken')

const prisma = new PrismaClient()

class TokenService {
	generateTokens(payload) {
		const accessToken = jwt.sign(payload, process.env.JWT_ACCESS_SECRET, {
			expiresIn: '30m',
		})
		const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
			expiresIn: '30d',
		})

		return { accessToken, refreshToken }
	}

	async saveToken(userId, refreshToken) {
		const tokenData = await prisma.token.findFirst({ where: { userId } })

		if (tokenData) {
			return prisma.token.update({
				where: { userId },
				data: { refreshToken },
			})
		}

		const token = await prisma.token.create({
			data: { userId, refreshToken },
		})

		return token
	}
}

module.exports = new TokenService()
