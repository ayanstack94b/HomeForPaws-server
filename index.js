const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

dotenv.config();

const app = express();
const port = process.env.PORT;

// middleware
app.use(
  cors({
    origin: function (origin, callback) {
      const allowedOrigins = [
        "http://localhost:3000",
        "https://home-for-paws-client.vercel.app",
      ];

      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  }),
);
app.use(express.json());
app.use(cookieParser());

// mongodb uri
const uri = process.env.MONGO_URI;

// mongodb client
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // await client.connect();

    // database
    const db = client.db("homeForPawsDB");

    // collections
    const petsCollection = db.collection("pets");

    const adoptionCollection = db.collection("adoptionRequests");

    // verify Token middleware

    const verifyToken = (req, res, next) => {
      const token = req.cookies.token;

      if (!token) {
        return res.status(401).send({
          message: "unauthorized access",
        });
      }

      jwt.verify(token, process.env.JWT_SECRET, (error, decoded) => {
        if (error) {
          return res.status(401).send({
            message: "unauthorized access",
          });
        }

        req.decoded = decoded;

        next();
      });
    };

    // jwt token
    app.post("/jwt", async (req, res) => {
      const user = req.body;

      console.log("jwt route hit");

      console.log(user);

      const token = jwt.sign(user, process.env.JWT_SECRET, {
        expiresIn: "7d",
      });

      res
        .cookie("token", token, {
          httpOnly: true,
          secure: false,
          sameSite: "lax",
        })
        .send({
          success: true,
        });
    });

    // ================================ All Api routes starts here =========================================

    // get pets
    app.get("/pet", async (req, res) => {
      const email = req.query.email;

      const search = req.query.search;

      const species = req.query.species;

      let query = {};

      // owner filter
      if (email) {
        query.ownerEmail = email;
      }

      // search filter
      if (search) {
        query.petName = {
          $regex: search,
          $options: "i",
        };
      }

      // species filter
      if (species) {
        query.species = {
          $in: [species],
        };
      }

      const result = await petsCollection.find(query).toArray();

      res.send(result);
    });

    // add pet
    app.post("/pet", async (req, res) => {
      const petData = req.body;

      const result = await petsCollection.insertOne(petData);

      res.send(result);
    });

    // update pet
    app.put("/pet/:id", async (req, res) => {
      const id = req.params.id;

      const updatedPet = req.body;

      const query = {
        _id: new ObjectId(id),
      };

      const updatedDoc = {
        $set: {
          petName: updatedPet.petName,
          species: updatedPet.species,
          breed: updatedPet.breed,
          gender: updatedPet.gender,
          image: updatedPet.image,
          location: updatedPet.location,
          adoptionFee: updatedPet.adoptionFee,
          healthStatus: updatedPet.healthStatus,
          vaccinationStatus: updatedPet.vaccinationStatus,
          description: updatedPet.description,
        },
      };

      const result = await petsCollection.updateOne(query, updatedDoc);

      res.send(result);
    });

    // pet details
    app.get("/pet/:id", async (req, res) => {
      const id = req.params.id;

      const query = {
        _id: new ObjectId(id),
      };

      const result = await petsCollection.findOne(query);

      res.send(result);
    });

    // delete pet
    app.delete("/pet/:id", async (req, res) => {
      const id = req.params.id;

      const query = {
        _id: new ObjectId(id),
      };

      const result = await petsCollection.deleteOne(query);

      res.send(result);
    });

    // get adoption requests
    app.get("/adoption-request", async (req, res) => {
      const email = req.query.email;

      const petId = req.query.petId;

      let query = {};

      if (email) {
        query.adopterEmail = email;
      }

      if (petId) {
        query.petId = petId;
      }

      const result = await adoptionCollection.find(query).toArray();

      res.send(result);
    });

    // add adoption request
    app.post("/adoption-request", async (req, res) => {
      const adoptionData = req.body;

      const query = {
        petId: adoptionData.petId,

        adopterEmail: adoptionData.adopterEmail,
      };

      const alreadyExists = await adoptionCollection.findOne(query);

      if (alreadyExists) {
        return res.send({
          inserted: false,

          message: "request already exists",
        });
      }
      const pet = await petsCollection.findOne({
        _id: new ObjectId(adoptionData.petId),
      });

      if (pet?.adopted) {
        return res.send({
          inserted: false,

          message: "pet already adopted",
        });
      }

      const result = await adoptionCollection.insertOne(adoptionData);

      res.send({
        inserted: true,

        insertedId: result.insertedId,
      });
    });

    // cancel adoption request
    app.delete("/adoption-request/:id", async (req, res) => {
      const id = req.params.id;

      const query = {
        _id: new ObjectId(id),
      };

      const result = await adoptionCollection.deleteOne(query);

      res.send(result);
    });

    // approve / reject adoption request
    app.patch("/adoption-request/:id", async (req, res) => {
      const id = req.params.id;

      const { status } = req.body;

      const query = {
        _id: new ObjectId(id),
      };

      const updatedDoc = {
        $set: {
          status,
        },
      };

      const result = await adoptionCollection.updateOne(query, updatedDoc);

      res.send(result);
    });

    // mark pet as adopted
    app.patch("/pet/adopt/:id", async (req, res) => {
      const id = req.params.id;

      const query = {
        _id: new ObjectId(id),
      };

      const updatedDoc = {
        $set: {
          adopted: true,
        },
      };

      const result = await petsCollection.updateOne(query, updatedDoc);

      res.send(result);
    });

    // mongodb ping
    // await client.db("admin").command({ ping: 1 });

    console.log("mongodb connected successfully");
  } finally {
  }
}

run().catch(console.dir);

// default route
app.get("/", (req, res) => {
  res.send("Home For Paws server is running fine");
});

module.exports = app;
