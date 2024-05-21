require('dotenv').config({ path: (__dirname, '../.env') })
const express = require("express");
const path = require('path');
const hbs = require("hbs");
const nodemailer = require("nodemailer");
const session = require("express-session");
var helpers = require('handlebars-helpers')({
    handlebars: hbs
});
const stripe = require('stripe')(process.env.STRIPE_KEY);
const UniqueStringGenerator = require('unique-string-generator');
const date = require('date-and-time');
const bcrypt = require('bcrypt');
const multer = require('multer');



const app = express();

var webviews = Number(process.env.WEB_VIEWS);

// Connection to Database
require("./db/conn");

const Register = require("./models/registers");
const Product = require("./models/property");
const Admin = require("./models/admins");
const { log } = require("console");
const { use } = require("passport");
const { on } = require('events');
const Property = require('./models/property');

require('dotenv').config({ path: (__dirname, '../.env') })
const static_path = path.join(__dirname, "../public");
const template_path = path.join(__dirname, "../templates/views");
const partials_path = path.join(__dirname, "../templates/partials");
const helper = helpers;

app.use(express.static(static_path));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.set("view engine", "hbs");
app.set("views", template_path);
hbs.registerPartials(partials_path);

// app.set('trust proxy', 1) // trust first proxy
app.use(session({
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }
}))

// Functions


//To send mail

const sendVerifyMail = async (name, email, user_id) => {
    // console.log('entered svm');
    try {

        const transporter = nodemailer.createTransport({
            // service:"Gmail",
            host: 'smtp.gmail.com',
            port: 587,
            secure: false,
            // requireTLS:true,
            tls: {
                rejectUnauthorized: false
            },
            auth: {
                user: 'harshprasad338@gmail.com',
                pass: process.env.GMAIL_PASS
            }
        });
        const mailOptions = {
            // console.log('mailoptiobn read');
            from: 'harshprasad338@gmail.com',
            to: email,
            subject: "Verification Mail",
            html: `<p> Hii ${name}, Please click in the link <a href="http://127.0.0.1:3000/verify?id=${user_id}"> Verify <a/>your mail.</p>`

        }
        transporter.sendMail(mailOptions, function (error, info) {
            // console.log("entered send Mail");
            if (error) {
                console.log(error);
            }
            else {
                console.log("Email has been sent", info.response);
            }
            // console.log('last line svm try');

        })
    } catch (error) {
        console.log(error.message);
    }
    // console.log('last line svm');
}

// to verify email

const verifyMail = async (req, res) => {
    try {

        const updateStatus = await Register.updateOne({ _id: req.query.id }, { $set: { verified: true } });
        console.log(updateStatus);
        res.status(201).render("login", { message: "e-mail verified please login!", currStatus: req.session.currLog });
        // res.send("<!DOCTYPE html>  <html lang='en'> <head> <title>Email verification</title></head> <body> Thanks for verifying your mail with us. Kindly login again. <a href='/'>click here</a></body> </html>")
    } catch (error) {
        console.log(error.message);
    }
}

// MAIN

app.get("/", async (req, res) => {
    req.session.views = (req.session.views || 0) + 1;
    webviews = webviews + 1;
    if (!req.session.cart) {
        req.session.cart = [];
        req.session.totalValue = {
            totalPrice: 0,
            includeTax: 0,
        }
    }
    // console.log(`You have visited ${req.session.views} times.`);
    // console.log(`User name : ${req.session.currLog} name is.`);
    // console.log(req.session);
    res.render("index", { currStatus: req.session.currLog });



})

//to send forgot password link

const sendforgetPassLink = async (name, email, user_id) => {
    // console.log('entered svm');
    try {
        // console.log('entered svm try');
        const transporter = nodemailer.createTransport({
            // service:"Gmail",
            host: 'smtp.gmail.com',
            port: 587,
            secure: false,
            // requireTLS:true,
            tls: {
                rejectUnauthorized: false
            },
            auth: {
                user: 'harshprasad338@gmail.com',
                pass: process.env.GMAIL_PASS
            }
        });
        const mailOptions = {
            // console.log('mailoptiobn read');
            from: 'harshprasad338@gmail.com',
            to: email,
            subject: "Change Password",
            html: `<p> Hii ${name}, Please click in the link to <a href="http://127.0.0.1:3000/changePassword?id=${user_id}"> change your password<a/>.</p>`

        }
        transporter.sendMail(mailOptions, function (error, info) {
            // console.log("entered send Mail");
            if (error) {
                console.log(error);
            }
            else {
                console.log("Email has been sent", info.response);
            }
            // console.log('last line svm try');

        })
    } catch (error) {
        console.log(error.message);
    }
    // console.log('last line svm');
}


//Register

app.get("/register", (req, res) => {
    res.render("register", { currStatus: req.session.currLog });
})
app.post("/register", async (req, res) => {
    try {
        const password = req.body.password;
        const conPassword = req.body.confirmPassword;

        const userData = await Register.findOne({ email: req.body.email });
        if (userData) {
            res.send("User already exist!")
        }
        else {
            if (password === conPassword) {
                const userData = new Register({
                    firstName: req.body.firstName,
                    lastName: req.body.lastName,
                    email: req.body.email,
                    password: req.body.password,
                    confirmPassword: req.body.confirmPassword,
                    isSeller: req.body.isSeller == 'on' ? true : false
                });

                const registered = await userData.save();
                //sending email for verification
                sendVerifyMail(req.body.firstName, req.body.email, registered._id);
                res.status(201).render("login", { message: "verify your mail to continue", currStatus: req.session.currLog });

            } else {
                render("register", { message: "Passwords do not match" });
                // res.send("Password != Confirm Password")
            }

        }
    }
    catch (error) {
        res.status(400).send(error);
    }
});

// Login

app.get("/login", (req, res) => {
    res.render("login", { currStatus: req.session.currLog });
});

app.post("/login", async (req, res) => {
    try {
        const email = req.body.email;
        const password = req.body.password;

        const userData = await Register.findOne({ email: email });
        if (userData.verified) {
            if (userData.password === password) {
                req.session.currLog = userData._id;

                if (userData.isSeller)
                    res.status(200).redirect('seller')
                else
                    res.status(201).render('index', { currStatus: req.session.currLog }); /// To be done
            } else {
                // res.send("Password mismatch");
                res.render('login', { message: "Username or password incorrect", currStatus: req.session.currLog });
            }
        } else {
            // res.send("Please verify your email.")

            res.render('login', { message: "Please verify your mail", currStatus: req.session.currLog });
        }
        // res.send("Succesfully logged in");

    } catch (error) {
        console.log(error);
        res.status(400).send("Invalid email");
    }
})

//Forget Pass

app.get("/forgetPass", (req, res) => {
    res.render("forgetPass", { currStatus: req.session.currLog });
});

app.post("/forgetPass", async (req, res) => {
    try {
        const email = req.body.email;
        const userEmail = await Register.findOne({ email: email });
        if (userEmail) {
            res.send("Link has been sent to change your password in your registerd email");
            sendforgetPassLink(userEmail.firstName, userEmail.email, userEmail._id);
        }
        else {
            res.send("email not found");
            console.log("email not found");
        }

    } catch (error) {
        console.log(error);
        res.status(400).send("Invalid Email");
    }
});

// Change Forget Password

app.get("/changePassword", (req, res) => {
    res.render("changePassword", { userId: req.query.id, currStatus: req.session.currLog });
    // console.log("id = "+req.query.id);
});
app.post("/changePassword", async (req, res) => {
    const newPass = req.body.newPass;
    const conNewPass = req.body.confirmNewPass;
    if (newPass === conNewPass) {

        console.log('pass = ' + newPass);
        const updatePass = await Register.updateOne({ _id: req.body.userId }, { $set: { password: newPass, confirmPassword: conNewPass } });
        console.log(updatePass);
        res.send("Password has been changed successfully");

    }
    else {
        res.send("Password mismatch");
    }
});



//verification

app.get("/verify", verifyMail);

//

//Policies

app.get("/policies", (req, res) => {
    res.render("policies", { currStatus: req.session.currLog });
});

//About us
app.get("/about-us", (req, res) => {
    res.render("about-us", { currStatus: req.session.currLog });
});

// Products

app.get("/products", async (req, res) => {
    const roomNo = req.query.noOfRoom;
    var propertyList;
    if (roomNo) {

        propertyList = await Property.find({ noOfRoom: roomNo });
    } else {
        propertyList = await Property.find();

    }
    // console.log("hi my self = ",propertyList)
    res.render("products", { productList: propertyList, currStatus: req.session.currLog });

});


// Product Main Page

app.get("/prdct-main", async (req, res) => {

    const clickedProduct = await Property.findOne({ propertyId: req.query.id });
    const sellerDetails = await Register.findOne({ _id: clickedProduct.sellerId })
    console.log("clickedProduc = ", sellerDetails)
    res.render("prdct-main", { clickedProduct: clickedProduct, sellerDetails: sellerDetails, currStatus: req.session.currLog });
});

// Account 
app.get("/account", async (req, res) => {
    const currLoggedUser = await Register.findOne({ _id: req.session.currLog })
    res.render("account", { userDetails: currLoggedUser, currStatus: req.session.currLog });

});
// Logout

app.get("/logout", (req, res) => {
    req.session.currLog = 0;
    res.redirect("/");
});

// Admin


app.get("/seller", async (req, res) => {
    try {

        const sellerId = req.session.currLog

        const properties = await Property.find({ sellerId: sellerId });
        const sellerDetails = await Register.findOne({ _id: sellerId })

        res.render("admin-dashboard", { products: properties, sellerDetails: sellerDetails });

    }

    catch (error) {
        console.log(error);
    }

});

// Admin add product

app.post("/admin/add-product", async (req, res) => {

    // req.body.id;
    try {
        console.log(req.body);

        const propertyAdd = new Property({
            propertyId: req.body.productId,
            name: req.body.productName,
            price: req.body.productPrice,
            description: req.body.productDescription,
            location: req.body.productLocation,
            noOfRoom: req.body.noOfRoom,
            noOfWashRoom: req.body.noOfWashroom,
            distToNearestCollege: req.body.nearestCollege,
            distToNearestHospital: req.body.nearestHospital,
            distToNearestMetro: req.body.nearestMetro,
            origin: req.body.productOrigin,
            fabric: req.body.productFabric,
            category: req.body.category,
            likesCount: 0,
            sellerId: req.session.currLog,
            photoUrl: req.body.picUrl
        });
        const success = await propertyAdd.save();
        res.redirect('back');
    } catch (error) {
        console.log(error);
    }
});

// Admin edit product

app.get("/admin/dashboard/product/edit", async (req, res) => {

    console.log(req.query.id);
    const fetchProduct = await Property.findOne({ _id: req.query.id });
    res.render("admin-edit-product", { product: fetchProduct })
});

app.post("/admin/edit-product/:id", async (req, res) => {
    const updateProduct = await Property.updateOne({ _id: req.params.id }, {
        $set: {
            name: req.body.productName,
            price: req.body.productPrice,
            description: req.body.productDescription,
            location: req.body.productLocation,
            noOfRoom: req.body.noOfRoom,
            noOfWashRoom: req.body.noOfWashroom,
            distToNearestCollege: req.body.nearestCollege,
            distToNearestHospital: req.body.nearestHospital,
            distToNearestMetro: req.body.nearestMetro,
            origin: req.body.productOrigin,
            fabric: req.body.productFabric,
            category: req.body.category,
            sellerId: req.session.currLog,
            photoUrl: req.body.picUrl
        }
    });
    res.redirect('/seller');
});

// delete product

app.get("/admin/dashboard/product/delete", async (req, res) => {
    try {
        const deleteProduct = await Product.deleteOne({ prod_id: req.query.id });
        console.log("id =", req.query.id);
        console.log("del pr = ", deleteProduct);
        res.redirect("/admin");

    } catch (error) {
        console.log(error);
    }
});
app.listen(process.env.PORT, () => {
    console.log(`Server is running at ${process.env.PORT}`);
});
