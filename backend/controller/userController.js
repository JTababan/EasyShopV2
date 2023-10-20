const bcrypt = require('bcrypt');
const DB = require('../models/DB')
const jwt = require('jsonwebtoken')
const { sendValidationEmail } = require('../service/EmailProvider') 

const creteToken = async (_id, _email) =>{
    return await jwt.sign({id : _id, email : _email }, 'secret', {expiresIn: '1d'})
}

const logout = function (req, res) {
    req.session.destroy(function(err){
        if(err) throw err
        res.json({status: 200, message: 'Logout Successfully'})
    })
}


const isAuth = function (req, res){
    
    if(!req.session.user){
        return res.json({status: 400, message: 'Please Login'})
    }
    
    const db = req.app.get('DB')
    
    db.query('select * from users_info where user_id = ?', [req.session.user.id], function (err, data) {
        res.json(data)
    })
}

const getUserInfo = function (req, res){
    
    if(!req.session.user){
        return res.json({status: 400, message: 'Please Login'})
    }
    
    const db = req.app.get('DB');
    
    db.query('select * from users_info where userId = ?', [req.session.user.id], function(err, data){
        if(err) {
            return res.json({status: 500, message: 'Server Error'})
        }
        res.json(data)
    })
}

const login =  async (req, res) => {
    
    const db = req.app.get('DB')
    
    const {email, password} = req.body
    
    
    const user = await DB.User.findOne({
        where:{
            email : email
        } 
    })
    
    if(!user) return res.json({status : 400, message : 'Email is not Registered'})
    
    const validPassword = await bcrypt.compare(password, user.password)
    
    if(!validPassword) return res.json({status : 400, message : 'Password inccorect'})
    
    const verified = await DB.Verified.findOne({where :{user_id : user.id}})
    
    if(!verified.isVerified) return res.send('Please confirm the email verification link')
    
    req.session.regenerate((error) =>{
        if(error) throw error
        
        req.session.user = {id : user.id , email : user.email}
        
        req.session.save(function (err) {
            if(err) throw err
            res.json({status: 200, user : req.session.user })
        });
        
    })
    
}

const signup = async (req, res) =>{

    const {firstName, lastName, password, repeatPassword } = req.body;
    const _email = req.body.email
   
    if(password == repeatPassword){
        
        try {
            

            console.log(req.body)
            const hashpass = await bcrypt.hash(password, 10)
            
            const t = await DB.instance.transaction()
            
            const user = await DB.User.create({password : hashpass, email: _email,  first_name : firstName, last_name: lastName}, { transaction : t})
            
            const token = await creteToken(user.id, user.email)
            
            const verified = await DB.Verified.create({token : token, user_id : user.id}, { transaction : t})
            
            const link = `http://${req.hostname }:${req.socket.localPort}/api/user/verify/${token}`

            console.log(link)
            const email = await sendValidationEmail(user.first_name, user.email, link)
            
            await t.commit()
            res.send(link)
        } catch (error) {
           res.send(error)
        }
    
    }
}

const verifyUser = async (req, res) => {
    try{
        // TODO add id
        const {token} = req.params
        
        const decodeToken  = await jwt.verify(token, 'secret')
        
        const verifiedUser = await DB.Verified.findOne({where : { user_id : decodeToken.id}})
        
        if(verifiedUser.isVerified) return res.send('')

        verifiedUser.isVerified = true;

        await verifiedUser.save()

        res.json({status: 200, message: 'Account Verified'})

    } catch(error) {
        res.send(error.name)
    }

    

}


const getAddress = (req, res) =>{
    if(!req.session.user){
        return res.json({status: 400, message: 'Please Login'})
    }
    const db = req.app.get('DB');
    
    db.query('select * from users_address where user_id = ?', [req.session.user.id], function(err, result){
        if(err) {
            console.log(err)
            return res.json({status: 500, message: 'Server Error'})
        }
        
        res.json(result)
    })
}

const setAddress = (req, res) =>{
    if(!req.session.user){
        return res.json({status: 400, message: 'Please Login'})
    }
    
    
    const {address_line_1, address_line_2, city, country, zipcode} = req.body
    const db = req.app.get('DB');
    
    db.beginTransaction(function(err){
        if(err) return res.json({status: 500, message: 'Server Error'})
        
        db.query('insert into users_address(user_id, address_line_1, address_line_2, city, country, zipcode) values (?, ?, ?, ?, ?, ? )', 
        [
            req.session.user.id,
            address_line_1,
            address_line_2,
            city,
            country,
            zipcode
        ], 
        function(err, result){
            if(err) return res.json({status: 500, message: 'Server Error'})
            
            const insertId = result.insertId
            
            db.query('update users_info set user_address_id = ? where user_id = ?', [insertId, req.session.user.id], function(err, result){
                if(err) return res.json({status: 500, message: 'Server Error'})
                
                db.commit(err =>{
                    res.json({status: 200})
                })
            })
        })
        
        
    })
    
}



module.exports = {
    login,
    signup,
    logout,
    isAuth,
    getUserInfo,
    getAddress,
    setAddress,
    verifyUser
}