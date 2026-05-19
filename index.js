const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const { ObjectId } = require("mongodb");
const { MongoClient, ServerApiVersion } = require("mongodb");

dotenv.config();

const app = express();
const port = process.env.PORT;

app.use(express.json());
app.use(cors());

const uri = process.env.MONGO_URI;

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

    const db = client.db("homeForPawsDB");
    const petsCollection = db.collection("pets");

    // for display the data in ui
    app.get("/pet", async (req, res) => {
      const result = await petsCollection.find().toArray();
      res.json(result);
    });

    // receiving the data from client
    app.post("/pet", async (req, res) => {
      const petData = req.body;
      console.log("data from backend", petData);
      const result = await petsCollection.insertOne(petData);
      res.json(result);
    });

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

    // Delete pets
    app.delete("/pet/:id", async (req, res) => {
      const id = req.params.id;

      const query = {
        _id: new ObjectId(id),
      };

      const result = await petsCollection.deleteOne(query);

      res.send(result);
    });

    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!",
    );
  } finally {
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Home For Paws server is running fine");
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
