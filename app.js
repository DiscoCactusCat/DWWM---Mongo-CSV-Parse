const fs = require("fs");
const path = require("path");
const csv = require("fast-csv");

const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const ObjectId = Schema.ObjectId;

const express = require("express");
const app = express();
app.listen(3000);

const MONGODB_URI =
  "mongodb+srv://caroline:caroline@cluster0.gfvqb.mongodb.net/zip_code?retryWrites=true&w=majority";

mongoose.connect(
  MONGODB_URI,
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false,
    useCreateIndex: true,
  },
  (err) => {
    console.log("Connecting to database ");
    if (err) console.log("Erreur de connection", err);
  }
);

const restaurant = new mongoose.Schema({
  name: String,
  cuisine: String,
  borough: String,
});

const restaurantListing = mongoose.model(
  "restaurant",
  restaurant,
  "restaurants"
);

const zip = new mongoose.Schema({
  zip: String,
  post_district: String,
  comment: String,
  country_code: String,
  region: String,
  town: String,
  lat: String,
  lng: String,
});

const ch_zipListing = mongoose.model("zip_ch", zip, "switzerland");

const fr_zipListing = mongoose.model("zip_fr", zip, "france");

app.get("/api", function (request, response) {
  userQuery = restaurantListing
    .find({}, { name: 1, cuisine: 1, borough: 1 })
    .sort({ _id: 1 })
    .limit(50);

  userQuery.exec((err, result) => {
    response.send(result);
  });
});

fs.createReadStream(
  path.resolve(__dirname, "assets", "switzerland_zipcode.csv")
)
  .pipe(csv.parse({ headers: true }))
  .on("error", (error) => console.error(error))
  .on("data", (row) => {
    let zip_code = new ch_zipListing(row);
    zip_code.save((err, data) => {
      if (err) console.log("Error", err);
    });
  })
  .on("end", (rowCount) => console.log(`Parsed ${rowCount} rows`));

fs.createReadStream(path.resolve(__dirname, "assets", "france_zipcode.csv"))
  .pipe(csv.parse({ headers: false, delimiter: ";" }))
  .on("error", (error) => console.error(error))
  .on("data", (row) => {
      
    let zip = row[2];
    let town = row[1];
    let gps = row[5].split(",");
    let lat = gps[0];
    let lng = gps[1];

    let cleanedDatas = {
      zip: zip,
      post_district: "",
      country_code: "FR",
      comment: "",
      region: "",
      town: town,
      lat: lat,
      lng: lng,
    };

    let zip_code = new fr_zipListing(cleanedDatas);
    zip_code.save((err, data) => {
      if (err) console.log("Error", err);
    });
  })
  .on("end", (rowCount) => console.log(`Parsed ${rowCount} rows`));
