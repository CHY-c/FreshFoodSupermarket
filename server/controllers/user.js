const db = require('../utils/db.js')
const nodemailer = require('nodemailer')
const md5 = require('md5')
const Redis_db = (require('../utils/db')).Redis_db
const domain = require('../config/Domain-config')
const batchUpdate = require('../utils/batchUpdate')

/*注册*/
async function signup(ctx, next) {
	
	let username = ctx.request.body.username
	let password = ctx.request.body.password
	let email = ctx.request.body.email

	let sql1 = `select * from user where username = '${username}'`
	let data1 = await db.MySQL_db(sql1)

	if(data1.length != 0) {
		ctx.body = {
			code: -1,
			data: {
				msg: "用户名已存在！"
			}
		}
		return
	} else {
		let sql2 = `insert into user (username, password, email) values ('${username}', '${password}', '${email}')`
		await db.MySQL_db(sql2)
		ctx.body = {
			code: 0,
			data: {
				msg : "注册成功！"
			}
		}
	}
}

/*找回密码*/
async function retrieve(ctx, next) {

	var params = {
	    host: 'smtp.163.com',
	    port: 465,
	    sercure: true,
	    auth: {
	        user: '18365225454@163.com',
	        pass: 'yetiandi123'
	    }
	}

	let username = ctx.request.body.username
	let sql = `select username, email from user where username = '${username}'`
	let token = md5(username + (new Date()).toLocaleString() + Math.random())
	let email = (await db.MySQL_db(sql))[0].email
	const mailOptions = {
        from: '18365225454@163.com', 
        to: email, 
        subject: '叶鲜生生鲜超市找回密码', 
        html: `<a href='http://${domain}:3000/reset.html?token=${token}'><b>请在五分钟内点击链接完成验证，并进行密码重置</b></a>` 
    }

    const transporter = nodemailer.createTransport(params)

    await transporter.sendMail(mailOptions, async function(err, info) {

        if (err) { return console.log(err) }
        await Redis_db.set(token, username);
        await Redis_db.expire(token, 300);
        console.log(`Emial sent to ${username}: ${email} sent successfully!`); 
    })

   	ctx.body = {
       	code: 0,
       	data: {
       		msg: '用户身份验证成功！'
   		}
    }
}

/*密码重置*/
async function reset(ctx, next) {

	let token = ctx.request.body.token

	let password = ctx.request.body.password

	let response = await Redis_db.exists(token)
	var msg = ''

	if(response === 1) {

		let username = await Redis_db.get(token)

		let sql = `update user set password = '${password}' where username = '${username}'`
		await db.MySQL_db(sql)
		await Redis_db.del(token)
		msg = '密码重置成功！'
		
	} else if(response === 0){

		msg = '邮箱验证链接已经过期！'
	} 

	ctx.body = {
		code: 0,
		data: {
			msg: msg
		}
	}
}

/*登录*/
async function signin(ctx, next) {

	let username = ctx.request.body.username
	let password = ctx.request.body.password

	let sql = `select * from user where username = '${username}' and password = '${password}'`

	let data = await db.MySQL_db(sql)

	if(data.length === 0) {
		ctx.body = {
			code: -1,
			data: {
				msg : "用户名或密码错误！"
			}
		}
		return 
	} else {

		ctx.cookies.set('username', encodeURIComponent(username) , {
			signed: false,
           	domain: domain,
         	path:'*',   
         	maxAge:1000*60*30,
         	httpOnly:false,
         	overwrite:false
		})

		ctx.session.user = {userName: data[0].username}

		ctx.body = {
			code: 0,
			data: {
				msg : "登录成功！"
			}
		}
		
	}
}

/*登出*/
/*增加超时机制*/
/*暂时未手动删除redis数据库中sessionsid*/
async function signout(ctx, next) {
	ctx.session = {}

	ctx.cookies.set('username', '' , {
		signed: false,
       	domain: domain,
     	path: '*',   
     	maxAge: 0,
     	httpOnly: false,
     	overwrite: false
 	})

	ctx.body = {
		code: 0,
		data: {
			msg: "退出成功！"
		}
	}

}

/*查询个人地址*/
async function address(ctx, next) {
	ctx.session.refresh()

	let username = ctx.request.query.username

	let sql = `select * from address where username = '${username}' order by isdefault desc`

	let data = await db.MySQL_db(sql)
	ctx.body = {
		code: 0,
		data: data
	}
}

/*新增个人地址*/
async function insertAddress(ctx, next) {
	ctx.session.refresh()

	let username = ctx.request.body.username
	let province = ctx.request.body.province
	let city = ctx.request.body.city
	let county = ctx.request.body.county
	let street = ctx.request.body.street
	let addressname = ctx.request.body.addressname
	let default_ = ctx.request.body.default

	let sql = `insert into address (username, province, city, county, street, addressname, isdefault) values ('${username}', '${province}', '${city}', '${county}', '${street}', '${addressname}', ${default_})`

	let data = await db.MySQL_db(sql)
	ctx.body = {
		code: 0,
		data: {
			msg: "填写成功！"
		}
	}
}

/*用户购买商品*/
async function buy(ctx, next) {
	ctx.session.refresh()
	
	let goodsList = ctx.request.body.goods

	let orderTime = (new Date()).toLocaleString()

	let sql = `insert into receive (username, goodsNo, orderNo, num, orderTime, subtotal, address) values `

	for(let i=0; i<goodsList.length; i++) {
		if(i < goodsList.length - 1) {
			sql += `('${goodsList[i].username}', '${goodsList[i].goodsNo}', '${md5(goodsList[i].username + orderTime + goodsList[i].subtotal)}', '${goodsList[i].num}', '${orderTime}', ${goodsList[i].subtotal}, '${goodsList[i].address}'), `

		} else {
			sql += `('${goodsList[i].username}', '${goodsList[i].goodsNo}', '${md5(goodsList[i].username + orderTime + goodsList[i].subtotal)}', '${goodsList[i].num}', '${orderTime}', ${goodsList[i].subtotal}, '${goodsList[i].address}')`
		}
	}

	await db.MySQL_db(sql)

	ctx.body = {
		code: 0,
		data: {
			msg: "下单成功！"
		}
	}

	await batchUpdate(goodsList)

}

/*个人推荐（猜你喜欢）*/
async function fav(ctx, next) {
	ctx.session.refresh()

	let username = ctx.request.body.username
	let sql = `select * from fav where username = '${username}'`
	let vector = (await db.MySQL_db(sql))[0]
	sql = `select * from fav`
	let matrix = await db.MySQL_db(sql)
	
	/*除数不为零！可能出错！*/
	let mul = 0
	let div1 = 0
	let div2 = 0
	let similarity = 0
	let keys = Object.keys(vector)
	for(let i=0; i<matrix.length; i++) {
		mul = 0
		div1 = 0
		div2 = 0
		for(let j=0; j<keys.length-1; j++) {
			mul = mul + vector[keys[j]]*(matrix[i])[keys[j]]
			div1 +=  Math.pow(vector[keys[j]], 2) 
			div2 +=  Math.pow((matrix[i])[keys[j]], 2)

		}
		similarity = 100*mul/(Math.sqrt(div1)*Math.sqrt(div2))
		sql = `update similarity set \`${matrix[i].username}\` = '${similarity}' where username = '${username}'`
		await db.MySQL_db(sql)
		
	}

	sql = `select * from similarity where username = '${username}'`
	let similarity_obj = (await db.MySQL_db(sql))[0]

	let lst = new Array()

	let names = Object.keys(similarity_obj).slice(1, Object.keys(similarity_obj).length)

	let goods1 = null
	let goods2 = null
	/*按照相似度排序未实现*/
	for(i=0; i<names.length; i++) {
		if(names[i] != username && similarity_obj[names[i]]>=50) {

			sql = `select username, goodsNo, sum(num) as num from receive where username = '${names[i]}' group by username, goodsNo order by num desc limit 2`

			goods1 = ((await db.MySQL_db(sql))[0]).goodsNo

			if(lst.indexOf(goods1) === -1) {
				lst.push(goods1)
			}

			goods2 = ((await db.MySQL_db(sql))[1]).goodsNo

			if(lst.indexOf(goods2) === -1) {
				lst.push(goods2)
			}
		}
	}

	sql = `select * from goods where goodsNo in (`
	for(i=0; i<lst.length; i++) {
		if(i != lst.length-1) {
			sql += lst[i] + `,`
		} else {
			sql += `${lst[i]})`
		}
	}

	let data = await db.MySQL_db(sql)

	ctx.body = {
		code: 0,
		data: data
	}

}

module.exports = {
	signup: signup,
	retrieve: retrieve,
	reset: reset,
	signin: signin,
	fav: fav,
	address: address,
	insertAddress: insertAddress,
	buy: buy,
	signout: signout,	
}

