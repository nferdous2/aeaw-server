const express = require("express");
const app = express();
require("dotenv").config();
const fs = require("fs");
const cors = require("cors");
const { MongoClient } = require("mongodb");
const multer = require("multer");
const path = require("path");
const bcrypt = require("bcryptjs");
const { v4: uuidv4 } = require("uuid");
const nodemailer = require("nodemailer");
const jwt = require('jsonwebtoken');

app.use(cors());
app.use(express.json());

// mogodb connection .

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.yhxur.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const port = process.env.PORT || 8000;
let loggedInUsers = {}; // Store logged in users

// Multer configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const destinationPath = path.join(__dirname, "articles/");
    fs.mkdirSync(destinationPath, { recursive: true }); // Create the 'articles' directory if it doesn't exist
    cb(null, destinationPath);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({ storage: storage }).fields([
  { name: "image", maxCount: 1 },
  { name: "pdf", maxCount: 1 },
  { name: "cv", maxCount: 1 },
]);

// Nodemailer configuration
const transporter = nodemailer.createTransport({
  host: "mail.aeaw.net",
  port: 465,
  secure: true,
  auth: {
    user: "aeaw01@aeaw.net",
    pass: "^y?)56=^~b]6",
  },
});
//
app.get("/", (req, res) => {
  res.send("Running away site");
});

async function run() {
  try {
    await client.connect();
    const database = client.db("aeaw");
    const articlesCollection = database.collection("articles");
    const usersCollection = database.collection("aeawUsers");
    const adminCollection = database.collection("admin");
    //article section starts
    // to get the articles
    app.get("/articles", async (req, res) => {
      const cursor = articlesCollection.find({});
      const articles = await cursor.toArray();
      res.send(articles);
    });

    // Serve the files statically from the 'articles' directory
    app.use("/articles", express.static(path.join(__dirname, "articles")));
    //  to get the cv
    app.get("/articles/cv/:filename", (req, res) => {
      const { filename } = req.params;
      const filePath = path.join(__dirname, "articles", filename);

      if (!fs.existsSync(filePath)) {
        console.error("File not found");
        return res.status(404).send({ message: "File not found" });
      }

      res.contentType("application/pdf");
      fs.createReadStream(filePath).pipe(res);
    });
    //  get the pdf
    app.get("/articles/pdf/:filename", (req, res) => {
      const { filename } = req.params;
      const filePath = path.join(__dirname, "articles", filename);

      if (!fs.existsSync(filePath)) {
        console.error("File not found");
        return res.status(404).send({ message: "File not found" });
      }

      res.contentType("application/pdf");
      fs.createReadStream(filePath).pipe(res);
    });
    // post the articles
    app.post("/articles", (req, res) => {
      upload(req, res, async (error) => {
        if (error) {
          console.error(error);
          return res.status(400).send({ message: "Error uploading files" });
        }

        const { name, email } = req.body;
        const imageFile = req.files["image"][0];
        const pdfFile = req.files["pdf"][0];
        const cvfFile = req.files["cv"][0];

        // Check if files exist before uploading
        const imageFilePath = path.join(
          __dirname,
          "articles/",
          imageFile.filename
        );
        const pdfFilePath = path.join(__dirname, "articles/", pdfFile.filename);
        const cvfFilePath = path.join(__dirname, "articles/", cvfFile.filename);

        if (!fs.existsSync(imageFilePath) || !fs.existsSync(pdfFilePath)) {
          console.error("One or more files not found");
          return res
            .status(400)
            .send({ message: "One or more files not found" });
        }

        const article = {
          name,
          email,
          image: imageFile.filename,
          pdf: pdfFile.filename,
          cv: cvfFile.filename,
        };

        const result = await articlesCollection.insertOne(article);
        console.log(result);
        res.json(result);
      });
    });
    //end of articles section

    //user reg
    // app.post("/register", async (req, res) => {
    //   try {
    //     const {
    //       name,
    //       address,
    //       email,
    //       phone,
    //       password,
    //       experience,
    //       education,
    //       country,
    //       role,
    //     } = req.body;
    //     const existingUser = await usersCollection.findOne({ email });
    //     if (existingUser) {
    //       return res.status(409).json({ error: "User already exists" });
    //     }
    //     const hashedPassword = await bcrypt.hash(password, 10);
    //     const user = {
    //       name,
    //       address,
    //       email,
    //       phone,
    //       password: hashedPassword,
    //       role, // Set the user role
    //       experience,
    //       education,
    //       country,
    //     };

    //     // Store the user object in the database
    //     const result = await usersCollection.insertOne(user);
    //     res.json({
    //       message: "User registered successfully",
    //       userId: result.insertedId,
    //     });
    //   } catch (err) {
    //     console.error("Error registering user:", err);
    //     res.status(500).json({ message: "An error occurred" });
    //   }
    // });

    app.post("/register", async (req, res) => {
      try {
        const {
          name,
          address,
          email,
          phone,
          password,
          experience,
          education,
          country,
          role,
        } = req.body;
        const existingUser = await usersCollection.findOne({ email });
        if (existingUser) {
          return res.status(409).json({ error: "User already exists" });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const verificationToken = uuidv4();
        const user = {
          name,
          address,
          email,
          phone,
          password: hashedPassword,
          role,
          experience,
          education,
          country,
          verificationToken,
          verified: false,
        };
        const result = await usersCollection.insertOne(user);
        const verificationLink = `http://localhost:8000/verify?token=${verificationToken}`;
        const mailOptions = {
          from: "aeaw01@aeaw.net",
          to: email,
          subject: "Email Verification",
          html: `
        <p>Thank you for registering on our awae website. Please verify your email by clicking the following link:</p>
        <a href="${verificationLink}">${verificationLink}</a>
      `,
        };
        await transporter.sendMail(mailOptions);
        res.json({
          message:
            "User registered successfully. A verification email has been sent.",
          userId: result.insertedId,
        });
      } catch (err) {
        console.error("Error registering user:", err);
        res.status(500).json({ message: "An error occurred" });
      }
    });
    app.get("/verify", async (req, res) => {
      try {
        const { token } = req.query;

        // Find the user with the matching verification token
        const user = await usersCollection.findOne({
          verificationToken: token,
        });

        if (!user) {
          return res.status(404).json({ error: "Invalid verification token" });
        }

        // Update the user's verification status in the database
        await usersCollection.updateOne(
          { _id: user._id },
          { $set: { verified: true, verificationToken: null } }
        );

        res.send(
          'Congratulations! Your email is verified, and now you can go to the AEAW website. Please click <a href="http://localhost:3000/">here</a> to visit the homepage.'
        );
      } catch (err) {
        console.error("Error verifying email:", err);
        res.status(500).json({ message: "An error occurred" });
      }
    });
    // //user login
    // app.post("/login", async (req, res) => {
    //   const { email, password } = req.body;
    //   const user = await usersCollection.findOne({ email });
    //   if (!user) {
    //     return res.status(401).json({ error: "Invalid username or password" });
    //   }
    //   const passwordMatch = await bcrypt.compare(password, user.password);
    //   if (!passwordMatch) {
    //     return res.status(401).json({ error: "Invalid username or password" });
    //   }
    //   const token = generateToken(); // Generate a unique token for the user
    //   loggedInUsers[token] = user;
    //   res.json({ message: "Login successfully", token });
    // });
    app.post("/login", async (req, res) => {
      const { email, password } = req.body;
      const user = await usersCollection.findOne({ email });
      if (!user) {
        return res.status(401).json({ error: "Invalid username or password" });
      }
      const passwordMatch = await bcrypt.compare(password, user.password);
      if (!passwordMatch) {
        return res.status(401).json({ error: "Invalid username or password" });
      }
      // Generate JWT token
      const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '1d' });
    
      res.cookie('token', token, { httpOnly: true }); // Set the token as a cookie
    
      res.json({ message: "Login successfully", token });
    });
    
    // Login route for the admin
    app.post("/admin/login", (req, res) => {
      const { email, password } = req.body;

      // Check if the provided email and password match the admin credentials
      if (email === "admin@admin.com" && password === "admin1") {
        res.status(200).json({ message: "Login successful!" });
      } else {
        res.status(401).json({ error: "Invalid credentials!" });
      }
    });

    //logout the user

    app.post("/logout", (req, res) => {
      const token = req.headers.authorization;
      delete loggedInUsers[token];
      res.json({ message: "Logged out successfully" });
    });

    app.listen(port, () => {
      console.log("Running on port", port);
    });
  } finally {
    // await client.close();
  }
}

function generateToken() {
  // Generate a random string as a token
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let token = "";
  for (let i = 0; i < 32; i++) {
    token += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return token;
}

run().catch(console.dir);
