import express from "express";
import path from "path";
import archiver from "archiver";
import fs from "fs";
import QRCode from "qrcode";
import chalk from "chalk";
import multer from "multer";
import { fileURLToPath } from "url";

const downloadServer = express(),
  uploadServer = express();
let filePath, storagePath;

const storage = multer.diskStorage({
  destination: (_, file, cb) => {
    cb(null, storagePath);
  },
  filename: (_, file, cb) => {
    cb(null, file.originalname);
  },
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
uploadServer.set("views", path.join(__dirname, "..", "views"));
uploadServer.use(express.static(path.join(__dirname, "..", "public")));
uploadServer.set("view engine", "ejs");
const upload = multer({ storage: storage }).single("file");
uploadServer.use(express.urlencoded({ extended: true }));

//when users want to view message from host
downloadServer.get("/message", (req, res) => {
  try {
    res.status(200).send(message);
    console.log(`message sent successfully to ${chalk.bold(req.ip)}`);
  } catch (err) {
    console.error(`error sending message \n${chalk.red(err)}`);
  }
});
downloadServer.get("/file/:filename", (req, res) => {
  const { filename } = req.params;
  try {
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${filename.split(" ").join("")}"`,
    );
    const stats = fs.statSync(filePath);
    if (stats.isFile()) {
      const r = fs.createReadStream(filePath);
      r.pipe(res);
      r.on("end", () => {
        console.log(
          `successfully transfered ${chalk.bold(filename)} to ${chalk.bold(req.ip)}`,
        );
      });
    } else if (stats.isDirectory()) {
      res.setHeader(
        "Content-Type",
        "application/zip;",
        `filename="${filename.split(" ").join("")}.zip"`,
      );
      const archive = archiver("zip", {
        zlib: { level: 9 },
      });
      archive.on("error", (err) => {
        console.log(`error in archiving ${err}`);
      });
      archive.pipe(res);
      archive.directory(filePath, false);
      archive.on("finish", () => {
        console.log(
          `successfully transfered ${chalk.bold(filename)} to ${chalk.bold(req.ip)}`,
        );
      });
      archive.finalize();
    }
  } catch (err) {
    console.error(
      `error in uploading requested file/folder\n ${chalk.red(err)}`,
    );
  }
});

uploadServer.get("/", (_, res) => {
  res.render("upload");
});

//users can send a text msg from client to this host
uploadServer.post("/message", (req, res) => {
  res.redirect("/");
  console.log(
    `received ${chalk.bold(req.body.message)} from ${chalk.bold(req.ip)}`,
  );
});

uploadServer.post(
  "/",
  (req, res, next) => {
    upload(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        throw err;
      } else if (err) {
        console.log(`Unknown error occured when uploading \n${chalk.red(err)}`);
        res.status(500).json({
          Error: `Unknown error occured when uploading \n${chalk.red(err)}`,
        });
        process.exit(1);
      }
      next();
    });
  },
  (req, res) => {
    res.redirect("/");
    console.log(
      `File ${chalk.bold(req.file.originalname)} uploaded successfully to ${chalk.bold(path.basename(req.file.destination))}`,
    );
  },
);

export const startDownloadServer = async ({ ...args }) => {
  const absPath = path.normalize(path.resolve(args.filePath));
  const filename = path.basename(absPath);
  const address = args.address;
  const port = args.port;
  const url = `http://${address}:${port}/file/${filename}`;
  filePath = absPath;
  downloadServer.listen(port, address, () => {
    console.log(`Scan the following QR to start downloading`);
    QRCode.toString(
      url,
      { type: "terminal", small: true },
      function (err, url) {
        if (err) console.error(err);
        else console.log(url);
      },
    );

    args.debug && console.log(url);
    //TODO: add logging
  });
};

export const startUploadServer = async ({ ...args }) => {
  const absPath = path.normalize(path.resolve(args.filePath));
  const address = args.address;
  const port = args.port;
  const url = `http://${address}:${port}/`;
  storagePath = absPath;
  uploadServer.listen(port, address, () => {
    console.log(`Scan the following QR to start uploading`);
    QRCode.toString(
      url,
      { type: "terminal", small: true },
      function (err, url) {
        if (err) console.error(err);
        else console.log(url);
      },
    );
    args.debug && console.log(url);
    //TODO: start logs
  });
};
export const sendMessage = ({ ...args }) => {
  const port = args.port;
  const address = args.address;
  const url = `http://${address}:${port}/message`;
  message = args.msg;
  downloadServer.listen(port, address, () => {
    console.log(`Scan the following QR to receive message `);
    QRCode.toString(
      url,
      { type: "terminal", small: true },
      function (err, url) {
        if (err) console.error(err);
        else console.log(url);
      },
    );
    console.log(url);
    startLogs(args.mode);
  });
};
