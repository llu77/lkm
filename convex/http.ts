import { httpRouter } from "convex/server";
import { auth } from "./auth.config";

const http = httpRouter();

// Convex Auth HTTP routes
auth.addHttpRoutes(http);

export default http;

