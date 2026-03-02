#!/usr/bin/env node
import os from "node:os";
import fs from "node:fs";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

// Define __filename and __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);


const launchCli = (executablePath, args) => {

  console.log(`*** __dirname: ${__dirname} filename: ${__filename}  ***`)
	console.log(
		`Attempting to execute: ${executablePath} with arguments: ${args.join(" ")}`,
	);

	const env = {
		...process.env,
		NODE_ENV: "production",
		TOTO: "i feel the rain",
	};

	const child = spawn(executablePath, args, { stdio: "inherit", env });

	child.on("error", (error) => {
		console.error(`Error launching fixentropy executable: ${error.message}`);
	});

	child.on("exit", (code) => {
		console.log(`Process exited with code ${code}`);
	});
};

const platform = os.platform();
const architecture = os.arch();

// Get additional arguments passed to the script
const cliArgs = process.argv.slice(2); // Slice to get only the relevant arguments

let executablePath;

if (platform === "darwin") {
	if (architecture === "x64") {
		executablePath = resolve(__dirname, "fixentropy-macos-x64");
	} else if (architecture === "arm64") {
		executablePath = resolve(__dirname, "fixentropy-macos-arm64");
	} else {
		console.error("Could not find a proper executable for your device.");
	}
} else if (platform === "linux") {
	executablePath = resolve(__dirname, "fixentropy-linux");
} else if (platform === "win32") {
	executablePath = resolve(__dirname, "fixentropy-windows.exe");
} else {
	console.log("Not running on a supported platform.");
}

if (executablePath) {
	launchCli(executablePath, cliArgs); // Pass the arguments to launchCli
}
