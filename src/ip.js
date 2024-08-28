#! /usr/bin/env node
import chalk from "chalk";
import meow from "meow";

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
  });
};
main();
