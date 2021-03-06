const {Router} = require('express')
const User = require('../models/User')
const bcrypt = require('bcryptjs')
const {check, validationResult} = require('express-validator')
const jwt = require("jsonwebtoken")
const config = require("config")
const router = Router()

//  /api/auth/register

router.post(
    '/register',
    [
        check('email', 'некорректный Email').isEmail(),
        check('password', "минимальная длина пароля 6 символов").isLength({min: 6})
    ],
    async (req, res) => {
        try {
            const errors = validationResult(req)

            if (!errors.isEmpty()) {
                return res.status(400).json({
                    errors: errors.array(),
                    message: "некорректные данные при регистрации"
                })
            }

            const {email, password} = req.body

            const candidate = await User.findOne({email})

            if (candidate) {
                res.status(400).json({massage: "такой пользователь уже существует"})
            }
            const hashedPassword = await bcrypt.hash(password, 12)

            const user = new User({email: email, password: hashedPassword})

            await user.save()

            res.status(201).json({message: "пользователь успешно создан"})

        } catch (e) {
            res.status(500).json({message: 'что-то пошло не так попробуйте снова '})
        }
    })

//  /api/auth/login
router.post(
    '/login',
    [
        check('email', 'введите корректный е-мейл').normalizeEmail().isEmail(),
        check('password', 'введите Пароль').exists()
    ],
    async (req, res) => {
        try {

            const errors = validationResult(req)

            if (!errors.isEmpty()) {
                return res.status(400).json({
                    errors: errors.array(),
                    message: "некорректные данные при входе в систему"
                })
            }

            const {email, password} = req.body

            const user = await User.findOne({email})

            if (!user) {
                return res.status(400).json({massage: "пользователь не найден"})
            }
            const isMatch = await bcrypt.compare(password, user.password)

            if (!isMatch) {
                return res.status(400).json({massage: "неправильный пароль"})
            }

            const token = jwt.sign(
                {userId: user.id},
                config.get("jwtSecret"),
                {expiresIn: "1h"}
            )

            res.json({token, userId: user.id})

        } catch (e) {
            res.status(500).json({message: 'что-то пошло не так попробуйте снова '})
        }
    })

router.get(
    '/users',
    async (req, res) => {
        try {
            const allArray = await User.find({})

            res.send(allArray)

        } catch (e) {
            res.status(500).json({message: 'что-то пошло не так попробуйте снова '})
        }
    })


module.exports = router