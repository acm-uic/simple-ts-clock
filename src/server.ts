#!/usr/bin/env node
// Reads .env for local development; on the clock, systemd provides the environment
import "dotenv/config";
import app from "./app";

const port = process.env.PORT || 8080;

app.listen(port, () => console.log(`Server started on port ${port}`));
