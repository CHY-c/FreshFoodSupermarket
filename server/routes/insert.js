const router = require('koa-router')()
const controllers = require('require-all')({
	dirname: 'D:/MyProjects/FreshFoodSuperMarket/server/controllers' 
})

router.post('/signup', controllers.signup)
router.post('/buy', controllers.buy)

module.exports = router