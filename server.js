var express = require('express');
var app = express();
var path = require('path');
var bodyParser = require('body-parser')
var session = require('express-session');
var mysql = require('mysql');
const { response, query } = require('express');
const PORT = process.env.PORT || 3000;
var url = require('url');
const { Console } = require('console');

//connection
var connection = mysql.createPool({
	host: 'us-cdbr-east-02.cleardb.com',
	user: 'bf8a1b55c1e2e6',
	password: '8c8d6ed8',
	database: 'heroku_0d15c6611609f1f'
});

app.use(session({
	secret: 'secret',
	resave: true,
	saveUninitialized: true
}));
app.set('view engine', 'ejs');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
	extended: true
}));
// get login
app.get('/', function (req, res) {
	res.sendFile(path.join(__dirname + '/web/login.html'));
})
// get material
app.get('/server/web/css/style.css', function (req, res) {
	res.sendFile('web/css/style.css', { root: __dirname })
})

app.get('/server/web/css/font-awesome.css', function (req, res) {
	res.sendFile('web/css/font-awesome.css', { root: __dirname })
})

app.get('/server/web/images/1.jpg', function (req, res) {
	res.sendFile('web/images/1.jpg', { root: __dirname })
})
app.get('/server/web/fonts/fontawesome-webfont.woff', function (req, res) {
	res.sendFile('web/fonts/fontawesome-webfont.woff', { root: __dirname })
})

app.get('/server/web/fonts/fontawesome-webfont.ttf', function (req, res) {
	res.sendFile('web/fonts/fontawesome-webfont.ttf', { root: __dirname })
})
// get change password
app.get('/change', function (req, res) {
	res.sendFile(path.join(__dirname + '/web/changePassword.html'));
})
app.get('/server/web/changePassword.html', function (req, res) {
	res.render('web/changePassword.html', { root: __dirname });
})
app.get('web/account.html', function (request, response) {
	if (request.session.loggedin) {
		response.send('Welcome back, ' + request.session.username + '!');
	} else {
		response.send('Please login to view this page!');
	}
	response.end();
});
// Login
app.post('/auth', function (request, response) {
	var username = request.body.username;
	var password = request.body.password;
	if (username && password) {
		connection.query('SELECT * FROM account WHERE accountName = ? AND password = ?', [username, password], function (error, results) {
			if (results.length > 0) {
				request.session.loggedin = true;
				request.session.username = username;
				response.redirect('report');
			} else {
				response.send('Incorrect Username and/or Password!');
			}
			response.end();
		});
	} else {
		response.send('Please enter Username and Password!');
		response.end();
	}
});
// Logout
app.get('/logout', function (req, res) {
	req.session.destroy(function (err) {
		if (err) {
			console.log(err);
		}
		else {
			res.redirect('/');
		}
	});

})

// Change password for admin
app.post('/change', function (request, response) {
	var accountName = request.body.userNameChange;
	var password = request.body.newPassword;
	let data = [password, accountName];
		connection.query('UPDATE account SET password = ? WHERE accountName = ?', data, function (error, results, fields) {
		if (error) {
			console.log(error.message);
			response.end();
		} else {
			if(results.affectedRows === 0){
				return response.send('Your email does not exit!');
			}
			console.log('Rows affected: ', results.affectedRows);
			response.redirect('/');
		}
		return response.end();
	});
});
//get account
app.get('/account', function (req, res, next) {
	if(req.session.loggedin){
		var url_parts = url.parse(req.url, true);
		var pageNumber = url_parts.query.page;
		if(pageNumber === undefined) pageNumber = 0;
		var limit = 5;
		var offset;
		offset = (limit * pageNumber) - limit;
		if(offset < 0) offset = 0;
		let query = `SELECT * FROM user WHERE is_delete = '0' ORDER BY id ASC LIMIT 5 OFFSET ${offset}` ;
			connection.query(query, function (error, data, fields) {
				if (error) {
					console.log(error.message);
				}
				res.render(__dirname + "/web/account.ejs",{ userData: data })
			});
	} else {
		res.redirect('/');
	}
});
// post data from mySql to fetch to account page
app.post('/account', function (req, res, next) {
	if(req.session.loggedin){
		let searchValue = req.body.searchValue;
		let query = `SELECT * FROM user WHERE is_delete = '0'`;
		if (searchValue === undefined) {
			query = `SELECT * FROM user WHERE is_delete = '0'`;
			connection.query(query, function (error, data, fields) {
				if (error) {
					console.log(error.message);
				}
				res.render(__dirname + "/web/account.ejs", { userData: data })
			});
		}
		else {
			query = `SELECT * FROM user WHERE is_delete = '0' AND name LIKE "%${searchValue}%"`;
			connection.query(query, function (error, data, fields) {
				if (error) {
					console.log(error.message);
				}
				res.render(__dirname + "/web/account.ejs", { userData: data })
			});
		}
	} else {
		res.redirect('/');
	}
});
// Fill data for user manager
app.get('/manager', function (req, res, next) {
	let id = req.query.id;
	if(req.session.loggedin){
		connection.query('SELECT * FROM user WHERE id = ?', id, function (error, data, fields) {
			if (error) {
				console.log(error.message);
			}
			listUser = data;
			res.render(__dirname + "/web/userManager.ejs", { userData: data })
		});
	} else {
		res.redirect('/');
	}
})
//Update user
app.post('/manager', function (request, response) {
	let id = request.body.idUpdate;
	var privacy = request.body.privacy;
	var enable = request.body.enableUpdate;
	var enableFrom = request.body.enableFromUpdate;
	var avatar = request.body.avatarUpdate;
	var Image = request.body.ImageUpdate;
	let flat = true;
	if(request.session.loggedin === true){
		connection.query('UPDATE user SET avatar = ?, is_block = ?, block_deadline = ? WHERE uid = ?', [ avatar, enable, enableFrom, id], function (error, results) {
			if (error) {
				flat = false;
				console.log(error.message)
				response.send('No column update ')
			} else {
				console.log(results.affectedRows + " record(s) updated");
				response.redirect("account")
			}
			response.end();
		});
	}
	else {
		response.redirect("You must loggedin");
	}
});
//get report
app.get('/report', function (req, res, next) {
	if(req.session.loggedin){
		var url_parts = url.parse(req.url, true);
		var pageNumber = url_parts.query.page;
		if(pageNumber === undefined) pageNumber = 0;
		var limit = 5;
		var offset;
		offset = (limit * pageNumber) - limit;
		if(offset < 0) offset = 0;
		let query = `select fb.id, u.name, fb.content, fb.feedbacktime, fb.img, fb.status from feedback fb inner join user u on fb.uid = u.uid ORDER BY status DESC LIMIT 5 OFFSET ${offset}`;
			connection.query(query, function (error, data, fields) {
				if (error) {
					console.log(error.message);
				}
				res.render(__dirname + "/web/reportManager.ejs", { userData: data })
			});
	} else {
		res.redirect('/');
	}
});
// post data from mySql to fetch to report page
app.post('/report', function (req, res, next) {
	if(req.session.loggedin){
		let searchValue = req.body.searchValue;
		let query = 'select fb.id, u.name, fb.content, fb.feedbacktime, fb.img, fb.status from feedback fb inner join user u on fb.uid = u.uid';
		if (searchValue === undefined) {
			query = 'select fb.id, u.name, fb.content, fb.feedbacktime, fb.img, fb.status from feedback fb inner join user u on fb.uid = u.uid';
			connection.query(query, function (error, data, fields) {
				if (error) {
					console.log(error.message);
				}
				res.render(__dirname + "/web/reportManager.ejs", { userData: data })
			});
		}
		else {
			query = 'select fb.id, u.name, fb.content, fb.feedbacktime, fb.img, fb.status from feedback fb inner join user u on fb.uid = u.uid WHERE name LIKE "%' + searchValue + '%"';
			connection.query(query, function (error, data, fields) {
				if (error) {
					console.log(error.message);
				}
				res.render(__dirname + "/web/reportManager.ejs", { userData: data })
			});
		}
	} else {
		res.redirect('/');
	}
});
let id;
//get image
app.get('/image', function (req, res, next) {
	if(req.session.loggedin){
		id = req.query.id;
		let query = 'SELECT p.name, p.avatar, p.id FROM USER u INNER JOIN pet p ON u.uid = p.user_id WHERE uid = ?';
			connection.query(query, id, function (error, data, fields) {
				if (error) {
					console.log(error.message);
				}
				res.render(__dirname + "/web/image.ejs", { userData: data })
			});
	} else {
		res.redirect('/');
	}
});
// post image
app.post('/image', function (req, res, next) {
	let image = req.body.textareaImage;
	let petID = req.body.pet_id;
	connection.query('UPDATE pet SET avatar = ? WHERE ID = ?', [image, petID], function (error, results) {
		if (error) {
			console.log(error.message)
			response.send('No column update ')
		} else {
			console.log(results.affectedRows + " record(s) updated");
			res.redirect(`image?id=${id}`);
		}
		res.end();
	});
});


//get petBreed
app.get('/petBreed', function (req, res, next) {
	if(req.session.loggedin){
		var url_parts = url.parse(req.url, true);
		var pageNumber = url_parts.query.page;
		if(pageNumber === undefined) pageNumber = 0;
		var limit = 5;
		var offset;
		offset = (limit * pageNumber) - limit;
		if(offset < 0) offset = 0;
		let query = `SELECT * FROM pet_breed ORDER BY id ASC LIMIT 5 OFFSET ${offset}` ;
			connection.query(query, function (error, data, fields) {
				if (error) {
					console.log(error.message);
				}
				res.render(__dirname + "/web/petBreed.ejs",{ pet: data })
			});
	} else {
		res.redirect('/');
	}
});
// post data from mySql to fetch to petBreed page
app.post('/petBreed', function (req, res, next) {
	if(req.session.loggedin){
		let searchValue = req.body.searchValue;
		let query = 'SELECT * FROM pet_breed';
		if (searchValue === undefined) {
			query = 'SELECT * FROM pet_breed';
			connection.query(query, function (error, data, fields) {
				if (error) {
					console.log(error.message);
				}
				res.render(__dirname + "/web/petBreed.ejs", { pet: data })
			});
		}
		else {
			query = 'SELECT * FROM pet_breed WHERE name LIKE "%' + searchValue + '%"';
			connection.query(query, function (error, data, fields) {
				if (error) {
					console.log(error.message);
				}
				res.render(__dirname + "/web/petBreed.ejs", { pet: data })
			});
		}
	} else {
		res.redirect('/');
	}
});
// Fill data for updateBreed
app.get('/updateBreed', function (req, res, next) {
	let id = req.query.id;
	if(req.session.loggedin){
		connection.query('SELECT * FROM pet_breed WHERE id = ?', id, function (error, data, fields) {
			if (error) {
				console.log(error.message);
			}
			listUser = data;
			res.render(__dirname + "/web/updateBreed.ejs", { pet: data })
		});
	} else {
		res.redirect('/');
	}
})
//Update breed
app.post('/updateBreed', function (request, response) {
	let id = request.body.idUpdate;
	var name = request.body.namePet;
	var modified_time = request.body.modified_time;
		connection.query('UPDATE pet_breed SET name = ?, modified_time = ? WHERE id = ?', [name, modified_time, id], function (error, results) {
			if (error) {
				console.log(error.message)
				response.send('No column update ')
			} else {
				console.log(results.affectedRows + " record(s) updated");
				response.redirect('petBreed');
			}
			response.end();
		});
});



// get add new breed
app.get('/addPet', function (req, res) {
	res.sendFile(path.join(__dirname + '/web/addPet.html'));
})
app.get('/server/web/addPet.html', function (req, res) {
	res.render('web/addPet.html', { root: __dirname });
})
// Add new Breed
app.post('/addPet', function (request, response) {
	var breed = request.body.petBreed;
	let flat = true;
	connection.query('select name from pet_breed', function(error, data,fields){
		for(let i = 0; i < data.length; i++){
			console.log(data[i].name);
			if(data[i].name === breed){
				flat = false;
			}
		}
	});
	if(request.session.loggedin){
		if(flat === true){
			connection.query(`INSERT INTO pet_breed(name) VALUES('${breed}')`, function (error) {
				if (error) {
					console.log(error.message);
					response.end();
				} else {
					console.log('Create successfully!!!')
					return response.redirect('petBreed');
				}
				response.end();
			});
		} else {
			response.send('Breed already exit!')
		}
	} else{
		return response.send('You must login!');
	}
});
//get vip
app.get('/vip', function (req, res) {
	if(req.session.loggedin){
		var url_parts = url.parse(req.url, true);
		var pageNumber = url_parts.query.page;
		if(pageNumber === undefined) pageNumber = 0;
		var limit = 5;
		var offset;
		offset = (limit * pageNumber) - limit;
		if(offset < 0) offset = 0;
		let query = `SELECT uv.id, u.name, uv.confirm_img, uv.from_date, uv.to_date, uv.status FROM USER u INNER JOIN user_vip uv ON u.uid = uv.uid ORDER BY uv.status DESC LIMIT 5 OFFSET ${offset}` ;
			connection.query(query, function (error, data, fields) {
				if (error) {
					console.log(error.message);
				}
				res.render(__dirname + "/web/vip.ejs",{ vip: data })
			});
	} else {
		res.redirect('/');
	}
});
// post data from mySql to fetch to vip page
app.post('/vip', function (req, res) {
	if(req.session.loggedin){
		let searchValue = req.body.searchValue;
		let query = 'SELECT uv.id, u.name, uv.confirm_img, uv.from_date, uv.to_date, uv.status FROM USER u INNER JOIN user_vip uv ON u.uid = uv.uid';
		if (searchValue === undefined) {
			query = 'SELECT uv.id, u.name, uv.confirm_img, uv.from_date, uv.to_date, uv.status FROM USER u INNER JOIN user_vip uv ON u.uid = uv.uid';
			connection.query(query, function (error, data, fields) {
				if (error) {
					console.log(error.message);
				}
				res.render(__dirname + "/web/vip.ejs", { vip: data })
			});
		}
		else {
			query = 'SELECT uv.id, u.name, uv.confirm_img, uv.from_date, uv.to_date, uv.status FROM USER u INNER JOIN user_vip uv ON u.uid = uv.uid WHERE name LIKE "%' + searchValue + '%"';
			connection.query(query, function (error, data, fields) {
				if (error) {
					console.log(error.message);
				}
				res.render(__dirname + "/web/vip.ejs", { vip: data })
			});
		}
	} else {
		res.redirect('/');
	}
});




app.get('/listpet', function (req, res, next) {
	if(req.session.loggedin){
		var url_parts = url.parse(req.url, true);
		var pageNumber = url_parts.query.page;
		if(pageNumber === undefined) pageNumber = 0;
		var limit = 5;
		var offset;
		offset = (limit * pageNumber) - limit;
		if(offset < 0) offset = 0;
		let query = `SELECT rp.id, rp.pet_id, rp.reason, rp.img, rp.created_time, u.name, rp.status FROM report
		 rp INNER JOIN user u ON rp.report_by = u.uid ORDER BY rp.status DESC LIMIT 5 OFFSET ${offset}`;
			connection.query(query, function (error, data, fields) {
				if (error) {
					console.log(error.message);
				}
				res.render(__dirname + "/web/ListPet.ejs", { userData: data })
			});
	} else {
		res.redirect('/');
	}
});
// post data from mySql to fetch to report page
app.post('/listpet', function (req, res, next) {
	if(req.session.loggedin){
		let searchValue = req.body.searchValue;
		let query = 'SELECT rp.id, rp.pet_id, rp.reason, rp.img, rp.created_time, u.name, rp.status FROM report rp INNER JOIN `user` u ON rp.report_by = u.uid';
		if (searchValue === undefined) {
			query = 'SELECT rp.id, rp.pet_id, rp.reason, rp.img, rp.created_time, u.name, rp.status FROM report rp INNER JOIN `user` u ON rp.report_by = u.uid';
			connection.query(query, function (error, data, fields) {
				if (error) {
					console.log(error.message);
				}
				res.render(__dirname + "/web/ListPet.ejs", { userData: data })
			});
		}
		else {
			query = 'SELECT rp.id, rp.pet_id, rp.reason, rp.img, rp.created_time, u.name, rp.status FROM report rp INNER JOIN `user` u ON rp.report_by = u.uid WHERE name LIKE "%' + searchValue + '%"';
			connection.query(query, function (error, data, fields) {
				if (error) {
					console.log(error.message);
				}
				res.render(__dirname + "/web/ListPet.ejs", { userData: data })
			});
		}
	} else {
		res.redirect('/');
	}
});





// Fill data for user manager
app.get('/updateURL', function (req, res, next) {
	let id = req.query.id;
	if(req.session.loggedin){
		connection.query('SELECT img FROM report WHERE pet_id = ?', id, function (error, data, fields) {
			if (error) {
				console.log(error.message);
			}
			listUser = data;
			res.render(__dirname + "/web/updateURL.ejs", { userData: data })
		});
	} else {
		res.redirect('/');
	}
})
//Update user
app.post('/updateURL', function (request, response) {
	let flat = true;
	var avatar = request.body.avatarUpdate;
		if(request.session.loggedin === true){
			connection.query('Delete from pet_feature WHERE img_url = ?', [avatar], function (error, results) {
				if (error) {
					flat = false;
					console.log(error.message)
					response.send('No column update ')
				} else {
					if(results.affectedRows < 1){
						flat = false;
					}
					console.log(results.affectedRows + " record(s) deleted!");
				}
			});
			if(flat === true){
				let done = "DONE";
				connection.query('UPDATE report SET status = ? WHERE img = ?', [done, avatar], function (error, results) {
					if (error) {
						console.log(error.message)
						response.send('No column update ')
					} else {
						console.log(results.affectedRows + " record(s) updated");
						response.redirect('/listpet');
					}
					response.end();
				});
			} else {
				response.redirect("Can't UPDATE");
			}
		} else {
			response.redirect("You must loggedin!")
		}
});
let ids;
app.get('/statusfeedback', function (req, res) {
	ids = req.query.id;
	res.sendFile(path.join(__dirname + '/web/statusFeedback.html'));
})
app.post('/statusfeedback', function (req, res) {
	let status = req.body.status;
	console.log(ids);
	if(req.session.loggedin === true){
		connection.query('UPDATE feedback SET status = ? WHERE id = ?', [status, ids], function (error, results) {
			if (error) {
				console.log(error.message)
				res.send('No column update ')
			} else {
				console.log(results.affectedRows + " record(s) updated");
				res.redirect("report")
			}
			res.end();
		});
	}
	else {
		res.redirect("You must loggedin");
	}
});
let idd;
app.get('/updateStatus', function (req, res) {
	idd = req.query.id;
	res.sendFile(path.join(__dirname + '/web/updateStatus.html'));
})
app.post('/updateStatus', function (req, res) {
	let status = req.body.statusVip;
	console.log(status);
	console.log(idd);
	if(req.session.loggedin === true){
		connection.query('UPDATE user_vip SET status = ? WHERE id = ?', [status, idd], function (error, results) {
			if (error) {
				console.log(error.message)
				res.send('No column update ')
			} else {
				console.log(results.affectedRows + " record(s) updated");
				res.redirect("vip")
			}
			res.end();
		});
	}
	else {
		res.redirect("You must loggedin");
	}
});
// SERVER
var server = app.listen(PORT, function () {

	var host = server.address().address
	var port = server.address().port

	console.log("Node server running: http://%s:%s", host, port)

})