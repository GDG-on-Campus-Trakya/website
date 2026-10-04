import { getStorage } from "firebase/storage";
import { app } from "./app";

// Uploads only: imported by the pages and helpers that write files.
export const storage = getStorage(app);
