import express from "express";
import path from "path";
import archiver from "archiver";
import fs from "fs";
import QRCode from "qrcode";
import chalk from "chalk";
import { fileURLToPath } from "url";

const downloadServer = express();
let filePath, storagePath;

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
    startLogs(args.mode);
  });
};
