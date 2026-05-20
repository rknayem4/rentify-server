const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
dotenv.config();

const uri = process.env.MONGODB_URI;

const app = express();
const port = process.env.PORT || 8000;

app.use(cors());
app.use(express.json());

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
    const db = client.db("rentify-cars");
    const carCollection = db.collection("car-collection");
    const carBookingCollection = db.collection("car-booking-collection");

    app.get("/car-collection", async (req, res) => {
      const result = await carCollection.find().toArray();
      res.json(result);
    });
    app.get("/car-collection/:id", async (req, res) => {
      const { id } = req.params;
      const result = await carCollection.findOne({
        _id: new ObjectId(id),
      });
      res.json(result);
    });

    app.get("/car-collection/:userId", async (req, res) => {
      const { userId } = req.params;
      const result = await carCollection.find({ userId: userId }).toArray();
      res.json(result);
    });

    app.delete("/car-collection/:userId", async (req, res) => {
      const { userId } = req.params;
      const result = await carCollection.deleteOne({
        _id: new ObjectId(userId),
      });
      res.json(result);
    });
    app.patch("/car-collection/:id", async (req, res) => {
      const { id } = req.params;
      const updateData = req.body;
      console.log(updateData);
      const result = await carCollection.updateOne(
        { _id: new ObjectId(id) },
        { $set: updateData },
      );
      res.json(result);
    });

    app.post("/car-collection", async (req, res) => {
      const desData = req.body;
      console.log(desData);
      const result = await carCollection.insertOne(desData);
      res.json(result);
    });

    app.post("/car-booking-collection", async (req, res) => {
      const desData = req.body;
      console.log(desData);
      const result = await carBookingCollection.insertOne(desData);
      res.json(result);
    });

    

    app.get("/car-booking-collection/:userId", async (req, res) => {
      const { userId } = req.params;
      const result = await carBookingCollection
        .find({ userId: userId })
        .toArray();
      res.json(result);
    });

    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!",
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Hello Developers");
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
