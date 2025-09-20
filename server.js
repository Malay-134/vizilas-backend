import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import { google } from "googleapis";
import fs from "fs";
import dotenv from "dotenv";

dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;
// app.use(cors());
app.use(cors({
  origin: process.env.CLIENT_URL || "*"
}));
app.use(bodyParser.json());

const SPREADSHEET_ID = process.env.SPREADSHEET_ID;
// console.log("SPREADSHEET_ID:", SPREADSHEET_ID);

let credentials;
if (process.env.GOOGLE_SERVICE_ACCOUNT) {
  credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT);
  // console.log("Service account email:", credentials.client_email);
} else {
  credentials = JSON.parse(fs.readFileSync("credentials.json", "utf8"));
}

const auth = new google.auth.GoogleAuth({
  credentials,
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

// Reservation route → goes to Sheet1
app.post("/reservation", async (req, res) => {
  try {
    const { name, email, datetime, people, message } = req.body;
    const client = await auth.getClient();
    const sheets = google.sheets({ version: "v4", auth: client });

    const newRow = [name, email, datetime, people, message, new Date().toLocaleString()];

    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: "Sheet1!A:F",   // Reservation sheet
      valueInputOption: "RAW",
      resource: { values: [newRow] },
    });

    res.status(200).json({ message: "Reservation saved!" });
  } catch (err) {
    res.status(500).json({ message: "Error saving reservation" });
    console.error("ERROR", err.message);
  }
});

// Contact route → goes to Sheet2
app.post("/contact", async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;
    const client = await auth.getClient();
    const sheets = google.sheets({ version: "v4", auth: client });

    const newRow = [name, email, subject, message, new Date().toLocaleString()];

    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: "Sheet2!A:E",   // Contact sheet
      valueInputOption: "RAW",
      resource: { values: [newRow] },
    });

    res.status(200).json({ message: "Contact saved!" });
  } catch (err) {
    res.status(500).json({ message: "Error saving contact" });
    console.error("ERROR", err.message);
  }
});

// app.listen(5000, () => console.log("Listening on :5000"));
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

