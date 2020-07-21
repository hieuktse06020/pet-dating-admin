var express = require('express');
var app = express();
var path = require('path');
var bodyParser = require('body-parser')
var session = require('express-session');
var mysql = require('mysql');
const { query } = require('express');
var connection = mysql.createConnection({
	host     : 'us-cdbr-east-02.cleardb.com',
	user     : 'bf8a1b55c1e2e6',
	password : '8c8d6ed8',
	database : 'heroku_0d15c6611609f1f'
});
//check connection
connection.connect((err) => {
  if (err) throw err;
  console.log('Connected!');
});


app.use(session({
	secret: 'secret',
	resave: true,
	saveUninitialized: true
}));
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
  res.sendFile('web/css/style.css', {root: __dirname })
})

app.get('/server/web/css/font-awesome.css', function (req, res) {
  res.sendFile('web/css/font-awesome.css', {root: __dirname })
})

app.get('/server/web/images/1.jpg', function (req, res) {
  res.sendFile('web/images/1.jpg', {root: __dirname })
})
app.get('/server/web/fonts/fontawesome-webfont.woff', function (req, res) {
  res.sendFile('web/fonts/fontawesome-webfont.woff', {root: __dirname })
})

app.get('/server/web/fonts/fontawesome-webfont.ttf', function (req, res) {
  res.sendFile('web/fonts/fontawesome-webfont.ttf', {root: __dirname })
})
// get account
app.get('/server/web/account.html', function(req, res){
  res.render('web/account.html', {root: __dirname });
})
app.get('/account', function (req, res) {
	res.sendFile(path.join(__dirname + '/web/account.html'));
  })
// get create account
app.get('/create', function (req, res) {
	res.sendFile(path.join(__dirname + '/web/createAccount.html'));
  })
app.get('/server/web/createAccount.html', function(req, res){
	res.render('web/createAccount.html', {root: __dirname });
  })
// get change password
app.get('/change', function (req, res) {
	res.sendFile(path.join(__dirname + '/web/changePassword.html'));
  })
app.get('/server/web/changePassword.html', function(req, res){
	res.render('web/changePassword.html', {root: __dirname });
  })
app.get('web/account.html', function(request, response) {
	if (request.session.loggedin) {
		response.send('Welcome back, ' + request.session.username + '!');
	} else {
		response.send('Please login to view this page!');
	}
	response.end();
});
// Login
app.post('/auth', function(request, response) {
	var username = request.body.username;
	var password = request.body.password;
	if (username && password) {
		connection.query('SELECT * FROM account WHERE accountName = ? AND password = ?', [username, password], function(error, results) {
      if (results.length > 0) {
				request.session.loggedin = true;
				request.session.username = username;
				response.redirect('account');
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
app.get('/logout',function(req,res){
    req.session.destroy(function(err){
        if(err){
            console.log(err);
        }
        else
        {
        	res.redirect('/');
        }
    });

});
// create an account for admin
app.post('/create', function(request, response) {
	var userName = request.body.youremail;
	var passWord = request.body.passwordNew;
	const role = 1;
	const acc_status = 1;
	var account = {
		accountName: userName,
		password: passWord,
		role: role,
		acc_status: acc_status
	}
	connection.query('INSERT INTO account SET ?', account, function(error){
		if(error){
			console.log(error.message);
			response.end();
		} else{
			console.log('Create successfully!!!')
			response.redirect('/');
		}
		response.end();
	});
});

// Change password for admin
app.post('/create', function(request, response) {
	
});
var server = app.listen(3000, function () {

  var host = server.address().address
  var port = server.address().port

  console.log("Node server running: http://%s:%s", host, port)

})