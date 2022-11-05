const express = require('express')
const app = express()
const port =  process.env.PORT || 3000
var parser = require('body-parser');
app.use(parser.urlencoded({ extended: false }))
app.use(parser.json())
const { Pool, Client } = require('pg')
const client = new Client({
    user: 'postgres',
    host: 'localhost',
    database: 'juka',
    password: 'password',
    port: 5432,
  })

client.connect()

app.use(function(req,res,next){
  res.locals.userValue = null;
  next();
})


app.set('view engine', 'ejs')

const text = 'SELECT * from users where username = $1 and password = $2'

var loggedIn = false
var inj_active = true
var broken_active = true
var admin = false
var user = ''

app.get('/', (req, res) => {
    if (loggedIn){
        res.redirect('/index')
    }else{
        res.render('login', {active:inj_active})
    }
})
app.get('/logout', (req, res) => {
    loggedIn = false
    admin = false
    user = ''
    res.redirect('/')
    
})

app.post('/login', (req, resp) => {
    let us = req.body['username']
    let pw = req.body['password']
    let txt = 'SELECT * from users where username = \'' + String(us) +'\' and password = \'' + String(pw) + '\''
    console.log(txt)

    if (inj_active){
        client.query(txt, (err, res) => {
            console.log(err,res)
            if (typeof res === 'undefined'){
                resp.redirect("/")
                return
            }


            if (res['rowCount'] == 1){
                loggedIn = true
                if (res['rows'][0]['username'] === 'admin'){
                    admin = true
                }else{
                    admin = false
                }
                user = res['rows'][0]['username']             
            }else{
                loggedIn = false
            }
            resp.redirect("/index")
            //client.end()
            
            })
        }
    else{
        client.query(text,[us,pw], (err, res) => {
            if (typeof res === 'undefined'){
                resp.redirect("/")
                return
            }

            if (res['rowCount'] == 1){
                loggedIn = true 
                if (res['rows'][0]['username'] === 'admin'){
                    admin = true
                }else{
                    admin = false
                }
                user = res['rows'][0]['username']  
            }else{
                loggedIn = false 
            }

            resp.redirect("/index")
            //client.end()
            
        })
    }
})
app.get('/index', (req, res) => {
    if (loggedIn){
        res.render('index', {user:user,active:broken_active})
    }else{
        res.redirect("/")
    }
})
app.get('/toggleSql', (req, res) => {
    inj_active = !inj_active    
    res.redirect("/")
     
})

app.get('/toggleBAC', (req, res) => {
    broken_active = !broken_active    
    res.redirect("/index")
     
})
app.get('/admin_info', (req, res) => {
    if (broken_active){
        res.render('admin_info')
    }else{
        if (loggedIn && admin){
            res.render('admin_info')
        }else{
            res.sendStatus(404);
        }
    }
})


app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})