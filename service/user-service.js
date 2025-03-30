const uuid = require('uuid')
const bcrypt = require('bcrypt')
const UserDto = require('../dtos/user-dto')
const mailService = require('./mail-service')
const tokenService = require('./token-service')
const { PrismaClient } = require('@prisma/client')
const ApiError = require('../exceptions/api-error')

const prisma = new PrismaClient()

class UserService {
	async registration(email, password) {
		const candidate = await prisma.user.findFirst({ where: { email } })

		if (candidate) {
			throw ApiError.BadRequest(
				`Пользователь с почтовым адресом ${candidate.email} уже существует`
			)
		}

		const hashPassword = await bcrypt.hash(password, 3)
		const activationLink = uuid.v4()
		const user = await prisma.user.create({
			data: { email, password: hashPassword, activationLink },
		})
		await mailService.sendActivationMail(
			email,
			`${process.env.API_URL}${process.env.PORT}/api/activate/${activationLink}`
		)

		const userDto = new UserDto(user)
		const tokens = tokenService.generateTokens({ ...userDto })
		await tokenService.saveToken(userDto.id, tokens.refreshToken)

		return {
			...tokens,
			user: userDto,
		}
	}

	async activate(activationLink) {
		const user = await prisma.user.findFirst({ where: { activationLink } })

		if (!user) {
			throw ApiError.BadRequest('Неккоректная ссылка активации')
		}

		await prisma.user.update({
			where: { id: user.id },
			data: { isActivated: true },
		})
	}

	async login(email, password) {
		const user = await prisma.user.findFirst({ where: { email } })

		if (!user) {
			throw ApiError.BadRequest('Пользователь с таким email не найден')
		}

		const isPassEquals = await bcrypt.compare(password, user.password)

		if (!isPassEquals) {
			throw ApiError.BadRequest('Неверный пароль')
		}

		const userDto = new UserDto(user)
		const tokens = tokenService.generateTokens({ ...userDto })
		await tokenService.saveToken(userDto.id, tokens.refreshToken)

		return { ...tokens, user: userDto }
	}

	async logout(refreshToken) {
		const token = await tokenService.removeToken(refreshToken)
		return token
	}

	async refresh(refreshToken) {
		if (!refreshToken) {
			throw ApiError.UnauthorizedError()
		}

		const userData = tokenService.validateRefreshToken(refreshToken)
		const tokenFromDB = await tokenService.findToken(refreshToken)

		if (!userData || !tokenFromDB) {
			throw ApiError.UnauthorizedError()
		}

		const user = await prisma.user.findFirst({ where: { id: userData.id } })
		const userDto = new UserDto(user)
		const tokens = tokenService.generateTokens({ ...userDto })

		await tokenService.saveToken(userDto.id, tokens.refreshToken)
		return { ...tokens, user: userDto }
	}

	async getAllUsers() {
		const users = await prisma.user.findMany()
		return users
	}
}

module.exports = new UserService()
