const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const { createRemoteJWKSet, jwtVerify } = require("jose-cjs");
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

const JWKS = createRemoteJWKSet(new URL("http://localhost:3000/api/auth/jwks"));

const verifyToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({
      message: "Unauthorized",
    });
  }
  const token = authHeader.split(" ")[1];
  if (!token) {
    return res.status(401).json({
      message: "Unauthorized",
    });
  }

  try {
    const { payload } = await jwtVerify(token, JWKS);
    console.log(payload);
    next();
  } catch (error) {
    return res.status(401).json({
      message: "Forbidden",
    });
  }
};

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
    app.get("/search-cars", async (req, res) => {
      const search = req.query.search || "";
      const type = req.query.type || "";

      let query = {
        carName: {
          $regex: search,
          $options: "i",
        },
      };

      if (type) {
        query.type = type;
      }

      const result = await carCollection.find(query).toArray();

      res.json(result);
    });
    app.get("/car-collection/:id", verifyToken, async (req, res) => {
      const { id } = req.params;
      const result = await carCollection.findOne({
        _id: new ObjectId(id),
      });
      res.json(result);
    });

    app.get("/my-car-collection/:userId", async (req, res) => {
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

    app.post("/car-collection", verifyToken, async (req, res) => {
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
    app.delete("/car-booking-collection/:userId", async (req, res) => {
      const { userId } = req.params;
      const result = await carBookingCollection.deleteOne({
        _id: new ObjectId(userId),
      });
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
