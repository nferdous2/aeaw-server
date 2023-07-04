
// const express = require("express");
// const app = express();
// require('dotenv').config();
// const fs = require('fs');
// const cors = require('cors');
// const { MongoClient } = require('mongodb');
// const multer = require('multer');
// const path = require('path');
// const bcrypt = require("bcryptjs");
// const nodemailer = require("nodemailer");

// app.use(cors());
// app.use(express.json());

// // MongoDB connection
// const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.yhxur.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
// const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

// const port = process.env.PORT || 8000;
// let loggedInUsers = {}; // Store logged in users

// // Multer configuration
// const storage = multer.diskStorage({
//   destination: function (req, file, cb) {
//     const destinationPath = path.join(__dirname, 'articles/');
//     fs.mkdirSync(destinationPath, { recursive: true }); // Create the 'articles' directory if it doesn't exist
//     cb(null, destinationPath);
//   },
//   filename: function (req, file, cb) {
//     cb(null, Date.now() + '-' + file.originalname);
//   }
// });

// const upload = multer({ storage: storage }).fields([
//   { name: 'image', maxCount: 1 },
//   { name: 'pdf', maxCount: 1 },
//   { name: 'cv', maxCount: 1 }
// ]);

// // Nodemailer configuration
// const transporter = nodemailer.createTransport({
//   host: "smtp.forwardemail.net",
//   secure: true,
//   port: 587,
//     auth: {
//         user: 'palma.larson@ethereal.email',
//         pass: 'zwCMfJRkXVay1PG4zM'
//     },
//     tls: {
//       minVersion: 'TLSv1.2'
//     }
// });

// // Generate a random token
// function generateToken() {
//   const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
//   let token = "";
//   for (let i = 0; i < 32; i++) {
//     token += characters.charAt(Math.floor(Math.random() * characters.length));
//   }
//   return token;
// }

// async function sendVerificationEmail(email, verificationToken) {
//   // Construct the email message
//   const mailOptions = {
//     from: '"Your Name" <kn769127@gmail.com>',
//     to: email,
//     subject: "Email Verification",
//     text: `Please click the following link to verify your email address: http://localhost:8000/verify?token=${verificationToken}`
//   };

//   // Send the email
//   await transporter.sendMail(mailOptions);
// }

// async function run() {
//   try {
//     await client.connect();
//     console.log("Connected to MongoDB");

//     const database = client.db("aeaw");
//     const articlesCollection = database.collection("articles");
//     const usersCollection = database.collection("aeawUsers");
//     const adminCollection = database.collection("admin");

//     // Register user endpoint
//     app.post("/register", async (req, res) => {
//       try {
//         const {
//           name,
//           address,
//           email,
//           phone,
//           password,
//           experience,
//           education,
//           country,
//           role,
//         } = req.body;

//         const existingUser = await usersCollection.findOne({ email });
//         if (existingUser) {
//           return res.status(409).json({ error: "User already exists" });
//         }

//         const hashedPassword = await bcrypt.hash(password, 10);
//         const verificationToken = generateToken(); // Generate a verification token

//         const user = {
//           name,
//           address,
//           email,
//           phone,
//           password: hashedPassword,
//           role,
//           experience,
//           education,
//           country,
//           verificationToken, // Add verification token to the user object
//         };

//         // Store the user object in the database
//         const result = await usersCollection.insertOne(user);

//         // Send the verification email
//         await sendVerificationEmail(email, verificationToken);

//         res.json({
//           message: "User registered successfully",
//           userId: result.insertedId,
//         });
//       } catch (err) {
//         console.error("Error registering user:", err);
//         res.status(500).json({ message: "An error occurred" });
//       }
//     });

//     app.get('/', (req, res) => {
//       res.send('Running away site');
//     });

//     app.listen(port, () => {
//       console.log("Server running on port", port);
//     });
//   } finally {
//     // await client.close();
//   }
// }

// run().catch(console.dir);
