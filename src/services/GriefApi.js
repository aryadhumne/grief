import axios from "axios";

const griefApi = axios.create({
  baseURL: import.meta.env.VITE_GRIEF_API_URL || "http://localhost:5001/api",
});

export default griefApi;