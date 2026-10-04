import { getDatabase } from "firebase/database";
import { app } from "./app";

// Live quiz and poll sessions only. The connection opens on the first read or listener.
export const realtimeDb = getDatabase(app);
