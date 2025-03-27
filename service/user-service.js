const uuid = require('uuid')
const bcrypt = require('bcrypt')
const UserDto = require('../dtos/user-dto')
const mailService = require('./mail-service')
const tokenService = require('./token-service')
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

class UserService {
	async registration(email, password) {
		const candidate = await prisma.user.findFirst({ where: { email } })

		if (candidate) {
			throw new Error(
				`Пользователь с почтовым адресом ${candidate.email} уже существует`
			)
		}

		const hashPassword = await bcrypt.hash(password, 3)
		const activationLink = uuid.v4()
		const user = await prisma.user.create({
			data: { email, password: hashPassword, activationLink },
		})
		await mailService.sendActivationMail(email, activationLink)

		const userDto = new UserDto(user)
		const tokens = tokenService.generateTokens({ ...userDto })
		await tokenService.saveToken(userDto.id, tokens.refreshToken)

		return {
			...tokens,
			user: userDto,
		}
	}
}

module.exports = new UserService()
