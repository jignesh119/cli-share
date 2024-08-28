#! /usr/bin/env node
import chalk from "chalk";
import meow from "meow";
import child_process from "child_process";
import network from "network";
import { startDownloadServer } from "./index.js";

const getLocalIp = () => {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === "IPv4" && !iface.internal) {
        return iface.address;
      }
    }
  }
  console.log("network is unreachable");
  process.exit(1);
};

function getLocalIpsAvailable(cb) {
  network.get_interfaces_list((err, interfaces) => {
    if (err) {
      cb(err, null);
      return;
    }
    const data = interfaces
      .filter((iface) => !iface.internal)
      .map((iface) => iface.ip_address)
      .filter((ip) => ip);
    cb(null, data);
  });
}

const getSSID = () => {
  const WINDOWS = "win32",
    MACOS = "darwin",
    LINUX = "linux";
  const os = process.platform;
  try {
    if (os === LINUX) {
      const ssid = child_process
        .execSync("iwgetid -r 2>/dev/null")
        .toString()
        .trim();
      return ssid;
    } else if (os === MACOS) {
      const ssid = child_process
        .execSync(
          "/System/Library/PrivateFrameworks/Apple80211.framework/Versions/Current/Resources/airport -I | awk '/ SSID/ {print substr($0, index($0, $2))}'",
        )
        .toString()
        .trim();
      return ssid;
    } else if (os === WINDOWS) {
      let interface_info = child_process
        .execSync("netsh.exe wlan show interfaces")
        .toString();
      for (let line of interface_info.split("\n")) {
        if (line.trim().startsWith("Profile")) {
          const ssid = line.split(":")[1].trim();
          return ssid;
        }
      }
    }
    return null;
  } catch (err) {
    console.log(`err finding ssid: ${err} ${os}`);
  }
};

//choose a port from this range to avoid conflicts with well-known ports.
const getRandomPort = (max = 65535, min = 1024) => {
  return Math.floor(Math.random() * (max - min) + min);
};

const findAvaliablePort = () => {
  return new Promise((resolve, reject) => {
    const port = getRandomPort();
    const server = http.createServer();
    server.listen(port, () => {
      server.on("close", () => {
        resolve(port);
      });
      server.close();
    });
    server.on("error", (err) => {
      if (err.code === "EADDRINUSE") {
        console.log(`${port} already in use, searching for another one\n`);
        findAvaliablePort().then(resolve).catch(reject);
      } else {
        reject("error finding port");
      }
    });
  });
};

const main = async () => {
  let port, address, filePath, mode, debug, cli, message;
  const helpText = `
		cli-share - cli tool to share files btw devices in same network by scanning a qr
		${chalk.bold("Usage:")} 

    ${chalk.italic("- file sharing: ")} cli-share [option {value}] <path>
      $ cli-share --help
      $ cli-share --version

		${chalk.bold("Options:")}
      -h --help    \tshow this screen
      -v --version \tshow version

		${chalk.bold("Examples:")}
      $ cli-share --help
      $ cli-share --version
	`;
  getLocalIpsAvailable(async (err, ips) => {
    cli = meow({
      importMeta: import.meta,
      help: helpText,
      flags: {
        help: {
          type: "boolean",
          default: false,
          shortFlag: "h",
        },
        version: {
          type: "boolean",
          default: false,
          shortFlag: "v",
        },
      },
      description: false,
    });
    debug = true;
    console.log(
      `make sure your device is connected to a network before trying the app`,
    );
    startDownloadServer({
      filePath: "./sample.txt",
      port: 4000,
      address: "192.168.1.10",
      debug: true,
      mode: null,
    });
  });
};
main();
