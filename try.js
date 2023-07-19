const express = require("express");
const app = express();
require("dotenv").config();
const cors = require("cors");
const { MongoClient } = require("mongodb");
const ObjectId = require("mongodb").ObjectId;
const bcrypt = require("bcryptjs");
const { v4: uuidv4 } = require("uuid");
const nodemailer = require("nodemailer");
const jwt = require("jsonwebtoken");
app.use(cors());
app.use(express.json());

// mongodb connection .
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.yhxur.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const port = process.env.PORT || 8000;
let loggedInUsers = {}; // Store logged in users


app.get("/", (req, res) => {
  res.send("Running away site");
});

// All functionality starts
async function run() {
  try {
    await client.connect();
    const database = client.db("aeaw");
    const usersCollection = database.collection("aeawUsers");



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

        // Generate JWT token
        const token = jwt.sign(
          { userId: result.insertedId },
          process.env.JWT_SECRET,
          { expiresIn: "1d" }
        );

        res.json({
          message:
            "User registered successfully. A verification email has been sent.",
          userId: result.insertedId,
          token: token,
        });
      } catch (err) {
        console.error("Error registering user:", err);
        res.status(500).json({ message: "An error occurred" });
      }
    });
    //verify the user
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
    //user login
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
      const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
        expiresIn: "1d",
      });

      res.json({ message: "Login successfully", token });
    });

    app.listen(port, () => {
      console.log("Running on port", port);
    });
  } finally {
    // await client.close();
  }
}


run().catch(console.dir);
