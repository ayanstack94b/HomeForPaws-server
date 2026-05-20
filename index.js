const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

dotenv.config();

const app = express();
const port = process.env.PORT;

// middleware
app.use(cors());
app.use(express.json());

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
    await client.connect();

    // database
    const db = client.db("homeForPawsDB");

    // collections
    const petsCollection = db.collection("pets");

    const adoptionCollection = db.collection("adoptionRequests");

    // get all pets
    app.get("/pet", async (req, res) => {
      const result = await petsCollection.find().toArray();

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

      const query = {
        adopterEmail: email,
      };

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

    // mongodb ping
    await client.db("admin").command({ ping: 1 });

    console.log("mongodb connected successfully");
  } finally {
  }
}

run().catch(console.dir);

// default route
app.get("/", (req, res) => {
  res.send("Home For Paws server is running fine");
});

// server running
app.listen(port, () => {
  console.log(`server running on port ${port}`);
});
