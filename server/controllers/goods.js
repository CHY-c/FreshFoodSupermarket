const db = require('../utils/db.js')

async function all(ctx, next) {
	ctx.session.refresh()

	let goodsName = ctx.request.query.goodsName
	let sql = `select * from goods where goodsName = '${goodsName}'`
	let data = await db.MySQL_db(sql)
	ctx.body = {
		code: 0,
		data: data
	}
}


async function fruits(ctx, next) {
	ctx.session.refresh()

	var subtypeList = ['香蕉', '苹果', '葡萄', '西瓜', '梨', '柚子', '车厘子']
	var data = new Array()
	for(let subtype of subtypeList) {
		let sql = `select * from sale where type = '水果' and subtype = '${subtype}' limit 5`
		let sub_data = await db.MySQL_db(sql)
		data.push(sub_data)
	}

	ctx.body = {
		code: 0,
		data: data
	}
}

async function vegetables(ctx, next) {
	ctx.session.refresh()

	var subtypeList = ['茄子', '黄瓜', '小辣椒', '小白菜', '大葱', '毛豆', '番茄']
	var data = new Array()
	for(let subtype of subtypeList) {
		let sql = `select * from sale where type = '蔬菜' and subtype = '${subtype}' limit 5`
		let sub_data = await db.MySQL_db(sql)
		data.push(sub_data)
	}
	
	ctx.body = {
		code: 0,
		data: data
	}
}

async function seafoods(ctx, next) {
	ctx.session.refresh()

	var subtypeList = ['生蚝', '帝王蟹', '乌贼', '扇贝', '龙虾', '鱿鱼', '海胆']
	var data = new Array()
	for(let subtype of subtypeList) {
		let sql = `select * from sale where type = '海鲜' and subtype = '${subtype}' limit 5`
		let sub_data = await db.MySQL_db(sql)
		data.push(sub_data)
	}
	
	ctx.body = {
		code: 0,
		data: data
	}
}

async function meat(ctx, next) {
	ctx.session.refresh()

	var subtypeList = ['火鸡', '牛肉', '羊肉', '烤鸭', '鹅肉', '猪肉', '鸡肉']
	var data = new Array()
	for(let subtype of subtypeList) {
		let sql = `select * from sale where type = '肉类' and subtype = '${subtype}' limit 5`
		let sub_data = await db.MySQL_db(sql)
		data.push(sub_data)
	}
	
	ctx.body = {
		code: 0,
		data: data
	}
}

async function dairy(ctx, next) {
	ctx.session.refresh()
	
	var subtypeList = ['奶酪', '奶油', '奶粉', '酸奶', '巴氏鲜奶', '炼乳', '冰淇淋']
	var data = new Array()
	for(let subtype of subtypeList) {
		let sql = `select * from sale where type = '乳制品' and subtype = '${subtype}' limit 5`
		let sub_data = await db.MySQL_db(sql)
		data.push(sub_data)
	}
	
	ctx.body = {
		code: 0,
		data: data
	}
}


module.exports = {
	all: all,
	fruits: fruits,
	vegetables:vegetables,
	seafoods: seafoods,
	meat: meat,
	dairy: dairy 
}

