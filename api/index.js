import { createDatabase } from '../database.js';
import { createApiHandler } from '../api-handler.js';
const database=createDatabase();
export default createApiHandler(database);
